import { AccountStorage, BugError, LiquidityPoolStorage, MarketState, MarketStorage, MarketTuple } from './types'
import { BrokerRelay } from './wrapper/BrokerRelay'
import { BrokerRelayFactory } from './wrapper/BrokerRelayFactory'
import { LiquidityPool } from './wrapper/LiquidityPool'
import { LiquidityPoolFactory } from './wrapper/LiquidityPoolFactory'
import { PoolFactory } from './wrapper/PoolFactory'
import { PoolFactoryFactory } from './wrapper/PoolFactoryFactory'
import { IOracleFactory } from './wrapper/IOracleFactory'
import { SignerOrProvider } from './types'
import { normalizeBigNumberish } from './utils'
import { BigNumber } from 'bignumber.js'
import { getAddress } from "@ethersproject/address"
import { DECIMALS } from './constants'
import { BigNumber as EthersBigNumber } from '@ethersproject/bignumber'
import { _0 } from './constants'

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

export function getPoolFactoryContract(
  contractAddress: string,
  signerOrProvider: SignerOrProvider
): PoolFactory {
  return PoolFactoryFactory.connect(contractAddress, signerOrProvider)
}

export async function getLiquidityPool(
  liquidityPool: LiquidityPool
): Promise<LiquidityPoolStorage> {
  // pool
  const poolData = await Promise.all([
    liquidityPool.liquidityPoolInfo(),
    liquidityPool.shareToken(),
    liquidityPool.governor(),
  ])
  const marketCount = poolData[0].marketCount.toNumber()
  let pool: LiquidityPoolStorage = {
    operatorAddress: poolData[0].operator,
    collateralTokenAddress: poolData[0].collateral,
    shareTokenAddress: poolData[1],
    governorAddress: poolData[2],
    vaultAddress: poolData[0].vault,

    vaultFeeRate: normalizeBigNumberish(poolData[0].vaultFeeRate).shiftedBy(-DECIMALS),
    insuranceFund: normalizeBigNumberish(poolData[0].insuranceFund).shiftedBy(-DECIMALS),
    insuranceFundCap: normalizeBigNumberish(poolData[0].insuranceFundCap).shiftedBy(-DECIMALS),
    donatedInsuranceFund: normalizeBigNumberish(poolData[0].donatedInsuranceFund).shiftedBy(-DECIMALS),
    totalClaimableFee: normalizeBigNumberish(poolData[0].totalClaimableFee).shiftedBy(-DECIMALS),
    poolCashBalance: normalizeBigNumberish(poolData[0].poolCashBalance).shiftedBy(-DECIMALS),
    fundingTime: poolData[0].fundingTime.toNumber(),

    markets: await readMarkets(liquidityPool, marketCount),
  }
  return pool
}

export async function readMarkets(
  liquidityPool: LiquidityPool,
  marketCount: number
): Promise<{ [marketIndex: number]: MarketStorage }> {
  if (marketCount > 10000) {
    throw new BugError(`market count is too large: ${marketCount}`)
  }
  const marketsInfoPromise: Promise<MarketInfoAbi>[] = []
  for (let i = 0; i < marketCount; i++) {
    marketsInfoPromise.push(liquidityPool.callStatic.marketInfo(i))
  }
  const marketsInfo = await Promise.all(marketsInfoPromise)
  const markets: { [marketIndex: number]: MarketStorage } = {}
  marketsInfo.forEach((market, i) => {
    if (market.state < MarketState.INIT || market.state > MarketState.CLEARED) {
      throw new Error(`unrecognized market state: ${market.state}`)
    }
    markets[i] = {
      oracleAddress: market.oracle,
      underlyingSymbol: "", // assigned later
      initialMarginRate: normalizeBigNumberish(market.coreParameters[0]).shiftedBy(-DECIMALS),
      maintenanceMarginRate: normalizeBigNumberish(market.coreParameters[1]).shiftedBy(-DECIMALS),
      operatorFeeRate: normalizeBigNumberish(market.coreParameters[2]).shiftedBy(-DECIMALS),
      lpFeeRate: normalizeBigNumberish(market.coreParameters[3]).shiftedBy(-DECIMALS),
      referrerRebateRate: normalizeBigNumberish(market.coreParameters[4]).shiftedBy(-DECIMALS),
      liquidationPenaltyRate: normalizeBigNumberish(market.coreParameters[5]).shiftedBy(-DECIMALS),
      keeperGasReward: normalizeBigNumberish(market.coreParameters[6]).shiftedBy(-DECIMALS),
      insuranceFundRate: normalizeBigNumberish(market.coreParameters[7]).shiftedBy(-DECIMALS),

      state: market.state as MarketState,
      markPrice: normalizeBigNumberish(market.markPrice).shiftedBy(-DECIMALS),
      indexPrice: normalizeBigNumberish(market.indexPrice).shiftedBy(-DECIMALS),
      unitAccumulativeFunding: normalizeBigNumberish(market.unitAccumulativeFunding).shiftedBy(-DECIMALS),
      
      halfSpread: normalizeBigNumberish(market.riskParameters[0]).shiftedBy(-DECIMALS),
      openSlippageFactor: normalizeBigNumberish(market.riskParameters[1]).shiftedBy(-DECIMALS),
      closeSlippageFactor: normalizeBigNumberish(market.riskParameters[2]).shiftedBy(-DECIMALS),
      fundingRateLimit: normalizeBigNumberish(market.riskParameters[3]).shiftedBy(-DECIMALS),
      maxLeverage: normalizeBigNumberish(market.riskParameters[4]).shiftedBy(-DECIMALS),

      ammPositionAmount: _0, // assigned later
    }
  })

  // underlying symbol
  const oracleInfoPromise: Promise<string>[] = []
  for (let i = 0; i < marketCount; i++) {
    const oracle = IOracleFactory.connect(pool.markets[i].oracleAddress, liquidityPool.provider)
    oracleInfoPromise.push(oracle.underlyingAsset())
  }
  const oracleInfo = await Promise.all(oracleInfo)
  oracleInfo.forEach((symbol, i) => {
    pool.markets[i].underlyingSymbol = symbol
  })

  return markets
}

