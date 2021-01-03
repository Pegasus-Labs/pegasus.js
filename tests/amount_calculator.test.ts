import BigNumber from 'bignumber.js'
import {
  computeAccount,
  computeTradeWithPrice,
  computeAMMTrade,
  computeAMMPrice,
} from '../src/computation'
import {
  computeMaxTradeAmountWithPrice,
  computeAMMMaxTradeAmount,
  computeAMMTradeAmountByMargin,
  computeAMMAmountWithPrice,
  computeAMMInverseVWAP,
} from '../src/amount_calculator'
import { computeAMMPoolMargin, initAMMTradingContext } from '../src/amm'
import { _0, _1 } from '../src/constants'
import {
  LiquidityPoolStorage,
  PerpetualStorage,
  AccountStorage,
  PerpetualState,
} from '../src/types'
import { normalizeBigNumberish } from '../src/utils'
import { extendExpect } from './helper'

extendExpect()

const defaultPool: LiquidityPoolStorage = {
  operator: '0x0',
  collateral: '0x0',
  vault: '0x0',
  governor: '0x0',
  shareToken: '0x0',

  vaultFeeRate: new BigNumber(0.0002),
  poolCashBalance: _0, // set me later
  fundingTime: 1579601290,

  perpetuals: new Map() // set me later
}

const perpetual1: PerpetualStorage = {
  symbol: 0,
  underlyingSymbol: 'T',
  state: PerpetualState.NORMAL,
  oracle: "0x0",

  markPrice: new BigNumber(6965),
  indexPrice: new BigNumber(7000),
  unitAccumulativeFunding: new BigNumber('9.9059375'),

  initialMarginRate: new BigNumber(0.1),
  maintenanceMarginRate: new BigNumber(0.05),
  operatorFeeRate: new BigNumber(0.0001),
  lpFeeRate: new BigNumber(0.0007),
  referrerRebateRate: new BigNumber(0.0000),
  liquidationPenaltyRate: new BigNumber(0.005),
  keeperGasReward: new BigNumber(1),
  insuranceFundRate: new BigNumber(0.0001),
  insuranceFundCap: new BigNumber(10000),
  insuranceFund: _0,
  donatedInsuranceFund: _0,

  halfSpread: new BigNumber(0.001),
  openSlippageFactor: new BigNumber(100),
  closeSlippageFactor: new BigNumber(90),
  fundingRateLimit: new BigNumber(0.005),
  ammMaxLeverage: new BigNumber(5),

  ammCashBalance: _0, // assign me later
  ammPositionAmount: _0, // assign me later
}

const TEST_MARKET_INDEX0 = 0

const poolStorage0: LiquidityPoolStorage = {
  ...defaultPool,
  poolCashBalance: new BigNumber('100000'),
  perpetuals: new Map([
    [TEST_MARKET_INDEX0, { ...perpetual1, ammPositionAmount: _0, }],
  ]),
}

// short normal
// availableCashBalance = 116095.73134375 - (9.9059375 * (-2.3)) = 116118.515
// poolMargin = 100000, 100001.8518085704069965273648933
const poolStorage1: LiquidityPoolStorage = {
  ...defaultPool,
  poolCashBalance: new BigNumber('116095.73134375'),
  perpetuals: new Map([
    [TEST_MARKET_INDEX0, { ...perpetual1, ammPositionAmount: new BigNumber('-2.3'), }],
  ]),
}


// short unsafe
// availableCashBalance = 17096.21634375 - (9.9059375 * (-2.3)) = 17119
const poolStorage3: LiquidityPoolStorage = {
  ...defaultPool,
  poolCashBalance: new BigNumber('17096.21634375'),
  perpetuals: new Map([
    [TEST_MARKET_INDEX0, { ...perpetual1, ammPositionAmount: new BigNumber('-2.3'), }],
  ]),
}

