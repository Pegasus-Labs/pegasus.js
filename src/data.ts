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
import { SymbolService } from './wrapper/SymbolService'
import { SymbolServiceFactory } from './wrapper/SymbolServiceFactory'

export function getLiquidityPoolContract(
  contractAddress: string,
  signerOrProvider: SignerOrProvider
): LiquidityPool {
  getAddress(contractAddress)
  return LiquidityPoolFactory.connect(contractAddress, signerOrProvider)
}

export function getBrokerRelayContract(
  contractAddress: string,
  signerOrProvider: SignerOrProvider
): BrokerRelay {
  getAddress(contractAddress)
  return BrokerRelayFactory.connect(contractAddress, signerOrProvider)
}

export function getPoolCreatorContract(
  contractAddress: string,
  signerOrProvider: SignerOrProvider
): PoolCreator {
  getAddress(contractAddress)
  return PoolCreatorFactory.connect(contractAddress, signerOrProvider)
}

export function getSymbolServiceContract(
  contractAddress: string,
  signerOrProvider: SignerOrProvider
): SymbolService {
  getAddress(contractAddress)
  return SymbolServiceFactory.connect(contractAddress, signerOrProvider)
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
  getAddress(liquidityPoolAddress)
  const pool = await reader.callStatic.getLiquidityPoolStorage(liquidityPoolAddress)
  const ret: LiquidityPoolStorage = {
    operator: pool.operator,
    collateral: pool.collateralToken,
    vault: pool.vault,
    governor: pool.governor,
    shareToken: pool.shareToken,

    vaultFeeRate: normalizeBigNumberish(pool.vaultFeeRate).shiftedBy(-DECIMALS),
    poolCashBalance: normalizeBigNumberish(pool.poolCash).shiftedBy(-DECIMALS),
    fundingTime: pool.fundingTime.toNumber(),

    perpetuals: new Map(),
  }
  pool.perpetualStorages.forEach((m, i) => {
    if (m.state < PerpetualState.INVALID || m.state > PerpetualState.CLEARED) {
      throw new Error(`unrecognized perpetual state: ${m.state}`)
    }
    ret.perpetuals.set(i, {
      symbol: m.symbol.toNumber(),
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
      insuranceFundCap: normalizeBigNumberish(m.insuranceFundCap).shiftedBy(-DECIMALS),
      insuranceFund: normalizeBigNumberish(m.insuranceFund).shiftedBy(-DECIMALS),
      donatedInsuranceFund: normalizeBigNumberish(m.donatedInsuranceFund).shiftedBy(-DECIMALS),

      halfSpread: normalizeBigNumberish(m.halfSpread).shiftedBy(-DECIMALS),
      openSlippageFactor: normalizeBigNumberish(m.openSlippageFactor).shiftedBy(-DECIMALS),
      closeSlippageFactor: normalizeBigNumberish(m.closeSlippageFactor).shiftedBy(-DECIMALS),
      fundingRateLimit: normalizeBigNumberish(m.fundingRateLimit).shiftedBy(-DECIMALS),
      ammMaxLeverage: normalizeBigNumberish(m.ammMaxLeverage).shiftedBy(-DECIMALS),

      ammCashBalance: normalizeBigNumberish(m.ammCashBalance).shiftedBy(-DECIMALS),
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
  getAddress(liquidityPoolAddress)
  getAddress(traderAddress)
  const marginAccount = await reader.getAccountStorage(
    liquidityPoolAddress, perpetualIndex, traderAddress)
  return {
    cashBalance: normalizeBigNumberish(marginAccount.cash).shiftedBy(-DECIMALS),
    positionAmount: normalizeBigNumberish(marginAccount.position).shiftedBy(-DECIMALS),
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

export async function listActivatePerpetualsOfTrader(
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
    if (ids.length === 0) {
      break
    }
    ids.forEach(j => {
      ret.push({
        liquidityPoolAddress: j.liquidityPool,
        perpetualIndex: j.perpetualIndex.toNumber(),
      })
    })
  }
  return ret
}

export async function listLiquidityPoolOfOperator(
  poolCreator: PoolCreator,
  operator: string
): Promise<string[]> {
  getAddress(operator)
  const count = (await poolCreator.ownedLiquidityPoolsCountOf(operator)).toNumber()
  if (count > 10000) {
    throw new BugError(`activate pool count is too large: ${count}`)
  }
  let ret: string[] = []
  const step = 100
  for (let begin = 0; begin < count; begin = ret.length) {
    let end = Math.min(begin + step, count)
    const ids = await poolCreator.listLiquidityPoolOwnedBy(operator, begin, end)
    if (ids.length === 0) {
      break
    }
    ret = ret.concat(ids)
  }
  return ret
}

export async function getPerpetualSettledMarginBalance(
  liquidityPool: LiquidityPool,
  perpetualIndex: number,
  traderAddress: string
): Promise<BigNumber> {
  getAddress(traderAddress)
  const collateralAmount = await liquidityPool.callStatic.getSettleableMargin(perpetualIndex, traderAddress)
  return normalizeBigNumberish(collateralAmount).shiftedBy(-DECIMALS)
}

export async function getPerpetualClearProgress(
  liquidityPool: LiquidityPool,
  perpetualIndex: number
): Promise<{
  left: BigNumber,
  total: BigNumber
}> {
  const progressInfo = await liquidityPool.callStatic.getClearProgress(perpetualIndex)
  const left = normalizeBigNumberish(progressInfo.left)
  const total = normalizeBigNumberish(progressInfo.total)
  return { left, total }
}

export async function getPerpetualClearGasReward(
  liquidityPool: LiquidityPool,
  perpetualIndex: number
): Promise<BigNumber> {
  const perpetualInfo = await liquidityPool.callStatic.getPerpetualInfo(perpetualIndex)
  const keeperGasReward = normalizeBigNumberish(perpetualInfo.nums[10]).shiftedBy(-DECIMALS)
  return keeperGasReward
}
