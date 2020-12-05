import { AccountStorage, PerpetualStorage } from './types'
import { Perpetual } from './wrapper/Perpetual'
import { PerpetualFactory } from './wrapper/PerpetualFactory'
import { BrokerRelay } from './wrapper/BrokerRelay'
import { BrokerRelayFactory } from './wrapper/BrokerRelayFactory'
import { SignerOrProvider } from './types'
import { normalizeBigNumberish } from './utils'
import { BigNumber } from 'bignumber.js'
import { getAddress } from "@ethersproject/address"
import { DECIMALS } from './constants'

export function getPerpetualContract(
  perpetualAddress: string,
  signerOrProvider: SignerOrProvider
): Perpetual {
  return PerpetualFactory.connect(perpetualAddress, signerOrProvider)
}

export function getBrokerRelayContract(
  contractAddress: string,
  signerOrProvider: SignerOrProvider
): BrokerRelay {
  return BrokerRelayFactory.connect(contractAddress, signerOrProvider)
}

export async function getPerpetualStorageMock(
  perpetual: Perpetual
): Promise<PerpetualStorage> {
  perpetual // just ref

  return {
    // perpetual
    underlyingSymbol: 'ETH',
    collateralTokenAddress: '0xf9bf6031fBDfBA94c29C3b2A399D97B22595CD79', // USDT
    shareTokenAddress: '',
    oracleAddress: '',
    initialMarginRate: normalizeBigNumberish(0.1),
    maintenanceMarginRate: normalizeBigNumberish(0.075),
    operatorFeeRate: normalizeBigNumberish(0.0001),
    vaultFeeRate: normalizeBigNumberish(0.0001),
    lpFeeRate: normalizeBigNumberish(0.0008),
    referrerRebateRate: normalizeBigNumberish(0.0002),
    liquidatorPenaltyRate: normalizeBigNumberish(0.075),
    keeperGasReward: normalizeBigNumberish(0.5),

    // amm
    halfSpreadRate: normalizeBigNumberish(0.001),
    beta1: normalizeBigNumberish(0.12),
    beta2: normalizeBigNumberish(0.06),
    fundingRateCoefficient: normalizeBigNumberish(0.1),
    targetLeverage: normalizeBigNumberish(5),

    isEmergency: false,
    isGlobalSettled: false,
    insuranceFund1: normalizeBigNumberish(10000),
    insuranceFund2: normalizeBigNumberish(10000),
    markPrice: normalizeBigNumberish(100),
    indexPrice: normalizeBigNumberish(100),
    accumulatedFundingPerContract: normalizeBigNumberish(1),
    fundingTime: Date.now() / 1000,
  }
}

export async function getPerpetualStorage(
  perpetual: Perpetual
): Promise<PerpetualStorage> {
  const result = await Promise.all([
    perpetual.information(),
    perpetual.shareToken(),
    perpetual.callStatic.state(),
    perpetual.callStatic.fundingState(),
  ])
 
  return {
    // perpetual gov
    underlyingSymbol: result[0].underlyingAsset,
    collateralTokenAddress: result[0].collateral,
    shareTokenAddress: result[1],
    oracleAddress: result[0].oracle,
    initialMarginRate: normalizeBigNumberish(result[0].coreParameter[0]).shiftedBy(-DECIMALS),
    maintenanceMarginRate: normalizeBigNumberish(result[0].coreParameter[1]).shiftedBy(-DECIMALS),
    operatorFeeRate: normalizeBigNumberish(result[0].coreParameter[2]).shiftedBy(-DECIMALS),
    vaultFeeRate: normalizeBigNumberish(result[0].coreParameter[3]).shiftedBy(-DECIMALS),
    lpFeeRate: normalizeBigNumberish(result[0].coreParameter[4]).shiftedBy(-DECIMALS),
    referrerRebateRate: normalizeBigNumberish(result[0].coreParameter[5]).shiftedBy(-DECIMALS),
    liquidatorPenaltyRate: normalizeBigNumberish(result[0].coreParameter[6]).shiftedBy(-DECIMALS),
    keeperGasReward: normalizeBigNumberish(result[0].coreParameter[7]).shiftedBy(-DECIMALS),

    // amm gov
    halfSpreadRate: normalizeBigNumberish(result[0].riskParameter[0]).shiftedBy(-DECIMALS),
    beta1: normalizeBigNumberish(result[0].riskParameter[1]).shiftedBy(-DECIMALS),
    beta2: normalizeBigNumberish(result[0].riskParameter[2]).shiftedBy(-DECIMALS),
    fundingRateCoefficient: normalizeBigNumberish(result[0].riskParameter[3]).shiftedBy(-DECIMALS),
    targetLeverage: normalizeBigNumberish(result[0].riskParameter[4]).shiftedBy(-DECIMALS),

    // state
    isEmergency: result[2].isEmergency,
    isGlobalSettled: result[2].isShuttingdown,
    insuranceFund1: normalizeBigNumberish(result[2].insuranceFund).shiftedBy(-DECIMALS),
    insuranceFund2: normalizeBigNumberish(result[2].donatedInsuranceFund).shiftedBy(-DECIMALS),
    markPrice: normalizeBigNumberish(result[2].markPrice).shiftedBy(-DECIMALS),
    indexPrice: normalizeBigNumberish(result[2].indexPrice).shiftedBy(-DECIMALS),
    accumulatedFundingPerContract: normalizeBigNumberish(result[3].unitAccumulativeFunding).shiftedBy(-DECIMALS),
    fundingTime: result[3].fundingTime.toNumber(),
  }
}

export async function getAccountStorageMock(
  perpetual: Perpetual,
  userAddress: string
): Promise<AccountStorage> {
  perpetual // just ref
  userAddress // just ref

  return {
    cashBalance: normalizeBigNumberish(1000000),
    entryFundingLoss: normalizeBigNumberish(10),
    entryValue: normalizeBigNumberish(1000),
    positionAmount: normalizeBigNumberish(10)
  }
}

export async function getAccountStorage(
  perpetual: Perpetual,
  userAddress: string
): Promise<AccountStorage> {
  const marginAccount = await perpetual.marginAccount(userAddress)
 
  return {
    cashBalance: normalizeBigNumberish(marginAccount.cashBalance).shiftedBy(-DECIMALS),
    positionAmount: normalizeBigNumberish(marginAccount.positionAmount).shiftedBy(-DECIMALS),
    entryFundingLoss: normalizeBigNumberish(marginAccount.entryFundingLoss).shiftedBy(-DECIMALS),
    entryValue: null,
  }
}

export async function getBrokerRelayBalanceOf(
  brokerRelay: BrokerRelay,
  trader: string,
): Promise<BigNumber> {
  getAddress(trader)
  const balance = await brokerRelay.balanceOf(trader)
  return normalizeBigNumberish(balance).shiftedBy(-DECIMALS)
}
