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

/**
 * Invalid argument or the query condition is impossible.
 */
export class InvalidArgumentError extends Error {
  public constructor(message: string) {
    super()
    this.name = message
  }
}

export enum PerpetualState {
  INIT,
  NORMAL,
  EMERGENCY,
  CLEARED,
}

export interface PerpetualID {
  sharedLiquidityPool: string
  perpetualIndex: number
}

export interface LiquidityPoolStorage {
  operator: string
  collateral: string
  vault: string
  governor: string
  shareToken: string

  vaultFeeRate: BigNumber
  insuranceFundCap: BigNumber
  insuranceFund: BigNumber
  donatedInsuranceFund: BigNumber
  totalClaimableFee: BigNumber
  poolCashBalance: BigNumber
  fundingTime: number
  
  perpetuals: Map<number, PerpetualStorage>
}

export interface PerpetualStorage {
  underlyingSymbol: string
  state: PerpetualState
  oracle: string

  markPrice: BigNumber
  indexPrice: BigNumber
  unitAccumulativeFunding: BigNumber

  initialMarginRate: BigNumber
  maintenanceMarginRate: BigNumber
  operatorFeeRate: BigNumber
  lpFeeRate: BigNumber
  referrerRebateRate: BigNumber
  liquidationPenaltyRate: BigNumber
  keeperGasReward: BigNumber
  insuranceFundRate: BigNumber
  
  halfSpread: BigNumber // α
  openSlippageFactor: BigNumber // β1
  closeSlippageFactor: BigNumber // β2
  fundingRateLimit: BigNumber // γ
  maxLeverage: BigNumber  // λ

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
  // current trading perpetual
  index: BigNumber // P_i_m
  position1: BigNumber // N_m
  halfSpread: BigNumber // α_m
  openSlippageFactor: BigNumber // β1_m
  closeSlippageFactor: BigNumber // β2_m
  fundingRateLimit: BigNumber // γ_m
  maxLeverage: BigNumber // λ_m

  // other perpetuals
  otherIndex: BigNumber[] // P_i_j
  otherPosition: BigNumber[] // N_j
  otherHalfSpread: BigNumber[] // α_j
  otherOpenSlippageFactor: BigNumber[] // β1_j
  otherCloseSlippageFactor: BigNumber[] // β2_j
  otherFundingRateCoefficient: BigNumber[] // γ_j
  otherMaxLeverage: BigNumber[] // λ_j
  
  // total
  cash: BigNumber // M_c
  poolMargin: BigNumber // M

  // trading result
  deltaMargin: BigNumber // cash2 - cash1
  deltaPosition: BigNumber // position2 - position1

  // eager evaluation
  valueWithoutCurrent: BigNumber // Σ_j (P_i_j * N_j) where j ≠ id
  squareValueWithoutCurrent: BigNumber // Σ_j (β1_j * P_i_j * N_j ^ 2) where j ≠ id
  positionMarginWithoutCurrent: BigNumber // Σ_j (P_i_j * | N_j | / λ_j) where j ≠ id
}

export interface AMMTradingResult {
  trader: AccountStorage
  newPool: LiquidityPoolStorage
  lpFee: BigNumber
  vaultFee: BigNumber
  operatorFee: BigNumber
  tradingPrice: BigNumber
}
