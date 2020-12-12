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

// // the returned amount is the trader's perspective
// export function computeAMMMaxTradeAmount(
//   p: LiquidityPoolStorage,
//   marketID: string,
//   trader: AccountStorage,
//   maxLeverage: BigNumberish,  // trader's lev
//   isBuy: boolean,  // trader's direction
// ): BigNumber {
//   const normalizeMaxLeverage = normalizeBigNumberish(maxLeverage)

//   // if AMM is unsafe, return 0
//   const ammDetails = computeAccount(p, amm)
//   const ammContext = initAMMTradingContext(p, ammDetails)
//   if (!isAMMSafe(ammContext, p.beta1)) {
//     if (isBuy && amm.positionAmount.lt(_0)) {
//       return _0
//     }
//     if (!isBuy && amm.positionAmount.gt(_0)) {
//       return _0
//     }
//   }

//   // guess = marginBalance * lev / index
//   const traderDetails = computeAccount(p, trader)
//   const guess = traderDetails.accountComputed.marginBalance.times(normalizeMaxLeverage).div(p.indexPrice)

//   // search
//   function checkTrading(a: number): number {
//     if (a == 0) {
//       return 0
//     }
//     try {
//       const context = computeAMMTrade(p, trader, amm, new BigNumber(a))
//       const newTraderDetails = computeAccount(p, context.takerAccount)
//       if (!newTraderDetails.accountComputed.isSafe
//         || newTraderDetails.accountComputed.leverage.gt(normalizeMaxLeverage)) {
//         return Math.abs(a)
//       }
//       return -Math.abs(a) // return a negative value
//     } catch (e) {
//       return Math.abs(a) // punish larger a
//     }
//   }
//   const options: any = {
//     maxIterations: 15
//   }
//   if (isBuy) {
//     options.lowerBound = 0
//     options.guess = guess.toNumber()
//   } else {
//     options.upperBound = 0
//     options.guess = guess.negated().toNumber()
//   }
//   const answer: any = {}
//   minimize(checkTrading, options, answer)
//   const result = new BigNumber(answer.argmin as number)
//   return result
// }

// // the returned amount is the trader's perspective
// export function computeAMMTradeAmountByMargin(
//   p: LiquidityPoolStorage,
//   marketID: string,
//   deltaMargin: BigNumberish,  // trader's margin change. < 0 if buy, > 0 if sell
// ): BigNumber {
//   const normalizeDeltaMargin = normalizeBigNumberish(deltaMargin)

//   // if AMM is unsafe, return 0
//   const ammDetails = computeAccount(p, amm)
//   const ammContext = initAMMTradingContext(p, ammDetails)
//   if (!isAMMSafe(ammContext, p.beta1)) {
//     if (normalizeDeltaMargin.lt(_0) && amm.positionAmount.lt(_0)) {
//       return _0
//     }
//     if (normalizeDeltaMargin.gt(_0) && amm.positionAmount.gt(_0)) {
//       return _0
//     }
//   }

//   // guess = deltaMargin / index
//   const guess = normalizeDeltaMargin.div(p.indexPrice).negated()

//   // search
//   function checkTrading(a: number): number {
//     if (a == 0) {
//       return 0
//     }
//     try {
//       const price = computeAMMPrice(p, amm, new BigNumber(a))
//       // err = | expected trader margin - actual trader margin |
//       const actualTraderMargin = price.deltaAMMMargin.negated()
//       const err = actualTraderMargin.minus(normalizeDeltaMargin).abs()
//       return err.toNumber()
//     } catch (e) {
//       return Math.abs(a) // punish larger a
//     }
//   }
//   const options: any = {
//     maxIterations: 15
//   }
//   if (normalizeDeltaMargin.lt(_0)) {
//     // trader buys
//     options.lowerBound = 0
//     options.guess = guess.toNumber()
//   } else {
//     // trader sells
//     options.upperBound = 0
//     options.guess = guess.toNumber()
//   }
//   const answer: any = {}
//   minimize(checkTrading, options, answer)
//   const result = new BigNumber(answer.argmin as number)
//   return result
// }

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
    console.log(`warn: computeAMMShortInverseVWAP Δ < 0. M = ${context.poolMargin.toFixed()}, `
      + `pos1 = ${context.position1.toFixed()}, index = ${context.index.toFixed()}, `
      + `price = ${price.toFixed()}, previousMa1MinusMa2 = ${previousMa1MinusMa2.toFixed()}, `
      + `previousAmount = ${previousAmount.toFixed()}`)
    return _0
  }
  let numerator = sqrt(beforeSqrt)
  if (!isAMMBuy) {
    numerator = numerator.negated()
  }
  numerator = numerator.minus(b)
  const amount = numerator.div(denominator)
  return amount.dp(DECIMALS, BigNumber.ROUND_DOWN)
}

