/*
  Simulate the smart contract's computation.
*/

import { BigNumber } from 'bignumber.js'
import { DECIMALS, REMOVE_LIQUIDITY_MAX_SHARE_RELAX, _0, _1, _2 } from './constants'
import { 
  LiquidityPoolStorage, AMMTradingContext, PerpetualState,
  BigNumberish, PerpetualStorage, AccountStorage
} from './types'
import { sqrt, splitAmount, hasTheSameSign, normalizeBigNumberish } from './utils'
import { InsufficientLiquidityError, BugError, InvalidArgumentError } from './types'


export function getFundingWithMeanPenalty(
  perpetual: PerpetualStorage, accountPosition: BigNumber, position: BigNumber,
  accountEntryValue: BigNumber | null
) {
  let funding = position.times(perpetual.unitAccumulativeFunding)
  if (!accountEntryValue || accountPosition == _0) {
      return funding;
  }
  let entryValAdj = accountEntryValue.times(position).div(accountPosition).abs();
  let meanAdj = perpetual.meanRate.value.times(position).abs();
  let penalty = _0;
  if (entryValAdj.lt(meanAdj)) {
      let meanRevertPenalty = perpetual.longMeanRevertFactor.value.times(
          meanAdj.minus(entryValAdj)
      );
      penalty = meanRevertPenalty.times(perpetual.unitAccumulativeLongFunding);
      if (position.isNegative()) {
        penalty = penalty.negated()
      }
  } else if (entryValAdj.gt(meanAdj)) {
      let meanRevertPenalty = perpetual.shortMeanRevertFactor.value.times(
          entryValAdj.minus(meanAdj)
      );
      penalty = meanRevertPenalty.times(perpetual.unitAccumulativeShortFunding);
      if (position.isNegative()) {
        penalty = penalty.negated()
      }
  }
  funding = funding.plus(penalty);
  return funding;
}

export function getAMMInitFundingWPenalty(
  perpetual: PerpetualStorage, trader: AccountStorage, deltaPosition: BigNumber,
  tradingPrice: BigNumber
) {
  const { close, open } = splitAmount(
    trader.positionAmount, deltaPosition.negated()
  )
  let fundingToAdd = _0
  let newEntryValue = perpetual.entryValue || _0
  if (!close.isZero()) {
    let closedValue = (
        trader.entryValue
        .times(close)
        .dividedBy(trader.positionAmount)
    );
    newEntryValue = newEntryValue.minus(closedValue)
    fundingToAdd = fundingToAdd.plus(
      getFundingWithMeanPenalty(
          perpetual, trader.positionAmount, close.negated(), trader.entryValue
      )
    )
  }
  if (!open.isZero()) {
    newEntryValue = newEntryValue.plus(
      tradingPrice.times(open).negated()
    )
    fundingToAdd = fundingToAdd.plus(
      getFundingWithMeanPenalty(
          perpetual, open.negated(), open.negated(),
          tradingPrice.times(open).abs()
      )
    )
  }
  return { fundingToAdd, newEntryValue }
}


