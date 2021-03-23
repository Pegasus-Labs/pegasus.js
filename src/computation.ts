/*
  Simulate the smart contract's computation.
*/

import { BigNumber } from 'bignumber.js'

import {
  AccountStorage,
  AccountDetails,
  LiquidityPoolStorage,
  BigNumberish,
  AccountComputed,
  AMMTradingResult,
  InvalidArgumentError,
  BugError,
  InsufficientLiquidityError
} from './types'
import { computeAMMInternalTrade, computeAMMPoolMargin, initAMMTradingContext } from './amm'
import { _0, _1 } from './constants'
import { normalizeBigNumberish, hasTheSameSign, splitAmount } from './utils'

export function computeAccount(p: LiquidityPoolStorage, perpetualIndex: number, s: AccountStorage): AccountDetails {
  const perpetual = p.perpetuals.get(perpetualIndex)
  if (!perpetual) {
    throw new InvalidArgumentError(`perpetual {perpetualIndex} not found in the pool`)
  }
  const positionValue = perpetual.markPrice.times(s.positionAmount.abs())
  const positionMargin = positionValue.times(perpetual.initialMarginRate)
  const maintenanceMargin = positionValue.times(perpetual.maintenanceMarginRate)
  let reservedCash = _0
  if (!s.positionAmount.isZero()) {
    reservedCash = perpetual.keeperGasReward
  }
  const availableCashBalance = s.cashBalance.minus(s.positionAmount.times(perpetual.unitAccumulativeFunding))
  const marginBalance = availableCashBalance.plus(perpetual.markPrice.times(s.positionAmount))
  const availableMargin = BigNumber.maximum(_0, marginBalance.minus(BigNumber.maximum(reservedCash, positionMargin)))
  const withdrawableBalance = availableMargin
  const isMMSafe = marginBalance.gte(BigNumber.maximum(reservedCash, maintenanceMargin))
  const isIMSafe = marginBalance.gte(BigNumber.maximum(reservedCash, positionMargin))
  const isMarginSafe = marginBalance.gte(reservedCash)
  const leverage = marginBalance.gt(0) ? positionValue.div(marginBalance) : _0

  let fundingPNL: BigNumber | null = null
  if (s.entryFunding) {
    fundingPNL = s.entryFunding.minus(s.positionAmount.times(perpetual.unitAccumulativeFunding))
  }

  let entryPrice: BigNumber | null = null
  let pnl1: BigNumber | null = null
  let pnl2: BigNumber | null = null
  let roe: BigNumber | null = null
  if (s.entryValue) {
    entryPrice = s.positionAmount.isZero() ? _0 : s.entryValue.div(s.positionAmount)
  }
  if (s.entryValue) {
    pnl1 = perpetual.markPrice.times(s.positionAmount).minus(s.entryValue)
  }
  if (pnl1 && fundingPNL) {
    pnl2 = pnl1.plus(fundingPNL)
  }
  if (pnl2 && s.entryValue && s.entryFunding) {
    let entryCash = s.cashBalance.plus(s.entryValue).minus(s.entryFunding)
    roe = entryCash.isZero() ? _0 : pnl2.div(entryCash)
  }

  // the estimated liquidation price helps traders to know when to close their positions.
  // it has already considered the close position trading fee. this value is different
  // from the keeper's liquidation price who does not pay the trading fee.
  let liquidationPrice = _0
  if (!s.positionAmount.isZero()) {
    let tradingFeeRate = p.vaultFeeRate.plus(perpetual.operatorFeeRate).plus(perpetual.lpFeeRate)
    const t = perpetual.maintenanceMarginRate
      .plus(tradingFeeRate)
      .times(s.positionAmount.abs())
      .minus(s.positionAmount)
    liquidationPrice = availableCashBalance.minus(reservedCash).div(t)
    if (liquidationPrice.isNegative()) {
      liquidationPrice = _0
    }
  }

  const accountComputed: AccountComputed = {
    positionValue,
    positionMargin,
    maintenanceMargin,
    availableCashBalance,
    marginBalance,
    availableMargin,
    withdrawableBalance,
    isMMSafe,
    isIMSafe,
    isMarginSafe,
    leverage,

    entryPrice,
    fundingPNL,
    pnl1,
    pnl2,
    roe,
    liquidationPrice
  }
  return { accountStorage: s, accountComputed }
}

