/*
  Some peripheral tools to calculate trading amounts

  If you don't need these tools, you can remove this file to reduce the package size.
*/
import { computeAccount, computeAMMTrade, computeAMMPrice } from './computation'
import { BigNumberish, InvalidArgumentError, AccountStorage, LiquidityPoolStorage, AMMTradingContext, TradeFlag, Order } from './types'
import {
  initAMMTradingContext,
  isAMMSafe,
  computeAMMPoolMargin,
  computeAMMSafeShortPositionAmount,
  computeAMMSafeLongPositionAmount,
  computeAMMInternalOpen,
  computeAMMInternalClose,
  computeBestAskBidPriceIfSafe,
  computeBestAskBidPriceIfUnsafe
} from './amm'
import { BugError } from './types'
import { DECIMALS, _0, _1, _2 } from './constants'
import { sqrt, normalizeBigNumberish, searchMaxAmount } from './utils'
import BigNumber from 'bignumber.js'
import { orderSideAvailable, splitOrdersByLimitPrice } from './order'

// max amount when a trader uses market-order with USE_TARGET_LEVERAGE
// the returned amount is the trader's perspective
export function computeAMMMaxTradeAmount(
  p: LiquidityPoolStorage,
  perpetualIndex: number,
  trader: AccountStorage,
  walletBalance: BigNumberish,
  isTraderBuy: boolean,
): BigNumber {
  const normalizeWalletBalance = normalizeBigNumberish(walletBalance)

  // if AMM is unsafe, return 0
  const ammContext = initAMMTradingContext(p, perpetualIndex)
  if (!isAMMSafe(ammContext, ammContext.openSlippageFactor)) {
    if (isTraderBuy && ammContext.position1.lt(_0)) {
      return _0
    }
    if (!isTraderBuy && ammContext.position1.gt(_0)) {
      return _0
    }
  }
  // guess = (marginBalance + walletBalance) * lev / index - position
  const traderDetails = computeAccount(p, perpetualIndex, trader)
  if (trader.targetLeverage.isZero()) {
    throw new InvalidArgumentError('target leverage = 0')
  }
  let guess = traderDetails.accountComputed.marginBalance.plus(normalizeWalletBalance)
  guess = guess.times(trader.targetLeverage).div(ammContext.index)
  if (!isTraderBuy) {
    guess = guess.negated()
  }
  guess = guess.minus(trader.positionAmount)

  // search
  function checkTrading(a: BigNumber): boolean {
    if (a.isZero()) {
      return true
    }
    if (!isTraderBuy) {
      a = a.negated()
    }
    try {
      const result = computeAMMTrade(p, perpetualIndex, trader, a, TradeFlag.MASK_USE_TARGET_LEVERAGE)
      if (!result.tradeIsSafe || result.adjustCollateral.gt(normalizeWalletBalance)) {
        return false
      }
      return true
    } catch (e) {
      // typically means a is too large
      return false
    }
  }
  let maxAmount = searchMaxAmount(checkTrading, guess.abs())
  if (!isTraderBuy) {
    maxAmount = maxAmount.negated()
  }
  return maxAmount
}

