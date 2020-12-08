/*
  Simulate the smart contract's computation.
*/

import { BigNumber } from 'bignumber.js'
import { DECIMALS, _0, _1, _2, _4 } from './constants'
import { PerpetualStorage, AMMTradingContext, AccountDetails } from './types'
import { sqrt, splitAmount } from './utils'
import { InsufficientLiquidityError, BugError } from './types'

export function initAMMTradingContext(p: PerpetualStorage, amm: AccountDetails): AMMTradingContext {
  const pos1 = amm.accountStorage.positionAmount
  const cash = amm.accountComputed.availableCashBalance
  const index = p.indexPrice
  const lev = p.targetLeverage
  const context: AMMTradingContext = { index, lev, cash, pos1, isSafe: true, m0: _0, mv: _0, ma1: _0, deltaMargin: _0, deltaPosition: _0 }
  return context
}

// the amount is the amm's perspective
export function computeAMMInternalTrade(p: PerpetualStorage, amm: AccountDetails, amount: BigNumber): AMMTradingContext {
  let context = initAMMTradingContext(p, amm)
  const { close, open } = splitAmount(context.pos1, amount)
  if (close.isZero() && open.isZero()) {
    throw new BugError('amm trade: trading amount = 0')
  }

  // trade
  if (!close.isZero()) {
    context = computeAMMInternalClose(context, close, p)
  }
  if (!open.isZero()) {
    context = computeAMMInternalOpen(context, open, p)
  }

  // spread
  if (amount.lt(_0)) {
    // amm sells, trader buys
    context.deltaMargin = context.deltaMargin.times(_1.plus(p.halfSpreadRate)).dp(DECIMALS)
  } else {
    // amm buys, trader sells
    context.deltaMargin = context.deltaMargin.times(_1.minus(p.halfSpreadRate)).dp(DECIMALS)
  }

  return context
}

// the amount is the amm's perspective
export function computeAMMInternalClose(context: AMMTradingContext, amount: BigNumber, p: PerpetualStorage): AMMTradingContext {
  const beta = p.beta2
  let ret: AMMTradingContext = { ...context }
  const { index } = ret
  const pos2 = ret.pos1.plus(amount)
  let deltaMargin = _0

  // trade
  if (isAMMSafe(ret, beta)) {
    ret = computeM0(ret, beta)
    deltaMargin = computeDeltaMargin(ret, beta, pos2)
  } else {
    deltaMargin = index.times(amount).negated()
  }

  // commit
  ret.deltaMargin = ret.deltaMargin.plus(deltaMargin)
  ret.deltaPosition = ret.deltaPosition.plus(amount)
  ret.cash = ret.cash.plus(deltaMargin)
  ret.pos1 = pos2
  return ret
}

// the amount is the amm's perspective
export function computeAMMInternalOpen(context: AMMTradingContext, amount: BigNumber, p: PerpetualStorage): AMMTradingContext {
  const beta = p.beta1
  let ret: AMMTradingContext = { ...context }
  const pos2 = ret.pos1.plus(amount)
  let deltaMargin = _0

  // pre-check
  if (!isAMMSafe(ret, beta)) {
    throw new InsufficientLiquidityError(`amm can not open position anymore: unsafe before trade`)
  }
  ret = computeM0(ret, beta)
  if (amount.gt(_0)) {
    // 0.....pos2.....safePos2
    const safePos2 = computeAMMSafeLongPositionAmount(ret, beta)
    if (pos2.gt(safePos2)) {
      throw new InsufficientLiquidityError(`amm can not open position anymore: position too large after trade ${pos2.toFixed()} > ${safePos2.toFixed()}`)
    }
  } else {
    // safePos2.....pos2.....0
    const safePos2 = computeAMMSafeShortPositionAmount(ret, beta)
    if (pos2.lt(safePos2)) {
      throw new InsufficientLiquidityError(`amm can not open position anymore: position too large after trade ${pos2.toFixed()} < ${safePos2.toFixed()}`)
    }
  }

  // trade
  deltaMargin = computeDeltaMargin(ret, beta, pos2)

  // commit
  ret.deltaMargin = ret.deltaMargin.plus(deltaMargin)
  ret.deltaPosition = ret.deltaPosition.plus(amount)
  ret.cash = ret.cash.plus(deltaMargin)
  ret.pos1 = pos2

  return ret
}

