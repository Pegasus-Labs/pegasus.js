import { ethers } from 'ethers'
import { getAddress } from '@ethersproject/address'
import { BigNumber } from 'bignumber.js'
import { normalizeBigNumberish } from './utils'
import { _0, DECIMALS, CHAIN_ID_TO_READER_ADDRESS } from './constants'
import { AccountStorage, LiquidityPoolStorage, PerpetualState, PerpetualID } from './types'
import { InvalidArgumentError, BugError, SignerOrProvider } from './types'
import { Broker } from './abi/Broker'
import { BrokerFactory } from './abi/BrokerFactory'
import { LiquidityPool } from './abi/LiquidityPool'
import { LiquidityPoolFactory } from './abi/LiquidityPoolFactory'
import { PoolCreator } from './abi/PoolCreator'
import { PoolCreatorFactory } from './abi/PoolCreatorFactory'
import { Reader } from './abi/Reader'
import { ReaderFactory } from './abi/ReaderFactory'
import { SymbolService } from './abi/SymbolService'
import { SymbolServiceFactory } from './abi/SymbolServiceFactory'
import { LpGovernor } from './abi/LpGovernor'
import { LpGovernorFactory } from './abi/LpGovernorFactory'

export function getLiquidityPoolContract(contractAddress: string, signerOrProvider: SignerOrProvider): LiquidityPool {
  getAddress(contractAddress)
  return LiquidityPoolFactory.connect(contractAddress, signerOrProvider)
}

export function getBrokerContract(contractAddress: string, signerOrProvider: SignerOrProvider): Broker {
  getAddress(contractAddress)
  return BrokerFactory.connect(contractAddress, signerOrProvider)
}

export function getPoolCreatorContract(contractAddress: string, signerOrProvider: SignerOrProvider): PoolCreator {
  getAddress(contractAddress)
  return PoolCreatorFactory.connect(contractAddress, signerOrProvider)
}

export function getSymbolServiceContract(contractAddress: string, signerOrProvider: SignerOrProvider): SymbolService {
  getAddress(contractAddress)
  return SymbolServiceFactory.connect(contractAddress, signerOrProvider)
}

export function getLpGovernorContract(contractAddress: string, signerOrProvider: SignerOrProvider): LpGovernor {
  getAddress(contractAddress)
  return LpGovernorFactory.connect(contractAddress, signerOrProvider)
}

export async function getReaderContract(signerOrProvider: SignerOrProvider, contractAddress?: string): Promise<Reader> {
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

export async function getLiquidityPool(reader: Reader, liquidityPoolAddress: string): Promise<LiquidityPoolStorage> {
  getAddress(liquidityPoolAddress)
  const { isSynced, pool } = await reader.callStatic.getLiquidityPoolStorage(liquidityPoolAddress)
  const ret: LiquidityPoolStorage = {
    isSynced,
    isRunning: pool.isRunning,
    isFastCreationEnabled: pool.isFastCreationEnabled,
    creator: pool.addresses[0],
    operator: pool.addresses[1],
    transferringOperator: pool.addresses[2],
    governor: pool.addresses[3],
    shareToken: pool.addresses[4],
    collateral: pool.addresses[5],
    vault: pool.addresses[6],
    vaultFeeRate: normalizeBigNumberish(pool.vaultFeeRate).shiftedBy(-DECIMALS),
    poolCashBalance: normalizeBigNumberish(pool.poolCash).shiftedBy(-DECIMALS),
    collateralDecimals: pool.collateralDecimals.toNumber(),
    fundingTime: pool.fundingTime.toNumber(),
    perpetuals: new Map()
  }
  pool.perpetuals.forEach((m, i) => {
    if (m.state < PerpetualState.INVALID || m.state > PerpetualState.CLEARED) {
      throw new Error(`unrecognized perpetual state: ${m.state}`)
    }
    const parsePerpNums = (index: number) => {
      return normalizeBigNumberish(m.nums[index]).shiftedBy(-DECIMALS)
    }
    ret.perpetuals.set(i, {
      state: m.state as PerpetualState,
      oracle: m.oracle,

      totalCollateral: parsePerpNums(0),
      markPrice: parsePerpNums(1),
      indexPrice: parsePerpNums(2),
      unitAccumulativeFunding: parsePerpNums(4),

      initialMarginRate: parsePerpNums(5),
      maintenanceMarginRate: parsePerpNums(6),
      operatorFeeRate: parsePerpNums(7),
      lpFeeRate: parsePerpNums(8),
      referrerRebateRate: parsePerpNums(9),
      liquidationPenaltyRate: parsePerpNums(10),
      keeperGasReward: parsePerpNums(11),
      insuranceFundRate: parsePerpNums(12),
      insuranceFundCap: parsePerpNums(13),
      insuranceFund: parsePerpNums(14),
      donatedInsuranceFund: parsePerpNums(15),

      halfSpread: {
        value: parsePerpNums(16),
        minValue: parsePerpNums(17),
        maxValue: parsePerpNums(18)
      },
      openSlippageFactor: {
        value: parsePerpNums(19),
        minValue: parsePerpNums(20),
        maxValue: parsePerpNums(21)
      },
      closeSlippageFactor: {
        value: parsePerpNums(22),
        minValue: parsePerpNums(23),
        maxValue: parsePerpNums(24)
      },
      fundingRateLimit: {
        value: parsePerpNums(25),
        minValue: parsePerpNums(26),
        maxValue: parsePerpNums(27)
      },
      ammMaxLeverage: {
        value: parsePerpNums(28),
        minValue: parsePerpNums(29),
        maxValue: parsePerpNums(30)
      },
      maxClosePriceDiscount: {
        value: parsePerpNums(31),
        minValue: parsePerpNums(32),
        maxValue: parsePerpNums(33)
      },

      symbol: m.symbol.toNumber(),
      underlyingSymbol: m.underlyingAsset,
      isMarketClosed: m.isMarketClosed,
      ammCashBalance: normalizeBigNumberish(m.ammCashBalance).shiftedBy(-DECIMALS),
      ammPositionAmount: normalizeBigNumberish(m.ammPositionAmount).shiftedBy(-DECIMALS)
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
  const { marginAccount } = await reader.callStatic.getAccountStorage(
    liquidityPoolAddress,
    perpetualIndex,
    traderAddress
  )
  return {
    cashBalance: normalizeBigNumberish(marginAccount.cash).shiftedBy(-DECIMALS),
    positionAmount: normalizeBigNumberish(marginAccount.position).shiftedBy(-DECIMALS),
    entryValue: null,
    entryFunding: null
  }
}

export async function getBrokerBalanceOf(broker: Broker, trader: string): Promise<BigNumber> {
  getAddress(trader)
  const balance = await broker.balanceOf(trader)
  return normalizeBigNumberish(balance).shiftedBy(-DECIMALS)
}

export async function listActivatePerpetualsOfTrader(poolCreator: PoolCreator, trader: string): Promise<PerpetualID[]> {
  getAddress(trader)
  const count = (await poolCreator.getActiveLiquidityPoolCountOf(trader)).toNumber()
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
        perpetualIndex: j.perpetualIndex.toNumber()
      })
    })
  }
  return ret
}

export async function listLiquidityPoolOfOperator(poolCreator: PoolCreator, operator: string): Promise<string[]> {
  getAddress(operator)
  const count = (await poolCreator.getOwnedLiquidityPoolsCountOf(operator)).toNumber()
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

export async function getPerpetualClearProgress(
  liquidityPool: LiquidityPool,
  perpetualIndex: number
): Promise<{
  left: BigNumber
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
