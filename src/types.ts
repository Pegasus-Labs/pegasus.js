import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'
import { Provider } from '@ethersproject/providers'

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
  INVALID,
  INITIALIZING,
  NORMAL,
  EMERGENCY,
  CLEARED
}

export enum TradeFlag {
  MASK_CLOSE_ONLY = 0x80000000,
  MASK_MARKET_ORDER = 0x40000000,
  MASK_STOP_LOSS_ORDER = 0x20000000,
  MASK_TAKE_PROFIT_ORDER = 0x10000000
}

export interface PerpetualID {
  liquidityPoolAddress: string
  perpetualIndex: number
}

export interface Option {
  value: BigNumber
  minValue: BigNumber
  maxValue: BigNumber
}

export interface LiquidityPoolStorage {
  isSynced: boolean // rue if the funding state is synced to real-time data. False if error happens (oracle error, zero price etc.). In this case, trading, withdraw (if position != 0), addLiquidity, removeLiquidity will fail
  isRunning: boolean // True if the liquidity pool is running
  isFastCreationEnabled: boolean // True if the operator of the liquidity pool is allowed to create new perpetual when the liquidity pool is running
  
  creator: string
  operator: string
  transferringOperator: string
  governor: string
  shareToken: string
  collateral: string
  vault: string

  vaultFeeRate: BigNumber
  poolCashBalance: BigNumber
  
  collateralDecimals: number
  fundingTime: number
  operatorExpiration: number

  perpetuals: Map<number, PerpetualStorage>
}

export interface PerpetualStorage {
  state: PerpetualState
  oracle: string

  totalCollateral: BigNumber
  markPrice: BigNumber // markPrice = settlementPrice if it is in EMERGENCY state
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
  insuranceFundCap: BigNumber
  insuranceFund: BigNumber
  donatedInsuranceFund: BigNumber

  halfSpread: Option // α
  openSlippageFactor: Option // β1
  closeSlippageFactor: Option // β2
  fundingRateLimit: Option // γ
  ammMaxLeverage: Option // λ
  maxClosePriceDiscount: Option // δ

  symbol: number
  underlyingSymbol: string
  isMarketClosed: boolean
  ammCashBalance: BigNumber
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
  withdrawableBalance: BigNumber
  isMMSafe: boolean // use this if check liquidation
  isIMSafe: boolean // use this if open positions
  isMarginSafe: boolean // use this if close positions. also known as bankrupt
  leverage: BigNumber

  entryPrice: BigNumber | null
  fundingPNL: BigNumber | null // entryFunding - pos * accumulatedFunding
  pnl1: BigNumber | null // pos * (exitPrice - entryPrice) if entry != null
  pnl2: BigNumber | null // pnl1 + funding if entry != null
  roe: BigNumber | null

  // the estimated liquidation price helps traders to know when to close their positions.
  // it has already considered the close position trading fee. this value is different
  // from the keeper's liquidation price who does not pay the trading fee.
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
  maxClosePriceDiscount: BigNumber // δ_m
  ammMaxLeverage: BigNumber // λ_m

  // other perpetuals
  otherIndex: BigNumber[] // P_i_j
  otherPosition: BigNumber[] // N_j
  otherOpenSlippageFactor: BigNumber[] // β1_j
  otherAMMMaxLeverage: BigNumber[] // λ_j

  // total
  cash: BigNumber // M_c
  poolMargin: BigNumber // M

  // trading result
  deltaMargin: BigNumber // cash2 - cash1
  deltaPosition: BigNumber // position2 - position1
  bestAskBidPrice: BigNumber | null // best ask price or best bid price (also the price at spread)

  // eager evaluation
  valueWithoutCurrent: BigNumber // Σ_j (P_i_j * N_j) where j ≠ id
  squareValueWithoutCurrent: BigNumber // Σ_j (β1_j * P_i_j^2 * N_j^2) where j ≠ id
  positionMarginWithoutCurrent: BigNumber // Σ_j (P_i_j * | N_j | / λ_j) where j ≠ id
}

export interface AMMTradingResult {
  tradeIsSafe: boolean
  trader: AccountDetails
  newPool: LiquidityPoolStorage
  lpFee: BigNumber
  vaultFee: BigNumber
  operatorFee: BigNumber
  tradingPrice: BigNumber
}
