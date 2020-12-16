import { AccountStorage, BugError, InvalidArgumentError, LiquidityPoolStorage } from './types'
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

export async function getPerpetualStorage(
  perpetual: Perpetual
): Promise<LiquidityPoolStorage> {
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
}

// export async function getAccountStorage(
//   perpetual: Perpetual,
//   userAddress: string
// ): Promise<AccountStorage> {
//   const marginAccount = await perpetual.marginAccount(userAddress)
 
//   return {
//     cashBalance: normalizeBigNumberish(marginAccount.cashBalance).shiftedBy(-DECIMALS),
//     positionAmount: normalizeBigNumberish(marginAccount.positionAmount).shiftedBy(-DECIMALS),
//     entryValue: null,
//     entryFunding: null,
//   }
// }

export async function getBrokerRelayBalanceOf(
  brokerRelay: BrokerRelay,
  trader: string,
): Promise<BigNumber> {
  getAddress(trader)
  const balance = await brokerRelay.balanceOf(trader)
  return normalizeBigNumberish(balance).shiftedBy(-DECIMALS)
}

export async function listActivatePerpetuals(
  liquidityPool: LiquidityPool,
  trader: string
): Promise<string[]> {

  ILiquidityPool(liquidityPool).activeAccountCount(marketIndex);

  getAddress(trader)
  const count = (await liquidityPool.totalActivePerpetualCountForTrader(trader)).toNumber()
  if (count > 1000000) {
    throw new BugError(`activate perpetual count is too large: ${count}`)
  }
  let ret: string[] = []
  const step = 100
  for (let begin = 0; begin < count; begin = ret.length) {
    let end = Math.min(begin + step, count)
    const ids = await liquidityPool.listActivePerpetualForTrader(trader, begin, end)
    ret = ret.concat(ids)

    ILiquidityPool pool = ILiquidityPool(liquidityPool);
        address[] memory accounts = pool.listActiveAccounts(marketIndex, begin, end);
        uint256 count = accounts.length;
        marginAccounts = new MarginAccount[](count);
        for (uint256 i = 0; i < count; i++) {
            (marginAccounts[i].cashBalance, marginAccounts[i].positionAmount) = pool.marginAccount(
                marketIndex,
                accounts[i]
            );
        }
  }
  return ret
}

export async function listActivateAccount(
  liquidityPool: LiquidityPool,
  market
  trader: string
): Promise<string[]> {
  liquidityPool

  ILiquidityPool(liquidityPool).activeAccountCount(marketIndex);

  getAddress(trader)
  const count = (await liquidityPool.activeAccountCount(trader)).toNumber()
  if (count > 1000000) {
    throw new BugError(`activate perpetual count is too large: ${count}`)
  }
  let ret: string[] = []
  const step = 100
  for (let begin = 0; begin < count; begin = ret.length) {
    let end = Math.min(begin + step, count)
    const ids = await liquidityPool.listActiveAccounts(trader, begin, end)
    ret = ret.concat(ids)
    
    ILiquidityPool pool = ILiquidityPool(liquidityPool);
        address[] memory accounts = pool.listActiveAccounts(marketIndex, begin, end);
        uint256 count = accounts.length;
        marginAccounts = new MarginAccount[](count);
        for (uint256 i = 0; i < count; i++) {
            (marginAccounts[i].cashBalance, marginAccounts[i].positionAmount) = pool.marginAccount(
                marketIndex,
                accounts[i]
            );
        }
  }
  return ret
}