export function computeDecreasePosition(
  p: LiquidityPoolStorage,
  perpetualIndex: number,
  a: AccountStorage,
  price: BigNumber,
  amount: BigNumber
): AccountStorage {
  const perpetual = p.perpetuals.get(perpetualIndex)
  if (!perpetual) {
    throw new InvalidArgumentError(`perpetual {perpetualIndex} not found in the pool`)
  }
  let cashBalance = a.cashBalance
  const oldAmount = a.positionAmount
  let entryValue = a.entryValue
  let entryFunding = a.entryFunding
  if (oldAmount.isZero() || amount.isZero() || hasTheSameSign(oldAmount, amount)) {
    throw new InvalidArgumentError(
      `bad amount ${amount.toFixed()} to decrease when position is ${oldAmount.toFixed()}.`
    )
  }
  if (price.lte(_0)) {
    throw new InvalidArgumentError(`bad price ${price.toFixed()}`)
  }
  if (oldAmount.abs().lt(amount.abs())) {
    throw new InvalidArgumentError(`position size |${oldAmount.toFixed()}| is less than amount |${amount.toFixed()}|`)
  }
  cashBalance = cashBalance.minus(price.times(amount))
  cashBalance = cashBalance.plus(perpetual.unitAccumulativeFunding.times(amount))
  const positionAmount = oldAmount.plus(amount)
  entryFunding = entryFunding ? entryFunding.times(positionAmount).div(oldAmount) : null
  entryValue = entryValue ? entryValue.times(positionAmount).div(oldAmount) : null
  return { cashBalance, entryValue, positionAmount, entryFunding }
}

export function computeIncreasePosition(
  p: LiquidityPoolStorage,
  perpetualIndex: number,
  a: AccountStorage,
  price: BigNumber,
  amount: BigNumber
): AccountStorage {
  const perpetual = p.perpetuals.get(perpetualIndex)
  if (!perpetual) {
    throw new InvalidArgumentError(`perpetual {perpetualIndex} not found in the pool`)
  }
  let cashBalance = a.cashBalance
  const oldAmount = a.positionAmount
  let entryValue = a.entryValue
  let entryFunding = a.entryFunding
  if (price.lte(_0)) {
    throw new InvalidArgumentError(`bad price ${price.toFixed()}`)
  }
  if (amount.isZero()) {
    throw new InvalidArgumentError(`bad amount`)
  }
  if (!oldAmount.isZero() && !hasTheSameSign(oldAmount, amount)) {
    throw new InvalidArgumentError(`bad increase size ${amount.toFixed()} where position is ${oldAmount.toFixed()}`)
  }
  cashBalance = cashBalance.minus(price.times(amount))
  cashBalance = cashBalance.plus(perpetual.unitAccumulativeFunding.times(amount))
  entryValue = entryValue ? entryValue.plus(price.times(amount)) : null
  entryFunding = entryFunding ? entryFunding.plus(perpetual.unitAccumulativeFunding.times(amount)) : null
  const positionAmount = oldAmount.plus(amount)
  return { cashBalance, entryValue, positionAmount, entryFunding }
}

export function computeFee(price: BigNumberish, amount: BigNumberish, feeRate: BigNumberish): BigNumber {
  const normalizedPrice = normalizeBigNumberish(price)
  const normalizedAmount = normalizeBigNumberish(amount)
  const normalizedFeeRate = normalizeBigNumberish(feeRate)
  if (normalizedPrice.lte(_0) || normalizedAmount.isZero()) {
    throw new InvalidArgumentError(`bad price ${normalizedPrice.toFixed()} or amount ${normalizedAmount.toFixed()}`)
  }
  return normalizedPrice.times(normalizedAmount.abs()).times(normalizedFeeRate)
}