// get amount according to a given (price(amount) * amount) when using market-order with USE_TARGET_LEVERAGE
// the returned amount is the trader's perspective
export function computeAMMTradeAmountByMargin(
  p: LiquidityPoolStorage,
  perpetualIndex: number,
  deltaMargin: BigNumberish, // trader's margin change. < 0 if buy, > 0 if sell
): BigNumber {
  const normalizeDeltaMargin = normalizeBigNumberish(deltaMargin)

  // if AMM is unsafe, return 0
  const ammContext = initAMMTradingContext(p, perpetualIndex)
  if (!isAMMSafe(ammContext, ammContext.openSlippageFactor)) {
    if (normalizeDeltaMargin.lt(_0) && ammContext.position1.lt(_0)) {
      return _0
    }
    if (normalizeDeltaMargin.gt(_0) && ammContext.position1.gt(_0)) {
      return _0
    }
  }

  // shortcut for 0
  if (normalizeDeltaMargin.isZero()) {
    return _0
  }

  // guess = deltaMargin / index
  const guess = normalizeDeltaMargin.div(ammContext.index).negated()
  let isTraderBuy: boolean = true
  if (guess.lt(_0)) {
    isTraderBuy = false
  }

  // search
  function checkTrading(a: BigNumber): boolean {
    if (a.isZero()) {
      return true
    }
    if (!isTraderBuy) {
      a = a.negated()
    }
    try {
      const res = computeAMMPrice(p, perpetualIndex, a)
      return res.deltaAMMMargin.abs().lte(normalizeDeltaMargin.abs())
    } catch (e) {
      // typically means a is too large
      return false
    }
  }
  let maxAmount = searchMaxAmount(checkTrading, guess.abs())
  if (!isTraderBuy) {
    maxAmount = maxAmount.negated()
  }
  return maxAmount
}

// max amount when a trader uses limit-order with USE_TARGET_LEVERAGE
// the returned amount is the trader's perspective
export function computeLimitOrderMaxTradeAmount(
  p: LiquidityPoolStorage,
  perpetualIndex: number,
  trader: AccountStorage,
  walletBalance: BigNumberish,
  orders: Order[],
  limitPrice: BigNumberish,
  isTraderBuy: boolean,
): BigNumber {
  const perpetual = p.perpetuals.get(perpetualIndex)
  if (!perpetual) {
    throw new InvalidArgumentError(`perpetual {perpetualIndex} not found in the pool`)
  }
  const normalizeWalletBalance = normalizeBigNumberish(walletBalance)
  const normalizeLimitPrice = normalizeBigNumberish(limitPrice)

  // guess = (marginBalance + walletBalance) * lev / index - position
  if (trader.targetLeverage.isZero()) {
    throw new InvalidArgumentError('target leverage = 0')
  }
  const traderDetails = computeAccount(p, perpetualIndex, trader)
  let guess = traderDetails.accountComputed.marginBalance.plus(normalizeWalletBalance)
  guess = guess.times(trader.targetLeverage).div(perpetual.markPrice)
  if (!isTraderBuy) {
    guess = guess.negated()
  }
  guess = guess.minus(trader.positionAmount)

  // state after executing pre-orders
  const { preOrders, postOrders } = splitOrdersByLimitPrice(orders, normalizeLimitPrice, isTraderBuy)
  const preState = orderSideAvailable(
    p, perpetualIndex, traderDetails.accountComputed.marginBalance,
    trader.positionAmount, trader.targetLeverage, normalizeWalletBalance, preOrders)
  
  // search
  function checkTrading(a: BigNumber): boolean {
    if (a.isZero()) {
      return true
    }
    if (!isTraderBuy) {
      a = a.negated()
    }
    let newOrderState = orderSideAvailable(
      p, perpetualIndex, preState.remainMargin,
      preState.remainPosition, trader.targetLeverage, preState.remainWalletBalance,
      [{ limitPrice: normalizeLimitPrice, amount: a }])
    let postState = orderSideAvailable(
      p, perpetualIndex, newOrderState.remainMargin,
      newOrderState.remainPosition, trader.targetLeverage, newOrderState.remainWalletBalance, postOrders)
    if (postState.remainWalletBalance.lt(_0)) {
      // a is too large
      return false
    }
    return true
  }
  let maxAmount = searchMaxAmount(checkTrading, guess.abs())
  if (!isTraderBuy) {
    maxAmount = maxAmount.negated()
  }
  return maxAmount
}

