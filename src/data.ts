import { ethers } from 'ethers'
import { getAddress } from "@ethersproject/address"
import { BigNumber } from 'bignumber.js'
import { normalizeBigNumberish } from './utils'
import { _0, DECIMALS, CHAIN_ID_TO_READER_ADDRESS } from './constants'
import { AccountStorage, LiquidityPoolStorage, PerpetualState, PerpetualID } from './types'
import { InvalidArgumentError, BugError, SignerOrProvider } from './types'
import { BrokerRelay } from './wrapper/BrokerRelay'
import { BrokerRelayFactory } from './wrapper/BrokerRelayFactory'
import { LiquidityPool } from './wrapper/LiquidityPool'
import { LiquidityPoolFactory } from './wrapper/LiquidityPoolFactory'
import { PoolCreator } from './wrapper/PoolCreator'
import { PoolCreatorFactory } from './wrapper/PoolCreatorFactory'
import { Reader } from './wrapper/Reader'
import { ReaderFactory } from './wrapper/ReaderFactory'

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

export function getPoolCreatorContract(
  contractAddress: string,
  signerOrProvider: SignerOrProvider
): PoolCreator {
  return PoolCreatorFactory.connect(contractAddress, signerOrProvider)
}

export async function getReaderContract(
  signerOrProvider: SignerOrProvider,
  contractAddress?: string
): Promise<Reader> {
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
  return ReaderFactory.connect(contractAddress, signerOrProvider)
}
  
export async function getLiquidityPool(
  reader: Reader,
  liquidityPoolAddress: string
): Promise<LiquidityPoolStorage> {
  const pool = await reader.callStatic.getLiquidityPoolStorage(liquidityPoolAddress)
  const ret: LiquidityPoolStorage = {
    operator: pool.operator,
    collateral: pool.collateral,
    vault: pool.vault,
    governor: pool.governor,
    shareToken: pool.shareToken,
    
    vaultFeeRate: normalizeBigNumberish(pool.vaultFeeRate).shiftedBy(-DECIMALS),
    insuranceFundCap: normalizeBigNumberish(pool.insuranceFundCap).shiftedBy(-DECIMALS),
    insuranceFund: normalizeBigNumberish(pool.insuranceFund).shiftedBy(-DECIMALS),
    donatedInsuranceFund: normalizeBigNumberish(pool.donatedInsuranceFund).shiftedBy(-DECIMALS),
    totalClaimableFee: normalizeBigNumberish(pool.totalClaimableFee).shiftedBy(-DECIMALS),
    poolCashBalance: normalizeBigNumberish(pool.poolCashBalance).shiftedBy(-DECIMALS),
    fundingTime: pool.fundingTime.toNumber(),

    perpetuals: new Map(),
  }
  pool.perpetualStorages.forEach((m, i) => {
    if (m.state < PerpetualState.INIT || m.state > PerpetualState.CLEARED) {
      throw new Error(`unrecognized perpetual state: ${m.state}`)
    }
    ret.perpetuals.set(i, {
      underlyingSymbol: m.underlyingAsset,
      state: m.state as PerpetualState,
      oracle: m.oracle,

      markPrice: normalizeBigNumberish(m.markPrice).shiftedBy(-DECIMALS),
      indexPrice: normalizeBigNumberish(m.indexPrice).shiftedBy(-DECIMALS),
      unitAccumulativeFunding: normalizeBigNumberish(m.unitAccumulativeFunding).shiftedBy(-DECIMALS),

      initialMarginRate: normalizeBigNumberish(m.initialMarginRate).shiftedBy(-DECIMALS),
      maintenanceMarginRate: normalizeBigNumberish(m.maintenanceMarginRate).shiftedBy(-DECIMALS),
      operatorFeeRate: normalizeBigNumberish(m.operatorFeeRate).shiftedBy(-DECIMALS),
      lpFeeRate: normalizeBigNumberish(m.lpFeeRate).shiftedBy(-DECIMALS),
      referrerRebateRate: normalizeBigNumberish(m.referrerRebateRate).shiftedBy(-DECIMALS),
      liquidationPenaltyRate: normalizeBigNumberish(m.liquidationPenaltyRate).shiftedBy(-DECIMALS),
      keeperGasReward: normalizeBigNumberish(m.keeperGasReward).shiftedBy(-DECIMALS),
      insuranceFundRate: normalizeBigNumberish(m.insuranceFundRate).shiftedBy(-DECIMALS),
      
      halfSpread: normalizeBigNumberish(m.halfSpread).shiftedBy(-DECIMALS),
      openSlippageFactor: normalizeBigNumberish(m.openSlippageFactor).shiftedBy(-DECIMALS),
      closeSlippageFactor: normalizeBigNumberish(m.closeSlippageFactor).shiftedBy(-DECIMALS),
      fundingRateLimit: normalizeBigNumberish(m.fundingRateLimit).shiftedBy(-DECIMALS),
      maxLeverage: normalizeBigNumberish(m.maxLeverage).shiftedBy(-DECIMALS),

      ammPositionAmount: normalizeBigNumberish(m.ammPositionAmount).shiftedBy(-DECIMALS),
    })
  })
  return ret
}

export async function getAccountStorage(
  reader: Reader,
  liquidityPoolAddress: string,
  perpetualIndex: number,  
  traderAddress: string
): Promise<AccountStorage> {
  const marginAccount = await reader.getAccountStorage(
    liquidityPoolAddress, perpetualIndex, traderAddress)
  return {
    cashBalance: normalizeBigNumberish(marginAccount.cashBalance).shiftedBy(-DECIMALS),
    positionAmount: normalizeBigNumberish(marginAccount.positionAmount).shiftedBy(-DECIMALS),
    entryValue: null,
    entryFunding: null,
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

export async function listActivatePerpetuals(
  poolCreator: PoolCreator,
  trader: string
): Promise<PerpetualID[]> {
  getAddress(trader)
  const count = (await poolCreator.activeLiquidityPoolCountOf(trader)).toNumber()
  if (count > 10000) {
    throw new BugError(`activate pool count is too large: ${count}`)
  }
  let ret: PerpetualID[] = []
  const step = 100
  for (let begin = 0; begin < count; begin = ret.length) {
    let end = Math.min(begin + step, count)
    const ids = await poolCreator.listActiveLiquidityPoolsOf(trader, begin, end)
    ids.forEach(j => {
      ret.push({
        sharedLiquidityPool: j.liquidityPool,
        perpetualIndex: j.perpetualIndex.toNumber(),
      })
    })
  }
  return ret
}
