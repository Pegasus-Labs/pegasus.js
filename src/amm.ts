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
  let halfSpread = _0
  let beta1 = _0
  let beta2 = _0
  let fundingRateCoefficient = _0
  let maxLeverage = _0
 
  let otherIndex: BigNumber[] = []
  let otherPosition: BigNumber[] = []
  let otherHalfSpread: BigNumber[] = []
  let otherBeta1: BigNumber[] = []
  let otherBeta2: BigNumber[] = []
  let otherFundingRateCoefficient: BigNumber[] = []
  let otherMaxLeverage: BigNumber[] = []

  // split markets into current market and other markets
  // M_c = ammCash - Σ accumulatedFunding * N
  let cash = p.ammCashBalance
  for (let id in p.markets) {
    const market = p.markets[id]
    cash = cash.minus(market.accumulatedFundingPerContract.times(market.ammPositionAmount))
    if (id === marketID) {
      index = market.indexPrice
      position1 = market.ammPositionAmount
      halfSpread = market.halfSpread
      beta1 = market.beta1
      beta2 = market.beta2
      fundingRateCoefficient = market.fundingRateCoefficient
      maxLeverage = market.maxLeverage
    } else {
      otherIndex.push(market.indexPrice)
      otherPosition.push(market.ammPositionAmount)
      otherHalfSpread.push(market.halfSpread)
      otherBeta1.push(market.beta1)
      otherBeta2.push(market.beta2)
      otherFundingRateCoefficient.push(market.fundingRateCoefficient)
      otherMaxLeverage.push(market.maxLeverage)
    }
  }
   
  let ret = {
    index, position1, halfSpread, beta1, beta2,
    fundingRateCoefficient, maxLeverage,
    otherIndex, otherPosition, otherHalfSpread, otherBeta1, otherBeta2,
    otherFundingRateCoefficient, otherMaxLeverage,
    cash, availableMargin: _0, deltaMargin: _0, deltaPosition: _0,
    marginBalanceWithoutCurrent: _0, squareWithoutCurrent: _0, positionValueWithoutCurrent: _0,
  }
  ret = initAMMTradingContextEagerEvaluation(ret)
  return ret
}

export function initAMMTradingContextEagerEvaluation(context: AMMTradingContext): AMMTradingContext {
  let marginBalanceWithoutCurrent = context.cash
  let squareWithoutCurrent = _0
  let positionValueWithoutCurrent = _0
  
  for (let j = 0; j < context.otherIndex.length; j++) {
    // M_c + Σ_j (P_i N) where j ≠ id
    marginBalanceWithoutCurrent = marginBalanceWithoutCurrent.plus(
      context.otherIndex[j].times(context.otherPosition[j])
    )
    // Σ_j (β P_i N^2) where j ≠ id
    squareWithoutCurrent = squareWithoutCurrent.plus(
      context.otherBeta1[j].times(context.otherIndex[j]).times(context.otherPosition[j]).times(context.otherPosition[j])
    )

    // Σ_j (P_i_j * | N_j | / λ_j) where j ≠ id
    positionValueWithoutCurrent = positionValueWithoutCurrent.plus(
      context.otherIndex[j].times(context.otherPosition[j].abs()).div(context.otherMaxLeverage[j])
    )
  }
   
  return {
    ...context,
    marginBalanceWithoutCurrent,
    squareWithoutCurrent,
    positionValueWithoutCurrent,
  }
}

// the amount is the AMM's perspective
export function computeAMMInternalTrade(p: LiquidityPoolStorage, marketID: string, amount: BigNumber): AMMTradingContext {
  let context = initAMMTradingContext(p, marketID)
  const { close, open } = splitAmount(context.position1, amount)
  if (close.isZero() && open.isZero()) {
    throw new BugError('amm trade: trading amount = 0')
  }

  // trade
  if (!close.isZero()) {
    context = computeAMMInternalClose(context, close)
  }
  if (!open.isZero()) {
    context = computeAMMInternalOpen(context, open)
  }

  // spread
  if (amount.lt(_0)) {
    // amm sells, trader buys
    context.deltaMargin = context.deltaMargin.times(_1.plus(context.halfSpread)).dp(DECIMALS)
  } else {
    // amm buys, trader sells
    context.deltaMargin = context.deltaMargin.times(_1.minus(context.halfSpread)).dp(DECIMALS)
  }

  return context
}

// the amount is the AMM's perspective
export function computeAMMInternalClose(context: AMMTradingContext, amount: BigNumber): AMMTradingContext {
  const beta = context.beta2
  let ret: AMMTradingContext = { ...context }
  const { index } = ret
  const position2 = ret.position1.plus(amount)
  let deltaMargin = _0

  // trade
  if (isAMMSafe(ret, beta)) {
    ret = computeAMMAvailableMargin(ret, beta)
    deltaMargin = computeDeltaMargin(ret, beta, position2)
  } else {
    deltaMargin = index.times(amount).negated()
  }

  // commit
  ret.deltaMargin = ret.deltaMargin.plus(deltaMargin)
  ret.deltaPosition = ret.deltaPosition.plus(amount)
  ret.cash = ret.cash.plus(deltaMargin)
  ret.position1 = position2
  return ret
}

