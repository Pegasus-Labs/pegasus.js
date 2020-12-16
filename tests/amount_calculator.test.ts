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
  MarketStorage,
  AccountStorage,
  MarketState,
} from '../src/types'
import { normalizeBigNumberish } from '../src/utils'
import { extendExpect } from './helper'

extendExpect()

const market1: MarketStorage = {
  underlyingSymbol: 'T',
  oracleAddress: '0x0',

  initialMarginRate: new BigNumber(0.1),
  maintenanceMarginRate: new BigNumber(0.05),
  liquidationPenaltyRate: new BigNumber(0.005),
  keeperGasReward: new BigNumber(1),

  halfSpread: new BigNumber(0.001),
  openSlippageFactor: new BigNumber(100),
  closeSlippageFactor: new BigNumber(90),
  fundingRateLimit: new BigNumber(0.005),
  maxLeverage: new BigNumber(5),
  lpFeeRate: new BigNumber(0.0007),
  vaultFeeRate: new BigNumber(0.0002),
  operatorFeeRate: new BigNumber(0.0001),
  referrerRebateRate: new BigNumber(0.0000),

  insuranceFund1: new BigNumber('0.0'),
  insuranceFund2: new BigNumber('0.0'),
  state: MarketState.NORMAL,
  markPrice: new BigNumber(6965),
  indexPrice: new BigNumber(7000),
  unitAccumulativeFunding: new BigNumber('9.9059375'),

  ammPositionAmount: _0, // assign me later
}

// short normal
// availableCashBalance = 116095.73134375 - (9.9059375 * (-2.3)) = 116118.515
// poolMargin = 100000, 100001.8518085704069965273648933
const amm1 = {
  cashBalance: new BigNumber('116095.73134375'),
  positionAmount: new BigNumber('-2.3'),
}

// short unsafe
// availableCashBalance = 16096.21634375 - (9.9059375 * (-2.3)) = 16119
const amm3 = {
  cashBalance: new BigNumber('16096.21634375'),
  positionAmount: new BigNumber('-2.3'),
}

// long normal
// availableCashBalance = 83941.29865625 - (9.9059375 * 2.3) = 83918.515
// poolMargin = 100000, 100001.8518085704069965273648933
const amm4 = {
  cashBalance: new BigNumber('83941.29865625'),
  positionAmount: new BigNumber('2.3'),
}

// long unsafe
// availableCashBalance = -13977.21634375 - (9.9059375 * (2.3)) = -14000
const amm6 = {
  cashBalance: new BigNumber('-13977.21634375'),
  positionAmount: new BigNumber('2.3'),
}

const TEST_MARKET_INDEX0 = 0

const poolStorage0: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0', shareTokenAddress: '0x0', fundingTime: 1579601290,
  poolCashBalance: new BigNumber('100000'),
  markets: {
    [TEST_MARKET_INDEX0]: {
      ...market1,
      ammPositionAmount: _0,
    }
  },
}

const poolStorage1: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0', shareTokenAddress: '0x0', fundingTime: 1579601290,
  poolCashBalance: amm1.cashBalance,
  markets: {
    [TEST_MARKET_INDEX0]: {
      ...market1,
      ammPositionAmount: amm1.positionAmount,
    }
  },
}

const poolStorage3: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0', shareTokenAddress: '0x0', fundingTime: 1579601290,
  poolCashBalance: amm3.cashBalance,
  markets: {
    [TEST_MARKET_INDEX0]: {
      ...market1,
      ammPositionAmount: amm3.positionAmount,
    }
  },
}

const poolStorage4: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0', shareTokenAddress: '0x0', fundingTime: 1579601290,
  poolCashBalance: amm4.cashBalance,
  markets: {
    [TEST_MARKET_INDEX0]: {
      ...market1,
      ammPositionAmount: amm4.positionAmount,
    }
  },
}

