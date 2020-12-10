/*
  Simulate the smart contract's computation.
*/

import { BigNumber } from 'bignumber.js'
import { DECIMALS, _0, _1, _2, _4 } from './constants'
import { LiquidityPoolStorage, AMMTradingContext } from './types'
import { sqrt, splitAmount } from './utils'
import { InsufficientLiquidityError, BugError } from './types'

export function initAMMTradingContext(p: LiquidityPoolStorage, marketID: string): AMMTradingContext {
  if (!p.markets[marketID]) {
    throw new Error(`market {marketID} not found in the pool`)
  }
  
  let index = _0
  let position1 = _0
  let halfSpreadRate = _0
  let beta1 = _0
  let beta2 = _0
  let fundingRateCoefficient = _0
  let maxLeverage = _0
 
  let otherIndex: BigNumber[] = []
  let otherPosition: BigNumber[] = []
  let otherHalfSpreadRate: BigNumber[] = []
  let otherBeta1: BigNumber[] = []
  let otherBeta2: BigNumber[] = []
  let otherFundingRateCoefficient: BigNumber[] = []
  let otherMaxLeverage: BigNumber[] = []

  // split markets into current market and other markets
  // M_c = ammCash - Σ accumulatedFunding * position
  let cash = p.ammCashBalance
  for (let id in p.markets) {
    const market = p.markets[id]
    cash = cash.minus(market.accumulatedFundingPerContract.times(market.ammPositionAmount))
    if (id === marketID) {
      index = market.indexPrice
      position1 = market.ammPositionAmount
      halfSpreadRate = market.halfSpreadRate
      beta1 = market.beta1
      beta2 = market.beta2
      fundingRateCoefficient = market.fundingRateCoefficient
      maxLeverage = market.maxLeverage
    } else {
      otherIndex.push(market.indexPrice)
      otherPosition.push(market.ammPositionAmount)
      otherHalfSpreadRate.push(market.halfSpreadRate)
      otherBeta1.push(market.beta1)
      otherBeta2.push(market.beta2)
      otherFundingRateCoefficient.push(market.fundingRateCoefficient)
      otherMaxLeverage.push(market.maxLeverage)
    }
  }
   
  let ret = {
    index, position1, halfSpreadRate, beta1, beta2,
    fundingRateCoefficient, maxLeverage,
    otherIndex, otherPosition, otherHalfSpreadRate, otherBeta1, otherBeta2,
    otherFundingRateCoefficient, otherMaxLeverage,
    cash, availableMargin: _0, deltaMargin: _0, deltaPosition: _0,
    marginBalanceWithoutCurrent: _0, squareWithoutCurrent: _0,
  }
  ret = initAMMTradingContextEagerEvaluation(ret)
  return ret
}

export function initAMMTradingContextEagerEvaluation(context: AMMTradingContext): AMMTradingContext {
  let marginBalanceWithoutCurrent = context.cash
  let squareWithoutCurrent = _0
  
  for (let j = 0; j < context.otherIndex.length; j++) {
    // cash + Σ_j (index position) where j ≠ id
    marginBalanceWithoutCurrent = marginBalanceWithoutCurrent.plus(
      context.otherIndex[j].times(context.otherPosition[j])
    )
    // Σ_j (beta1 index position^2) where j ≠ id
    squareWithoutCurrent = squareWithoutCurrent.plus(
      context.otherBeta1[j].times(context.otherIndex[j]).times(context.otherPosition[j]).times(context.otherPosition[j])
    )
  }
   
  return {
    ...context,
    marginBalanceWithoutCurrent,
    squareWithoutCurrent,
  }
}

// // the amount is the AMM's perspective
// export function computeAMMInternalTrade(p: LiquidityPoolStorage, marketID: string, amm: AccountDetails, amount: BigNumber): AMMTradingContext {
//   let context = initAMMTradingContext(p, amm)
//   const { close, open } = splitAmount(context.pos1, amount)
//   if (close.isZero() && open.isZero()) {
//     throw new BugError('amm trade: trading amount = 0')
//   }

//   // trade
//   if (!close.isZero()) {
//     context = computeAMMInternalClose(context, close, p)
//   }
//   if (!open.isZero()) {
//     context = computeAMMInternalOpen(context, open, p)
//   }