export function initAMMTradingContext(p: LiquidityPoolStorage, perpetualIndex?: number): AMMTradingContext {
  if (perpetualIndex) {
    if (!p.perpetuals.get(perpetualIndex)) {
      throw new InvalidArgumentError(`perpetual ${perpetualIndex} not found in the pool`)
    }
  }

  let index = _0
  let position1 = _0
  let halfSpread = _0
  let openSlippageFactor = _0
  let openSlippageShortPenaltyFactor = _0
  let openSlippageLongPenaltyFactor = _0
  let maxRate = _0
  let meanRate = _0
  let closeSlippageFactor = _0
  let fundingRateFactor = _0
  let fundingRateLimit = _0
  let maxClosePriceDiscount = _0
  let ammMaxLeverage = _0

  let otherIndex: BigNumber[] = []
  let otherPosition: BigNumber[] = []
  let otherOpenSlippageFactor: BigNumber[] = []
  let otherAMMMaxLeverage: BigNumber[] = []

  // split perpetuals into current perpetual and other perpetuals
  // M_c = ammCash - ?? accumulatedFunding * N
  let cash = p.poolCashBalance
  p.perpetuals.forEach((perpetual, id) => {
    // only involve normal market
    if (perpetual.state !== PerpetualState.NORMAL) {
      return
    }
    if (perpetual.indexPrice.lte(_0)) {
      throw new InvalidArgumentError('index price must be positive')
    }
    cash = cash.plus(perpetual.ammCashBalance)
    cash = cash.minus(
      getFundingWithMeanPenalty(
        perpetual, perpetual.ammPositionAmount, perpetual.ammPositionAmount,
        perpetual.entryValue
      )
    )
    if (id === perpetualIndex) {
      index = perpetual.indexPrice
      position1 = perpetual.ammPositionAmount
      halfSpread = perpetual.halfSpread.value
      openSlippageFactor = perpetual.openSlippageFactor.value
      openSlippageShortPenaltyFactor = perpetual.openSlippageShortPenaltyFactor.value
      openSlippageLongPenaltyFactor = perpetual.openSlippageLongPenaltyFactor.value
      meanRate = perpetual.meanRate.value
      maxRate = perpetual.maxRate.value
      closeSlippageFactor = perpetual.closeSlippageFactor.value
      fundingRateFactor = perpetual.fundingRateFactor.value
      fundingRateLimit = perpetual.fundingRateLimit.value
      maxClosePriceDiscount = perpetual.maxClosePriceDiscount.value
      ammMaxLeverage = perpetual.ammMaxLeverage.value
    } else {
      otherIndex.push(perpetual.indexPrice)
      otherPosition.push(perpetual.ammPositionAmount)
      otherOpenSlippageFactor.push(perpetual.openSlippageFactor.value)
      otherAMMMaxLeverage.push(perpetual.ammMaxLeverage.value)
    }
  })

  let ret: AMMTradingContext = {
    index,
    position1,
    halfSpread,
    openSlippageFactor,
    openSlippageShortPenaltyFactor,
    openSlippageLongPenaltyFactor,
    meanRate,
    maxRate,
    closeSlippageFactor,
    fundingRateFactor,
    fundingRateLimit,
    maxClosePriceDiscount,
    ammMaxLeverage,
    otherIndex,
    otherPosition,
    otherOpenSlippageFactor,
    otherAMMMaxLeverage,
    cash,
    poolMargin: _0,
    deltaMargin: _0,
    deltaPosition: _0,
    bestAskBidPrice: null,
    valueWithoutCurrent: _0,
    squareValueWithoutCurrent: _0,
    positionMarginWithoutCurrent: _0
  }
  ret = initAMMTradingContextEagerEvaluation(ret)
  return ret
}

export function initAMMTradingContextEagerEvaluation(context: AMMTradingContext): AMMTradingContext {
  let valueWithoutCurrent = _0
  let squareValueWithoutCurrent = _0
  let positionMarginWithoutCurrent = _0

  for (let j = 0; j < context.otherIndex.length; j++) {
    // ??_j (P_i N) where j ??? id
    valueWithoutCurrent = valueWithoutCurrent.plus(context.otherIndex[j].times(context.otherPosition[j]))
    // ??_j (?? P_i^2 N^2) where j ??? id
    squareValueWithoutCurrent = squareValueWithoutCurrent.plus(
      context.otherOpenSlippageFactor[j]
        .times(context.otherIndex[j])
        .times(context.otherIndex[j])
        .times(context.otherPosition[j])
        .times(context.otherPosition[j])
    )
    // ??_j (P_i_j * | N_j | / ??_j) where j ??? id
    positionMarginWithoutCurrent = positionMarginWithoutCurrent.plus(
      context.otherIndex[j].times(context.otherPosition[j].abs()).div(context.otherAMMMaxLeverage[j])
    )
  }

  // prevent margin balance < 0
  const marginBalanceWithCurrent = context.cash.plus(valueWithoutCurrent).plus(context.index.times(context.position1))
  if (marginBalanceWithCurrent.lt(_0)) {
    throw new InsufficientLiquidityError('AMM is emergency')
  }

  return {
    ...context,
    valueWithoutCurrent,
    squareValueWithoutCurrent,
    positionMarginWithoutCurrent
  }
}