const poolStorage6: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0', shareTokenAddress: '0x0', fundingTime: 1579601290,
  poolCashBalance: amm6.cashBalance,
  markets: {
    [TEST_MARKET_INDEX0]: {
      ...market1,
      ammPositionAmount: amm6.positionAmount,
    }
  },
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
  const price = market1.markPrice // let trading price = mark price, because this function is designed for a stop order
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
  it(`short: open without vwap`, function () {
    const price = new BigNumber('7050')
    const context = computeAMMPoolMargin(initAMMTradingContext(poolStorage1, TEST_MARKET_INDEX0), market1.openSlippageFactor)
    const amount = computeAMMInverseVWAP(context, price, market1.openSlippageFactor, false)
    expect(amount).toApproximate(normalizeBigNumberish('-9.68571428571428571428571429'))
    const trade = computeAMMTrade(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, amount.negated())
    expect(trade.tradingPrice).toApproximate(price.times(_1.plus(market1.halfSpread)))
  })

  it(`short: open with vwap`, function () {
    const price = new BigNumber('7050')
    const context = computeAMMPoolMargin(initAMMTradingContext(poolStorage0, TEST_MARKET_INDEX0), market1.openSlippageFactor)
    context.deltaMargin = new BigNumber('6950')
    context.deltaPosition = new BigNumber('-1')
    const amount = computeAMMInverseVWAP(context, price, market1.openSlippageFactor, false)
    expect(amount).toApproximate(normalizeBigNumberish('-16.06428285485485457978127589'))
  })

  it(`short: close`, function () {
    const price = new BigNumber('7010')
    const context = computeAMMPoolMargin(initAMMTradingContext(poolStorage1, TEST_MARKET_INDEX0), market1.closeSlippageFactor)
    const amount = computeAMMInverseVWAP(context, price, market1.closeSlippageFactor, true)
    expect(amount).toApproximate(normalizeBigNumberish('1.42533803782316168264992492'))
    const trade = computeAMMTrade(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, amount.negated())
    expect(trade.tradingPrice).toApproximate(price.times(_1.minus(market1.halfSpread)))
  })

  it(`long: open without vwap`, function () {
    const price = new BigNumber('6950')
    const context = computeAMMPoolMargin(initAMMTradingContext(poolStorage4, TEST_MARKET_INDEX0), market1.openSlippageFactor)
    const amount = computeAMMInverseVWAP(context, price, market1.openSlippageFactor, true)
    expect(amount).toApproximate(normalizeBigNumberish('9.68571428571428571428571429'))
    const trade = computeAMMTrade(poolStorage4, TEST_MARKET_INDEX0, accountStorage1, amount.negated())
    expect(trade.tradingPrice).toApproximate(price.times(_1.minus(market1.halfSpread)))
  })

  it(`long: open with vwap`, function () {
    const price = new BigNumber('6950')
    const context = computeAMMPoolMargin(initAMMTradingContext(poolStorage0, TEST_MARKET_INDEX0), market1.openSlippageFactor)
    context.deltaMargin = new BigNumber('-7050')
    context.deltaPosition = new BigNumber('1')
    const amount = computeAMMInverseVWAP(context, price, market1.openSlippageFactor, true)
    expect(amount).toApproximate(normalizeBigNumberish('16.06428285485485457978127589'))
  })

  it(`long: close`, function () {
    const price = new BigNumber('6990')
    const context = computeAMMPoolMargin(initAMMTradingContext(poolStorage4, TEST_MARKET_INDEX0), market1.closeSlippageFactor)
    const amount = computeAMMInverseVWAP(context, price, market1.closeSlippageFactor, false)
    expect(amount).toApproximate(normalizeBigNumberish('-1.42533803782316168264992492'))
    const trade = computeAMMTrade(poolStorage4, TEST_MARKET_INDEX0, accountStorage1, amount.negated())
    expect(trade.tradingPrice).toApproximate(price.times(_1.plus(market1.halfSpread)))
  })
})

describe('computeAMMAmountWithPrice - amm holds short, trader buys', function () {
  it(`amm unsafe`, function () {
    const limitPrice = new BigNumber(100000)
    const amount = computeAMMAmountWithPrice(poolStorage3, TEST_MARKET_INDEX0, true, limitPrice)
    expect(amount.isZero()).toBeTruthy()
  })

  it(`lower than index`, function () {
    const limitPrice = new BigNumber(7000)
    const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_INDEX0, true, limitPrice)
    expect(amount.isZero()).toBeTruthy()
  })

  it(`limitPrice is far away`, function () {
    const limitPrice = new BigNumber(100000)
    const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_INDEX0, true, limitPrice)
    // -2.3 => max -93.095503235030246126178607648
    expect(amount).toApproximate(normalizeBigNumberish('90.795503235030246126178607648'))
    const trade = computeAMMTrade(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice.lte(limitPrice)).toBeTruthy()
  })

  it(`normal`, function () {
    const limitPrice = (new BigNumber(7200)).times(_1.plus(market1.halfSpread))
    const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_INDEX0, true, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('52.542857142857142857'))
    const trade = computeAMMTrade(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice).toApproximate(limitPrice)
  })

  it(`no solution`, function () {
    const limitPrice = new BigNumber(7010).times(_1.plus(market1.halfSpread))
    const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_INDEX0, true, limitPrice)
    expect(amount.isZero()).toBeTruthy()
  })
})