//   // spread
//   if (amount.lt(_0)) {
//     // amm sells, trader buys
//     context.deltaMargin = context.deltaMargin.times(_1.plus(p.halfSpreadRate)).dp(DECIMALS)
//   } else {
//     // amm buys, trader sells
//     context.deltaMargin = context.deltaMargin.times(_1.minus(p.halfSpreadRate)).dp(DECIMALS)
//   }

//   return context
// }

// // the amount is the AMM's perspective
// export function computeAMMInternalClose(context: AMMTradingContext, amount: BigNumber, p: LiquidityPoolStorage): AMMTradingContext {
//   const beta = p.beta2
//   let ret: AMMTradingContext = { ...context }
//   const { index } = ret
//   const pos2 = ret.pos1.plus(amount)
//   let deltaMargin = _0

//   // trade
//   if (isAMMSafe(ret, beta)) {
//     ret = computeM0(ret, beta)
//     deltaMargin = computeDeltaMargin(ret, beta, pos2)
//   } else {
//     deltaMargin = index.times(amount).negated()
//   }

//   // commit
//   ret.deltaMargin = ret.deltaMargin.plus(deltaMargin)
//   ret.deltaPosition = ret.deltaPosition.plus(amount)
//   ret.cash = ret.cash.plus(deltaMargin)
//   ret.pos1 = pos2
//   return ret
// }

// // the amount is the AMM's perspective
// export function computeAMMInternalOpen(context: AMMTradingContext, amount: BigNumber, p: LiquidityPoolStorage): AMMTradingContext {
//   const beta = p.beta1
//   let ret: AMMTradingContext = { ...context }
//   const pos2 = ret.pos1.plus(amount)
//   let deltaMargin = _0

//   // pre-check
//   if (!isAMMSafe(ret, beta)) {
//     throw new InsufficientLiquidityError(`amm can not open position anymore: unsafe before trade`)
//   }
//   ret = computeM0(ret, beta)
//   if (amount.gt(_0)) {
//     // 0.....pos2.....safePos2
//     const safePos2 = computeAMMSafeLongPositionAmount(ret, beta)
//     if (pos2.gt(safePos2)) {
//       throw new InsufficientLiquidityError(`amm can not open position anymore: position too large after trade ${pos2.toFixed()} > ${safePos2.toFixed()}`)
//     }
//   } else {
//     // safePos2.....pos2.....0
//     const safePos2 = computeAMMSafeShortPositionAmount(ret, beta)
//     if (pos2.lt(safePos2)) {
//       throw new InsufficientLiquidityError(`amm can not open position anymore: position too large after trade ${pos2.toFixed()} < ${safePos2.toFixed()}`)
//     }
//   }

//   // trade
//   deltaMargin = computeDeltaMargin(ret, beta, pos2)

//   // commit
//   ret.deltaMargin = ret.deltaMargin.plus(deltaMargin)
//   ret.deltaPosition = ret.deltaPosition.plus(amount)
//   ret.cash = ret.cash.plus(deltaMargin)
//   ret.pos1 = pos2

//   return ret
// }

// do not call this function if !isAMMSafe
export function computeAMMAvailableMargin(context: AMMTradingContext, beta: BigNumber): AMMTradingContext {
  const marginBalanceWithCurrent = context.marginBalanceWithoutCurrent
    .plus(context.index.times(context.position1))
  const squareWithCurrent = context.squareWithoutCurrent
    .plus(beta.times(context.index).times(context.position1).times(context.position1))
  const beforeSqrt = marginBalanceWithCurrent.times(marginBalanceWithCurrent).minus(_2.times(squareWithCurrent))
  if (beforeSqrt.lt(_0)) {
    throw new BugError('AMM available margin sqrt < 0')
  }
  const availableMargin = marginBalanceWithCurrent.plus(sqrt(beforeSqrt)).div(_2)
  return { ...context, availableMargin }
}

