import BigNumber from 'bignumber.js'
import {
  computeAccount,
  computeTradeWithPrice,
  computeAMMTrade,
  computeAMMPrice,
} from '../src/computation'
import {
  computeMaxTradeAmountWithPrice,
  // computeAMMMaxTradeAmount,
  // computeAMMTradeAmountByMargin,
  // computeAMMAmountWithPrice,
  // computeAMMShortInverseVWAP,
  // computeAMMLongInverseVWAP,
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
// availableCashBalance = 83941.29865625 - (9.9059375 * 2.3) = 83918.515
// poolMargin = 100000, 100001.851808570406996527364893
const amm1 = {
  cashBalance: new BigNumber('83941.29865625'),
  positionAmount: new BigNumber('2.3'),
}

// short unsafe
// availableCashBalance = 18119.79134375 - (9.9059375 * (-2.3)) = 18142.575
const amm3 = {
  cashBalance: new BigNumber('18119.79134375'),
  positionAmount: new BigNumber('-2.3'),
}

// long normal
// availableCashBalance = 18119.79134375 - (9.9059375 * (-2.3)) = 18142.575
const amm4 = {
  cashBalance: new BigNumber('18119.79134375'),
  positionAmount: new BigNumber('2.3'),
}

// long unsafe
// availableCashBalance = 18119.79134375 - (9.9059375 * (-2.3)) = 18142.575
const amm6 = {
  cashBalance: new BigNumber('18119.79134375'),
  positionAmount: new BigNumber('2.3'),
}

const TEST_MARKET_ID = '0x0'

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

// describe('computeAMMMaxTradeAmount', function () {
//   const targetLeverage = _1

//   it(`safe trader + safe amm, trader buy`, function () {
//     const amount = computeAMMMaxTradeAmount(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage4, targetLeverage, true) // 1.12090
//     const context = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage4, amount)
//     const newTrader = computeAccount(poolStorage1, TEST_MARKET_ID, context.takerAccount)
//     expect(amount.gt('1.1')).toBeTruthy()
//     expect(amount.lt('1.2')).toBeTruthy()
//     expect(newTrader.accountComputed.leverage.gt('0.9')).toBeTruthy()
//     expect(newTrader.accountComputed.leverage.lte('1.1')).toBeTruthy()
//   })

//   it(`safe trader + safe amm, trader sell`, function () {
//     const amount = computeAMMMaxTradeAmount(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage4, targetLeverage, false) // -4.96708
//     const context = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage4, amount)
//     const newTrader = computeAccount(poolStorage1, TEST_MARKET_ID, context.takerAccount)
//     expect(amount.lt('-4.9')).toBeTruthy()
//     expect(amount.gt('-5.0')).toBeTruthy()
//     expect(newTrader.accountComputed.leverage.gt('0.9')).toBeTruthy()
//     expect(newTrader.accountComputed.leverage.lte('1.1')).toBeTruthy()
//   })

//   it(`safe trader + unsafe amm(holds short), trader buy`, function () {
//     const amount = computeAMMMaxTradeAmount(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage3, targetLeverage, true)
//     expect(amount.isZero()).toBeTruthy()
//   })

//   it(`safe trader + unsafe amm(holds long), trader sell`, function () {
//     const amount = computeAMMMaxTradeAmount(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage6, targetLeverage, false)
//     expect(amount.isZero()).toBeTruthy()
//   })
// })

// describe('computeAMMTradeAmountByMargin', function () {
//   it(`safe trader + safe amm, trader buy`, function () {
//     const amount = computeAMMTradeAmountByMargin(poolStorage1, TEST_MARKET_ID, ammStorage4, '-100') // 0.0147487
//     const p = computeAMMPrice(poolStorage1, TEST_MARKET_ID, ammStorage4, amount)
//     const actualTraderMargin = p.deltaAMMMargin.negated()
//     expect(amount.lt('0.015')).toBeTruthy()
//     expect(amount.gt('0.014')).toBeTruthy()
//     expect(actualTraderMargin.gt('-101')).toBeTruthy()
//     expect(actualTraderMargin.lt('-99')).toBeTruthy()
//   })

//   it(`safe trader + safe amm, trader sell`, function () {
//     const amount = computeAMMTradeAmountByMargin(poolStorage1, TEST_MARKET_ID, ammStorage4, '100') // -0.01525
//     const p = computeAMMPrice(poolStorage1, TEST_MARKET_ID, ammStorage4, amount)
//     const actualTraderMargin = p.deltaAMMMargin.negated()
//     expect(amount.gt('-0.016')).toBeTruthy()
//     expect(amount.lt('-0.015')).toBeTruthy()
//     expect(actualTraderMargin.gt('99')).toBeTruthy()
//     expect(actualTraderMargin.lt('101')).toBeTruthy()
//   })

//   it(`safe trader + unsafe amm(holds short), trader buy`, function () {
//     const amount = computeAMMTradeAmountByMargin(poolStorage1, TEST_MARKET_ID, ammStorage3, '-100')
//     expect(amount.isZero()).toBeTruthy()
//   })

//   it(`safe trader + unsafe amm(holds long), trader sell`, function () {
//     const amount = computeAMMTradeAmountByMargin(poolStorage1, TEST_MARKET_ID, ammStorage6, '100')
//     expect(amount.isZero()).toBeTruthy()
//   })
// })

// describe('computeAMMShortInverseVWAP', function () {
//   it(`newly open`, function () {
//     const price = new BigNumber('8600')
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage1)
//     const context = computeM0(initAMMTradingContext(poolStorage1, TEST_MARKET_ID, ammDetails), perpetualStorage.beta1)
//     const amount = computeAMMShortInverseVWAP(context, price, perpetualStorage.beta1, false)
//     expect(amount).toApproximate(normalizeBigNumberish('-1.150442655750823901'))
//     const trade = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage1, amount.negated())
//     expect(trade.tradingPrice).toApproximate(price.times(_1.plus(perpetualStorage.halfSpread)))
//   })

