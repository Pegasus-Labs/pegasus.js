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
} from './types'
import {
  computeAMMInternalTrade
} from './amm'
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
  const maxWithdrawable = BigNumber.max(_0, marginBalance.minus(positionMargin).minus(reservedCash))
  const availableMargin = BigNumber.max(_0, maxWithdrawable)
  const withdrawableBalance = maxWithdrawable
  const isSafe = maintenanceMargin.lte(marginBalance)
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
    entryPrice = (s.positionAmount.isZero() ? _0 : s.entryValue.div(s.positionAmount))
  }
  if (s.entryValue) {
    pnl1 = perpetual.markPrice.times(s.positionAmount).minus(s.entryValue)
  }
  if (pnl1 && fundingPNL) {
    pnl2 = pnl1.plus(fundingPNL)
  }
  if (pnl2 && s.entryValue && s.entryFunding) {
    let entryCash = s.cashBalance.plus(s.entryValue).minus(s.entryFunding)
    roe = (entryCash.isZero() ? _0 : pnl2.div(entryCash))
  }

  let liquidationPrice = _0
  if (!s.positionAmount.isZero()) {
    const t = s.positionAmount.abs().times(perpetual.maintenanceMarginRate).minus(s.positionAmount)
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
    maxWithdrawable,
    availableMargin,
    withdrawableBalance,
    isSafe,
    leverage,

    entryPrice,
    fundingPNL,
    pnl1,
    pnl2,
    roe,
    liquidationPrice,
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
    throw new InvalidArgumentError(`bad amount ${amount.toFixed()} to decrease when position is ${oldAmount.toFixed()}.`)
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
  entryFunding = entryFunding
    ? entryFunding.times(positionAmount).div(oldAmount)
    : null
  entryValue = entryValue
    ? entryValue.times(positionAmount).div(oldAmount)
    : null
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
  entryValue = entryValue
    ? entryValue.plus(price.times(amount))
    : null
  entryFunding = entryFunding
    ? entryFunding.plus(perpetual.unitAccumulativeFunding.times(amount))
    : null
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
  feeRate: BigNumberish,
): AccountStorage {
  const normalizedPrice = normalizeBigNumberish(price)
  const normalizedAmount = normalizeBigNumberish(amount)
  const normalizedFeeRate = normalizeBigNumberish(feeRate)
  if (normalizedPrice.lte(_0) || normalizedAmount.isZero()) {
    throw new InvalidArgumentError(`bad price ${normalizedPrice.toFixed()} or amount ${normalizedAmount.toFixed()}`)
  }
  let newAccount: AccountStorage = a
  let { close, open } = splitAmount(newAccount.positionAmount, normalizedAmount)
  if (!close.isZero()) {
    newAccount = computeDecreasePosition(p, perpetualIndex, newAccount, normalizedPrice, close)
  }
  if (!open.isZero()) {
    newAccount = computeIncreasePosition(p, perpetualIndex, newAccount, normalizedPrice, open)
  }
  const fee = computeFee(normalizedPrice, normalizedAmount, normalizedFeeRate)
  newAccount.cashBalance = newAccount.cashBalance.minus(fee)
  return newAccount
}

