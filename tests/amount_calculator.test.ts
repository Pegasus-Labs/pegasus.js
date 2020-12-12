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
  // computeAMMAmountWithPrice,
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
  liquidatorPenaltyRate: new BigNumber(0.005),
  keeperGasReward: new BigNumber(1),

  halfSpread: new BigNumber(0.001),
  beta1: new BigNumber(100),
  beta2: new BigNumber(90),
  fundingRateCoefficient: new BigNumber(0.005),
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
  accumulatedFundingPerContract: new BigNumber('9.9059375'),

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

const TEST_MARKET_ID = '0x0'

const poolStorage0: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0', shareTokenAddress: '0x0', fundingTime: 1579601290,
  ammCashBalance: new BigNumber('100000'),
  markets: {
    [TEST_MARKET_ID]: {
      ...market1,
      ammPositionAmount: _0,
    }
  },
}

const poolStorage1: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0', shareTokenAddress: '0x0', fundingTime: 1579601290,
  ammCashBalance: amm1.cashBalance,
  markets: {
    [TEST_MARKET_ID]: {
      ...market1,
      ammPositionAmount: amm1.positionAmount,
    }
  },
}

const poolStorage3: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0', shareTokenAddress: '0x0', fundingTime: 1579601290,
  ammCashBalance: amm3.cashBalance,
  markets: {
    [TEST_MARKET_ID]: {
      ...market1,
      ammPositionAmount: amm3.positionAmount,
    }
  },
}

const poolStorage4: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0', shareTokenAddress: '0x0', fundingTime: 1579601290,
  ammCashBalance: amm4.cashBalance,
  markets: {
    [TEST_MARKET_ID]: {
      ...market1,
      ammPositionAmount: amm4.positionAmount,
    }
  },
}

const poolStorage6: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0', shareTokenAddress: '0x0', fundingTime: 1579601290,
  ammCashBalance: amm6.cashBalance,
  markets: {
    [TEST_MARKET_ID]: {
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
    const amount = computeMaxTradeAmountWithPrice(poolStorage1, TEST_MARKET_ID, accountStorage1, price, lev, fee, true)
    expect(amount.gt(_0)).toBeTruthy()
    const res = computeTradeWithPrice(poolStorage1, TEST_MARKET_ID, accountStorage1, price, amount, fee)
    const details = computeAccount(poolStorage1, TEST_MARKET_ID, res)
    expect(details.accountComputed.leverage.gt('4.9')).toBeTruthy()
    expect(details.accountComputed.leverage.lte('5')).toBeTruthy()
  })

  it('safe account sell', function () {
    const amount = computeMaxTradeAmountWithPrice(poolStorage1, TEST_MARKET_ID, accountStorage1, price, lev, fee, false)
    expect(amount.lt(_0)).toBeTruthy()
    const res = computeTradeWithPrice(poolStorage1, TEST_MARKET_ID, accountStorage1, price, amount, fee)
    const details = computeAccount(poolStorage1, TEST_MARKET_ID, res)
    expect(details.accountComputed.leverage.gt('4.9')).toBeTruthy()
    expect(details.accountComputed.leverage.lte('5.1')).toBeTruthy()
  })

  it('unsafe account buy', function () {
    const amount = computeMaxTradeAmountWithPrice(poolStorage1, TEST_MARKET_ID, accountStorage3, price, lev, fee, true)
    expect(amount.gt(_0)).toBeTruthy()
    const res = computeTradeWithPrice(poolStorage1, TEST_MARKET_ID, accountStorage3, price, amount, fee)
    const details = computeAccount(poolStorage1, TEST_MARKET_ID, res)
    expect(details.accountComputed.leverage.gt('4.9')).toBeTruthy()
    expect(details.accountComputed.leverage.lte('5.1')).toBeTruthy()
  })

  it('unsafe account sell', function () {
    const amount = computeMaxTradeAmountWithPrice(poolStorage1, TEST_MARKET_ID, accountStorage3, price, lev, fee, false)
    expect(amount.isZero()).toBeTruthy()
  })
})

