import { AccountStorage, BugError, InvalidArgumentError, LiquidityPoolStorage, MarketTuple } from './types'
import { BrokerRelay } from './wrapper/BrokerRelay'
import { BrokerRelayFactory } from './wrapper/BrokerRelayFactory'
import { LiquidityPool } from './wrapper/LiquidityPool'
import { LiquidityPoolFactory } from './wrapper/LiquidityPoolFactory'
import { PoolFactory } from './wrapper/PoolFactory'
import { PoolFactoryFactory } from './wrapper/PoolFactoryFactory'
import { SignerOrProvider } from './types'
import { ethers } from 'ethers'
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

export function getPoolFactoryContract(
  contractAddress: string,
  signerOrProvider: SignerOrProvider
): PoolFactory {
  return PoolFactoryFactory.connect(contractAddress, signerOrProvider)
}

export async function getLiquidityPool(
  liquidityPool: LiquidityPool
): Promise<LiquidityPoolStorage> {
  const poolData = await Promise.all([
    liquidityPool.liquidityPoolInfo(),
    liquidityPool.shareToken(),
    liquidityPool.governor(),
  ])
  let pool = {
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

    markets: [],
  }

  const marketCount = poolData[0].marketCount.toNumber()
  if (marketCount > 10000) {
    throw new BugError(`market count is too large: ${marketCount}`)
  }

  

  // liquidityPool.callStatic.state(),
  // liquidityPool.callStatic.fundingState(),


  {
    vaultFeeRate: BigNumber;
    insuranceFund: BigNumber;
    insuranceFundCap: BigNumber;
    donatedInsuranceFund: BigNumber;
    totalClaimableFee: BigNumber;
    poolCashBalance: BigNumber;
    fundingTime: BigNumber;
    priceUpdateTime: BigNumber;
    marketCount: BigNumber;


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
    liquidationPenaltyRate: normalizeBigNumberish(result[0].coreParameter[6]).shiftedBy(-DECIMALS),
    keeperGasReward: normalizeBigNumberish(result[0].coreParameter[7]).shiftedBy(-DECIMALS),

    // amm gov
    halfSpread: normalizeBigNumberish(result[0].riskParameter[0]).shiftedBy(-DECIMALS),
    openSlippageFactor: normalizeBigNumberish(result[0].riskParameter[1]).shiftedBy(-DECIMALS),
    closeSlippageFactor: normalizeBigNumberish(result[0].riskParameter[2]).shiftedBy(-DECIMALS),
    fundingRateLimit: normalizeBigNumberish(result[0].riskParameter[3]).shiftedBy(-DECIMALS),
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

  return pool
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
