/*
  Some peripheral tools to calculate trading amounts

  If you don't need these tools, you can remove this file to reduce the package size.
*/
import {
  computeAccount,
  computeTradeWithPrice,
  computeAMMTrade,
  computeAMMPrice,
} from './computation'
import {
  BigNumberish,
  AccountStorage,
  AccountDetails,
  PerpetualStorage,
  AMMTradingContext,
} from './types'
import {
  initAMMTradingContext,
  isAMMSafe,
  computeM0,
  computeAMMSafeShortPositionAmount,
  computeAMMSafeLongPositionAmount,
  computeAMMInternalOpen,
  computeAMMInternalClose,
} from './amm'
import { BugError } from './types'
import { DECIMALS, _0, _1, _2, _INF } from './constants'
import { sqrt, normalizeBigNumberish } from './utils'
import BigNumber from 'bignumber.js'
const minimize = require('minimize-golden-section-1d')

// the returned amount is the trader's perspective
// note: the position value is "mark * | x |" but we use "price * | x |" instead. because this function
//       is designed for "stop order". when stop order matches, the mark price is near the trading price.
export function computeMaxTradeAmountWithPrice(
  p: PerpetualStorage,
  s: AccountStorage,
  price: BigNumberish,
  maxLeverage: BigNumberish,  // trader's lev
  feeRate: BigNumberish,
  isBuy: boolean,  // trader's direction
) {
  const normalizedPrice = normalizeBigNumberish(price)
  const normalizedMaxLeverage = normalizeBigNumberish(maxLeverage)
  const normalizedFeeRate = normalizeBigNumberish(feeRate)
  if (normalizedPrice.lte(_0) || normalizedMaxLeverage.lte(_0)) {
    throw Error(`bad price ${normalizedPrice.toFixed()} or maxLeverage ${normalizedMaxLeverage.toFixed()}`)
  }

  // close all
  let newAccount = s
  let closeAmount = newAccount.positionAmount.negated()
  if (!closeAmount.isZero()) {
    newAccount = computeTradeWithPrice(p, s, normalizedPrice, closeAmount, normalizedFeeRate)
  }
  const newDetails = computeAccount(p, newAccount)

  // open again
  //                        price | x |
  // lev = ----------------------------------------------
  //        (cash - price x - price | x | fee) + price x
  //                 cash lev 
  // => x = ± ---------------------
  //           (1 + lev fee) price
  const cash = newDetails.accountComputed.availableMargin
  let denominator = normalizedMaxLeverage.times(normalizedFeeRate).plus(_1).times(normalizedPrice)
  if (denominator.isZero()) {
    // no solution
    return _0
  }
  let openAmount = cash.times(normalizedMaxLeverage).div(denominator)
  if (!isBuy) {
    openAmount = openAmount.negated()
  }
  const result = closeAmount.plus(openAmount)

  // check the direction
  if (isBuy && result.lt(_0)) {
    return _0
  } else if (!isBuy && result.gt(_0)) {
    return _0
  }

  return result
}

// the returned amount is the trader's perspective
export function computeAMMMaxTradeAmount(
  p: PerpetualStorage,
  trader: AccountStorage,
  amm: AccountStorage,
  maxLeverage: BigNumberish,  // trader's lev
  isBuy: boolean,  // trader's direction
): BigNumber {
  const normalizeMaxLeverage = normalizeBigNumberish(maxLeverage)

  // if amm is unsafe, return 0
  const ammDetails = computeAccount(p, amm)
  const ammContext = initAMMTradingContext(p, ammDetails)
  if (!isAMMSafe(ammContext, p.beta1)) {
    if (isBuy && amm.positionAmount.lt(_0)) {
      return _0
    }
    if (!isBuy && amm.positionAmount.gt(_0)) {
      return _0
    }
  }

  // guess = marginBalance * lev / index
  const traderDetails = computeAccount(p, trader)
  const guess = traderDetails.accountComputed.marginBalance.times(normalizeMaxLeverage).div(p.indexPrice)

  // search
  function checkTrading(a: number): number {
    if (a == 0) {
      return 0
    }
    try {
      const context = computeAMMTrade(p, trader, amm, new BigNumber(a))
      const newTraderDetails = computeAccount(p, context.takerAccount)
      if (!newTraderDetails.accountComputed.isSafe
        || newTraderDetails.accountComputed.leverage.gt(normalizeMaxLeverage)) {
        return Math.abs(a)
      }
      return -Math.abs(a) // return a negative value
    } catch (e) {
      return Math.abs(a) // punish larger a
    }
  }
  const options: any = {
    maxIterations: 15
  }
  if (isBuy) {
    options.lowerBound = 0
    options.guess = guess.toNumber()
  } else {
    options.upperBound = 0
    options.guess = guess.negated().toNumber()
  }
  const answer: any = {}
  minimize(checkTrading, options, answer)
  const result = new BigNumber(answer.argmin as number)
  return result
}