// the amount is the AMM's perspective
export function computeAMMInternalTrade(
  p: LiquidityPoolStorage,
  perpetualIndex: number,
  amount: BigNumber
): AMMTradingContext {
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

  // spread. this is equivalent to:
  // * if amount > 0, trader sell. use min(P_avg, P_bestBid)
  // * if amount < 0, trader buy. use max(P_avg, P_bestAsk)
  if (context.bestAskBidPrice === null) {
    throw new BugError('bestAskBidPrice is null')
  }
  const valueAtBestAskBidPrice = context.bestAskBidPrice.times(amount).negated()
  if (context.deltaMargin.lt(valueAtBestAskBidPrice)) {
    context.deltaMargin = valueAtBestAskBidPrice
  }

  return context
}

// get the price if ??N -> 0. equal to lim_(??N -> 0) (computeDeltaMargin / (??N))
// call computeAMMPoolMargin before this function. make sure isAMMSafe before this function
// CAUTION: this function only implements P_{best} in the paper, it's not the real trading price if ?? takes effect
export function computeBestAskBidPriceIfSafe(
  context: AMMTradingContext,
  beta: BigNumber,
  isAMMBuy: boolean
): BigNumber {
  if (context.poolMargin.lte(_0)) {
    throw new InsufficientLiquidityError(`AMM poolMargin <= 0`)
  }
  // P_i (1 - ?? / M * P_i * N1)
  let price = context.position1
    .times(context.index)
    .div(context.poolMargin)
    .times(beta)
  price = _1.minus(price).times(context.index)
  return appendSpread(context, price, isAMMBuy)
}

export function computeBestAskBidPriceIfUnsafe(context: AMMTradingContext): BigNumber {
  return context.index
}

function appendSpread(context: AMMTradingContext, midPrice: BigNumber, isAMMBuy: boolean): BigNumber {
  if (isAMMBuy) {
    // AMM buys, trader sells
    return midPrice.times(_1.minus(context.halfSpread)).dp(DECIMALS)
  } else {
    // AMM sells, trader buys
    return midPrice.times(_1.plus(context.halfSpread)).dp(DECIMALS)
  }
}

export function computeOpenSlippageFactor(context: AMMTradingContext, isAMMBuy: boolean): BigNumber {
  let beta = context.openSlippageFactor
  let index = context.index
  let dist = _0
  if (index.lt(context.meanRate) && !isAMMBuy) {
    dist = index.minus(context.meanRate).abs()
    dist = dist.div(context.meanRate)
    beta = beta.times(_1.plus(context.openSlippageLongPenaltyFactor.times(dist)))
  } else if (index.gt(context.meanRate) && isAMMBuy) {
    dist = index.minus(context.meanRate).abs()
    dist = dist.div(context.maxRate.minus(context.meanRate))
    beta = beta.times(_1.plus(context.openSlippageShortPenaltyFactor.times(dist)))
  }
  return beta
}

// get the price if ??N -> 0. lim_(??N -> 0) (computeDeltaMargin / (??N))
// this function implements all possible situations include:
// * limit by ??. this is P_{best} in the paper
// * limit by ?? when close
// * amm unsafe
export function computeBestAskBidPrice(p: LiquidityPoolStorage, perpetualIndex: number, isAMMBuy: boolean): BigNumber {
  let context = initAMMTradingContext(p, perpetualIndex)
  let isAMMClosing = false
  let beta = computeOpenSlippageFactor(context, isAMMBuy)
  if ((context.position1.gt(_0) && !isAMMBuy) || (context.position1.lt(_0) && isAMMBuy)) {
    isAMMClosing = true
    beta = context.closeSlippageFactor
  }
  // unsafe
  if (!isAMMSafe(context, beta)) {
    if (!isAMMClosing) {
      throw new InsufficientLiquidityError(`AMM can not open position anymore: unsafe before trade`)
    }
    return computeBestAskBidPriceIfUnsafe(context)
  }
  // safe: limit by ??
  context = computeAMMPoolMargin(context, beta)
  let price = computeBestAskBidPriceIfSafe(context, beta, isAMMBuy)
  if (isAMMClosing) {
    // limit by ??
    let discount = context.maxClosePriceDiscount
    if (context.position1.gt(_0)) {
      discount = discount.negated()
    }
    const discountLimitPrice = _1.plus(discount).times(context.index)
    if (isAMMBuy) {
      if (price.gt(discountLimitPrice)) {
        return discountLimitPrice
      }
    } else {
      if (price.lt(discountLimitPrice)) {
        return discountLimitPrice
      }
    }
  }
  return price
}