export function computeM0(context: AMMTradingContext, beta: BigNumber): AMMTradingContext {
  if (!isAMMSafe(context, beta)) {
    return { ...context, isSafe: false }
  }
  const { pos1, cash, lev } = context
  let mv = _0
  if (pos1.isZero()) {
    mv = computeM0Flat(context)
  } else if (pos1.lt(_0)) {
    mv = computeM0Short(context, beta)
  } else {
    mv = computeM0Long(context, beta)
  }
  const m0 = mv.times(lev).div(lev.minus(_1))
  const ma1 = cash.plus(mv)
  return { ...context, isSafe: true, mv, m0, ma1 }
}

export function computeM0Flat(context: AMMTradingContext): BigNumber {
  const { pos1, cash, lev } = context
  if (!pos1.isZero()) {
    throw new BugError(`bug: pos1 ${pos1.toFixed()} != 0`)
  }
  // v = cash * (lev - 1)
  const mv = cash.times(lev.minus(_1))
  return mv.dp(DECIMALS)
}

export function computeM0Short(context: AMMTradingContext, beta: BigNumber): BigNumber {
  const { pos1, cash, index, lev } = context
  if (pos1.gt(_0)) {
    throw new BugError(`bug: pos1 (${pos1.toFixed()}) > 0`)
  }
  // a = 2 * index * pos1
  // b = lev * cash + index * pos1 * (lev + 1)
  // before_sqrt = b ** 2 - beta * lev * a ** 2
  // v = (lev - 1) / 2 / lev * (b - a + math.sqrt(before_sqrt))
  const a = _2.times(index).times(pos1)
  let b = lev.times(cash)
  b = b.plus(index.times(pos1).times(lev.plus(_1)))
  let beforeSqrt = b.times(b)
  beforeSqrt = beforeSqrt.minus(beta.times(lev).times(a).times(a))
  if (beforeSqrt.lt(_0)) {
    throw new BugError('edge case: short m0 sqrt < 0')
  }
  let afterSqrt = sqrt(beforeSqrt)
  let mv = lev.minus(_1).div(_2).div(lev)
  mv = mv.times(b.minus(a).plus(afterSqrt))
  return mv.dp(DECIMALS)
}

export function computeM0Long(context: AMMTradingContext, beta: BigNumber): BigNumber {
  const { pos1, cash, index, lev } = context
  if (pos1.lt(_0)) {
    throw new BugError(`bug: pos1 (${pos1.toFixed()}) < 0`)
  }
  // b = lev * cash + index * pos1 * (lev - 1)
  // before_sqrt = b ** 2 + 4 * beta * index * lev * cash * pos1
  // v = (lev - 1) / 2 / (lev + beta - 1) * (b - 2 * (1 - beta) * cash + math.sqrt(before_sqrt))
  let b = lev.times(cash).plus(index.times(pos1).times(lev.minus(_1)))
  let beforeSqrt = b.times(b)
  beforeSqrt = beforeSqrt.plus(_4.times(beta).times(index).times(lev).times(cash).times(pos1))
  if (beforeSqrt.lt(_0)) {
    throw new BugError('edge case: long m0 sqrt < 0')
  }
  let afterSqrt = sqrt(beforeSqrt)
  let mv = lev.minus(_1).div(_2).div(lev.plus(beta).minus(_1))
  mv = mv.times(b.minus(_2.times(_1.minus(beta).times(cash))).plus(afterSqrt))
  return mv.dp(DECIMALS)
}

export function isAMMSafe(context: AMMTradingContext, beta: BigNumber): boolean {
  const { pos1 } = context
  if (pos1.isZero()) {
    return true
  } else if (pos1.lt(_0)) {
    return isAMMSafeShort(context, beta)
  } else {
    return isAMMSafeLong(context, beta)
  }
}