describe('computeAMMAmountWithPrice - amm holds short, trader sells', function () {
  it(`amm unsafe - impossible price`, function () {
    const limitPrice = new BigNumber(100000)
    const amount = computeAMMAmountWithPrice(poolStorage3, TEST_MARKET_INDEX0, false, limitPrice)
    expect(amount.isZero()).toBeTruthy()
  })

  it(`amm unsafe - largest amount`, function () {
    const limitPrice = new BigNumber(0)
    const amount = computeAMMAmountWithPrice(poolStorage3, TEST_MARKET_INDEX0, false, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('-2.317688145614655747')) // 2.3 + 0.017688145614655747
    const trade = computeAMMTrade(poolStorage3, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice.gte(limitPrice)).toBeTruthy()
  })

  it(`amm unsafe close + open`, function () {
    const limitPrice = new BigNumber(6998).times(_1.minus(market1.halfSpread))
    const amount = computeAMMAmountWithPrice(poolStorage3, TEST_MARKET_INDEX0, false, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('-2.315856729596580035')) // 2.3 + 0.015856729596580035
    const trade = computeAMMTrade(poolStorage3, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice).toApproximate(limitPrice)
  })

  it(`close only`, function () {
    const limitPrice = new BigNumber('7014.174737510995938681826').times(_1.minus(market1.halfSpread))
    const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_INDEX0, false, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('-0.1'))
    const trade = computeAMMTrade(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice).toApproximate(limitPrice)
  })

  it(`close + open`, function () {
    // 16116.663191429593003472635 + 6996.5000648120997682267097
    // ---------------------------------------------------------
    //                         2.3 + 0.1
    const limitPrice = new BigNumber('7003.9888655277856883937409').times(_1.minus(market1.halfSpread))
    const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_INDEX0, false, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('-3.3')) // 2.3 + 0.1
    const trade = computeAMMTrade(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice).toApproximate(limitPrice)
  })
})

describe('computeAMMAmountWithPrice - amm holds long, trader buys', function () {
  it(`amm unsafe - impossible price`, function () {
    const limitPrice = new BigNumber(0)
    const amount = computeAMMAmountWithPrice(poolStorage6, TEST_MARKET_INDEX0, true, limitPrice)
    expect(amount.isZero()).toBeTruthy()
  })

  it(`amm unsafe - largest amount`, function () {
    const limitPrice = new BigNumber(100000)
    const amount = computeAMMAmountWithPrice(poolStorage6, TEST_MARKET_INDEX0, true, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('4.255005567935635169')) // 2.3 + 1.955005567935635169
    const trade = computeAMMTrade(poolStorage6, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice.lte(limitPrice)).toBeTruthy()
  })

  it(`amm unsafe - close + open`, function () {
    const limitPrice = new BigNumber(7002).times(_1.plus(market1.halfSpread))
    const amount = computeAMMAmountWithPrice(poolStorage6, TEST_MARKET_INDEX0, true, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('2.472240789218530841')) // 2.3 + 0.172240789218530841
    const trade = computeAMMTrade(poolStorage6, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice).toApproximate(limitPrice)
  })

  it(`close only`, function () {
    const limitPrice = new BigNumber('6985.825262489004061318174').times(_1.plus(market1.halfSpread))
    const amount = computeAMMAmountWithPrice(poolStorage4, TEST_MARKET_INDEX0, true, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('0.1'))
    const trade = computeAMMTrade(poolStorage4, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice).toApproximate(limitPrice)
  })

  it(`close + open`, function () {
    // 16083.336808570406996527365 + 7003.49993518790023177329031034219456153428
    // -------------------------------------------------------------------------
    //                         2.3 + 0.1
    const limitPrice = new BigNumber('6996.0111344722143116062591').times(_1.plus(market1.halfSpread))
    const amount = computeAMMAmountWithPrice(poolStorage4, TEST_MARKET_INDEX0, true, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('3.3')) // 2.3 + 0.1
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
    const limitPrice = new BigNumber(7000)
    const amount = computeAMMAmountWithPrice(poolStorage4, TEST_MARKET_INDEX0, false, limitPrice)
    expect(amount.isZero()).toBeTruthy()
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
    const limitPrice = (new BigNumber(6800)).times(_1.minus(market1.halfSpread))
    const amount = computeAMMAmountWithPrice(poolStorage4, TEST_MARKET_INDEX0, false, limitPrice)
    expect(amount).toApproximate(normalizeBigNumberish('-52.542857142857142857'))
    const trade = computeAMMTrade(poolStorage4, TEST_MARKET_INDEX0, accountStorage1, amount)
    expect(trade.tradingPrice).toApproximate(limitPrice)
  })

  it(`no solution`, function () {
    const limitPrice = new BigNumber(6990).times(_1.minus(market1.halfSpread))
    const amount = computeAMMAmountWithPrice(poolStorage4, TEST_MARKET_INDEX0, false, limitPrice)
    expect(amount.isZero()).toBeTruthy()
  })
})