// long normal
// availableCashBalance = 83941.29865625 - (9.9059375 * 2.3) = 83918.515
// poolMargin = 100000, 100001.8518085704069965273648933
const poolStorage4: LiquidityPoolStorage = {
  ...defaultPool,
  poolCashBalance: new BigNumber('83941.29865625'),
  perpetuals: new Map([
    [TEST_MARKET_INDEX0, { ...perpetual1, ammPositionAmount: new BigNumber('2.3'), }],
  ]),
}

// long unsafe
// availableCashBalance = -13677.21634375 - (9.9059375 * (2.3)) = -13700
const poolStorage6: LiquidityPoolStorage = {
  ...defaultPool,
  poolCashBalance: new BigNumber('-13677.21634375'),
  perpetuals: new Map([
    [TEST_MARKET_INDEX0, { ...perpetual1, ammPositionAmount: new BigNumber('2.3'), }],
  ]),
}

const accountStorage1: AccountStorage = {
  cashBalance: new BigNumber('7698.86'), // 10000 - 2300.23 + (-0.91)
  positionAmount: new BigNumber('2.3'),
  entryValue: null, entryFunding: null,
}

const accountStorage3: AccountStorage = {
  cashBalance: new BigNumber('16301.14'), // 14000 + 2300.23 + 0.91
  positionAmount: new BigNumber('-2.3'),
  entryValue: null, entryFunding: null,
}

describe('computeMaxTradeAmountWithPrice', function () {
  const price = perpetual1.markPrice // let trading price = mark price, because this function is designed for a stop order
  const lev = 5
  const fee = '0.001'

  it('safe account buy', function () {
    const amount = computeMaxTradeAmountWithPrice(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, price, lev, fee, true)
    expect(amount.gt(_0)).toBeTruthy()
    const res = computeTradeWithPrice(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, price, amount, fee)
    const details = computeAccount(poolStorage1, TEST_MARKET_INDEX0, res)
    expect(details.accountComputed.leverage.gt('4.9')).toBeTruthy()
    expect(details.accountComputed.leverage.lte('5')).toBeTruthy()
  })

  it('safe account sell', function () {
    const amount = computeMaxTradeAmountWithPrice(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, price, lev, fee, false)
    expect(amount.lt(_0)).toBeTruthy()
    const res = computeTradeWithPrice(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, price, amount, fee)
    const details = computeAccount(poolStorage1, TEST_MARKET_INDEX0, res)
    expect(details.accountComputed.leverage.gt('4.9')).toBeTruthy()
    expect(details.accountComputed.leverage.lte('5.1')).toBeTruthy()
  })

  it('unsafe account buy', function () {
    const amount = computeMaxTradeAmountWithPrice(poolStorage1, TEST_MARKET_INDEX0, accountStorage3, price, lev, fee, true)
    expect(amount.gt(_0)).toBeTruthy()
    const res = computeTradeWithPrice(poolStorage1, TEST_MARKET_INDEX0, accountStorage3, price, amount, fee)
    const details = computeAccount(poolStorage1, TEST_MARKET_INDEX0, res)
    expect(details.accountComputed.leverage.gt('4.9')).toBeTruthy()
    expect(details.accountComputed.leverage.lte('5.1')).toBeTruthy()
  })

  it('unsafe account sell', function () {
    const amount = computeMaxTradeAmountWithPrice(poolStorage1, TEST_MARKET_INDEX0, accountStorage3, price, lev, fee, false)
    expect(amount.isZero()).toBeTruthy()
  })
})