export function isAMMSafeShort(context: AMMTradingContext, beta: BigNumber): boolean {
  const { pos1, cash, index, lev } = context
  if (pos1.gt(_0)) {
    throw new BugError(`bug: pos1 (${pos1.toFixed()}) > 0`)
  }
  // safeIndex = -lev * cash / pos / (lev + 1 + 2 * math.sqrt(beta * lev))
  const beforeSqrt = beta.times(lev)
  if (beforeSqrt.lt(_0)) {
    throw new BugError('bug: ammSafe sqrt < 0')
  }
  const denominator = lev.plus(_1).plus(_2.times(sqrt(beforeSqrt)))
  const safeIndex = lev.negated().times(cash).div(pos1).div(denominator)
  return index.lte(safeIndex)
}

export function isAMMSafeLong(context: AMMTradingContext, beta: BigNumber): boolean {
  const { pos1, cash, index, lev } = context
  if (pos1.lt(_0)) {
    throw new BugError(`bug: pos1 (${pos1.toFixed()}) < 0`)
  }
  if (cash.gte(_0)) {
    return true
  }
  // Δ = beta * (lev - 1 + beta)
  // safeIndex = -lev * cash * (lev - 1 + 2 * (beta + math.sqrt(Δ)))
  // / pos / (lev - 1) ** 2
  const levMinus1 = lev.minus(1)
  const beforeSqrt = beta.times(levMinus1.plus(beta))
  if (beforeSqrt.lt(_0)) {
    throw new BugError('bug: ammSafe sqrt < 0')
  }
  let safeIndex = lev.negated().times(cash)
  safeIndex = safeIndex.times(levMinus1.plus(_2.times(beta.plus(sqrt(beforeSqrt)))))
  safeIndex = safeIndex.div(pos1).div(levMinus1).div(levMinus1)
  return index.gte(safeIndex)
}

// call computeM0 before this function
export function computeAMMSafeShortPositionAmount(context: AMMTradingContext, beta: BigNumber): BigNumber {
  if (!context.isSafe) {
    throw new BugError('bug: do not call shortPosition when unsafe')
  }
  const { index, lev, m0 } = context
  // safePosition = -m0 / i / (1 + sqrt(beta * lev))
  const beforeSqrt = beta.times(lev)
  if (beforeSqrt.lt(_0)) {
    throw new BugError('bug: ammSafe sqrt < 0')
  }
  const safePosition = m0.negated().div(index).div(sqrt(beforeSqrt).plus(_1))
  return safePosition.dp(DECIMALS)
}

// call computeM0 before this function
export function computeAMMSafeLongPositionAmount(context: AMMTradingContext, beta: BigNumber): BigNumber {
  if (!context.isSafe) {
    throw new BugError('bug: do not call shortPosition when unsafe')
  }
  const { index, lev, m0 } = context
  let safePosition = _0

  const edge1 = beta.times(lev).plus(beta).minus(_1)
  // if -1 + beta + beta lev = 0
  // safePosition = m0 / 2 / i / (1 - 2 beta)
  if (edge1.isZero()) {
    safePosition = m0.div(_2).div(index).div(_1.minus(_2.times(beta)))
    return safePosition.dp(DECIMALS)
  }

  // a = (lev + beta - 1)
  //                    (2 * beta - 1) * a + sqrt(beta * a) * (lev + 2beta - 2)
  // safePosition = m0 -------------------------------------------------------------
  //                           i * (lev - 1) * (beta * lev + beta - 1)
  const a = lev.plus(beta).minus(1)
  const beforeSqrt = beta.times(a)
  if (beforeSqrt.lt(_0)) {
    throw new BugError('bug: ammSafe sqrt < 0')
  }
  const denominator = edge1.times(lev.minus(_1)).times(index)
  safePosition = _2.times(beta).minus(_2).plus(lev)
  safePosition = safePosition.times(sqrt(beforeSqrt))
  safePosition = safePosition.plus(_2.times(beta).minus(_1).times(a))
  safePosition = safePosition.times(m0).div(denominator)
  return safePosition.dp(DECIMALS)
}