export function computeAMMTrade(
  p: LiquidityPoolStorage,
  perpetualIndex: number,
  trader: AccountStorage,
  amount: BigNumberish, // trader's perspective
): AMMTradingResult {
  const normalizedAmount = normalizeBigNumberish(amount)
  if (normalizedAmount.isZero()) {
    throw new InvalidArgumentError(`bad amount ${normalizedAmount.toFixed()}`)
  }
  const perpetual = p.perpetuals.get(perpetualIndex)
  if (!perpetual) {
    throw new InvalidArgumentError(`perpetual {perpetualIndex} not found in the pool`)
  }

  // AMM
  const { deltaAMMAmount, tradingPrice } = computeAMMPrice(p, perpetualIndex, normalizedAmount)
  if (!deltaAMMAmount.negated().eq(normalizedAmount)) {
    throw new BugError(`trading amount mismatched ${deltaAMMAmount.negated().toFixed()} != ${normalizedAmount.toFixed()}`)
  }

  // fee
  const lpFee = computeFee(tradingPrice, deltaAMMAmount, perpetual.lpFeeRate)
  const vaultFee = computeFee(tradingPrice, deltaAMMAmount, p.vaultFeeRate)
  const operatorFee = computeFee(tradingPrice, deltaAMMAmount, perpetual.operatorFeeRate)

  // trader
  trader = computeTradeWithPrice(
    p, perpetualIndex, trader, tradingPrice, deltaAMMAmount.negated(),
    perpetual.lpFeeRate.plus(p.vaultFeeRate).plus(perpetual.operatorFeeRate))

  // new AMM
  let fakeAMMAccount: AccountStorage = {
    cashBalance: p.poolCashBalance,
    positionAmount: perpetual.ammPositionAmount,
    entryValue: null, entryFunding: null,
  }
  fakeAMMAccount = computeTradeWithPrice(p, perpetualIndex, fakeAMMAccount,
    tradingPrice, deltaAMMAmount, _0)
  fakeAMMAccount.cashBalance = fakeAMMAccount.cashBalance.plus(lpFee)
  const newPool: LiquidityPoolStorage = {
    // clone the old pool to keep the return value immutable
    ...p,
    poolCashBalance: fakeAMMAccount.cashBalance,
    perpetuals: new Map(p.perpetuals)
  }
  newPool.perpetuals.set(perpetualIndex, { ...perpetual, ammPositionAmount: fakeAMMAccount.positionAmount })

  return {
    trader,
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
  amount: BigNumberish, // trader's perspective
): {
  deltaAMMAmount: BigNumber,
  deltaAMMMargin: BigNumber,
  tradingPrice: BigNumber,
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

// export function computeAMMAddLiquidity(
//   p: LiquidityPoolStorage,
//   amm: AMMDetails,
//   user: AccountStorage,
//   totalShare: BigNumberish,
//   amount: BigNumberish
// ): { amm: AccountStorage; user: AccountStorage; share: BigNumber } {
//   const normalizedAmount = normalizeBigNumberish(amount)
//   const normalizedTotalShare = normalizeBigNumberish(totalShare)
//   const fairPrice = computeAMMPrice(amm, TRADE_SIDE.Sell, 0)
//   const normalizedCollateral = normalizedAmount.times(fairPrice).times(2)

//   const amm2 = { ...amm.accountStorage, cashBalance: amm.accountStorage.cashBalance.plus(normalizedCollateral) }
//   const user2 = { ...user, cashBalance: user.cashBalance.minus(normalizedCollateral) }
//   const newAMM = computeTrade(perp, funding, amm2, TRADE_SIDE.Buy, fairPrice, normalizedAmount, 0)
//   const newUser = computeTrade(perp, funding, user2, TRADE_SIDE.Sell, fairPrice, normalizedAmount, 0)
//   const share = normalizedTotalShare.isZero()
//     ? normalizedAmount
//     : normalizedAmount.div(amm.accountStorage.positionSize).times(normalizedTotalShare)
//   return { amm: newAMM, user: newUser, share }
// }

// export function computeAMMRemoveLiquidity(
//   p: LiquidityPoolStorage,
//   amm: AMMDetails,
//   user: AccountStorage,
//   totalShare: BigNumberish,
//   shareAmount: BigNumberish
// ): { amm: AccountStorage; user: AccountStorage } {
//   const normalizedTotalShare = normalizeBigNumberish(totalShare)
//   const normalizedShare = normalizeBigNumberish(shareAmount)
//   const percent = normalizedShare.div(normalizedTotalShare)
//   const transferSize = amm.accountStorage.positionSize.times(percent).idiv(gov.lotSize).times(gov.lotSize)
//   const transferCollateral = amm.ammComputed.fairPrice.times(transferSize).times(2)

//   let ammAccount: AccountStorage
//   let userAccount: AccountStorage
//   if (transferSize.isZero()) {
//     ammAccount = amm.accountStorage
//     userAccount = user
//   } else {
//     ammAccount = computeTrade(
//       perp,
//       funding,
//       amm.accountStorage,
//       TRADE_SIDE.Sell,
//       funding.markPrice,
//       transferSize,
//       0
//     )

//     userAccount = computeTrade(perp, funding, user, TRADE_SIDE.Buy, funding.markPrice, transferSize, 0)
//   }
//   const amm2 = { ...ammAccount, cashBalance: ammAccount.cashBalance.minus(transferCollateral) }
//   const user2 = { ...userAccount, cashBalance: userAccount.cashBalance.plus(transferCollateral) }

//   return { amm: amm2, user: user2 }
// }
