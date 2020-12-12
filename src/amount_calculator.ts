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
  InvalidArgumentError,
  AccountStorage,
  LiquidityPoolStorage,
  AMMTradingContext,
} from './types'
import {
  initAMMTradingContext,
  isAMMSafe,
  computeAMMPoolMargin,
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
  p: LiquidityPoolStorage,
  marketID: string,
  s: AccountStorage,
  price: BigNumberish,
  maxLeverage: BigNumberish,  // trader's lev
  feeRate: BigNumberish,
  isTraderBuy: boolean,  // trader's direction
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
    newAccount = computeTradeWithPrice(p, marketID, s, normalizedPrice, closeAmount, normalizedFeeRate)
  }
  const newDetails = computeAccount(p, marketID, newAccount)

  // open again
  //                        price | x |
  // lev = ----------------------------------------------
  //        (cash - price x - price | x | fee) + price x
  //                 cash lev 
  // => x = ± ---------------------
  //           (1 + lev fee) price
  const cash = newDetails.accountComputed.availableCashBalance
  let denominator = normalizedMaxLeverage.times(normalizedFeeRate).plus(_1).times(normalizedPrice)
  if (denominator.isZero()) {
    // no solution
    return _0
  }
  let openAmount = cash.times(normalizedMaxLeverage).div(denominator)
  if (!isTraderBuy) {
    openAmount = openAmount.negated()
  }
  const result = closeAmount.plus(openAmount)

  // check the direction
  if (isTraderBuy && result.lt(_0)) {
    return _0
  } else if (!isTraderBuy && result.gt(_0)) {
    return _0
  }

  return result
}

