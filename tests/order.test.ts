import BigNumber from 'bignumber.js'
import { computeAccount } from '../src/computation'
import { _0 } from '../src/constants'
import { orderAvailable, orderCost, orderSideAvailable } from '../src/order'
import { AccountStorage, LiquidityPoolStorage, Order, PerpetualState, PerpetualStorage } from '../src/types'
import { extendExpect } from './helper'

extendExpect()

const defaultPool: LiquidityPoolStorage = {
  isSynced: true,
  isRunning: true,
  isFastCreationEnabled: false,
  insuranceFundCap: new BigNumber(10000),

  collateralDecimals: 18,
  transferringOperator: '0x0',
  creator: '0x0',
  operator: '0x0',
  collateral: '0x0',
  vault: '0x0',
  governor: '0x0',
  shareToken: '0x0',

  vaultFeeRate: new BigNumber(0.0002),
  poolCashBalance: _0, // set me later
  fundingTime: 1579601290,
  operatorExpiration: 1579601290,
  insuranceFund: _0,
  donatedInsuranceFund: _0,

  perpetuals: new Map() // set me later
}

const perpetual1: PerpetualStorage = {
  symbol: 0,
  underlyingSymbol: 'T',
  isMarketClosed: false,
  state: PerpetualState.NORMAL,
  oracle: '0x0',
  totalCollateral: _0,

  markPrice: new BigNumber(6965),
  indexPrice: new BigNumber(7000),
  fundingRate: _0, // useless
  unitAccumulativeFunding: new BigNumber('9.9059375'),

  initialMarginRate: new BigNumber(0.1),
  maintenanceMarginRate: new BigNumber(0.05),
  operatorFeeRate: new BigNumber(0.0001),
  lpFeeRate: new BigNumber(0.0007),
  referrerRebateRate: new BigNumber(0.0),
  liquidationPenaltyRate: new BigNumber(0.005),
  keeperGasReward: new BigNumber(1),
  insuranceFundRate: new BigNumber(0.0001),
  openInterest: new BigNumber('10'),
  maxOpenInterestRate: new BigNumber('100'),

  halfSpread: { value: new BigNumber(0.001), minValue: _0, maxValue: _0 },
  openSlippageFactor: { value: new BigNumber('0.0142857142857142857142857142857'), minValue: _0, maxValue: _0 },
  closeSlippageFactor: { value: new BigNumber('0.0128571428571428571428571428571'), minValue: _0, maxValue: _0 },
  fundingRateFactor: { value: new BigNumber(0.005), minValue: _0, maxValue: _0 },
  fundingRateLimit: { value: new BigNumber(0.005), minValue: _0, maxValue: _0 },
  ammMaxLeverage: { value: new BigNumber(5), minValue: _0, maxValue: _0 },
  maxClosePriceDiscount: { value: new BigNumber(0.05), minValue: _0, maxValue: _0 },
  defaultTargetLeverage: { value: new BigNumber(10), minValue: _0, maxValue: _0 },

  ammCashBalance: _0, // assign me later
  ammPositionAmount: _0 // assign me later
}

const TEST_MARKET_INDEX0 = 0

// AMM status is not important
const poolStorage1: LiquidityPoolStorage = {
  ...defaultPool,
  poolCashBalance: new BigNumber('83941.29865625'),
  perpetuals: new Map([
    [
      TEST_MARKET_INDEX0,
      {
        ...perpetual1,
        ammPositionAmount: new BigNumber('2.3')
      }
    ]
  ])
}

const accountStorage0: AccountStorage = {
  cashBalance: new BigNumber('1000'),
  positionAmount: _0,
  targetLeverage: new BigNumber('2'),
  entryValue: _0,
  entryFunding: _0
}

const accountStorage1: AccountStorage = {
  cashBalance: new BigNumber('7698.86'), // 10000 - 2300.23 + (-0.91)
  positionAmount: new BigNumber('2.3'),
  targetLeverage: new BigNumber('2'),
  entryValue: new BigNumber('2300.23'),
  entryFunding: new BigNumber('-0.91')
}