describe('computeAMMMaxTradeAmount', function () {
  const targetLeverage = _1

  it(`safe trader + safe amm, trader buy`, function () {
    const amount = computeAMMMaxTradeAmount(poolStorage4, TEST_MARKET_INDEX0, accountStorage1, targetLeverage, true) // 1.1
    const context = computeAMMTrade(poolStorage4, TEST_MARKET_INDEX0, accountStorage1, amount)
    const newTrader = computeAccount(poolStorage4, TEST_MARKET_INDEX0, context.trader)
    expect(amount.gt('1.0')).toBeTruthy()
    expect(amount.lt('1.2')).toBeTruthy()
    expect(newTrader.accountComputed.leverage.gt('0.99')).toBeTruthy()
    expect(newTrader.accountComputed.leverage.lte('1.01')).toBeTruthy()
  })

  it(`safe trader + safe amm, trader sell`, function () {
    const amount = computeAMMMaxTradeAmount(poolStorage4, TEST_MARKET_INDEX0, accountStorage1, targetLeverage, false) // -5.6
    const context = computeAMMTrade(poolStorage4, TEST_MARKET_INDEX0, accountStorage1, amount)
    const newTrader = computeAccount(poolStorage4, TEST_MARKET_INDEX0, context.trader)
    expect(amount.lt('-5')).toBeTruthy()
    expect(amount.gt('-6')).toBeTruthy()
    expect(newTrader.accountComputed.leverage.gt('0.99')).toBeTruthy()
    expect(newTrader.accountComputed.leverage.lte('1.01')).toBeTruthy()
  })

  it(`safe trader + unsafe amm(holds short), trader buy`, function () {
    const amount = computeAMMMaxTradeAmount(poolStorage3, TEST_MARKET_INDEX0, accountStorage1, targetLeverage, true)
    expect(amount.isZero()).toBeTruthy()
  })

  it(`safe trader + unsafe amm(holds long), trader sell`, function () {
    const amount = computeAMMMaxTradeAmount(poolStorage6, TEST_MARKET_INDEX0, accountStorage1, targetLeverage, false)
    expect(amount.isZero()).toBeTruthy()
  })
})

describe('computeAMMTradeAmountByMargin', function () {
  it(`safe trader + safe amm, trader buy`, function () {
    const amount = computeAMMTradeAmountByMargin(poolStorage4, TEST_MARKET_INDEX0, '-100') // 0.0147487
    const p = computeAMMPrice(poolStorage4, TEST_MARKET_INDEX0, amount)
    const actualTraderMargin = p.deltaAMMMargin.negated()
    expect(amount.lt('0.015')).toBeTruthy()
    expect(amount.gt('0.014')).toBeTruthy()
    expect(actualTraderMargin.gt('-100.1')).toBeTruthy()
    expect(actualTraderMargin.lt('-99.9')).toBeTruthy()
  })

  it(`safe trader + safe amm, trader sell`, function () {
    const amount = computeAMMTradeAmountByMargin(poolStorage4, TEST_MARKET_INDEX0, '100') // -0.01525
    const p = computeAMMPrice(poolStorage4, TEST_MARKET_INDEX0, amount)
    const actualTraderMargin = p.deltaAMMMargin.negated()
    expect(amount.gt('-0.015')).toBeTruthy()
    expect(amount.lt('-0.014')).toBeTruthy()
    expect(actualTraderMargin.gt('99.9')).toBeTruthy()
    expect(actualTraderMargin.lt('100.1')).toBeTruthy()
  })

  it(`safe trader + unsafe amm(holds short), trader buy`, function () {
    const amount = computeAMMTradeAmountByMargin(poolStorage3, TEST_MARKET_INDEX0, '-100')
    expect(amount.isZero()).toBeTruthy()
  })

  it(`safe trader + unsafe amm(holds long), trader sell`, function () {
    const amount = computeAMMTradeAmountByMargin(poolStorage6, TEST_MARKET_INDEX0, '100')
    expect(amount.isZero()).toBeTruthy()
  })
})