export function computeTradeWithPrice(
  p: LiquidityPoolStorage,
  perpetualIndex: number,
  a: AccountStorage,
  price: BigNumberish,
  amount: BigNumberish,
  feeRate: BigNumberish
): { afterTrade: AccountDetails; tradeIsSafe: boolean } {
  const normalizedPrice = normalizeBigNumberish(price)
  const normalizedAmount = normalizeBigNumberish(amount)
  const normalizedFeeRate = normalizeBigNumberish(feeRate)
  if (normalizedPrice.lte(_0) || normalizedAmount.isZero()) {
    throw new InvalidArgumentError(`bad price ${normalizedPrice.toFixed()} or amount ${normalizedAmount.toFixed()}`)
  }

  // trade
  let newAccount: AccountStorage = { ...a }
  let { close, open } = splitAmount(newAccount.positionAmount, normalizedAmount)
  if (!close.isZero()) {
    newAccount = computeDecreasePosition(p, perpetualIndex, newAccount, normalizedPrice, close)
  }
  if (!open.isZero()) {
    newAccount = computeIncreasePosition(p, perpetualIndex, newAccount, normalizedPrice, open)
  }
  
  // fee
  const fee = computeFee(normalizedPrice, normalizedAmount, normalizedFeeRate)
  newAccount.cashBalance = newAccount.cashBalance.minus(fee)

  // open position requires margin > IM. close position requires !bankrupt
  const afterTrade = computeAccount(p, perpetualIndex, newAccount)
  let tradeIsSafe = afterTrade.accountComputed.isMarginSafe
  if (!open.isZero()) {
    tradeIsSafe = afterTrade.accountComputed.isIMSafe
  }
  return {
    afterTrade,
    tradeIsSafe
  }
}

export function computeAMMTrade(
  p: LiquidityPoolStorage,
  perpetualIndex: number,
  trader: AccountStorage,
  amount: BigNumberish // trader's perspective
): AMMTradingResult {
  const normalizedAmount = normalizeBigNumberish(amount)
  if (normalizedAmount.isZero()) {
    throw new InvalidArgumentError(`bad amount ${normalizedAmount.toFixed()}`)
  }
  const perpetual = p.perpetuals.get(perpetualIndex)
  if (!perpetual) {
    throw new InvalidArgumentError(`perpetual {perpetualIndex} not found in the pool`)
  }
  let oldOpenInterest = perpetual.openInterest
  let newOpenInterest = oldOpenInterest

  // AMM
  const { deltaAMMAmount, tradingPrice } = computeAMMPrice(p, perpetualIndex, normalizedAmount)
  if (!deltaAMMAmount.negated().eq(normalizedAmount)) {
    throw new BugError(
      `trading amount mismatched ${deltaAMMAmount.negated().toFixed()} != ${normalizedAmount.toFixed()}`
    )
  }

  // fee
  const lpFee = computeFee(tradingPrice, deltaAMMAmount, perpetual.lpFeeRate)
  const vaultFee = computeFee(tradingPrice, deltaAMMAmount, p.vaultFeeRate)
  const operatorFee = computeFee(tradingPrice, deltaAMMAmount, perpetual.operatorFeeRate)

  // trader
  const traderResult = computeTradeWithPrice(
    p,
    perpetualIndex,
    trader,
    tradingPrice,
    deltaAMMAmount.negated(),
    perpetual.lpFeeRate.plus(p.vaultFeeRate).plus(perpetual.operatorFeeRate)
  )
  newOpenInterest = computeOpenInterest(newOpenInterest, trader.positionAmount, deltaAMMAmount.negated())

  // new AMM
  let fakeAMMAccount: AccountStorage = {
    cashBalance: p.poolCashBalance,
    positionAmount: perpetual.ammPositionAmount,
    entryValue: null,
    entryFunding: null
  }
  const fakeAMMResult = computeTradeWithPrice(p, perpetualIndex, fakeAMMAccount, tradingPrice, deltaAMMAmount, _0)
  fakeAMMAccount = fakeAMMResult.afterTrade.accountStorage
  fakeAMMAccount.cashBalance = fakeAMMAccount.cashBalance.plus(lpFee)
  newOpenInterest = computeOpenInterest(newOpenInterest, perpetual.ammPositionAmount, deltaAMMAmount)
  const newPool: LiquidityPoolStorage = {
    // clone the old pool to keep the return value immutable
    ...p,
    poolCashBalance: fakeAMMAccount.cashBalance,
    perpetuals: new Map(p.perpetuals)
  }
  newPool.perpetuals.set(perpetualIndex, {
    ...perpetual,
    ammPositionAmount: fakeAMMAccount.positionAmount,
    openInterest: newOpenInterest,
  })

  // check open interest limit
  if (newOpenInterest.gt(oldOpenInterest)) {
    let context = initAMMTradingContext(newPool, perpetualIndex)
    context = computeAMMPoolMargin(context, context.openSlippageFactor, true /* allowUnsafe */)
    const limit = context.poolMargin.times(perpetual.maxOpenInterestRate).div(perpetual.indexPrice)
    if (newOpenInterest.gt(limit)) {
      throw new InsufficientLiquidityError(`open interest exceeds limit: ${newOpenInterest.toFixed()} > ${limit.toFixed()}`)
    }
  }

  return {
    tradeIsSafe: traderResult.tradeIsSafe,
    trader: traderResult.afterTrade,
    newPool,
    lpFee,
    vaultFee,
    operatorFee,
    tradingPrice
  }
}