describe('computeAMMMaxTradeAmount', function () {
  const targetLeverage = _1

  it(`safe trader + safe amm, trader buy`, function () {
    const amount = computeAMMMaxTradeAmount(poolStorage4, TEST_MARKET_ID, accountStorage1, targetLeverage, true) // 1.12090
    const context = computeAMMTrade(poolStorage4, TEST_MARKET_ID, accountStorage1, amount)
    const newTrader = computeAccount(poolStorage4, TEST_MARKET_ID, context.takerAccount)
    expect(amount.gt('1.0')).toBeTruthy()
    expect(amount.lt('1.2')).toBeTruthy()
    expect(newTrader.accountComputed.leverage.gt('0.99')).toBeTruthy()
    expect(newTrader.accountComputed.leverage.lte('1.01')).toBeTruthy()
  })

  it(`safe trader + safe amm, trader sell`, function () {
    const amount = computeAMMMaxTradeAmount(poolStorage4, TEST_MARKET_ID, accountStorage1, targetLeverage, false) // -4.96708
    const context = computeAMMTrade(poolStorage4, TEST_MARKET_ID, accountStorage1, amount)
    const newTrader = computeAccount(poolStorage4, TEST_MARKET_ID, context.takerAccount)
    expect(amount.lt('-5')).toBeTruthy()
    expect(amount.gt('-6')).toBeTruthy()
    expect(newTrader.accountComputed.leverage.gt('0.99')).toBeTruthy()
    expect(newTrader.accountComputed.leverage.lte('1.01')).toBeTruthy()
  })

  it(`safe trader + unsafe amm(holds short), trader buy`, function () {
    const amount = computeAMMMaxTradeAmount(poolStorage3, TEST_MARKET_ID, accountStorage1, targetLeverage, true)
    expect(amount.isZero()).toBeTruthy()
  })

  it(`safe trader + unsafe amm(holds long), trader sell`, function () {
    const amount = computeAMMMaxTradeAmount(poolStorage6, TEST_MARKET_ID, accountStorage1, targetLeverage, false)
    expect(amount.isZero()).toBeTruthy()
  })
})

describe('computeAMMTradeAmountByMargin', function () {
  it(`safe trader + safe amm, trader buy`, function () {
    const amount = computeAMMTradeAmountByMargin(poolStorage4, TEST_MARKET_ID, '-100') // 0.0147487
    const p = computeAMMPrice(poolStorage4, TEST_MARKET_ID, amount)
    const actualTraderMargin = p.deltaAMMMargin.negated()
    expect(amount.lt('0.015')).toBeTruthy()
    expect(amount.gt('0.014')).toBeTruthy()
    expect(actualTraderMargin.gt('-100.1')).toBeTruthy()
    expect(actualTraderMargin.lt('-99.9')).toBeTruthy()
  })

  it(`safe trader + safe amm, trader sell`, function () {
    const amount = computeAMMTradeAmountByMargin(poolStorage4, TEST_MARKET_ID, '100') // -0.01525
    const p = computeAMMPrice(poolStorage4, TEST_MARKET_ID, amount)
    const actualTraderMargin = p.deltaAMMMargin.negated()
    expect(amount.gt('-0.015')).toBeTruthy()
    expect(amount.lt('-0.014')).toBeTruthy()
    expect(actualTraderMargin.gt('99.9')).toBeTruthy()
    expect(actualTraderMargin.lt('100.1')).toBeTruthy()
  })

  it(`safe trader + unsafe amm(holds short), trader buy`, function () {
    const amount = computeAMMTradeAmountByMargin(poolStorage3, TEST_MARKET_ID, '-100')
    expect(amount.isZero()).toBeTruthy()
  })

  it(`safe trader + unsafe amm(holds long), trader sell`, function () {
    const amount = computeAMMTradeAmountByMargin(poolStorage6, TEST_MARKET_ID, '100')
    expect(amount.isZero()).toBeTruthy()
  })
})

