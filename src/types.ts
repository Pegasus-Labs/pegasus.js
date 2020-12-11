import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'
import { Provider } from "@ethersproject/providers"

export type BigNumberish = BigNumber | ethers.BigNumber | string | number

export type SignerOrProvider = ethers.Signer | Provider

/**
 * Indicates that the AMM has insufficient reserves for a desired amount.
 * I.e. if the trade completes, the margin of the AMM will be not enough.
 */
export class InsufficientLiquidityError extends Error {
  public readonly isInsufficientLiquidityError: true = true

  public constructor(message: string) {
    super()
    this.name = message
  }
}

/**
 * Indicates that calling convention error or bugs happened.
 */
export class BugError extends Error {
  public constructor(message: string) {
    super()
    this.name = message
  }
}

export interface PerpetualContract {
  contract: ethers.Contract
}

export enum MarketState {
  INIT,
  NORMAL,
  EMERGENCY,
  CLEARED,
}

export interface LiquidityPoolStorage {
  collateralTokenAddress: string
  shareTokenAddress: string

  ammCashBalance: BigNumber
  fundingTime: number

  markets: { [marketID: string]: MarketStorage }
}

export interface MarketStorage {
  oracleAddress: string
  underlyingSymbol: string
  initialMarginRate: BigNumber
  maintenanceMarginRate: BigNumber
  operatorFeeRate: BigNumber
  vaultFeeRate: BigNumber
  lpFeeRate: BigNumber
  referrerRebateRate: BigNumber
  liquidatorPenaltyRate: BigNumber
  keeperGasReward: BigNumber

  state: MarketState
  markPrice: BigNumber
  indexPrice: BigNumber
  accumulatedFundingPerContract: BigNumber
  insuranceFund1: BigNumber
  insuranceFund2: BigNumber

  halfSpread: BigNumber
  beta1: BigNumber
  beta2: BigNumber
  fundingRateCoefficient: BigNumber
  maxLeverage: BigNumber

  ammPositionAmount: BigNumber
}

export interface AccountStorage {
  cashBalance: BigNumber
  positionAmount: BigNumber
  
  // read from the graph
  entryValue: BigNumber | null
  entryFunding: BigNumber | null
}

export interface AccountComputed {
  positionValue: BigNumber
  positionMargin: BigNumber
  maintenanceMargin: BigNumber
  availableCashBalance: BigNumber // cash - accumulatedFunding * pos
  marginBalance: BigNumber // cash + i pos - accumulatedFunding * pos
  availableMargin: BigNumber
  maxWithdrawable: BigNumber
  withdrawableBalance: BigNumber
  isSafe: boolean
  leverage: BigNumber
  
  entryPrice: BigNumber | null
  fundingPNL: BigNumber | null // entryFunding - pos * accumulatedFunding
  pnl1: BigNumber | null // pos * (exitPrice - entryPrice) if entry != null
  pnl2: BigNumber | null // pnl1 + funding if entry != null
  roe: BigNumber | null
  liquidationPrice: BigNumber
}

export interface AccountDetails {
  accountStorage: AccountStorage
  accountComputed: AccountComputed
}

export interface TradeCost {
  account: AccountDetails
  marginCost: BigNumber
  fee: BigNumber
}

export interface AMMTradingContext {
  // current trading market
  index: BigNumber // P_i_m
  position1: BigNumber // N_m
  halfSpread: BigNumber // α_m
  beta1: BigNumber // β1_m
  beta2: BigNumber // β2_m
  fundingRateCoefficient: BigNumber // γ_m
  maxLeverage: BigNumber // λ_m

  // other markets
  otherIndex: BigNumber[] // P_i_j
  otherPosition: BigNumber[] // N_j
  otherHalfSpread: BigNumber[] // α_j
  otherBeta1: BigNumber[] // β1_j
  otherBeta2: BigNumber[] // β2_j
  otherFundingRateCoefficient: BigNumber[] // γ_j
  otherMaxLeverage: BigNumber[] // λ_j
  
  // total
  cash: BigNumber // M_c
  poolMargin: BigNumber // M

  // trading result
  deltaMargin: BigNumber // cash2 - cash1
  deltaPosition: BigNumber // position2 - position1

  // eager evaluation
  marginBalanceWithoutCurrent: BigNumber // Σ_j (P_i_j * N_j) where j ≠ id
  squareValueWithoutCurrent: BigNumber // Σ_j (β1_j * P_i_j * N_j ^ 2) where j ≠ id
  positionMarginWithoutCurrent: BigNumber // Σ_j (P_i_j * | N_j | / λ_j) where j ≠ id
}

export interface TradingContext {
  takerAccount: AccountStorage
  lpFee: BigNumber
  vaultFee: BigNumber
  operatorFee: BigNumber
  tradingPrice: BigNumber
}