describe('orderCost', function() {
  it('empty order book. close only', function() {
    const walletBalance = _0
    const orders: Order[] = []
    const newOrder: Order = {
      limitPrice: new BigNumber('6900'),
      amount: new BigNumber('-1')
    }
    const oldAvailable = orderAvailable(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, walletBalance, orders)
    const cost = orderCost(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, walletBalance, orders, oldAvailable, newOrder)
    expect(cost).toApproximate(_0)

    // marginBalance = 23695.57634375, fee = 6.9, | loss | = (6965 - 6900) * 1 = 65
    // withdraw = marginBalance * | Δpos / pos | - | loss | - fee = 10230.5244972826086956521739130
    const marginBalance = computeAccount(poolStorage1, TEST_MARKET_INDEX0, accountStorage1).accountComputed.marginBalance
    const targetLeverage = accountStorage1.targetLeverage
    const details = orderSideAvailable(poolStorage1, TEST_MARKET_INDEX0, marginBalance,
      accountStorage1.positionAmount, targetLeverage, walletBalance, orders.concat(newOrder))
    expect(details.remainPosition).toApproximate(new BigNumber('1.3'))
    expect(details.remainMargin).toApproximate(new BigNumber('13393.1518464673913043478260870')) // marginBalance - | loss | - fee - withdraw
    expect(details.remainWalletBalance).toApproximate(new BigNumber('10230.5244972826086956521739130')) // old + withdraw
  })

  it('empty order book. close + open. withdraw covers deposit', function() {
    const walletBalance = _0
    const orders: Order[] = []
    const newOrder: Order = {
      limitPrice: new BigNumber('6900'),
      amount: new BigNumber('-3.3')
    }
    const oldAvailable = orderAvailable(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, walletBalance, orders)
    const cost = orderCost(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, walletBalance, orders, oldAvailable, newOrder)
    expect(cost).toApproximate(_0)

    // marginBalance = 23695.57634375
    // | loss | = (6965 - 6900) * 2.3 = 149.5, withdraw = marginBalance - | loss | - closeFee = 23530.20634375
    // | loss | = (6965 - 6900) * 1 = 65, deposit = 6900 * 1 / lev + | loss | + openFee = 3521.9
    const marginBalance = computeAccount(poolStorage1, TEST_MARKET_INDEX0, accountStorage1).accountComputed.marginBalance
    const targetLeverage = accountStorage1.targetLeverage
    const details = orderSideAvailable(poolStorage1, TEST_MARKET_INDEX0, marginBalance,
      accountStorage1.positionAmount, targetLeverage, walletBalance, orders.concat(newOrder))
    expect(details.remainPosition).toApproximate(new BigNumber('0')) // fully closed. meaningless when open positions
    expect(details.remainMargin).toApproximate(new BigNumber('0')) // fully closed. meaningless when open positions
    expect(details.remainWalletBalance).toApproximate(new BigNumber('20008.30634375')) // old + withdraw - deposit
  })

  it('empty order book. close + open', function() {
    const walletBalance = _0
    const orders: Order[] = []
    const newOrder: Order = {
      limitPrice: new BigNumber('6900'),
      amount: new BigNumber('-10')
    }
    // marginBalance = 23695.57634375
    // withdraw = 23695.57634375 - (6965 - 6900)*2.3 - 6900*2.3*0.001 = 23530.20634375
    // deposit = (10 - 2.3)*6900*(1/2 + 0.001) + (6965 - 6900)*(10 - 2.3) = 27118.6
    // cost = deposit - withdraw = 3588.42
    const oldAvailable = orderAvailable(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, walletBalance, orders)
    const cost = orderCost(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, walletBalance, orders, oldAvailable, newOrder)
    expect(cost).toApproximate(new BigNumber('3588.42365625'))
  })

  it('empty order book. pos = 0 but cash > 0. open', function() {
    const walletBalance = _0
    const orders: Order[] = []
    const newOrder: Order = {
      limitPrice: new BigNumber('6900'),
      amount: new BigNumber('-10')
    }
    // deposit = 10*6900*(1/2 + 0.001) + (6965 - 6900)*10 = 35219
    // cost = deposit - 1000 = 34219
    const oldAvailable = orderAvailable(poolStorage1, TEST_MARKET_INDEX0, accountStorage0, walletBalance, orders)
    const cost = orderCost(poolStorage1, TEST_MARKET_INDEX0, accountStorage0, walletBalance, orders, oldAvailable, newOrder)
    expect(cost).toApproximate(new BigNumber('34219'))
  })
})
