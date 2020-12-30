import { ethers } from 'ethers'
import { DECIMALS } from './constants'
import { BigNumberish } from './types'
import { normalizeBigNumberish } from './utils'
import BigNumber from 'bignumber.js'
import type { LiquidityPool } from './wrapper/LiquidityPool'
import type { BrokerRelay } from './wrapper/BrokerRelay'
import { Overrides, PayableOverrides } from "@ethersproject/contracts"
import { getAddress } from "@ethersproject/address"

export async function perpetualTrade(
  liquidityPool: LiquidityPool,
  perpetualIndex: number,
  trader: string,
  tradeAmount: BigNumberish, // +1.23 means buy, -1.23 means sell
  limitPrice: BigNumberish,
  deadline: number,
  referrer: string,
  isCloseOnly: boolean,
  overrides?: Overrides,
): Promise<ethers.providers.TransactionResponse> {
  getAddress(trader)
  getAddress(referrer)
  const largeAmount = normalizeBigNumberish(tradeAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  const largeLimitPrice = normalizeBigNumberish(limitPrice)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  return await liquidityPool.trade(
    perpetualIndex, trader, largeAmount.toFixed(), largeLimitPrice.toFixed(),
    deadline, referrer, isCloseOnly,
    overrides)
}

export async function perpetualDeposit(
  liquidityPool: LiquidityPool,
  perpetualIndex: number,
  trader: string,
  collateralAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  overrides?: PayableOverrides,
): Promise<ethers.providers.TransactionResponse> {
  getAddress(trader)
  const largeAmount = normalizeBigNumberish(collateralAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  return await liquidityPool.deposit(perpetualIndex, trader, largeAmount.toFixed(), overrides)
}

export async function perpetualDepositEth(
  liquidityPool: LiquidityPool,
  perpetualIndex: number,
  trader: string,
  collateralAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  overrides?: PayableOverrides,
): Promise<ethers.providers.TransactionResponse> {
  getAddress(trader)
  const largeAmount = normalizeBigNumberish(collateralAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  if (!overrides) {
    overrides = {}
  }
  overrides.value = largeAmount.toFixed()
  return await liquidityPool.deposit(perpetualIndex, trader, '0', overrides)
}

export async function perpetualWithdraw(
  liquidityPool: LiquidityPool,
  perpetualIndex: number,
  trader: string,
  collateralAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  overrides?: Overrides,
): Promise<ethers.providers.TransactionResponse> {
  const largeAmount = normalizeBigNumberish(collateralAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  return await liquidityPool.withdraw(perpetualIndex, trader, largeAmount.toFixed(), overrides)
}

export async function brokerRelayDeposit(
  brokerRelay: BrokerRelay,
  tokenAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  overrides?: PayableOverrides,
): Promise<ethers.providers.TransactionResponse> {
  const largeAmount = normalizeBigNumberish(tokenAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  if (!overrides) {
    overrides = {}
  }
  overrides.value = largeAmount.toFixed()
  return await brokerRelay.deposit(overrides)
}

export async function brokerRelayWithdraw(
  brokerRelay: BrokerRelay,
  tokenAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  overrides?: Overrides,
): Promise<ethers.providers.TransactionResponse> {
  const largeAmount = normalizeBigNumberish(tokenAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  return await brokerRelay.withdraw(largeAmount.toFixed(), overrides)
}

export async function perpetualClear(
  liquidityPool: LiquidityPool,
  perpetualIndex: number,
  overrides?: PayableOverrides,
): Promise<ethers.providers.TransactionResponse> {
  return await liquidityPool.clear(perpetualIndex, overrides)
}

export async function perpetualSettleWithDraw(
  liquidityPool: LiquidityPool,
  perpetualIndex: number,
  trader: string,
  overrides?: PayableOverrides,
): Promise<ethers.providers.TransactionResponse> {
  getAddress(trader)
  return await liquidityPool.settle(perpetualIndex, trader, overrides)
}

export async function addLiquidity(
  liquidityPool: LiquidityPool,
  collateralAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  overrides?: PayableOverrides,
): Promise<ethers.providers.TransactionResponse> {
  const largeAmount = normalizeBigNumberish(collateralAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  return await liquidityPool.addLiquidity(largeAmount.toFixed(), overrides)
}

export async function removeLiquidity(
  liquidityPool: LiquidityPool,
  collateralAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  overrides?: PayableOverrides,
): Promise<ethers.providers.TransactionResponse> {
  const largeAmount = normalizeBigNumberish(collateralAmount)
    .shiftedBy(DECIMALS)
    .dp(0, BigNumber.ROUND_DOWN)
  return await liquidityPool.removeLiquidity(largeAmount.toFixed(), overrides)
}