//   it(`open with vwap`, function () {
//     const price = new BigNumber('8600')
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage1)
//     const context = computeM0(initAMMTradingContext(poolStorage1, TEST_MARKET_ID, ammDetails), perpetualStorage.beta1)
//     context.deltaMargin = new BigNumber('8590')
//     context.deltaPosition = new BigNumber('-1')
//     const amount = computeAMMShortInverseVWAP(context, price, perpetualStorage.beta1, false)
//     expect(amount).toApproximate(normalizeBigNumberish('-1.166700495274031079648097380'))
//   })

//   it(`denominator = 0`, function () {
//     const price = new BigNumber('5600')
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage1)
//     const context = computeM0(initAMMTradingContext(poolStorage1, TEST_MARKET_ID, ammDetails), perpetualStorage.beta1)
//     context.deltaMargin = new BigNumber('5550')
//     context.deltaPosition = new BigNumber('-1')
//     const amount = computeAMMShortInverseVWAP(context, price, perpetualStorage.beta1, false)
//     expect(amount).toApproximate(normalizeBigNumberish('0.019968285737965901480859663290'))
//   })

//   it(`newly close`, function () {
//     const price = new BigNumber('7496.94559507299850561599560184')
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage1)
//     const context = computeM0(initAMMTradingContext(poolStorage1, TEST_MARKET_ID, ammDetails), perpetualStorage.beta2)
//     const amount = computeAMMShortInverseVWAP(context, price, perpetualStorage.beta2, true)
//     expect(amount).toApproximate(normalizeBigNumberish('0.1'))
//     const trade = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage1, amount.negated())
//     expect(trade.tradingPrice).toApproximate(price.times(_1.minus(perpetualStorage.halfSpread)))
//   })
// })

// describe('computeAMMLongInverseVWAP', function () {
//   it(`newly open`, function () {
//     const price = new BigNumber('6400')
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage4)
//     const context = computeM0(initAMMTradingContext(poolStorage1, TEST_MARKET_ID, ammDetails), perpetualStorage.beta1)
//     const amount = computeAMMLongInverseVWAP(context, price, perpetualStorage.beta1, false)
//     expect(amount).toApproximate(normalizeBigNumberish('1.448990370102629051'))
//     const trade = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage4, amount.negated())
//     expect(trade.tradingPrice).toApproximate(price.times(_1.minus(perpetualStorage.halfSpread)))
//   })

//   it(`open with vwap`, function () {
//     const price = new BigNumber('6400')
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage4)
//     const context = computeM0(initAMMTradingContext(poolStorage1, TEST_MARKET_ID, ammDetails), perpetualStorage.beta1)
//     context.deltaMargin = new BigNumber('-6410')
//     context.deltaPosition = new BigNumber('1')
//     const amount = computeAMMLongInverseVWAP(context, price, perpetualStorage.beta1, false)
//     expect(amount).toApproximate(normalizeBigNumberish('1.5056824943534932257'))
//   })