// the returned amount is the trader's perspective
export function computeAMMTradeAmountByMargin(
  p: PerpetualStorage,
  amm: AccountStorage,
  deltaMargin: BigNumberish,  // trader's margin change. < 0 if buy, > 0 if sell
): BigNumber {
  const normalizeDeltaMargin = normalizeBigNumberish(deltaMargin)

  // if amm is unsafe, return 0
  const ammDetails = computeAccount(p, amm)
  const ammContext = initAMMTradingContext(p, ammDetails)
  if (!isAMMSafe(ammContext, p.beta1)) {
    if (normalizeDeltaMargin.lt(_0) && amm.positionAmount.lt(_0)) {
      return _0
    }
    if (normalizeDeltaMargin.gt(_0) && amm.positionAmount.gt(_0)) {
      return _0
    }
  }

  // guess = deltaMargin / index
  const guess = normalizeDeltaMargin.div(p.indexPrice).negated()

  // search
  function checkTrading(a: number): number {
    if (a == 0) {
      return 0
    }
    try {
      const price = computeAMMPrice(p, amm, new BigNumber(a))
      // err = | expected trader margin - actual trader margin |
      const actualTraderMargin = price.deltaAMMMargin.negated()
      const err = actualTraderMargin.minus(normalizeDeltaMargin).abs()
      return err.toNumber()
    } catch (e) {
      return Math.abs(a) // punish larger a
    }
  }
  const options: any = {
    maxIterations: 15
  }
  if (normalizeDeltaMargin.lt(_0)) {
    // trader buys
    options.lowerBound = 0
    options.guess = guess.toNumber()
  } else {
    // trader sells
    options.upperBound = 0
    options.guess = guess.toNumber()
  }
  const answer: any = {}
  minimize(checkTrading, options, answer)
  const result = new BigNumber(answer.argmin as number)
  return result
}

// the inverse function of VWAP when AMM holds short
// call computeM0 before this function
// the returned amount(= pos2 - pos1) is the amm's perspective
export function computeAMMShortInverseVWAP(
  context: AMMTradingContext,
  price: BigNumber,
  beta: BigNumber,
  isClosing: boolean,
): BigNumber {
  if (!context.isSafe) {
    throw new BugError('bug: do not call computeAMMShortInverseVWAP when unsafe')
  }
  const { index, pos1, m0 } = context
  const previousMa1MinusMa2 = context.deltaMargin.negated()
  const previousAmount = context.deltaPosition
  /*
  D = previousMa1MinusMa2 - previousAmount price;
  E = beta - 1;
  F = m0 + i pos1;
  A = i F (i E + price);
  B = i^3 E pos1^2 + m0^2 price + 
    i^2 pos1 (-D + 2 E m0 + pos1 price) - 
    i m0 (D + m0 - 2 pos1 price);
  C = F^2 D;
  sols = 1/(2 A) (-B - sqrt(B^2 + 4 A C));
  */
  const d = previousMa1MinusMa2.minus(previousAmount.times(price))
  const e = beta.minus(_1)
  const f = index.times(pos1).plus(m0)
  const a = index.times(e).plus(price).times(f).times(index)
  let denominator = a.times(_2)
  if (denominator.isZero()) {
    /*
    G = i E previousAmount + previousMa1MinusMa2;
    sols = -(F^2 G)/i /(beta m0^2 + F G)
    */
    const g = index.times(e).times(previousAmount).plus(previousMa1MinusMa2)
    let denominator2 = beta.times(m0).times(m0).plus(f.times(g))
    if (denominator2.isZero()) {
      // no solution
      // TODO: do we need an exception?
      console.log(`warn: computeAMMShortInverseVWAP denominator2 = 0. m0 = ${m0.toFixed()}, pos1 = ${pos1.toFixed()}, index = ${index.toFixed()}, price = ${price.toFixed()}, previousMa1MinusMa2 = ${previousMa1MinusMa2.toFixed()}, previousAmount = ${previousAmount.toFixed()}`)
      return _0
    }
    const amount = f.times(f).times(g).div(index).div(denominator2)
    return amount.dp(DECIMALS, BigNumber.ROUND_DOWN)
  }
  let b = index.times(index).times(index).times(e).times(pos1).times(pos1)
  b = b.plus(m0.times(m0).times(price))
  b = b.plus(pos1.times(price).plus(e.times(m0).times(_2)).minus(d).times(pos1).times(index).times(index))
  b = b.minus(d.plus(m0).minus(pos1.times(price).times(_2)).times(m0).times(index))
  const c = f.times(f).times(d)
  const beforeSqrt = a.times(c).times(4).plus(b.times(b))
  if (beforeSqrt.lt(_0)) {
    console.log(`warn: computeAMMShortInverseVWAP Δ < 0. m0 = ${m0.toFixed()}, pos1 = ${pos1.toFixed()}, index = ${index.toFixed()}, price = ${price.toFixed()}, previousMa1MinusMa2 = ${previousMa1MinusMa2.toFixed()}, previousAmount = ${previousAmount.toFixed()}`)
    return _0
  }
  let numerator = sqrt(beforeSqrt)
  if (isClosing) {
    numerator = numerator.negated()
  }
  numerator = numerator.plus(b).negated()
  const amount = numerator.div(denominator)
  return amount.dp(DECIMALS, BigNumber.ROUND_DOWN)
}