// the amount is the AMM's perspective
export function computeAMMInternalClose(context: AMMTradingContext, amount: BigNumber): AMMTradingContext {
  const beta = context.closeSlippageFactor
  let ret: AMMTradingContext = { ...context }
  const position2 = ret.position1.plus(amount)
  let deltaMargin = _0

  // trade
  if (isAMMSafe(ret, beta)) {
    ret = computeAMMPoolMargin(ret, beta)
    ret.bestAskBidPrice = computeBestAskBidPriceIfSafe(ret, beta, amount.gt(_0))
    deltaMargin = computeDeltaMargin(ret, beta, position2)
  } else {
    ret.bestAskBidPrice = computeBestAskBidPriceIfUnsafe(ret)
    deltaMargin = ret.bestAskBidPrice.times(amount).negated()
  }

  // max close price discount = -P_i * ??N * (1 ?? discount)
  let discount = context.maxClosePriceDiscount
  if (amount.lt(_0)) {
    discount = discount.negated()
  }
  const limitValue = _1
    .plus(discount)
    .times(context.index)
    .times(amount)
    .negated()
  deltaMargin = BigNumber.maximum(deltaMargin, limitValue)

  if (hasTheSameSign(deltaMargin, amount)) {
    throw new BugError(
      `close error. ??M and amount has the same sign unexpectedly: ${deltaMargin.toFixed()} vs ${amount.toFixed()}`
    )
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
  const beta = computeOpenSlippageFactor(context, amount.gt(0))
  let ret: AMMTradingContext = { ...context }
  const position2 = ret.position1.plus(amount)

  // pre-check
  if (!isAMMSafe(ret, context.openSlippageFactor)) {
    throw new InsufficientLiquidityError(`AMM can not open position anymore: unsafe before trade`)
  }
  ret = computeAMMPoolMargin(ret, context.openSlippageFactor)
  if (ret.poolMargin.lte(_0)) {
    throw new InsufficientLiquidityError(`AMM can not open position anymore: pool margin must be positive`)
  }
  if (amount.gt(_0)) {
    // 0.....position2.....safePosition2
    const safePosition2 = computeAMMSafeLongPositionAmount(ret, context.openSlippageFactor)
    if (position2.gt(safePosition2)) {
      throw new InsufficientLiquidityError(
        `AMM can not open position anymore: position too large after trade ${position2.toFixed()} > ${safePosition2.toFixed()}`
      )
    }
  } else {
    // safePosition2.....position2.....0
    const safePosition2 = computeAMMSafeShortPositionAmount(ret, context.openSlippageFactor)
    if (position2.lt(safePosition2)) {
      throw new InsufficientLiquidityError(
        `AMM can not open position anymore: position too large after trade ${position2.toFixed()} < ${safePosition2.toFixed()}`
      )
    }
  }

  // trade
  if (ret.bestAskBidPrice === null) {
    ret.bestAskBidPrice = computeBestAskBidPriceIfSafe(ret, beta, amount.gt(_0))
  }
  const deltaMargin = computeDeltaMargin(ret, beta, position2)
  if (hasTheSameSign(deltaMargin, amount)) {
    throw new BugError(
      `open error. ??M and amount has the same sign unexpectedly: ${deltaMargin.toFixed()} vs ${amount.toFixed()}`
    )
  }

  // commit
  ret.deltaMargin = ret.deltaMargin.plus(deltaMargin)
  ret.deltaPosition = ret.deltaPosition.plus(amount)
  ret.cash = ret.cash.plus(deltaMargin)
  ret.position1 = position2

  return ret
}

// do not call this function if !isAMMSafe && !allowUnsafe
export function computeAMMPoolMargin(
  context: AMMTradingContext,
  beta: BigNumber,
  allowUnsafe: boolean = false
): AMMTradingContext {
  const marginBalanceWithCurrent = context.cash
    .plus(context.valueWithoutCurrent)
    .plus(context.index.times(context.position1))
  const squareValueWithCurrent = context.squareValueWithoutCurrent.plus(
    beta
      .times(context.index)
      .times(context.index)
      .times(context.position1)
      .times(context.position1)
  )
  // 1/2 (M_b + ???(M_b^2 - 2(?? ?? P_i_j^2 N_j^2)))
  let beforeSqrt = marginBalanceWithCurrent.times(marginBalanceWithCurrent).minus(_2.times(squareValueWithCurrent))
  if (beforeSqrt.lt(_0)) {
    if (allowUnsafe) {
      beforeSqrt = _0
    } else {
      throw new BugError('AMM available margin sqrt < 0')
    }
  }
  const poolMargin = marginBalanceWithCurrent.plus(sqrt(beforeSqrt)).div(_2)
  if (poolMargin.lt(_0)) {
    throw new InsufficientLiquidityError('pool margin is negative')
  }
  return { ...context, poolMargin }
}

export function isAMMSafe(context: AMMTradingContext, beta: BigNumber): boolean {
  const valueWithCurrent = context.valueWithoutCurrent.plus(context.index.times(context.position1))
  const squareValueWithCurrent = context.squareValueWithoutCurrent.plus(
    beta
      .times(context.index)
      .times(context.index)
      .times(context.position1)
      .times(context.position1)
  )
  // ???(2 ??(??_j P_i_j^2 N_j^2)) - ??(P_i_j N_j). always positive
  const beforeSqrt = _2.times(squareValueWithCurrent)
  const safeCash = sqrt(beforeSqrt).minus(valueWithCurrent)
  return context.cash.gte(safeCash)
}

// call computeAMMPoolMargin before this function. make sure isAMMSafe before this function
export function computeAMMSafeShortPositionAmount(context: AMMTradingContext, beta: BigNumber): BigNumber {
  if (context.poolMargin.lte(_0)) {
    return _0
  }
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
  if (context.poolMargin.lte(_0)) {
    return _0
  }
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
  // M / i / ??
  const position2 = context.poolMargin.div(context.index).div(beta)
  return position2.dp(DECIMALS)
}

// return true if always safe
export function computeAMMSafeCondition2(context: AMMTradingContext, beta: BigNumber): BigNumber | true {
  if (context.poolMargin.lte(_0)) {
    throw new InsufficientLiquidityError(`AMM poolMargin <= 0`)
  }
  // M - ??(positionMargin_j - squareValue_j / 2 / M) where j ??? id
  const x = context.poolMargin
    .minus(context.positionMarginWithoutCurrent)
    .plus(context.squareValueWithoutCurrent.div(context.poolMargin).div(_2))
  //  M - ???(M(M - 2????^2 x))
  // ---------------------------
  //          ?? ?? P_i
  let beforeSqrt = x
    .times(context.ammMaxLeverage)
    .times(context.ammMaxLeverage)
    .times(beta)
    .times(_2)
  beforeSqrt = context.poolMargin.minus(beforeSqrt).times(context.poolMargin)
  if (beforeSqrt.lt(_0)) {
    // means the curve is always above the x-axis
    return true
  }
  let position2 = context.poolMargin.minus(sqrt(beforeSqrt))
  position2 = BigNumber.max(position2, _0) // might be negative, clip to zero
  position2 = position2
    .div(beta)
    .div(context.ammMaxLeverage)
    .div(context.index)
  return position2.dp(DECIMALS)
}

// return false if always unsafe
export function computeAMMSafeCondition3(context: AMMTradingContext, beta: BigNumber): BigNumber | false {
  //   1      2M^2 - squareValueWithoutCurrent
  // ----- ???(----------------------------------)
  //  P_i                   ??
  const beforeSqrt = _2
    .times(context.poolMargin)
    .times(context.poolMargin)
    .minus(context.squareValueWithoutCurrent)
    .div(beta)
  if (beforeSqrt.lt(_0)) {
    return false
  }
  const position2 = sqrt(beforeSqrt).div(context.index)
  return position2.dp(DECIMALS)
}

// P_b
export function computeBasePrice(context: AMMTradingContext, beta: BigNumber, position: BigNumber): BigNumber {
  if (context.poolMargin.lte(_0)) {
    throw new InsufficientLiquidityError(`AMM poolMargin <= 0`)
  }
  // P_i (1 - ?? / M * P_i * N)
  let ret = context.index
    .times(position)
    .div(context.poolMargin)
    .times(beta)
  ret = _1.minus(ret).times(context.index)
  return ret.dp(DECIMALS)
}

// ??? computeBasePrice(p) dp
// cash2 - cash1
export function computeDeltaMargin(context: AMMTradingContext, beta: BigNumber, position2: BigNumber): BigNumber {
  if ((context.position1.gt(_0) && position2.lt(_0)) || (context.position1.lt(_0) && position2.gt(_0))) {
    throw new BugError('bug: cross direction is not supported')
  }
  if (context.poolMargin.lte(_0)) {
    throw new InsufficientLiquidityError(`AMM poolMargin <= 0`)
  }
  // P_i (N1 - N2) (1 - ?? / M * P_i * (N2 + N1) / 2)
  let ret = position2
    .plus(context.position1)
    .div(_2)
    .times(context.index)
    .div(context.poolMargin)
    .times(beta)
  ret = _1.minus(ret)
  ret = context.position1
    .minus(position2)
    .times(ret)
    .times(context.index)
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

  const perpetual = p.perpetuals.get(perpetualIndex)
  if (!perpetual) {
    throw new InvalidArgumentError(`perpetual ${perpetualIndex} not found in the pool`)
  }
  context = computeAMMPoolMargin(context, context.openSlippageFactor)
  let fr = _0
  if (!perpetual.openInterest.isZero()) {
    if (
      (perpetual.baseFundingRate.value.gt(_0) && context.position1.lte(_0)) ||
      (perpetual.baseFundingRate.value.lt(_0) && context.position1.gte(_0))
    ) {
      fr = perpetual.baseFundingRate.value
    }
  }
  fr = fr.plus(
    context.fundingRateFactor
    .times(context.index)
    .times(context.position1)
    .div(context.poolMargin)
    .negated()
  )
  fr = BigNumber.minimum(fr, context.fundingRateLimit)
  fr = BigNumber.maximum(fr, context.fundingRateLimit.negated())
  return fr
}

// add liquidity helper
export function computeAMMShareToMint(
  p: LiquidityPoolStorage,
  totalShare: BigNumberish,
  cashToAdd: BigNumberish
): { shareToMint: BigNumber; poolMargin: BigNumber; newPoolMargin: BigNumber } {
  const normalizedCashToAdd = normalizeBigNumberish(cashToAdd)
  const normalizedTotalShare = normalizeBigNumberish(totalShare)
  let context = initAMMTradingContext(p)
  context = computeAMMPoolMargin(context, _0 /* useless */, true /* allowUnsafe */)
  const poolMargin = context.poolMargin
  let newContext: AMMTradingContext = {
    ...context,
    cash: context.cash.plus(normalizedCashToAdd)
  }
  newContext = computeAMMPoolMargin(newContext, _0 /* useless */, true /* allowUnsafe */)
  const newPoolMargin = newContext.poolMargin
  let shareToMint = _0
  if (poolMargin.isZero()) {
    if (!normalizedTotalShare.isZero()) {
      console.warn('WARN: addLiquidity while poolMargin = 0 but totalShare != 0')
    }
    shareToMint = newPoolMargin
  } else {
    shareToMint = newPoolMargin
      .minus(poolMargin)
      .times(normalizedTotalShare)
      .div(poolMargin)
  }
  return {
    shareToMint,
    poolMargin,
    newPoolMargin
  }
}

// remove liquidity helper
export function computeAMMCashToReturn(
  p: LiquidityPoolStorage,
  totalShare: BigNumberish,
  shareToRemove: BigNumberish
): { cashToReturn: BigNumber; poolMargin: BigNumber; newPoolMargin: BigNumber } {
  const normalizedShareToRemove = normalizeBigNumberish(shareToRemove)
  const normalizedTotalShare = normalizeBigNumberish(totalShare)
  if (normalizedTotalShare.lte(_0) || normalizedShareToRemove.gt(normalizedTotalShare)) {
    throw new InvalidArgumentError(
      `remove liquidity error. totalShare: ${normalizedTotalShare.toFixed()} shareToRemove: ${normalizedShareToRemove.toFixed()}`
    )
  }
  let context = initAMMTradingContext(p)
  if (!isAMMSafe(context, _0 /* useless */)) {
    throw new InsufficientLiquidityError(`AMM can not remove liquidity: unsafe before removing liquidity`)
  }
  context = computeAMMPoolMargin(context, _0 /* useless */)
  const poolMargin = context.poolMargin
  if (poolMargin.isZero()) {
    return { cashToReturn: _0, poolMargin: _0, newPoolMargin: _0 }
  }
  const newPoolMargin = normalizedTotalShare
    .minus(normalizedShareToRemove)
    .times(poolMargin)
    .div(normalizedTotalShare)
  const minPoolMargin = sqrt(context.squareValueWithoutCurrent.div(_2))
  if (newPoolMargin.lt(minPoolMargin)) {
    throw new InsufficientLiquidityError(`AMM can not remove liquidity: unsafe after removing liquidity`)
  }
  let cashToReturn = _0
  if (newPoolMargin.isZero()) {
    // remove all
    cashToReturn = context.cash
  } else if (newPoolMargin.lt(_0)) {
    throw new InsufficientLiquidityError(`AMM can not remove liquidity: pool margin must be positive`)
  } else {
    // M - ?? P_i N + ?? (?? P_i^2 N^2) / 2 / M
    cashToReturn = context.squareValueWithoutCurrent
      .div(newPoolMargin)
      .div(_2)
      .plus(newPoolMargin)
      .minus(context.valueWithoutCurrent)
    cashToReturn = context.cash.minus(cashToReturn)
  }
  if (cashToReturn.lt(_0)) {
    throw new InsufficientLiquidityError(`AMM can not remove liquidity: received margin is negative`)
  }

  // prevent amm offering negative price
  for (let j = 0; j < context.otherIndex.length; j++) {
    // M / P_i / ??
    const maxPos = newPoolMargin.div(context.otherOpenSlippageFactor[j]).div(context.otherIndex[j])
    if (context.otherPosition[j].gt(maxPos)) {
      throw new InsufficientLiquidityError(`AMM can not remove liquidity: negative price in ${j}`)
    }
  }

  // prevent amm exceeding max leverage
  if (
    context.cash
      .plus(context.valueWithoutCurrent)
      .minus(cashToReturn)
      .lt(context.positionMarginWithoutCurrent)
  ) {
    throw new InsufficientLiquidityError(
      `AMM can not remove liquidity: amm exceeds max leverage after removing liquidity`
    )
  }

  return {
    cashToReturn,
    poolMargin,
    newPoolMargin
  }
}

export function computeMaxRemovableShare(p: LiquidityPoolStorage, totalShare: BigNumberish): BigNumber {
  const normalizedTotalShare = normalizeBigNumberish(totalShare)
  let context = initAMMTradingContext(p)
  if (!isAMMSafe(context, _0 /* useless */)) {
    return _0
  }
  context = computeAMMPoolMargin(context, _0 /* useless */)
  const poolMargin = context.poolMargin
  if (poolMargin.lte(_0)) {
    return _0
  }

  // if zero position
  if (context.positionMarginWithoutCurrent.isZero()) {
    return normalizedTotalShare
  }

  // prevent amm unsafe
  let minPoolMargin = sqrt(context.squareValueWithoutCurrent.div(_2))

  // prevent amm offering negative price. note: perp.state != PerpetualState.NORMAL are already skipped
  for (let j = 0; j < context.otherIndex.length; j++) {
    // M >= ?? P_i N
    minPoolMargin = BigNumber.maximum(
      minPoolMargin,
      context.otherOpenSlippageFactor[j].times(context.otherIndex[j]).times(context.otherPosition[j])
    )
  }

  // prevent amm exceeding max leverage
  // newCash + ?? P_i N >= ?? P_i | N | / ??
  const minNewCash = context.positionMarginWithoutCurrent.minus(context.valueWithoutCurrent)
  const contextForLev = computeAMMPoolMargin(
    {
      ...context,
      cash: minNewCash
    },
    _0 /* useless */,
    true /* allowUnsafe */
  )
  minPoolMargin = BigNumber.maximum(minPoolMargin, contextForLev.poolMargin)

  // share
  if (minPoolMargin.gte(poolMargin)) {
    return _0
  }
  const shareToRemove = _1.minus(minPoolMargin.div(poolMargin)).times(normalizedTotalShare)
  return shareToRemove.times(REMOVE_LIQUIDITY_MAX_SHARE_RELAX).dp(DECIMALS, BigNumber.ROUND_DOWN)
}