// the returned amount is the trader's perspective
export function computeAMMMaxTradeAmount(
  p: LiquidityPoolStorage,
  marketID: string,
  trader: AccountStorage,
  maxLeverage: BigNumberish,  // trader's lev
  isTraderBuy: boolean,  // trader's direction
): BigNumber {
  const normalizeMaxLeverage = normalizeBigNumberish(maxLeverage)

  // if AMM is unsafe, return 0
  const ammContext = initAMMTradingContext(p, marketID)
  if (!isAMMSafe(ammContext, ammContext.beta1)) {
    if (isTraderBuy && ammContext.position1.lt(_0)) {
      return _0
    }
    if (!isTraderBuy && ammContext.position1.gt(_0)) {
      return _0
    }
  }

  // guess = marginBalance * lev / index
  const traderDetails = computeAccount(p, marketID, trader)
  const guess = traderDetails.accountComputed.marginBalance.times(normalizeMaxLeverage).div(ammContext.index)

  // search
  function checkTrading(a: number): number {
    if (a == 0) {
      return 0
    }
    try {
      const context = computeAMMTrade(p, marketID, trader, new BigNumber(a))
      const newTraderDetails = computeAccount(p, marketID, context.takerAccount)
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
    maxIterations: 20
  }
  if (isTraderBuy) {
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
  p: LiquidityPoolStorage,
  marketID: string,
  deltaMargin: BigNumberish,  // trader's margin change. < 0 if buy, > 0 if sell
): BigNumber {
  const normalizeDeltaMargin = normalizeBigNumberish(deltaMargin)

  // if AMM is unsafe, return 0
  const ammContext = initAMMTradingContext(p, marketID)
  if (!isAMMSafe(ammContext, ammContext.beta1)) {
    if (normalizeDeltaMargin.lt(_0) && ammContext.position1.lt(_0)) {
      return _0
    }
    if (normalizeDeltaMargin.gt(_0) && ammContext.position1.gt(_0)) {
      return _0
    }
  }

  // guess = deltaMargin / index
  const guess = normalizeDeltaMargin.div(ammContext.index).negated()

  // search
  function checkTrading(a: number): number {
    if (a == 0) {
      return 0
    }
    try {
      const price = computeAMMPrice(p, marketID, new BigNumber(a))
      // err = | expected trader margin - actual trader margin |
      const actualTraderMargin = price.deltaAMMMargin.negated()
      const err = actualTraderMargin.minus(normalizeDeltaMargin).abs()
      return err.toNumber()
    } catch (e) {
      return Math.abs(a) // punish larger a
    }
  }
  const options: any = {
    maxIterations: 40
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

// the inverse function of VWAP of AMM pricing function
// call computeAMMPoolMargin before this function
// the returned amount(= pos2 - pos1) is the AMM's perspective
// make sure ammSafe before this function
export function computeAMMInverseVWAP(
  context: AMMTradingContext,
  price: BigNumber,
  beta: BigNumber,
  isAMMBuy: boolean,
): BigNumber {
  const previousMa1MinusMa2 = context.deltaMargin.negated()
  const previousAmount = context.deltaPosition

  /*
  A = P_i β;
  B = -2 P_i M + 2 A N1 + 2 M price;
  C = -2 M (previousMa1MinusMa2 - previousAmount price);
  sols = (-B ± sqrt(B^2 - 4 A C)) / (2 A);
  */
  const a = context.index.times(beta)
  let denominator = a.times(_2)
  if (denominator.isZero()) {
    throw Error(`bad market parameter beta ${beta.toFixed()} or index ${context.index}.`)
  }
  let b = context.index.times(context.poolMargin).negated()
  b = b.plus(a.times(context.position1))
  b = b.plus(context.poolMargin.times(price))
  b = b.times(_2)
  const c = previousMa1MinusMa2.minus(previousAmount.times(price)).times(context.poolMargin).times(_2).negated()
  const beforeSqrt = a.times(c).times(4).negated().plus(b.times(b))
  if (beforeSqrt.lt(_0)) {
    throw new InvalidArgumentError(`computeAMMInverseVWAP: impossible price. `
      + `index = ${context.index.toFixed()}, price = ${price.toFixed()}, `
      + `M = ${context.poolMargin.toFixed()}, position1 = ${context.position1.toFixed()}, `
      + `previousMa1MinusMa2 = ${previousMa1MinusMa2.toFixed()}, previousAmount = ${previousAmount.toFixed()}`)
  }
  let numerator = sqrt(beforeSqrt)
  if (!isAMMBuy) {
    numerator = numerator.negated()
  }
  numerator = numerator.minus(b)
  const amount = numerator.div(denominator)
  return amount.dp(DECIMALS, BigNumber.ROUND_DOWN)
}

// the returned amount is the trader's perspective
export function computeAMMAmountWithPrice(
  p: LiquidityPoolStorage,
  marketID: string,
  isTraderBuy: boolean,  // trader's direction
  limitPrice: BigNumberish,
): BigNumber {
  if (!p.markets[marketID]) {
    throw new InvalidArgumentError(`market {marketID} not found in the pool`)
  }
  
  // add spread
  let normalizedLimitPrice = normalizeBigNumberish(limitPrice)
  if (isTraderBuy) {
    normalizedLimitPrice = normalizedLimitPrice.div(_1.plus(p.markets[marketID].halfSpread))
  } else {
    normalizedLimitPrice = normalizedLimitPrice.div(_1.minus(p.markets[marketID].halfSpread))
  }
  
  // get amount
  const isAMMBuy = !isTraderBuy
  let context = initAMMTradingContext(p, marketID)
  if (context.position1.lte(_0) && !isAMMBuy) {
    return computeAMMOpenAmountWithPrice(context, normalizedLimitPrice, isAMMBuy).negated()
  } else if (context.position1.lt(_0) && isAMMBuy) {
    //                         ^^ 0 is another story
    return computeAMMCloseAndOpenAmountWithPrice(context, normalizedLimitPrice, isAMMBuy).negated()
  } else if (context.position1.gte(_0) && isAMMBuy) {
    return computeAMMOpenAmountWithPrice(context, normalizedLimitPrice, isAMMBuy).negated()
  } else if (context.position1.gt(_0) && !isAMMBuy) {
    //                          ^^ 0 is another story
    return computeAMMCloseAndOpenAmountWithPrice(context, normalizedLimitPrice, isAMMBuy).negated()
  }
  throw new InvalidArgumentError('bug: unknown trading direction')
}

// // spread and fees are ignored. add them after calling this function
// // the returned amount is the AMM's perspective
export function computeAMMOpenAmountWithPrice(
  context: AMMTradingContext,
  limitPrice: BigNumber, // fill price <= limitPrice
  isAMMBuy: boolean,  // AMM's direction
): BigNumber {
  if (
    (isAMMBuy && context.position1.lt(_0) /* short buy */)
    || (!isAMMBuy && context.position1.gt(_0) /* long sell */)
  ) {
    throw new InvalidArgumentError(`this is not opening. pos1: ${context.position1} isBuy: ${isAMMBuy}`)
  }

  // case 1: unsafe open
  if (!isAMMSafe(context, context.beta1)) {
    return _0
  }
  context = computeAMMPoolMargin(context, context.beta1)

  // case 2: limit by safePos
  let safePos2: BigNumber
  if (isAMMBuy) {
    safePos2 = computeAMMSafeLongPositionAmount(context, context.beta1)
    if (safePos2.lt(context.position1)) {
      return _0
    }
  } else {
    safePos2 = computeAMMSafeShortPositionAmount(context, context.beta1)
    if (safePos2.gt(context.position1)) {
      return _0
    }
  }
  const maxAmount = safePos2.minus(context.position1)
  const safePos2Context = computeAMMInternalOpen(context, maxAmount)
  if (!maxAmount.eq(safePos2Context.deltaPosition.minus(context.deltaPosition))) {
    throw new BugError('open positions failed')
  }
  const safePos2Price = safePos2Context.deltaMargin.div(safePos2Context.deltaPosition).abs()
  if (
    (isAMMBuy && safePos2Price.gte(limitPrice) /* long open. trader sell */)
    || (!isAMMBuy && safePos2Price.lte(limitPrice) /* short open. trader buy */ )
  ) {
    return maxAmount
  }

  // case 3: inverse function of price function
  const amount = computeAMMInverseVWAP(context, limitPrice, context.beta1, isAMMBuy)
  if (
    (isAMMBuy && amount.gt(_0) /* long open success */)
    || (!isAMMBuy && amount.lt(_0) /* short open success */)
  ) {
    return amount
  }
  
  // invalid open. only close is possible
  return _0
}

// spread and fees are ignored. add them after calling this function
// the returned amount is the AMM's perspective
export function computeAMMCloseAndOpenAmountWithPrice(
  context: AMMTradingContext,
  limitPrice: BigNumber, // fill price >= limitPrice
  isAMMBuy: boolean,  // AMM's direction
): BigNumber {
  if (!context.deltaMargin.isZero() || !context.deltaPosition.isZero()) {
    throw new InvalidArgumentError('partial close is not supported')
  }
  if (context.position1.isZero()) {
    throw new InvalidArgumentError('close from 0 is not supported')
  }

  // case 1: limit by existing positions
  const zeroContext = computeAMMInternalClose(context, context.position1.negated())
  if (zeroContext.deltaPosition.isZero()) {
    throw new BugError('close to zero failed')
  }
  const zeroPrice = zeroContext.deltaMargin.div(zeroContext.deltaPosition).abs()
  if (
    (isAMMBuy && zeroPrice.gte(limitPrice) /* short close */)
    || (!isAMMBuy && zeroPrice.lte(limitPrice) /* long close */)
  ) {
    // close all
    context = zeroContext
  } else if (!isAMMSafe(context, context.beta2)) {
    // case 2: unsafe close, but price not matched
    return _0
  } else {
    // case 3: close by price
    context = computeAMMPoolMargin(context, context.beta2)
    const amount = computeAMMInverseVWAP(context, limitPrice, context.beta2, isAMMBuy)
    if (
      (isAMMBuy && amount.gt(_0) /* short close success */)
      || (!isAMMBuy && amount.lt(_0) /* long close success */)
    ) {
      context = computeAMMInternalClose(context, amount)
    } else {
      // invalid close. only open is possible
    }
  }

  // case 4: open positions
  if (
    (isAMMBuy && context.position1.gte(_0) /* cross 0 after short close */)
    || (!isAMMBuy && context.position1.lte(_0) /* cross 0 after long close */)
  ) {
    const openAmount = computeAMMOpenAmountWithPrice(context, limitPrice, isAMMBuy)
    return context.deltaPosition.plus(openAmount)
  }
  return context.deltaPosition
}