// the inverse function of VWAP when AMM holds long
// call computeM0 before this function
// the returned amount(= pos2 - pos1) is the amm's perspective
export function computeAMMLongInverseVWAP(
  context: AMMTradingContext,
  price: BigNumber,
  beta: BigNumber,
  isClosing: boolean,
): BigNumber {
  if (!context.isSafe) {
    throw new BugError('bug: do not call computeAMMLongInverseVWAP when unsafe')
  }
  const { index, m0, ma1 } = context
  const previousMa1MinusMa2 = context.deltaMargin.negated()
  const previousAmount = context.deltaPosition
  /*
  D = previousMa1MinusMa2 - previousAmount price;
  A = ma1 price (i + (-1 + beta) price);
  B = i ma1 (D + ma1) - beta m0^2 price + (-1 + beta) ma1 (2 D + ma1) price;
  C = D (ma1 (ma1 + D) + beta (m0^2 - ma1 (ma1 + D)));
  sols = 1/(2 A) (B + sqrt(B^2 + 4 A C));
  */
  const d = previousMa1MinusMa2.minus(previousAmount.times(price))
  const a = beta.minus(_1).times(price).plus(index).times(ma1).times(price)
  let b = ma1.plus(d).times(index).times(ma1)
  b = b.minus(beta.times(m0).times(m0).times(price))
  b = b.plus(beta.minus(_1).times(ma1).times(_2.times(d).plus(ma1)).times(price))
  let c = ma1.plus(d).times(ma1).negated().plus(m0.times(m0)).times(beta)
  c = c.plus(ma1.plus(d).times(ma1))
  c = c.times(d)
  let denominator = a.times(_2)
  if (denominator.isZero()) {
    // G = i previousAmount + previousMa1MinusMa2 (beta - 1);
    // H = beta m0^2 - ma1 G;
    // sols = kappaG (-H + ma1^2 (k - 1))/i/H
    const g = index.times(previousAmount).plus(beta.minus(_1).times(previousMa1MinusMa2))
    const h = beta.times(m0).times(m0).minus(ma1.times(g))
    if (h.isZero()) {
      // no solution
      // TODO: do we need an exception?
      console.log(`warn: computeAMMLongInverseVWAP denominator2 = 0. m0 = ${m0.toFixed()}, ma1 = ${ma1.toFixed()}, index = ${index.toFixed()}, price = ${price.toFixed()}, previousMa1MinusMa2 = ${previousMa1MinusMa2.toFixed()}, previousAmount = ${previousAmount.toFixed()}`)
      return _0
    }
    const amount = beta.minus(_1).times(ma1).times(ma1).minus(h).times(g).div(index).div(h)
    return amount.dp(DECIMALS, BigNumber.ROUND_DOWN)
  }
  let beforeSqrt = a.times(c).times(4).plus(b.times(b))
  if (beforeSqrt.lt(_0)) {
    console.log(`warn: computeAMMLongInverseVWAP Δ < 0. m0 = ${m0.toFixed()}, ma1 = ${ma1.toFixed()}, index = ${index.toFixed()}, price = ${price.toFixed()}, previousMa1MinusMa2 = ${previousMa1MinusMa2.toFixed()}, previousAmount = ${previousAmount.toFixed()}`)
    return _0
  }
  let numerator = sqrt(beforeSqrt)
  if (isClosing) {
    numerator = numerator.negated()
  }
  numerator = numerator.plus(b)
  const amount = numerator.div(denominator)
  return amount.dp(DECIMALS, BigNumber.ROUND_DOWN)
}