// the inverse function of VWAP of AMM pricing function
// call computeAMMPoolMargin before this function
// the returned amount(= pos2 - pos1) is the AMM's perspective
// make sure ammSafe before this function
export function computeAMMInverseVWAP(
  context: AMMTradingContext,
  price: BigNumber,
  beta: BigNumber,
  isAMMBuy: boolean
): BigNumber {
  const previousMa1MinusMa2 = context.deltaMargin.negated()
  const previousAmount = context.deltaPosition

  /*
  A = P_i^2 β;
  B = -2 P_i M + 2 A N1 + 2 M price;
  C = -2 M (previousMa1MinusMa2 - previousAmount price);
  sols = (-B ± sqrt(B^2 - 4 A C)) / (2 A);
  */
  const a = context.index.times(context.index).times(beta)
  let denominator = a.times(_2)
  if (denominator.isZero()) {
    throw Error(`bad perpetual parameter beta ${beta.toFixed()} or index ${context.index}.`)
  }
  let b = context.index.times(context.poolMargin).negated()
  b = b.plus(a.times(context.position1))
  b = b.plus(context.poolMargin.times(price))
  b = b.times(_2)
  const c = previousMa1MinusMa2
    .minus(previousAmount.times(price))
    .times(context.poolMargin)
    .times(_2)
    .negated()
  const beforeSqrt = a
    .times(c)
    .times(4)
    .negated()
    .plus(b.times(b))
  if (beforeSqrt.lt(_0)) {
    throw new InvalidArgumentError(
      `computeAMMInverseVWAP: impossible price. ` +
        `index = ${context.index.toFixed()}, price = ${price.toFixed()}, ` +
        `M = ${context.poolMargin.toFixed()}, position1 = ${context.position1.toFixed()}, ` +
        `previousMa1MinusMa2 = ${previousMa1MinusMa2.toFixed()}, previousAmount = ${previousAmount.toFixed()}`
    )
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
  perpetualIndex: number,
  isTraderBuy: boolean,
  limitPrice: BigNumberish
): BigNumber {
  const perpetual = p.perpetuals.get(perpetualIndex)
  if (!perpetual) {
    throw new InvalidArgumentError(`perpetual ${perpetualIndex} not found in the pool`)
  }
  let normalizedLimitPrice = normalizeBigNumberish(limitPrice)

  // get amount
  const isAMMBuy = !isTraderBuy
  let context = initAMMTradingContext(p, perpetualIndex)
  if (context.position1.lte(_0) && !isAMMBuy) {
    return computeAMMOpenAmountWithPrice(context, normalizedLimitPrice, isAMMBuy).negated()
  } else if (context.position1.lt(_0) && isAMMBuy) {
    //                         ^^ == 0 is another story
    return computeAMMCloseAndOpenAmountWithPrice(context, normalizedLimitPrice, isAMMBuy).negated()
  } else if (context.position1.gte(_0) && isAMMBuy) {
    return computeAMMOpenAmountWithPrice(context, normalizedLimitPrice, isAMMBuy).negated()
  } else if (context.position1.gt(_0) && !isAMMBuy) {
    //                         ^^ == 0 is another story
    return computeAMMCloseAndOpenAmountWithPrice(context, normalizedLimitPrice, isAMMBuy).negated()
  }
  throw new InvalidArgumentError('bug: unknown trading direction')
}

// spread and fees are ignored. add them after calling this function
// the returned amount is the AMM's perspective
export function computeAMMOpenAmountWithPrice(
  context: AMMTradingContext,
  limitPrice: BigNumber,
  isAMMBuy: boolean
): BigNumber {
  if (
    (isAMMBuy && context.position1.lt(_0)) /* short buy */ ||
    (!isAMMBuy && context.position1.gt(_0)) /* long sell */
  ) {
    throw new InvalidArgumentError(`this is not opening. pos1: ${context.position1} isBuy: ${isAMMBuy}`)
  }

  // case 1: unsafe open
  if (!isAMMSafe(context, context.openSlippageFactor)) {
    return _0
  }
  context = computeAMMPoolMargin(context, context.openSlippageFactor)

  // case 2: limit by spread
  if (context.bestAskBidPrice === null) {
    context.bestAskBidPrice = computeBestAskBidPriceIfSafe(context, context.openSlippageFactor, isAMMBuy)
  }
  if (isAMMBuy) {
    if (limitPrice.gt(context.bestAskBidPrice)) {
      return _0
    }
  } else {
    if (limitPrice.lt(context.bestAskBidPrice)) {
      return _0
    }
  }

  // case 3: limit by safePos
  let safePos2: BigNumber
  if (isAMMBuy) {
    safePos2 = computeAMMSafeLongPositionAmount(context, context.openSlippageFactor)
    if (safePos2.lt(context.position1)) {
      return _0
    }
  } else {
    safePos2 = computeAMMSafeShortPositionAmount(context, context.openSlippageFactor)
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
    (isAMMBuy && safePos2Price.gte(limitPrice)) /* long open. trader sell */ ||
    (!isAMMBuy && safePos2Price.lte(limitPrice)) /* short open. trader buy */
  ) {
    return maxAmount
  }

  // case 3: inverse function of price function
  const amount = computeAMMInverseVWAP(context, limitPrice, context.openSlippageFactor, isAMMBuy)
  if ((isAMMBuy && amount.gt(_0)) /* long open success */ || (!isAMMBuy && amount.lt(_0)) /* short open success */) {
    return amount
  }

  // invalid open. only close is possible
  return _0
}

// spread and fees are ignored. add them after calling this function
// the returned amount is the AMM's perspective
export function computeAMMCloseAndOpenAmountWithPrice(
  context: AMMTradingContext,
  limitPrice: BigNumber,
  isAMMBuy: boolean
): BigNumber {
  if (!context.deltaMargin.isZero() || !context.deltaPosition.isZero()) {
    throw new InvalidArgumentError('partial close is not supported')
  }
  if (context.position1.isZero()) {
    throw new InvalidArgumentError('close from 0 is not supported')
  }

  // case 1: limit by spread
  const ammSafe = isAMMSafe(context, context.closeSlippageFactor)
  if (ammSafe) {
    context = computeAMMPoolMargin(context, context.closeSlippageFactor)
    context.bestAskBidPrice = computeBestAskBidPriceIfSafe(context, context.closeSlippageFactor, isAMMBuy)
  } else {
    context.bestAskBidPrice = computeBestAskBidPriceIfUnsafe(context)
  }
  if (isAMMBuy) {
    if (limitPrice.gt(context.bestAskBidPrice)) {
      return _0
    }
  } else {
    if (limitPrice.lt(context.bestAskBidPrice)) {
      return _0
    }
  }

  // case 2: limit by existing positions
  const zeroContext = computeAMMInternalClose(context, context.position1.negated())
  if (zeroContext.deltaPosition.isZero()) {
    throw new BugError('close to zero failed')
  }
  const zeroPrice = zeroContext.deltaMargin.div(zeroContext.deltaPosition).abs()
  if (
    (isAMMBuy && zeroPrice.gte(limitPrice)) /* short close */ ||
    (!isAMMBuy && zeroPrice.lte(limitPrice)) /* long close */
  ) {
    // close all
    context = zeroContext
  } else if (!ammSafe) {
    // case 3: unsafe close, but price not matched
    return _0
  } else {
    // case 4: close by price
    const amount = computeAMMInverseVWAP(context, limitPrice, context.closeSlippageFactor, isAMMBuy)
    if (
      (isAMMBuy && amount.gt(_0)) /* short close success */ ||
      (!isAMMBuy && amount.lt(_0)) /* long close success */
    ) {
      context = computeAMMInternalClose(context, amount)
    } else {
      // invalid close. only open is possible
    }
  }

  // case 5: open positions
  if (
    (isAMMBuy && context.position1.gte(_0)) /* cross 0 after short close */ ||
    (!isAMMBuy && context.position1.lte(_0)) /* cross 0 after long close */
  ) {
    const openAmount = computeAMMOpenAmountWithPrice(context, limitPrice, isAMMBuy)
    return context.deltaPosition.plus(openAmount)
  }
  return context.deltaPosition
}
