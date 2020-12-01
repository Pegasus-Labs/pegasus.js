import { ethers } from 'ethers'
import { DECIMALS } from './constants'
import { BigNumberish } from './types'
import { normalizeBigNumberish } from './utils'
import BigNumber from 'bignumber.js'
import type { Perpetual } from './wrapper/Perpetual'
import type { BrokerRelay } from './wrapper/BrokerRelay'
import { Overrides, PayableOverrides } from "@ethersproject/contracts"
import { getAddress } from "@ethersproject/address"

export async function perpetualTrade(
  perpetual: Perpetual,
  trader: string,
  tradeAmount: BigNumberish, // +1.23 means buy, -1.23 means sell
  limitPrice: BigNumberish,
  deadline: number,
  referrer: string,
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
  return await perpetual.trade(trader, largeAmount.toFixed(), largeLimitPrice.toFixed(), deadline, referrer, overrides)
}

export async function perpetualDeposit(
  perpetual: Perpetual,
  trader: string,
  collateralAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  collateralDecimals: number,
  overrides?: Overrides,
): Promise<ethers.providers.TransactionResponse> {
  getAddress(trader)
  const largeAmount = normalizeBigNumberish(collateralAmount)
    .shiftedBy(collateralDecimals)
    .dp(0, BigNumber.ROUND_DOWN)
  return await perpetual.deposit(trader, largeAmount.toFixed(), overrides)
}

export async function perpetualWithdraw(
  perpetual: Perpetual,
  trader: string,
  collateralAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  collateralDecimals: number,
  overrides?: Overrides,
): Promise<ethers.providers.TransactionResponse> {
  const largeAmount = normalizeBigNumberish(collateralAmount)
    .shiftedBy(collateralDecimals)
    .dp(0, BigNumber.ROUND_DOWN)
  return await perpetual.withdraw(trader, largeAmount.toFixed(), overrides)
}


export async function brokerRelayDeposit(
  brokerRelay: BrokerRelay,
  tokenAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  tokenDecimals: number,
  overrides: PayableOverrides,
): Promise<ethers.providers.TransactionResponse> {
  const largeAmount = normalizeBigNumberish(tokenAmount)
    .shiftedBy(tokenDecimals)
    .dp(0, BigNumber.ROUND_DOWN)
  overrides.value = largeAmount.toFixed()
  return await brokerRelay.deposit(overrides)
}

export async function brokerRelayWithdraw(
  brokerRelay: BrokerRelay,
  tokenAmount: BigNumberish, // should be a decimal number (ie: 1.234)
  tokenDecimals: number,
  overrides?: Overrides,
): Promise<ethers.providers.TransactionResponse> {
  const largeAmount = normalizeBigNumberish(tokenAmount)
    .shiftedBy(tokenDecimals)
    .dp(0, BigNumber.ROUND_DOWN)
  return await brokerRelay.withdraw(largeAmount.toFixed(), overrides)
}