// ma2 - ma1
export function computeDeltaMargin(context: AMMTradingContext, beta: BigNumber, pos2: BigNumber): BigNumber {
  const { pos1 } = context
  if (pos1.gte(_0) && pos2.gte(_0)) {
    return computeDeltaMarginLong(context, beta, pos2)
  } else if (pos1.lte(_0) && pos2.lte(_0)) {
    return computeDeltaMarginShort(context, beta, pos2)
  } else {
    throw new BugError('bug: cross direction is not supported')
  }
}

// ma2 - ma1
export function computeDeltaMarginShort(context: AMMTradingContext, beta: BigNumber, pos2: BigNumber): BigNumber {
  const { pos1, index, m0 } = context
  if (pos1.gt(_0)) {
    throw new BugError(`bug: pos1 (${pos1.toFixed()}) > 0`)
  }
  if (pos2.gt(_0)) {
    throw new BugError(`bug: pos2 (${pos2.toFixed()}) > 0`)
  }
  if (m0.lte(_0)) {
    throw new InsufficientLiquidityError(`m0 (${m0.toFixed()}) <= 0`)
  }
  // ma2 - ma1 = index * (pos1 - pos2) * (1 - beta + beta * m0**2 / (m0 + pos1 * index) / (m0 + pos2 * index))
  let deltaMargin = beta.times(m0).times(m0)
  deltaMargin = deltaMargin.div(pos1.times(index).plus(m0))
  deltaMargin = deltaMargin.div(pos2.times(index).plus(m0))
  deltaMargin = deltaMargin.plus(_1).minus(beta)
  deltaMargin = deltaMargin.times(index).times(pos1.minus(pos2))
  return deltaMargin.dp(DECIMALS)
}

// ma2 - ma1
export function computeDeltaMarginLong(context: AMMTradingContext, beta: BigNumber, pos2: BigNumber): BigNumber {
  const { pos1, index, m0, ma1 } = context
  if (pos1.lt(_0)) {
    throw new BugError(`bug: pos1 (${pos1.toFixed()}) < 0`)
  }
  if (pos2.lt(_0)) {
    throw new BugError(`bug: pos2 (${pos2.toFixed()}) < 0`)
  }
  if (m0.lte(_0)) {
    throw new InsufficientLiquidityError(`m0 (${m0.toFixed()}) <= 0`)
  }
  if (ma1.lte(_0)) {
    throw new InsufficientLiquidityError(`ma1 (${ma1.toFixed()}) <= 0`)
  }
  // a = 2 * (1 - beta) * ma1
  // assert a != 0
  // b = -beta * m0 ** 2 + ma1 * (ma1 * (1 - beta) - index * (pos2 - pos1))
  // before_sqrt = b**2 + 2 * a * ma1 * m0 ** 2 * beta
  // assert before_sqrt >= 0
  // ma2 = (b + math.sqrt(before_sqrt)) / a
  const a = _1.minus(beta).times(ma1).times(_2)
  if (a.isZero()) {
    throw new BugError('edge case: deltaMarginLong.a = 0')
  }
  let b = pos2.minus(pos1).times(index)
  b = a.div(_2).minus(b).times(ma1)
  b = b.minus(beta.times(m0).times(m0))
  let beforeSqrt = beta.times(a).times(ma1).times(m0).times(m0).times(2)
  beforeSqrt = beforeSqrt.plus(b.times(b))
  if (beforeSqrt.lt(_0)) {
    throw new BugError('edge case: deltaMarginLong.sqrt < 0')
  }
  const ma2 = sqrt(beforeSqrt).plus(b).div(a)
  return ma2.minus(ma1).dp(DECIMALS)
}

export function computeFundingRate(p: PerpetualStorage, amm: AccountDetails): BigNumber {
  let context = initAMMTradingContext(p, amm)  
  if (!isAMMSafe(context, p.beta1)) {
    if (context.pos1.isZero()) {
      return _0
    } else if (context.pos1.gt(_0)) {
      return p.fundingRateCoefficient.negated()
    } else {
      return p.fundingRateCoefficient
    }
  }
  
  context = computeM0(context, p.beta1)
  return p.fundingRateCoefficient.times(p.indexPrice).times(context.pos1).div(context.m0).negated()
}
