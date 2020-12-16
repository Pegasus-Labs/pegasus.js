import { AccountStorage, BugError, PerpetualStorage } from './types'
import { Perpetual } from './wrapper/Perpetual'
import { PerpetualFactory } from './wrapper/PerpetualFactory'
import { BrokerRelay } from './wrapper/BrokerRelay'
import { BrokerRelayFactory } from './wrapper/BrokerRelayFactory'
import { PerpetualMaker } from './wrapper/PerpetualMaker'
import { PerpetualMakerFactory } from './wrapper/PerpetualMakerFactory'
import { SignerOrProvider } from './types'
import { normalizeBigNumberish } from './utils'
import { BigNumber } from 'bignumber.js'
import { getAddress } from "@ethersproject/address"
import { DECIMALS } from './constants'

export function getLiquidityPoolContract(
  contractAddress: string,
  signerOrProvider: SignerOrProvider
): LiquidityPool {
  return LiquidityPoolFactory.connect(contractAddress, signerOrProvider)
}

export function getBrokerRelayContract(
  contractAddress: string,
  signerOrProvider: SignerOrProvider
): BrokerRelay {
  return BrokerRelayFactory.connect(contractAddress, signerOrProvider)
}

export async function getReaderContract(
  signerOrProvider: SignerOrProvider,
  contractAddress?: string
): Promise<BrokerRelay> {
  if (!contractAddress) {
    let chainId = 0
    if (signerOrProvider instanceof ethers.Signer) {
      if (!signerOrProvider.provider) {
        throw new InvalidArgumentError('the given Signer does not have a Provider')
      }
      chainId = (await signerOrProvider.provider.getNetwork()).chainId
    } else {
      chainId = (await signerOrProvider.getNetwork()).chainId
    }
    contractAddress = CHAIN_ID_TO_READER_ADDRESS[chainId]
    if (!contractAddress) {
      throw new InvalidArgumentError(`unknown chainId ${chainId}`)
    }
  }

  return BrokerRelayFactory.connect(contractAddress, signerOrProvider)
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
    halfSpread: normalizeBigNumberish(result[0].riskParameter[0]).shiftedBy(-DECIMALS),
    beta1: normalizeBigNumberish(result[0].riskParameter[1]).shiftedBy(-DECIMALS),
    beta2: normalizeBigNumberish(result[0].riskParameter[2]).shiftedBy(-DECIMALS),
    fundingRateCoefficient: normalizeBigNumberish(result[0].riskParameter[3]).shiftedBy(-DECIMALS),
    targetLeverage: normalizeBigNumberish(result[0].riskParameter[4]).shiftedBy(-DECIMALS),

    // state
    isEmergency: result[2].isEmergency,
    isGlobalSettled: result[2].isCleared,
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
    entryFundingLoss: normalizeBigNumberish(marginAccount.entryFunding).shiftedBy(-DECIMALS),
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

export async function getActivatePerpetuals(
  perpetualMaker: PerpetualMaker,
  trader: string
): Promise<string[]> {
  getAddress(trader)
  const count = (await perpetualMaker.totalActivePerpetualCountForTrader(trader)).toNumber()
  if (count > 1000000) {
    throw new BugError(`activate perpetual count is too large: ${count}`)
  }
  let ret: string[] = []
  const step = 100
  for (let begin = 0; begin < count; begin = ret.length) {
    let end = Math.min(begin + step, count)
    const ids = await perpetualMaker.listActivePerpetualForTrader(trader, begin, end)
    ret = ret.concat(ids)
  }
  return ret
}