// the amount is the AMM's perspective
export function computeAMMInternalOpen(context: AMMTradingContext, amount: BigNumber): AMMTradingContext {
  const beta = context.beta1
  let ret: AMMTradingContext = { ...context }
  const position2 = ret.position1.plus(amount)
  let deltaMargin = _0

  // pre-check
  if (!isAMMSafe(ret, beta)) {
    throw new InsufficientLiquidityError(`amm can not open position anymore: unsafe before trade`)
  }
  ret = computeAMMAvailableMargin(ret, beta)
  if (amount.gt(_0)) {
    // 0.....position2.....safePosition2
    const safePosition2 = computeAMMSafeLongPositionAmount(ret, beta)
    if (position2.gt(safePosition2)) {
      throw new InsufficientLiquidityError(`amm can not open position anymore: position too large after trade ${position2.toFixed()} > ${safePosition2.toFixed()}`)
    }
  } else {
    // safePosition2.....position2.....0
    const safePosition2 = computeAMMSafeShortPositionAmount(ret, beta)
    if (position2.lt(safePosition2)) {
      throw new InsufficientLiquidityError(`amm can not open position anymore: position too large after trade ${position2.toFixed()} < ${safePosition2.toFixed()}`)
    }
  }
  
  // trade
  deltaMargin = computeDeltaMargin(ret, beta, position2)

  // commit
  ret.deltaMargin = ret.deltaMargin.plus(deltaMargin)
  ret.deltaPosition = ret.deltaPosition.plus(amount)
  ret.cash = ret.cash.plus(deltaMargin)
  ret.position1 = position2

  return ret
}

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

// call computeAMMAvailableMargin before this function. make sure isAMMSafe before this function
export function computeAMMSafeShortPositionAmount(context: AMMTradingContext, beta: BigNumber): BigNumber {
  let condition3 = computeAMMSafeCondition3(context, beta)
  if (condition3 === false) {
    return _0
  }
  condition3 = condition3.negated()
  let condition2 = computeAMMSafeCondition2(context, beta)
  if (condition2 === true) {
    return condition3
  } else {
    condition2 = condition2.negated()
    return BigNumber.max(condition2, condition3)
  }
}

// call computeAMMAvailableMargin before this function. make sure isAMMSafe before this function
export function computeAMMSafeLongPositionAmount(context: AMMTradingContext, beta: BigNumber): BigNumber {
  let condition3 = computeAMMSafeCondition3(context, beta)
  if (condition3 === false) {
    return _0
  }
  const condition1 = computeAMMSafeCondition1(context, beta)
  const condition13 = BigNumber.min(condition1, condition3)
  const condition2 = computeAMMSafeCondition2(context, beta)
  if (condition2 === true) {
    return condition13
  } else {
    return BigNumber.min(condition2, condition13)
  }
}

export function computeAMMSafeCondition1(context: AMMTradingContext, beta: BigNumber): BigNumber {
  // M / β
  const position2 = context.availableMargin.div(beta)
  return position2.dp(DECIMALS)
}

// return true if always safe
export function computeAMMSafeCondition2(context: AMMTradingContext, beta: BigNumber): BigNumber | true {
  // M - Σ(positionValue_j - square_j / 2 / M) where j ≠ id
  const x = context.availableMargin
    .minus(context.positionValueWithoutCurrent)
    .plus(context.squareWithoutCurrent.div(context.availableMargin).div(_2))
  //  M - √(M(M - 2βλ^2/P_i x))
  // ---------------------------
  //             βλ
  let beforeSquare = x.times(context.maxLeverage).times(context.maxLeverage).times(beta).times(_2).div(context.index)
  beforeSquare = context.availableMargin.minus(beforeSquare).times(context.availableMargin)
  if (beforeSquare.lt(_0)) {
    // means the curve is always above the x-axis
    return true
  }
  let position2 = context.availableMargin.minus(sqrt(beforeSquare))
  position2 = position2.div(beta).div(context.maxLeverage)
  return position2.dp(DECIMALS)
}

// return false if always unsafe
export function computeAMMSafeCondition3(context: AMMTradingContext, beta: BigNumber): BigNumber | false {
  //    2M^2 - square
  // √(---------------)
  //       P_i β
  const beforeSqrt = _2.times(context.availableMargin).times(context.availableMargin)
    .minus(context.squareWithoutCurrent)
    .div(context.index).div(beta)
  if (beforeSqrt.lt(_0)) {
    return false
  }
  const position2 = sqrt(beforeSqrt)
  return position2.dp(DECIMALS)
}

// cash2 - cash1
export function computeDeltaMargin(context: AMMTradingContext, beta: BigNumber, position2: BigNumber): BigNumber {
  if (context.position1.gt(_0) && position2.lt(_0)
    || context.position1.lt(_0) && position2.gt(_0)) {
    throw new BugError('bug: cross direction is not supported')
  }
  // P_i (N1 - N2) (1 - β / M * (N2 + N1) / 2)
  let ret = position2.plus(context.position1).div(_2).div(context.availableMargin).times(beta)
  ret = _1.minus(ret)
  ret = context.position1.minus(position2).times(ret).times(context.index)
  return ret.dp(DECIMALS)
}

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