export function isAMMSafe(context: AMMTradingContext, beta: BigNumber): boolean {
  if (context.position1.isZero()) {
    // current market pos = 0
    // (cash + Σ i pos) ^ 2 - 2 Σ beta i pos^2 >= 0
    const beforeSqrt = context.marginBalanceWithoutCurrent
      .times(context.marginBalanceWithoutCurrent)
      .minus(_2.times(context.squareWithoutCurrent))
    return beforeSqrt.gte(_0)
  }

  if (context.position1.lt(_0)) {
    // short
    if (context.marginBalanceWithoutCurrent.lt(_0)) {
      // perpetual should revert before this function. we also mark this as unsafe
      return false
    }
  }
  
  // uniform
  // -2 beta pos1 margin + k^2 pos1^2 + 2 square
  let beforeSqrt = _2.negated().times(beta).times(context.position1).times(context.marginBalanceWithoutCurrent)
  beforeSqrt = beforeSqrt.plus(beta.times(beta).times(context.position1).times(context.position1))
  beforeSqrt = beforeSqrt.plus(_2.times(context.squareWithoutCurrent))
  if (beforeSqrt.lt(_0)) {
    // means the curve is always above the x-axis
    return true
  }

  // (- margin + beta pos1 + sqrt) / pos1
  let safeIndex = context.marginBalanceWithoutCurrent.negated()
  safeIndex = safeIndex.plus(beta.times(context.position1))
  safeIndex = safeIndex.plus(sqrt(beforeSqrt))
  safeIndex = safeIndex.div(context.position1)
  
  if (context.position1.gt(_0)) {
    // long
    return context.index.gte(safeIndex)
  }
  // short
  return context.index.lte(safeIndex)
}

// // call computeM0 before this function
// export function computeAMMSafeShortPositionAmount(context: AMMTradingContext, beta: BigNumber): BigNumber {
//   if (!context.isSafe) {
//     throw new BugError('bug: do not call shortPosition when unsafe')
//   }
//   const { index, lev, m0 } = context
//   // safePosition = -m0 / i / (1 + sqrt(beta * lev))
//   const beforeSqrt = beta.times(lev)
//   if (beforeSqrt.lt(_0)) {
//     throw new BugError('bug: ammSafe sqrt < 0')
//   }
//   const safePosition = m0.negated().div(index).div(sqrt(beforeSqrt).plus(_1))
//   return safePosition.dp(DECIMALS)
// }

// // call computeM0 before this function
// export function computeAMMSafeLongPositionAmount(context: AMMTradingContext, beta: BigNumber): BigNumber {
//   if (!context.isSafe) {
//     throw new BugError('bug: do not call shortPosition when unsafe')
//   }
//   const { index, lev, m0 } = context
//   let safePosition = _0

//   const edge1 = beta.times(lev).plus(beta).minus(_1)
//   // if -1 + beta + beta lev = 0
//   // safePosition = m0 / 2 / i / (1 - 2 beta)
//   if (edge1.isZero()) {
//     safePosition = m0.div(_2).div(index).div(_1.minus(_2.times(beta)))
//     return safePosition.dp(DECIMALS)
//   }

//   // a = (lev + beta - 1)
//   //                    (2 * beta - 1) * a + sqrt(beta * a) * (lev + 2beta - 2)
//   // safePosition = m0 -------------------------------------------------------------
//   //                           i * (lev - 1) * (beta * lev + beta - 1)
//   const a = lev.plus(beta).minus(1)
//   const beforeSqrt = beta.times(a)
//   if (beforeSqrt.lt(_0)) {
//     throw new BugError('bug: ammSafe sqrt < 0')
//   }
//   const denominator = edge1.times(lev.minus(_1)).times(index)
//   safePosition = _2.times(beta).minus(_2).plus(lev)
//   safePosition = safePosition.times(sqrt(beforeSqrt))
//   safePosition = safePosition.plus(_2.times(beta).minus(_1).times(a))
//   safePosition = safePosition.times(m0).div(denominator)
//   return safePosition.dp(DECIMALS)
// }

// cash2 - cash1
export function computeDeltaMargin(context: AMMTradingContext, beta: BigNumber, position2: BigNumber): BigNumber {
  if (context.position1.gt(_0) && position2.lt(_0)
    || context.position1.lt(_0) && position2.gt(_0)) {
    throw new BugError('bug: cross direction is not supported')
  }
  // i (pos1 - pos2) (1 - beta / m * (pos2 + pos1) / 2)
  let ret = position2.plus(context.position1).div(_2).div(context.availableMargin).times(beta)
  ret = _1.minus(ret)
  ret = context.position1.minus(position2).times(ret).times(context.index)
  return ret
}