export async function readUnderlyingSymbol(
  liquidityPool: LiquidityPool,
  markets: MarketStorage[]
): Promise<string[]> {
  const symbols = await Promise.all(
    markets.map(m => {
      const oracle = IOracleFactory.connect(m.oracleAddress, liquidityPool.provider)
      return oracle.underlyingAsset()
    })
  )
  return symbols
}

export async function readAMMPositions(
  liquidityPool: LiquidityPool,
  
  markets: MarketStorage[]
): Promise<BigNumber[]> {
  const positions = await Promise.all(
    markets.map((m, i) => {
      const account = liquidityPool.marginAccount(i, ) oracle.underlyingAsset()
    })
  )
  return positions
}

export async function getAccountStorage(
  liquidityPool: LiquidityPool,
  marketIndex: number,  
  userAddress: string
): Promise<AccountStorage> {
  const marginAccount = await liquidityPool.marginAccount(marketIndex, userAddress)

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
  poolFactory: PoolFactory,
  trader: string
): Promise<MarketTuple[]> {
  getAddress(trader)
  const count = (await poolFactory.activeSharedLiquidityPoolCountOf(trader)).toNumber()
  if (count > 10000) {
    throw new BugError(`activate pool count is too large: ${count}`)
  }
  let ret: MarketTuple[] = []
  const step = 100
  for (let begin = 0; begin < count; begin = ret.length) {
    let end = Math.min(begin + step, count)
    const ids = await poolFactory.listActiveSharedLiquidityPoolsOf(trader, begin, end)
    ids.forEach(j => {
      ret.push({
        sharedLiquidityPool: j.sharedLiquidityPool,
        marketIndex: j.marketIndex.toNumber(),
      })
    })
  }
  return ret
}

interface MarketInfoAbi {
  state: number;
  oracle: string;
  markPrice: EthersBigNumber;
  indexPrice: EthersBigNumber;
  unitAccumulativeFunding: EthersBigNumber;
  fundingRate: EthersBigNumber;
  coreParameters: [ EthersBigNumber, EthersBigNumber, EthersBigNumber, EthersBigNumber, EthersBigNumber, EthersBigNumber, EthersBigNumber, EthersBigNumber ];
  riskParameters: [ EthersBigNumber, EthersBigNumber, EthersBigNumber, EthersBigNumber, EthersBigNumber ];
  0: number; 1: string; 2: EthersBigNumber; 3: EthersBigNumber; 4: EthersBigNumber; 5: EthersBigNumber;
  6: [ EthersBigNumber, EthersBigNumber, EthersBigNumber, EthersBigNumber, EthersBigNumber, EthersBigNumber, EthersBigNumber, EthersBigNumber ];
  7: [EthersBigNumber, EthersBigNumber, EthersBigNumber, EthersBigNumber, EthersBigNumber];
}
