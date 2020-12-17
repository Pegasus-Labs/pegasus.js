/*
  Simulate the smart contract's computation.
*/

import { BigNumber } from 'bignumber.js'
import { DECIMALS, _0, _1, _2, _4 } from './constants'
import { LiquidityPoolStorage, AMMTradingContext } from './types'
import { sqrt, splitAmount } from './utils'
import { InsufficientLiquidityError, BugError, InvalidArgumentError } from './types'

export function initAMMTradingContext(p: LiquidityPoolStorage, perpetualIndex?: number): AMMTradingContext {
  if (perpetualIndex) {
    if (!p.perpetuals.get(perpetualIndex)) {
      throw new InvalidArgumentError(`perpetual {perpetualIndex} not found in the pool`)
    }
  }
  
  let index = _0
  let position1 = _0
  let halfSpread = _0
  let openSlippageFactor = _0
  let closeSlippageFactor = _0
  let fundingRateLimit = _0
  let maxLeverage = _0
 
  let otherIndex: BigNumber[] = []
  let otherPosition: BigNumber[] = []
  let otherHalfSpread: BigNumber[] = []
  let otherOpenSlippageFactor: BigNumber[] = []
  let otherCloseSlippageFactor: BigNumber[] = []
  let otherFundingRateCoefficient: BigNumber[] = []
  let otherMaxLeverage: BigNumber[] = []

  // split perpetuals into current perpetual and other perpetuals
  // M_c = ammCash - Σ accumulatedFunding * N
  let cash = p.poolCashBalance
  p.perpetuals.forEach((perpetual, id) => {
    cash = cash.minus(perpetual.unitAccumulativeFunding.times(perpetual.ammPositionAmount))
    if (id === perpetualIndex) {
      index = perpetual.indexPrice
      position1 = perpetual.ammPositionAmount
      halfSpread = perpetual.halfSpread
      openSlippageFactor = perpetual.openSlippageFactor
      closeSlippageFactor = perpetual.closeSlippageFactor
      fundingRateLimit = perpetual.fundingRateLimit
      maxLeverage = perpetual.maxLeverage
    } else {
      otherIndex.push(perpetual.indexPrice)
      otherPosition.push(perpetual.ammPositionAmount)
      otherHalfSpread.push(perpetual.halfSpread)
      otherOpenSlippageFactor.push(perpetual.openSlippageFactor)
      otherCloseSlippageFactor.push(perpetual.closeSlippageFactor)
      otherFundingRateCoefficient.push(perpetual.fundingRateLimit)
      otherMaxLeverage.push(perpetual.maxLeverage)
    }
  })
   
  let ret = {
    index, position1, halfSpread, openSlippageFactor, closeSlippageFactor,
    fundingRateLimit, maxLeverage,
    otherIndex, otherPosition, otherHalfSpread, otherOpenSlippageFactor, otherCloseSlippageFactor,
    otherFundingRateCoefficient, otherMaxLeverage,
    cash, poolMargin: _0, deltaMargin: _0, deltaPosition: _0,
    valueWithoutCurrent: _0, squareValueWithoutCurrent: _0, positionMarginWithoutCurrent: _0,
  }
  ret = initAMMTradingContextEagerEvaluation(ret)
  return ret
}

export function initAMMTradingContextEagerEvaluation(context: AMMTradingContext): AMMTradingContext {
  let valueWithoutCurrent = _0
  let squareValueWithoutCurrent = _0
  let positionMarginWithoutCurrent = _0
  
  for (let j = 0; j < context.otherIndex.length; j++) {
    // Σ_j (P_i N) where j ≠ id
    valueWithoutCurrent = valueWithoutCurrent.plus(
      context.otherIndex[j].times(context.otherPosition[j])
    )
    // Σ_j (β P_i N^2) where j ≠ id
    squareValueWithoutCurrent = squareValueWithoutCurrent.plus(
      context.otherOpenSlippageFactor[j].times(context.otherIndex[j]).times(context.otherPosition[j]).times(context.otherPosition[j])
    )
    // Σ_j (P_i_j * | N_j | / λ_j) where j ≠ id
    positionMarginWithoutCurrent = positionMarginWithoutCurrent.plus(
      context.otherIndex[j].times(context.otherPosition[j].abs()).div(context.otherMaxLeverage[j])
    )
  }
   
  return {
    ...context,
    valueWithoutCurrent,
    squareValueWithoutCurrent,
    positionMarginWithoutCurrent,
  }
}

// the amount is the AMM's perspective
export function computeAMMInternalTrade(p: LiquidityPoolStorage, perpetualIndex: number, amount: BigNumber): AMMTradingContext {
  let context = initAMMTradingContext(p, perpetualIndex)
  const { close, open } = splitAmount(context.position1, amount)
  if (close.isZero() && open.isZero()) {
    throw new BugError('AMM trade: trading amount = 0')
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
    // AMM sells, trader buys
    context.deltaMargin = context.deltaMargin.times(_1.plus(context.halfSpread)).dp(DECIMALS)
  } else {
    // AMM buys, trader sells
    context.deltaMargin = context.deltaMargin.times(_1.minus(context.halfSpread)).dp(DECIMALS)
  }

  return context
}