// don't forget to transfer lpFees into amm after calling this function
export function computeAMMPrice(
  p: LiquidityPoolStorage,
  perpetualIndex: number,
  amount: BigNumberish // trader's perspective
): {
  deltaAMMAmount: BigNumber
  deltaAMMMargin: BigNumber
  tradingPrice: BigNumber
} {
  const normalizedAmount = normalizeBigNumberish(amount)
  if (normalizedAmount.isZero()) {
    throw new InvalidArgumentError(`bad amount ${normalizedAmount.toFixed()}`)
  }
  const ammTrading = computeAMMInternalTrade(p, perpetualIndex, normalizedAmount.negated())
  const deltaAMMMargin = ammTrading.deltaMargin
  const deltaAMMAmount = ammTrading.deltaPosition
  const tradingPrice = deltaAMMMargin.div(deltaAMMAmount).abs()
  return { deltaAMMAmount, deltaAMMMargin, tradingPrice }
}

// > 0 if more collateral required
export function computeMarginCost(
  p: LiquidityPoolStorage,
  perpetualIndex: number,
  afterTrade: AccountDetails,
  targetLeverage: BigNumberish
): BigNumber {
  const normalizedLeverage = normalizeBigNumberish(targetLeverage)
  if (!normalizedLeverage.isPositive()) {
    throw Error(`bad leverage ${targetLeverage.toString()}`)
  }
  const perpetual = p.perpetuals.get(perpetualIndex)
  if (!perpetual) {
    throw new InvalidArgumentError(`perpetual {perpetualIndex} not found in the pool`)
  }
  let reservedCash = _0
  let marginCost = _0
  if (!afterTrade.accountStorage.positionAmount.isZero()) {
    reservedCash = perpetual.keeperGasReward
    const positionMargin = afterTrade.accountComputed.positionValue.div(normalizedLeverage)
    const minAvailableMargin = BigNumber.maximum(reservedCash, positionMargin)
    marginCost = minAvailableMargin.minus(afterTrade.accountComputed.marginBalance)
  }
  return marginCost
}

// > 0 if more collateral required
export function computeOpenInterest(
  oldOpenInterest: BigNumber,
  oldPosition: BigNumber,
  tradeAmount: BigNumber): BigNumber {
  let newOpenInterest = oldOpenInterest
  let newPosition = oldPosition.plus(tradeAmount)
  if (oldPosition.gt(_0)) {
    newOpenInterest = newOpenInterest.minus(oldPosition)
  }
  if (newPosition.gt(_0)) {
    newOpenInterest = newOpenInterest.plus(newPosition)
  }
  return newOpenInterest
}