// // ma2 - ma1
// export function computeDeltaMarginShort(context: AMMTradingContext, beta: BigNumber, pos2: BigNumber): BigNumber {
//   const { pos1, index, m0 } = context
//   if (pos1.gt(_0)) {
//     throw new BugError(`bug: pos1 (${pos1.toFixed()}) > 0`)
//   }
//   if (pos2.gt(_0)) {
//     throw new BugError(`bug: pos2 (${pos2.toFixed()}) > 0`)
//   }
//   if (m0.lte(_0)) {
//     throw new InsufficientLiquidityError(`m0 (${m0.toFixed()}) <= 0`)
//   }
//   // ma2 - ma1 = index * (pos1 - pos2) * (1 - beta + beta * m0**2 / (m0 + pos1 * index) / (m0 + pos2 * index))
//   let deltaMargin = beta.times(m0).times(m0)
//   deltaMargin = deltaMargin.div(pos1.times(index).plus(m0))
//   deltaMargin = deltaMargin.div(pos2.times(index).plus(m0))
//   deltaMargin = deltaMargin.plus(_1).minus(beta)
//   deltaMargin = deltaMargin.times(index).times(pos1.minus(pos2))
//   return deltaMargin.dp(DECIMALS)
// }

// // ma2 - ma1
// export function computeDeltaMarginLong(context: AMMTradingContext, beta: BigNumber, pos2: BigNumber): BigNumber {
//   const { pos1, index, m0, ma1 } = context
//   if (pos1.lt(_0)) {
//     throw new BugError(`bug: pos1 (${pos1.toFixed()}) < 0`)
//   }
//   if (pos2.lt(_0)) {
//     throw new BugError(`bug: pos2 (${pos2.toFixed()}) < 0`)
//   }
//   if (m0.lte(_0)) {
//     throw new InsufficientLiquidityError(`m0 (${m0.toFixed()}) <= 0`)
//   }
//   if (ma1.lte(_0)) {
//     throw new InsufficientLiquidityError(`ma1 (${ma1.toFixed()}) <= 0`)
//   }
//   // a = 2 * (1 - beta) * ma1
//   // assert a != 0
//   // b = -beta * m0 ** 2 + ma1 * (ma1 * (1 - beta) - index * (pos2 - pos1))
//   // before_sqrt = b**2 + 2 * a * ma1 * m0 ** 2 * beta
//   // assert before_sqrt >= 0
//   // ma2 = (b + math.sqrt(before_sqrt)) / a
//   const a = _1.minus(beta).times(ma1).times(_2)
//   if (a.isZero()) {
//     throw new BugError('edge case: deltaMarginLong.a = 0')
//   }
//   let b = pos2.minus(pos1).times(index)
//   b = a.div(_2).minus(b).times(ma1)
//   b = b.minus(beta.times(m0).times(m0))
//   let beforeSqrt = beta.times(a).times(ma1).times(m0).times(m0).times(2)
//   beforeSqrt = beforeSqrt.plus(b.times(b))
//   if (beforeSqrt.lt(_0)) {
//     throw new BugError('edge case: deltaMarginLong.sqrt < 0')
//   }
//   const ma2 = sqrt(beforeSqrt).plus(b).div(a)
//   return ma2.minus(ma1).dp(DECIMALS)
// }

// export function computeFundingRate(p: LiquidityPoolStorage, amm: AccountDetails): BigNumber {
//   let context = initAMMTradingContext(p, amm)  
//   if (!isAMMSafe(context, p.beta1)) {
//     if (context.pos1.isZero()) {
//       return _0
//     } else if (context.pos1.gt(_0)) {
//       return p.fundingRateCoefficient.negated()
//     } else {
//       return p.fundingRateCoefficient
//     }
//   }
  
//   context = computeM0(context, p.beta1)
//   return p.fundingRateCoefficient.times(p.indexPrice).times(context.pos1).div(context.m0).negated()
// }


sqrt
DECIMALS
InsufficientLiquidityError
BugError
splitAmount