// the amount is the AMM's perspective
export function computeAMMInternalClose(context: AMMTradingContext, amount: BigNumber): AMMTradingContext {
  const beta = context.closeSlippageFactor
  let ret: AMMTradingContext = { ...context }
  const { index } = ret
  const position2 = ret.position1.plus(amount)
  let deltaMargin = _0

  // trade
  if (isAMMSafe(ret, beta)) {
    ret = computeAMMPoolMargin(ret, beta)
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
  const beta = context.openSlippageFactor
  let ret: AMMTradingContext = { ...context }
  const position2 = ret.position1.plus(amount)
  let deltaMargin = _0

  // pre-check
  if (!isAMMSafe(ret, beta)) {
    throw new InsufficientLiquidityError(`AMM can not open position anymore: unsafe before trade`)
  }
  ret = computeAMMPoolMargin(ret, beta)
  if (amount.gt(_0)) {
    // 0.....position2.....safePosition2
    const safePosition2 = computeAMMSafeLongPositionAmount(ret, beta)
    if (position2.gt(safePosition2)) {
      throw new InsufficientLiquidityError(`AMM can not open position anymore: position too large after trade ${position2.toFixed()} > ${safePosition2.toFixed()}`)
    }
  } else {
    // safePosition2.....position2.....0
    const safePosition2 = computeAMMSafeShortPositionAmount(ret, beta)
    if (position2.lt(safePosition2)) {
      throw new InsufficientLiquidityError(`AMM can not open position anymore: position too large after trade ${position2.toFixed()} < ${safePosition2.toFixed()}`)
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
export function computeAMMPoolMargin(context: AMMTradingContext, beta: BigNumber): AMMTradingContext {
  const marginBalanceWithCurrent = context.cash
    .plus(context.valueWithoutCurrent)
    .plus(context.index.times(context.position1))
  const squareValueWithCurrent = context.squareValueWithoutCurrent
    .plus(beta.times(context.index).times(context.position1).times(context.position1))
  const beforeSqrt = marginBalanceWithCurrent.times(marginBalanceWithCurrent).minus(_2.times(squareValueWithCurrent))
  if (beforeSqrt.lt(_0)) {
    throw new BugError('AMM available margin sqrt < 0')
  }
  const poolMargin = marginBalanceWithCurrent.plus(sqrt(beforeSqrt)).div(_2)
  return { ...context, poolMargin }
}

export function isAMMSafe(context: AMMTradingContext, beta: BigNumber): boolean {
  const valueWithCurrent = context.valueWithoutCurrent
    .plus(context.index.times(context.position1))
  const squareValueWithCurrent = context.squareValueWithoutCurrent
    .plus(beta.times(context.index).times(context.position1).times(context.position1))
  // √(2 Σ(β_j P_i_j N_j)) - Σ(P_i_j N_j). always positive
  const beforeSqrt = _2.times(squareValueWithCurrent)
  const safeCash = sqrt(beforeSqrt).minus(valueWithCurrent)
  return context.cash.gte(safeCash)
}

// call computeAMMPoolMargin before this function. make sure isAMMSafe before this function
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

// call computeAMMPoolMargin before this function. make sure isAMMSafe before this function
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
  const position2 = context.poolMargin.div(beta)
  return position2.dp(DECIMALS)
}

// return true if always safe
export function computeAMMSafeCondition2(context: AMMTradingContext, beta: BigNumber): BigNumber | true {
  // M - Σ(positionMargin_j - squareValue_j / 2 / M) where j ≠ id
  const x = context.poolMargin
    .minus(context.positionMarginWithoutCurrent)
    .plus(context.squareValueWithoutCurrent.div(context.poolMargin).div(_2))
  //  M - √(M(M - 2βλ^2/P_i x))
  // ---------------------------
  //             βλ
  let beforeSquare = x.times(context.maxLeverage).times(context.maxLeverage).times(beta).times(_2).div(context.index)
  beforeSquare = context.poolMargin.minus(beforeSquare).times(context.poolMargin)
  if (beforeSquare.lt(_0)) {
    // means the curve is always above the x-axis
    return true
  }
  let position2 = context.poolMargin.minus(sqrt(beforeSquare))
  position2 = position2.div(beta).div(context.maxLeverage)
  return position2.dp(DECIMALS)
}

// return false if always unsafe
export function computeAMMSafeCondition3(context: AMMTradingContext, beta: BigNumber): BigNumber | false {
  //    2M^2 - squareValueWithoutCurrent
  // √(----------------------------------)
  //                P_i β
  const beforeSqrt = _2.times(context.poolMargin).times(context.poolMargin)
    .minus(context.squareValueWithoutCurrent)
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
  if (context.poolMargin.lte(_0)) {
    throw new InsufficientLiquidityError(`AMM poolMargin <= 0`)
  }
  // P_i (N1 - N2) (1 - β / M * (N2 + N1) / 2)
  let ret = position2.plus(context.position1).div(_2).div(context.poolMargin).times(beta)
  ret = _1.minus(ret)
  ret = context.position1.minus(position2).times(ret).times(context.index)
  return ret.dp(DECIMALS)
}

export function computeFundingRate(p: LiquidityPoolStorage, perpetualIndex: number): BigNumber {
  let context = initAMMTradingContext(p, perpetualIndex)  
  if (!isAMMSafe(context, context.openSlippageFactor)) {
    if (context.position1.isZero()) {
      return _0
    } else if (context.position1.gt(_0)) {
      return context.fundingRateLimit.negated()
    } else {
      return context.fundingRateLimit
    }
  }
  
  context = computeAMMPoolMargin(context, context.openSlippageFactor)
  let fr = context.fundingRateLimit
    .times(context.index).times(context.position1)
    .div(context.poolMargin).negated()
  fr = BigNumber.minimum(fr, context.fundingRateLimit)
  fr = BigNumber.maximum(fr, context.fundingRateLimit.negated())
  return fr
}