// the returned amount is the trader's perspective
export function computeAMMAmountWithPrice(
  p: PerpetualStorage,
  amm: AccountDetails,
  isBuy: boolean,  // trader's direction
  limitPrice: BigNumberish,
): BigNumber {
  // shift by spread
  let normalizedLimitPrice = normalizeBigNumberish(limitPrice)
  if (isBuy) {
    normalizedLimitPrice = normalizedLimitPrice.div(_1.plus(p.halfSpreadRate))
  } else {
    normalizedLimitPrice = normalizedLimitPrice.div(_1.minus(p.halfSpreadRate))
  }

  // get amount
  let context = initAMMTradingContext(p, amm)
  if (context.pos1.lte(_0) && isBuy) {
    return computeAMMAmountShortOpen(context, normalizedLimitPrice, p).negated()
  } else if (context.pos1.lt(_0) && !isBuy) {
    //                    ^^ 0 is another story
    return computeAMMAmountShortClose(context, normalizedLimitPrice, p).negated()
  } else if (context.pos1.gte(_0) && !isBuy) {
    return computeAMMAmountLongOpen(context, normalizedLimitPrice, p).negated()
  } else if (context.pos1.gt(_0) && isBuy) {
    //                    ^^ 0 is another story
    return computeAMMAmountLongClose(context, normalizedLimitPrice, p).negated()
  }
  throw new Error('bug: unknown trading direction')
}

// spread and fees are ignored. add them after calling this function
// the returned amount is the amm's perspective
export function computeAMMAmountShortOpen(
  context: AMMTradingContext,
  limitPrice: BigNumber, // fill price <= limitPrice
  p: PerpetualStorage,
): BigNumber {
  // case 1: unsafe open
  if (!isAMMSafe(context, p.beta1)) {
    return _0
  }
  context = computeM0(context, p.beta1)

  // case 2: limit by safePos
  const safePos2 = computeAMMSafeShortPositionAmount(context, p.beta1)
  if (safePos2.gt(_0) || safePos2.gt(context.pos1)) {
    return _0
  }
  const maxAmount = safePos2.minus(context.pos1)
  if (maxAmount.gte(_0)) {
    console.log(`warn: short open, but pos1 ${context.pos1.toFixed()} < safePos2 ${safePos2.toFixed()}`)
    return _0
  }
  const safePos2Context = computeAMMInternalOpen(context, maxAmount, p)
  if (!maxAmount.eq(safePos2Context.deltaPosition.minus(context.deltaPosition))) {
    throw new BugError('open positions failed')
  }
  const safePos2Price = safePos2Context.deltaMargin.div(safePos2Context.deltaPosition).abs()
  if (safePos2Price.lte(limitPrice)) {
    return maxAmount
  }

  // case 3: inverse function of price function
  const amount = computeAMMShortInverseVWAP(context, limitPrice, p.beta1, false)
  if (amount.gte(_0)) {
    // closing
    return _0
  }

  return amount
}