describe('computeAMMInverseVWAP', function () {
  const getZeroAlphaPool = (pool: LiquidityPoolStorage): LiquidityPoolStorage => {
    const p = pool.perpetuals.get(TEST_MARKET_INDEX0) as PerpetualStorage
    const newPool = { ...pool, perpetuals: new Map(pool.perpetuals) }
    newPool.perpetuals.set(TEST_MARKET_INDEX0, { ...p, halfSpread: _0 })
    return newPool
  }

  it(`short: open without vwap`, function () {
    const price = new BigNumber('7050')
    const pool = getZeroAlphaPool(poolStorage1)
    const context = computeAMMPoolMargin(initAMMTradingContext(pool, TEST_MARKET_INDEX0), perpetual1.openSlippageFactor)
    const amount = computeAMMInverseVWAP(context, price, perpetual1.openSlippageFactor, false)
    expect(amount).toApproximate(normalizeBigNumberish('-9.68571428571428571428571429'))
    const trade = computeAMMTrade(pool, TEST_MARKET_INDEX0, accountStorage1, amount.negated())
    expect(trade.tradingPrice).toApproximate(price)
  })

  it(`short: open with vwap`, function () {
    const price = new BigNumber('7050')
    const pool = getZeroAlphaPool(poolStorage0)
    const context = computeAMMPoolMargin(initAMMTradingContext(pool, TEST_MARKET_INDEX0), perpetual1.openSlippageFactor)
    context.deltaMargin = new BigNumber('6950')
    context.deltaPosition = new BigNumber('-1')
    const amount = computeAMMInverseVWAP(context, price, perpetual1.openSlippageFactor, false)
    expect(amount).toApproximate(normalizeBigNumberish('-16.06428285485485457978127589'))
  })

  it(`short: close`, function () {
    const price = new BigNumber('7010')
    const pool = getZeroAlphaPool(poolStorage1)
    const context = computeAMMPoolMargin(initAMMTradingContext(pool, TEST_MARKET_INDEX0), perpetual1.closeSlippageFactor)
    const amount = computeAMMInverseVWAP(context, price, perpetual1.closeSlippageFactor, true)
    expect(amount).toApproximate(normalizeBigNumberish('1.42533803782316168264992492'))
    const trade = computeAMMTrade(pool, TEST_MARKET_INDEX0, accountStorage1, amount.negated())
    expect(trade.tradingPrice).toApproximate(price)
  })

  it(`long: open without vwap`, function () {
    const price = new BigNumber('6950')
    const pool = getZeroAlphaPool(poolStorage4)
    const context = computeAMMPoolMargin(initAMMTradingContext(pool, TEST_MARKET_INDEX0), perpetual1.openSlippageFactor)
    const amount = computeAMMInverseVWAP(context, price, perpetual1.openSlippageFactor, true)
    expect(amount).toApproximate(normalizeBigNumberish('9.68571428571428571428571429'))
    const trade = computeAMMTrade(pool, TEST_MARKET_INDEX0, accountStorage1, amount.negated())
    expect(trade.tradingPrice).toApproximate(price)
  })

  it(`long: open with vwap`, function () {
    const price = new BigNumber('6950')
    const pool = getZeroAlphaPool(poolStorage0)
    const context = computeAMMPoolMargin(initAMMTradingContext(pool, TEST_MARKET_INDEX0), perpetual1.openSlippageFactor)
    context.deltaMargin = new BigNumber('-7050')
    context.deltaPosition = new BigNumber('1')
    const amount = computeAMMInverseVWAP(context, price, perpetual1.openSlippageFactor, true)
    expect(amount).toApproximate(normalizeBigNumberish('16.06428285485485457978127589'))
  })

  it(`long: close`, function () {
    const price = new BigNumber('6990')
    const pool = getZeroAlphaPool(poolStorage4)
    const context = computeAMMPoolMargin(initAMMTradingContext(pool, TEST_MARKET_INDEX0), perpetual1.closeSlippageFactor)
    const amount = computeAMMInverseVWAP(context, price, perpetual1.closeSlippageFactor, false)
    expect(amount).toApproximate(normalizeBigNumberish('-1.42533803782316168264992492'))
    const trade = computeAMMTrade(pool, TEST_MARKET_INDEX0, accountStorage1, amount.negated())
    expect(trade.tradingPrice).toApproximate(price)
  })
})