describe('computeAMMInverseVWAP', function () {
  it(`short: open without vwap`, function () {
    const price = new BigNumber('7050')
    const context = computeAMMPoolMargin(initAMMTradingContext(poolStorage1, TEST_MARKET_ID), market1.beta1)
    const amount = computeAMMInverseVWAP(context, price, market1.beta1, false)
    expect(amount).toApproximate(normalizeBigNumberish('-9.68571428571428571428571429'))
    const trade = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, amount.negated())
    expect(trade.tradingPrice).toApproximate(price.times(_1.plus(market1.halfSpread)))
  })

  it(`short: open with vwap`, function () {
    const price = new BigNumber('7050')
    const context = computeAMMPoolMargin(initAMMTradingContext(poolStorage0, TEST_MARKET_ID), market1.beta1)
    context.deltaMargin = new BigNumber('6950')
    context.deltaPosition = new BigNumber('-1')
    const amount = computeAMMInverseVWAP(context, price, market1.beta1, false)
    expect(amount).toApproximate(normalizeBigNumberish('-16.06428285485485457978127589'))
  })

  it(`short: close`, function () {
    const price = new BigNumber('7010')
    const context = computeAMMPoolMargin(initAMMTradingContext(poolStorage1, TEST_MARKET_ID), market1.beta2)
    const amount = computeAMMInverseVWAP(context, price, market1.beta2, true)
    expect(amount).toApproximate(normalizeBigNumberish('1.42533803782316168264992492'))
    const trade = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, amount.negated())
    expect(trade.tradingPrice).toApproximate(price.times(_1.minus(market1.halfSpread)))
  })

  it(`long: open without vwap`, function () {
    const price = new BigNumber('6950')
    const context = computeAMMPoolMargin(initAMMTradingContext(poolStorage4, TEST_MARKET_ID), market1.beta1)
    const amount = computeAMMInverseVWAP(context, price, market1.beta1, true)
    expect(amount).toApproximate(normalizeBigNumberish('9.68571428571428571428571429'))
    const trade = computeAMMTrade(poolStorage4, TEST_MARKET_ID, accountStorage1, amount.negated())
    expect(trade.tradingPrice).toApproximate(price.times(_1.minus(market1.halfSpread)))
  })

  it(`long: open with vwap`, function () {
    const price = new BigNumber('6950')
    const context = computeAMMPoolMargin(initAMMTradingContext(poolStorage0, TEST_MARKET_ID), market1.beta1)
    context.deltaMargin = new BigNumber('-7050')
    context.deltaPosition = new BigNumber('1')
    const amount = computeAMMInverseVWAP(context, price, market1.beta1, true)
    expect(amount).toApproximate(normalizeBigNumberish('16.06428285485485457978127589'))
  })

  it(`long: close`, function () {
    const price = new BigNumber('6990')
    const context = computeAMMPoolMargin(initAMMTradingContext(poolStorage4, TEST_MARKET_ID), market1.beta2)
    const amount = computeAMMInverseVWAP(context, price, market1.beta2, false)
    expect(amount).toApproximate(normalizeBigNumberish('-1.42533803782316168264992492'))
    const trade = computeAMMTrade(poolStorage4, TEST_MARKET_ID, accountStorage1, amount.negated())
    expect(trade.tradingPrice).toApproximate(price.times(_1.plus(market1.halfSpread)))
  })
})

// describe('computeAMMAmountWithPrice - amm holds short, trader buys', function () {
//   it(`amm unsafe`, function () {
//     const limitPrice = new BigNumber(100000)
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage3)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, true, limitPrice)
//     expect(amount.isZero()).toBeTruthy()
//   })

//   it(`lower than index`, function () {
//     const limitPrice = new BigNumber(7000)
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage1)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, true, limitPrice)
//     expect(amount.isZero()).toBeTruthy()
//   })

//   it(`limitPrice is far away`, function () {
//     const limitPrice = new BigNumber(100000)
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage1)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, true, limitPrice)
//     // -2.3 => -4.578554661208745284
//     expect(amount).toApproximate(normalizeBigNumberish('2.278554661208745284'))
//   })

//   it(`normal`, function () {
//     const limitPrice = (new BigNumber(8600)).times(_1.plus(market1.halfSpread))
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage1)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, true, limitPrice)
//     // -2.3 => -4.578554661208745284
//     expect(amount).toApproximate(normalizeBigNumberish('1.1504426557508239018'))
//     const trade = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage1, amount)
//     expect(trade.tradingPrice).toApproximate(limitPrice)
//   })

//   it(`no solution`, function () {
//     const limitPrice = new BigNumber(7010).times(_1.plus(market1.halfSpread))
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage1)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, true, limitPrice)
//     expect(amount.isZero()).toBeTruthy()
//   })
// })

// describe('computeAMMAmountWithPrice - amm holds short, trader sells', function () {
//   it(`amm unsafe - impossible price`, function () {
//     const limitPrice = new BigNumber(100000)
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage3)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, false, limitPrice)
//     expect(amount.isZero()).toBeTruthy()
//   })

//   it(`amm unsafe - largest amount`, function () {
//     const limitPrice = new BigNumber(0)
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage3)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, false, limitPrice)
//     expect(amount).toApproximate(normalizeBigNumberish('-1.27141176385071134')) // close -1 + open -0.27141176385071134
//   })