// spread and fees are ignored. add them after calling this function
// the returned amount is the amm's perspective
export function computeAMMAmountShortClose(
  context: AMMTradingContext,
  limitPrice: BigNumber, // fill price >= limitPrice
  p: PerpetualStorage,
): BigNumber {
  if (!context.deltaMargin.isZero() || !context.deltaPosition.isZero()) {
    throw new BugError('partial close is not supported')
  }

  if (!context.pos1.isZero()) {
    // case 1: limit by existing positions
    const zeroContext = computeAMMInternalClose(context, context.pos1.negated(), p)
    if (zeroContext.deltaPosition.isZero()) {
      throw new BugError('close to zero failed')
    }
    const zeroPrice = zeroContext.deltaMargin.div(zeroContext.deltaPosition).abs()
    if (zeroPrice.gte(limitPrice)) {
      // close all
      context = zeroContext
    } else if (!isAMMSafe(context, p.beta2)) {
      // case 2: unsafe close, but price not matched
      return _0
    } else {
      // case 3: close by price 
      context = computeM0(context, p.beta2)
      const amount = computeAMMShortInverseVWAP(context, limitPrice, p.beta2, true)
      if (amount.gt(_0)) {
        context = computeAMMInternalClose(context, amount, p)
      }
    }
  }

  // case 4: open positions
  if (context.pos1.gte(_0)) {
    const openAmount = computeAMMAmountLongOpen(context, limitPrice, p)
    return context.deltaPosition.plus(openAmount)
  }
  return context.deltaPosition
}

// spread and fees are ignored. add them after calling this function
// the returned amount is the amm's perspective
export function computeAMMAmountLongClose(
  context: AMMTradingContext,
  limitPrice: BigNumber, // fill price <= limitPrice
  p: PerpetualStorage,
): BigNumber {
  if (!context.deltaMargin.isZero() || !context.deltaPosition.isZero()) {
    throw new BugError('partial close is not supported')
  }

  if (!context.pos1.isZero()) {
    // case 1: limit by existing positions
    const zeroContext = computeAMMInternalClose(context, context.pos1.negated(), p)
    if (zeroContext.deltaPosition.isZero()) {
      throw new BugError('close to zero failed')
    }
    const zeroPrice = zeroContext.deltaMargin.div(zeroContext.deltaPosition).abs()
    if (zeroPrice.lte(limitPrice)) {
      // close all
      context = zeroContext
    } else if (!isAMMSafe(context, p.beta2)) {
      // case 2: unsafe close, but price not matched
      return _0
    } else {
      // case 3: close by price 
      context = computeM0(context, p.beta2)
      const amount = computeAMMLongInverseVWAP(context, limitPrice, p.beta2, true)
      if (amount.lt(_0)) {
        context = computeAMMInternalClose(context, amount, p)
      }
    }
  }

  // case 4: open positions
  if (context.pos1.lte(_0)) {
    const openAmount = computeAMMAmountShortOpen(context, limitPrice, p)
    return context.deltaPosition.plus(openAmount)
  }
  return context.deltaPosition
}

// spread and fees are ignored. add them after calling this function
// the returned amount is the amm's perspective
export function computeAMMAmountLongOpen(
  context: AMMTradingContext,
  limitPrice: BigNumber, // fill price >= limitPrice
  p: PerpetualStorage,
): BigNumber {
  // case 1: unsafe open
  if (!isAMMSafe(context, p.beta1)) {
    return _0
  }
  context = computeM0(context, p.beta1)

  // case 2: limit by safePos
  const safePos2 = computeAMMSafeLongPositionAmount(context, p.beta1)
  if (safePos2.lt(_0) || safePos2.lt(context.pos1)) {
    return _0
  }
  const maxAmount = safePos2.minus(context.pos1)
  if (maxAmount.lte(_0)) {
    console.log(`warn: long open, but pos1 ${context.pos1.toFixed()} > safePos2 ${safePos2.toFixed()}`)
    return _0
  }
  const safePos2Context = computeAMMInternalOpen(context, maxAmount, p)
  if (!maxAmount.eq(safePos2Context.deltaPosition.minus(context.deltaPosition))) {
    throw new BugError('open positions failed')
  }
  const safePos2Price = safePos2Context.deltaMargin.div(safePos2Context.deltaPosition).abs()
  if (safePos2Price.gte(limitPrice)) {
    return maxAmount
  }

  // case 3: inverse function of price function
  const amount = computeAMMLongInverseVWAP(context, limitPrice, p.beta1, false)
  if (amount.lte(_0)) {
    // closing
    return _0
  }

  return amount
}