describe('computeAMMAmountWithPrice - amm holds short, trader buys', function () {
  it(`amm unsafe`, function () {
    const limitPrice = new BigNumber('100000')
    const amount = computeAMMAmountWithPrice(poolStorage3, TEST_MARKET_INDEX0, true, limitPrice)
    expect(amount.isZero()).toBeTruthy()
  })

  it(`lower than spread`, function () {
    const limitPrice = new BigNumber('7023.1160999') // spread = 7023.1161
    const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_INDEX0, true, limitPrice)
    expect(amount.isZero()).toBeTruthy()
  })

  it(`exactly the best ask/bid price`, function () {
    const limitPrice = new BigNumber('7023.1161')
    const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_INDEX0, true, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('2.0046'))
    const trade = computeAMMTrade(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice.lte(limitPrice)).toBeTruthy()
  })

  it(`limitPrice is far away`, function () {
    const limitPrice = new BigNumber('100000')
    const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_INDEX0, true, limitPrice)
    // -2.3 => max -93.095503235030246126178607648
    expect(amount).toApproximate(normalizeBigNumberish('90.795503235030246126178607648'))
    const trade = computeAMMTrade(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice.lte(limitPrice)).toBeTruthy()
  })

  it(`normal`, function () {
    const limitPrice = new BigNumber('7200')
    const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_INDEX0, true, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('52.542857142857142857'))
    const trade = computeAMMTrade(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice).toApproximate(limitPrice)
  })
})

describe('computeAMMAmountWithPrice - amm holds short, trader sells', function () {
  it(`amm unsafe - higher than spread`, function () {
    const limitPrice = new BigNumber('6993.001') // spread = 6993
    const amount = computeAMMAmountWithPrice(poolStorage3, TEST_MARKET_INDEX0, false, limitPrice)
    expect(amount.isZero()).toBeTruthy()
  })

  it(`amm unsafe - exactly the best ask/bid price - close + open`, function () {
    const limitPrice = new BigNumber('6993')
    const amount = computeAMMAmountWithPrice(poolStorage3, TEST_MARKET_INDEX0, false, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('-2.52693371063539536994239123215'))
    const trade = computeAMMTrade(poolStorage3, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice.lte(limitPrice)).toBeTruthy()
  })

  it(`amm unsafe - largest amount`, function () {
    const limitPrice = new BigNumber(0)
    const amount = computeAMMAmountWithPrice(poolStorage3, TEST_MARKET_INDEX0, false, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('-3.248643177964958208'))
    const trade = computeAMMTrade(poolStorage3, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice.gte(limitPrice)).toBeTruthy()
  })

  it(`amm unsafe close + open`, function () {
    const limitPrice = new BigNumber('6992')
    const amount = computeAMMAmountWithPrice(poolStorage3, TEST_MARKET_INDEX0, false, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('-2.54339106672133532007243536012'))
    const trade = computeAMMTrade(poolStorage3, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice).toApproximate(limitPrice)
  })

  it(`safe - higher than spread`, function () {
    const limitPrice = new BigNumber('7007.476') // spread = 7007.4752419462290525818804101137
    const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_INDEX0, false, limitPrice)
    expect(amount.isZero()).toBeTruthy()
  })

  it(`safe - exactly the best ask/bid price - close + open`, function () {
    const limitPrice = new BigNumber('7007.4752419462290525818804101137')
    const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_INDEX0, false, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('-2.226863373523786822'))
    const trade = computeAMMTrade(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice).toApproximate(limitPrice)
  })

  it(`safe - close only`, function () {
    const limitPrice = new BigNumber('7007.4')
    const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_INDEX0, false, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('-2.250750147989139645'))
    const trade = computeAMMTrade(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice).toApproximate(limitPrice)
  })

  it(`safe - close + open`, function () {
    const limitPrice = new BigNumber('7006')
    const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_INDEX0, false, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('-2.688951590780905289'))
    const trade = computeAMMTrade(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice).toApproximate(limitPrice)
  })
})