//   it(`amm unsafe close + open`, function () {
//     const limitPrice = new BigNumber(6999).times(_1.minus(market1.halfSpread))
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage3)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, false, limitPrice)
//     expect(amount).toApproximate(normalizeBigNumberish('-1.016044559439571046')) // close -1 + open -0.016044559439571046
//     const trade = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage3, amount)
//     expect(trade.tradingPrice).toApproximate(limitPrice)
//   })

//   it(`close only`, function () {
//     const limitPrice = new BigNumber('7496.94559507299850561599560184').times(_1.minus(market1.halfSpread))
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage1)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, false, limitPrice)
//     expect(amount).toApproximate(normalizeBigNumberish('-0.1'))
//     const trade = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage1, amount)
//     expect(trade.tradingPrice).toApproximate(limitPrice)
//   })

//   it(`close + open`, function () {
//     const limitPrice = new BigNumber(6999).times(_1.minus(market1.halfSpread))
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage1)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, false, limitPrice)
//     expect(amount).toApproximate(normalizeBigNumberish('-4.072429388483517252')) // close -2.3 + open -1.772429388483517252
//     const trade = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage1, amount)
//     expect(trade.tradingPrice).toApproximate(limitPrice)
//   })
// })

// describe('computeAMMAmountWithPrice - amm holds long, trader buys', function () {
//   it(`amm unsafe - impossible price`, function () {
//     const limitPrice = new BigNumber(0)
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage6)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, true, limitPrice)
//     expect(amount.isZero()).toBeTruthy()
//   })

//   it(`amm unsafe - largest amount`, function () {
//     const limitPrice = new BigNumber(100000)
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage6)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, true, limitPrice)
//     expect(amount).toApproximate(normalizeBigNumberish('1.889319308035714286')) // close 1 + open 0.889319308035714286
//   })

//   it(`amm unsafe - close + open`, function () {
//     const limitPrice = new BigNumber(7001).times(_1.plus(market1.halfSpread))
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage6)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, true, limitPrice)
//     expect(amount).toApproximate(normalizeBigNumberish('1.035909706138829466')) // close 1 + open 0.035909706138829466
//     const trade = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage6, amount)
//     expect(trade.tradingPrice).toApproximate(limitPrice)
//   })

//   it(`close only`, function () {
//     const limitPrice = new BigNumber('6778.41582553989229623003259').times(_1.plus(market1.halfSpread))
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage4)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, true, limitPrice)
//     expect(amount).toApproximate(normalizeBigNumberish('0.1')) // close 1
//     const trade = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage4, amount)
//     expect(trade.tradingPrice).toApproximate(limitPrice)
//   })

//   it(`close + open`, function () {
//     const limitPrice = new BigNumber(7001).times(_1.plus(market1.halfSpread))
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage4)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, true, limitPrice)
//     expect(amount).toApproximate(normalizeBigNumberish('3.948030273926512578')) // close 2.3 + open 1.648030273926512578
//     const trade = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage4, amount)
//     expect(trade.tradingPrice).toApproximate(limitPrice)
//   })
// })

// describe('computeAMMAmountWithPrice - amm holds long, trader sells', function () {
//   it(`amm unsafe`, function () {
//     const limitPrice = new BigNumber(0)
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage6)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, false, limitPrice)
//     expect(amount.isZero()).toBeTruthy()
//   })

//   it(`higher than index`, function () {
//     const limitPrice = new BigNumber(7000)
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage4)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, false, limitPrice)
//     expect(amount.isZero()).toBeTruthy()
//   })

//   it(`limitPrice is far away`, function () {
//     const limitPrice = new BigNumber(0)
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage4)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, false, limitPrice)
//     // 2.3 => 12.398048373879559398
//     expect(amount).toApproximate(normalizeBigNumberish('-10.098048373879559398'))
//   })

//   it(`normal`, function () {
//     const limitPrice = (new BigNumber(6400)).times(_1.minus(market1.halfSpread))
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage4)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, false, limitPrice)
//     expect(amount).toApproximate(normalizeBigNumberish('-1.448990370102629051'))
//     const trade = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage4, amount)
//     expect(trade.tradingPrice).toApproximate(limitPrice)
//   })

//   it(`no solution`, function () {
//     const limitPrice = new BigNumber(6990).times(_1.minus(market1.halfSpread))
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage4)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, false, limitPrice)
//     expect(amount.isZero()).toBeTruthy()
//   })
// })








poolStorage1
poolStorage3
poolStorage4
poolStorage6
computeAMMPoolMargin
accountStorage1
accountStorage3
computeAccount
computeTradeWithPrice
computeAMMTrade
computeAMMPrice
normalizeBigNumberish
initAMMTradingContext
poolStorage0