//   it(`denominator = 0`, function () {
//     const price = new BigNumber('8750')
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage4)
//     const context = computeM0(initAMMTradingContext(poolStorage1, TEST_MARKET_ID, ammDetails), perpetualStorage.beta1)
//     context.deltaMargin = new BigNumber('-8760')
//     context.deltaPosition = new BigNumber('1')
//     const amount = computeAMMLongInverseVWAP(context, price, perpetualStorage.beta1, false)
//     expect(amount).toApproximate(normalizeBigNumberish('0.0045694996651542960242353'))
//   })

//   it(`newly close`, function () {
//     const price = new BigNumber('6778.41582553989229623003259')
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage4)
//     const context = computeM0(initAMMTradingContext(poolStorage1, TEST_MARKET_ID, ammDetails), perpetualStorage.beta2)
//     const amount = computeAMMLongInverseVWAP(context, price, perpetualStorage.beta2, true)
//     expect(amount).toApproximate(normalizeBigNumberish('-0.1'))
//     const trade = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage4, amount.negated())
//     expect(trade.tradingPrice).toApproximate(price.times(_1.plus(perpetualStorage.halfSpread)))
//   })
// })

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
//     const limitPrice = (new BigNumber(8600)).times(_1.plus(perpetualStorage.halfSpread))
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage1)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, true, limitPrice)
//     // -2.3 => -4.578554661208745284
//     expect(amount).toApproximate(normalizeBigNumberish('1.1504426557508239018'))
//     const trade = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage1, amount)
//     expect(trade.tradingPrice).toApproximate(limitPrice)
//   })

//   it(`no solution`, function () {
//     const limitPrice = new BigNumber(7010).times(_1.plus(perpetualStorage.halfSpread))
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
//     const limitPrice = new BigNumber(6999).times(_1.minus(perpetualStorage.halfSpread))
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage3)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, false, limitPrice)
//     expect(amount).toApproximate(normalizeBigNumberish('-1.016044559439571046')) // close -1 + open -0.016044559439571046
//     const trade = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage3, amount)
//     expect(trade.tradingPrice).toApproximate(limitPrice)
//   })

//   it(`close only`, function () {
//     const limitPrice = new BigNumber('7496.94559507299850561599560184').times(_1.minus(perpetualStorage.halfSpread))
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage1)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, false, limitPrice)
//     expect(amount).toApproximate(normalizeBigNumberish('-0.1'))
//     const trade = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage1, amount)
//     expect(trade.tradingPrice).toApproximate(limitPrice)
//   })

//   it(`close + open`, function () {
//     const limitPrice = new BigNumber(6999).times(_1.minus(perpetualStorage.halfSpread))
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
//     const limitPrice = new BigNumber(7001).times(_1.plus(perpetualStorage.halfSpread))
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage6)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, true, limitPrice)
//     expect(amount).toApproximate(normalizeBigNumberish('1.035909706138829466')) // close 1 + open 0.035909706138829466
//     const trade = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage6, amount)
//     expect(trade.tradingPrice).toApproximate(limitPrice)
//   })

//   it(`close only`, function () {
//     const limitPrice = new BigNumber('6778.41582553989229623003259').times(_1.plus(perpetualStorage.halfSpread))
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage4)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, true, limitPrice)
//     expect(amount).toApproximate(normalizeBigNumberish('0.1')) // close 1
//     const trade = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage4, amount)
//     expect(trade.tradingPrice).toApproximate(limitPrice)
//   })

//   it(`close + open`, function () {
//     const limitPrice = new BigNumber(7001).times(_1.plus(perpetualStorage.halfSpread))
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
//     const limitPrice = (new BigNumber(6400)).times(_1.minus(perpetualStorage.halfSpread))
//     const ammDetails = computeAccount(poolStorage1, TEST_MARKET_ID, ammStorage4)
//     const amount = computeAMMAmountWithPrice(poolStorage1, TEST_MARKET_ID, ammDetails, false, limitPrice)
//     expect(amount).toApproximate(normalizeBigNumberish('-1.448990370102629051'))
//     const trade = computeAMMTrade(poolStorage1, TEST_MARKET_ID, accountStorage1, ammStorage4, amount)
//     expect(trade.tradingPrice).toApproximate(limitPrice)
//   })

//   it(`no solution`, function () {
//     const limitPrice = new BigNumber(6990).times(_1.minus(perpetualStorage.halfSpread))
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