// // the returned amount is the trader's perspective
// export function computeAMMAmountWithPrice(
//   p: LiquidityPoolStorage,
//   marketID: string,
//   isBuy: boolean,  // trader's direction
//   limitPrice: BigNumberish,
// ): BigNumber {
//   // shift by spread
//   let normalizedLimitPrice = normalizeBigNumberish(limitPrice)
//   if (isBuy) {
//     normalizedLimitPrice = normalizedLimitPrice.div(_1.plus(p.halfSpread))
//   } else {
//     normalizedLimitPrice = normalizedLimitPrice.div(_1.minus(p.halfSpread))
//   }

//   // get amount
//   let context = initAMMTradingContext(p, amm)
//   if (context.pos1.lte(_0) && isBuy) {
//     return computeAMMAmountShortOpen(context, normalizedLimitPrice, p).negated()
//   } else if (context.pos1.lt(_0) && !isBuy) {
//     //                    ^^ 0 is another story
//     return computeAMMAmountShortClose(context, normalizedLimitPrice, p).negated()
//   } else if (context.pos1.gte(_0) && !isBuy) {
//     return computeAMMAmountLongOpen(context, normalizedLimitPrice, p).negated()
//   } else if (context.pos1.gt(_0) && isBuy) {
//     //                    ^^ 0 is another story
//     return computeAMMAmountLongClose(context, normalizedLimitPrice, p).negated()
//   }
//   throw new Error('bug: unknown trading direction')
// }

// // spread and fees are ignored. add them after calling this function
// // the returned amount is the AMM's perspective
// export function computeAMMAmountShortOpen(
//   context: AMMTradingContext,
//   limitPrice: BigNumber, // fill price <= limitPrice
//   p: PerpetualStorage,
// ): BigNumber {
//   // case 1: unsafe open
//   if (!isAMMSafe(context, p.beta1)) {
//     return _0
//   }
//   context = computeAMMPoolMargin(context, p.beta1)

//   // case 2: limit by safePos
//   const safePos2 = computeAMMSafeShortPositionAmount(context, p.beta1)
//   if (safePos2.gt(_0) || safePos2.gt(context.pos1)) {
//     return _0
//   }
//   const maxAmount = safePos2.minus(context.pos1)
//   if (maxAmount.gte(_0)) {
//     console.log(`warn: short open, but pos1 ${context.pos1.toFixed()} < safePos2 ${safePos2.toFixed()}`)
//     return _0
//   }
//   const safePos2Context = computeAMMInternalOpen(context, maxAmount, p)
//   if (!maxAmount.eq(safePos2Context.deltaPosition.minus(context.deltaPosition))) {
//     throw new BugError('open positions failed')
//   }
//   const safePos2Price = safePos2Context.deltaMargin.div(safePos2Context.deltaPosition).abs()
//   if (safePos2Price.lte(limitPrice)) {
//     return maxAmount
//   }

//   // case 3: inverse function of price function
//   const amount = computeAMMShortInverseVWAP(context, limitPrice, p.beta1, false)
//   if (amount.gte(_0)) {
//     // closing
//     return _0
//   }

//   return amount
// }

// // spread and fees are ignored. add them after calling this function
// // the returned amount is the AMM's perspective
// export function computeAMMAmountShortClose(
//   context: AMMTradingContext,
//   limitPrice: BigNumber, // fill price >= limitPrice
//   p: PerpetualStorage,
// ): BigNumber {
//   if (!context.deltaMargin.isZero() || !context.deltaPosition.isZero()) {
//     throw new BugError('partial close is not supported')
//   }

//   if (!context.pos1.isZero()) {
//     // case 1: limit by existing positions
//     const zeroContext = computeAMMInternalClose(context, context.pos1.negated(), p)
//     if (zeroContext.deltaPosition.isZero()) {
//       throw new BugError('close to zero failed')
//     }
//     const zeroPrice = zeroContext.deltaMargin.div(zeroContext.deltaPosition).abs()
//     if (zeroPrice.gte(limitPrice)) {
//       // close all
//       context = zeroContext
//     } else if (!isAMMSafe(context, p.beta2)) {
//       // case 2: unsafe close, but price not matched
//       return _0
//     } else {
//       // case 3: close by price 
//       context = computeAMMPoolMargin(context, p.beta2)
//       const amount = computeAMMShortInverseVWAP(context, limitPrice, p.beta2, true)
//       if (amount.gt(_0)) {
//         context = computeAMMInternalClose(context, amount, p)
//       }
//     }
//   }