describe('computeAMMAmountWithPrice - amm holds long, trader buys', function () {
  it(`amm unsafe - lower than spread`, function () {
    const limitPrice = new BigNumber('7006.999') // spread = 7007
    const amount = computeAMMAmountWithPrice(poolStorage6, TEST_MARKET_INDEX0, true, limitPrice)
    expect(amount.isZero()).toBeTruthy()
  })

  it(`amm unsafe - exactly the best ask/bid price - close + open`, function () {
    const limitPrice = new BigNumber('7007')
    const amount = computeAMMAmountWithPrice(poolStorage6, TEST_MARKET_INDEX0, true, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('2.65713060501851222135483063416'))
    const trade = computeAMMTrade(poolStorage6, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice.lte(limitPrice)).toBeTruthy()
  })

  it(`amm unsafe - largest amount`, function () {
    const limitPrice = new BigNumber('100000')
    const amount = computeAMMAmountWithPrice(poolStorage6, TEST_MARKET_INDEX0, true, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('4.534292077640725907'))
    const trade = computeAMMTrade(poolStorage6, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice.lte(limitPrice)).toBeTruthy()
  })

  it(`amm unsafe - close + open`, function () {
    const limitPrice = new BigNumber('7008')
    const amount = computeAMMAmountWithPrice(poolStorage6, TEST_MARKET_INDEX0, true, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('2.68369217482083603940884140606'))
    const trade = computeAMMTrade(poolStorage6, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice).toApproximate(limitPrice)
  })

  it(`safe - lower than spread`, function () {
    const limitPrice = new BigNumber('6992.495') // spread = 6992.4957785904151334990367462224
    const amount = computeAMMAmountWithPrice(poolStorage4, TEST_MARKET_INDEX0, true, limitPrice)
    expect(amount.isZero()).toBeTruthy()
  })

  it(`safe - exactly the best ask/bid price - close + open`, function () {
    const limitPrice = new BigNumber('6992.4957785904151334990367462224')
    const amount = computeAMMAmountWithPrice(poolStorage4, TEST_MARKET_INDEX0, true, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('2.217663373523786822'))
    const trade = computeAMMTrade(poolStorage4, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice).toApproximate(limitPrice)
  })

  it(`safe - close only`, function () {
    const limitPrice = new BigNumber('6992.7')
    const amount = computeAMMAmountWithPrice(poolStorage4, TEST_MARKET_INDEX0, true, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('2.282496767610908028'))
    const trade = computeAMMTrade(poolStorage4, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice).toApproximate(limitPrice)
  })

  it(`safe - close + open`, function () {
    const limitPrice = new BigNumber('6994')
    const amount = computeAMMAmountWithPrice(poolStorage4, TEST_MARKET_INDEX0, true, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('2.688951590780905289'))
    const trade = computeAMMTrade(poolStorage4, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice).toApproximate(limitPrice)
  })
})

describe('computeAMMAmountWithPrice - amm holds long, trader sells', function () {
  it(`amm unsafe`, function () {
    const limitPrice = new BigNumber(0)
    const amount = computeAMMAmountWithPrice(poolStorage6, TEST_MARKET_INDEX0, false, limitPrice)
    expect(amount.isZero()).toBeTruthy()
  })

  it(`higher than index`, function () {
    const limitPrice = new BigNumber('6976.9161001')
    const amount = computeAMMAmountWithPrice(poolStorage4, TEST_MARKET_INDEX0, false, limitPrice)
    expect(amount.isZero()).toBeTruthy()
  })

  it(`exactly the best ask/bid price`, function () {
    const limitPrice = new BigNumber('6976.9161')
    const amount = computeAMMAmountWithPrice(poolStorage4, TEST_MARKET_INDEX0, false, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('-1.9954'))
    const trade = computeAMMTrade(poolStorage4, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice.lte(limitPrice)).toBeTruthy()
  })

  it(`limitPrice is far away`, function () {
    const limitPrice = new BigNumber(0)
    const amount = computeAMMAmountWithPrice(poolStorage4, TEST_MARKET_INDEX0, false, limitPrice)
    // 2.3 => 93.095503235030246126178607648
    expect(amount).toApproximate(normalizeBigNumberish('-90.795503235030246126178607648'))
    const trade = computeAMMTrade(poolStorage4, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice.gte(limitPrice)).toBeTruthy()
  })

  it(`normal`, function () {
    const limitPrice = (new BigNumber('6800'))
    const amount = computeAMMAmountWithPrice(poolStorage4, TEST_MARKET_INDEX0, false, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('-52.542857142857142857'))
    const trade = computeAMMTrade(poolStorage4, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice).toApproximate(limitPrice)
  })
})