//   // case 4: open positions
//   if (context.pos1.gte(_0)) {
//     const openAmount = computeAMMAmountLongOpen(context, limitPrice, p)
//     return context.deltaPosition.plus(openAmount)
//   }
//   return context.deltaPosition
// }

// // spread and fees are ignored. add them after calling this function
// // the returned amount is the AMM's perspective
// export function computeAMMAmountLongClose(
//   context: AMMTradingContext,
//   limitPrice: BigNumber, // fill price <= limitPrice
//   p: PerpetualStorage,
// ): BigNumber {
//   if (!context.deltaMargin.isZero() || !context.deltaPosition.isZero()) {
//     throw new BugError('partial close is not supported')
//   }

//   if (!context.pos1.isZero()) {
//     // case 1: limit by existing positions
//     const zeroContext = computeAMMInternalClose(context, context.pos1.negated(), p)
//     if (zeroContext.deltaPosition.isZero()) {
//       throw new BugError('close to zero failed')
//     }
//     const zeroPrice = zeroContext.deltaMargin.div(zeroContext.deltaPosition).abs()
//     if (zeroPrice.lte(limitPrice)) {
//       // close all
//       context = zeroContext
//     } else if (!isAMMSafe(context, p.beta2)) {
//       // case 2: unsafe close, but price not matched
//       return _0
//     } else {
//       // case 3: close by price 
//       context = computeAMMPoolMargin(context, p.beta2)
//       const amount = computeAMMLongInverseVWAP(context, limitPrice, p.beta2, true)
//       if (amount.lt(_0)) {
//         context = computeAMMInternalClose(context, amount, p)
//       }
//     }
//   }

//   // case 4: open positions
//   if (context.pos1.lte(_0)) {
//     const openAmount = computeAMMAmountShortOpen(context, limitPrice, p)
//     return context.deltaPosition.plus(openAmount)
//   }
//   return context.deltaPosition
// }

// // spread and fees are ignored. add them after calling this function
// // the returned amount is the AMM's perspective
// export function computeAMMAmountLongOpen(
//   context: AMMTradingContext,
//   limitPrice: BigNumber, // fill price >= limitPrice
//   p: PerpetualStorage,
// ): BigNumber {
//   // case 1: unsafe open
//   if (!isAMMSafe(context, p.beta1)) {
//     return _0
//   }
//   context = computeAMMPoolMargin(context, p.beta1)

//   // case 2: limit by safePos
//   const safePos2 = computeAMMSafeLongPositionAmount(context, p.beta1)
//   if (safePos2.lt(_0) || safePos2.lt(context.pos1)) {
//     return _0
//   }
//   const maxAmount = safePos2.minus(context.pos1)
//   if (maxAmount.lte(_0)) {
//     console.log(`warn: long open, but pos1 ${context.pos1.toFixed()} > safePos2 ${safePos2.toFixed()}`)
//     return _0
//   }
//   const safePos2Context = computeAMMInternalOpen(context, maxAmount, p)
//   if (!maxAmount.eq(safePos2Context.deltaPosition.minus(context.deltaPosition))) {
//     throw new BugError('open positions failed')
//   }
//   const safePos2Price = safePos2Context.deltaMargin.div(safePos2Context.deltaPosition).abs()
//   if (safePos2Price.gte(limitPrice)) {
//     return maxAmount
//   }

//   // case 3: inverse function of price function
//   const amount = computeAMMLongInverseVWAP(context, limitPrice, p.beta1, false)
//   if (amount.lte(_0)) {
//     // closing
//     return _0
//   }

//   return amount
// }

computeAMMTrade
computeAMMPrice
initAMMTradingContext
isAMMSafe
computeAMMPoolMargin
computeAMMSafeShortPositionAmount
computeAMMSafeLongPositionAmount
computeAMMInternalOpen
computeAMMInternalClose
let a : BugError | null = null
a
sqrt
normalizeBigNumberish
minimize
DECIMALS
let b : AMMTradingContext | null = null
b
let c: BigNumber | null = null
c
