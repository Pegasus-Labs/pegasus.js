import BigNumber from 'bignumber.js'
import {
  initAMMTradingContext,
  initAMMTradingContextEagerEvaluation,
  // computeAMMInternalTrade,
  computeAMMAvailableMargin,
  isAMMSafe,
  computeDeltaMargin,
  // computeAMMSafeShortPositionAmount,
  // computeAMMSafeLongPositionAmount,
  // computeFundingRate,
} from '../src/amm'
import { DECIMALS, _0, _1 } from '../src/constants'
import {
  MarketState,
  MarketStorage,
  LiquidityPoolStorage,
  AccountDetails,
  AMMTradingContext
} from '../src/types'
import { normalizeBigNumberish, splitAmount } from '../src/utils'
import { extendExpect } from './helper'
import { InsufficientLiquidityError } from '../src/types'

extendExpect()

const market1: MarketStorage = {
  underlyingSymbol: 'T',
  oracleAddress: '0x0',

  initialMarginRate: new BigNumber(0.1),
  maintenanceMarginRate: new BigNumber(0.05),
  liquidatorPenaltyRate: new BigNumber(0.005),
  keeperGasReward: new BigNumber(2),

  halfSpreadRate: new BigNumber(0.001),
  beta1: new BigNumber(100),
  beta2: new BigNumber(90),
  fundingRateCoefficient: new BigNumber(0.005),
  maxLeverage: new BigNumber(5),
  lpFeeRate: new BigNumber(0.0008),
  vaultFeeRate: new BigNumber(0.0001),
  operatorFeeRate: new BigNumber(0.0001),
  referrerRebateRate: new BigNumber(0.0000),

  insuranceFund1: new BigNumber('0.0'),
  insuranceFund2: new BigNumber('0.0'),
  state: MarketState.NORMAL,
  markPrice: new BigNumber(95),
  indexPrice: new BigNumber(100),
  accumulatedFundingPerContract: new BigNumber('1.9'),

  ammPositionAmount: _0, // assign me later
}

const TEST_MARKET_ID = '0x0'
const TEST_MARKET_ID2 = '0x1'

// [0] zero
// available cash = 10000
// available margin = 10000
const poolStorage0: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0', shareTokenAddress: '0x0', fundingTime: 1579601290,
  ammCashBalance: new BigNumber('10000'),
  markets: {
    [TEST_MARKET_ID]: { ...market1, ammPositionAmount: _0 },
    [TEST_MARKET_ID2]: { ...market1, ammPositionAmount: _0 },
  },
}

// [1] short 1: normal
// available cash = 10100 - 1.9 * (-10) - 1.9 * (10) = 10100
// available margin = 10000
const poolStorage1: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0', shareTokenAddress: '0x0', fundingTime: 1579601290,
  ammCashBalance: new BigNumber('10100'),
  markets: {
    [TEST_MARKET_ID]: { ...market1, ammPositionAmount: new BigNumber('-10') },
    [TEST_MARKET_ID2]: { ...market1, ammPositionAmount: new BigNumber('10') },
  },
}

// [2] short 2: loss but safe
// available cash = 14599 - 1.9 * (-50) - 1.9 * (10) = 14675
// available margin = 9273.09477715884768908142691791
const poolStorage2: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0', shareTokenAddress: '0x0', fundingTime: 1579601290,
  ammCashBalance: new BigNumber('14599'),
  markets: {
    [TEST_MARKET_ID]: { ...market1, ammPositionAmount: new BigNumber('-50') },
    [TEST_MARKET_ID2]: { ...market1, ammPositionAmount: new BigNumber('10') },
  },
}

// [3] short 3: unsafe
// available cash = 17877 - 1.9 * (-80) - 1.9 * (10) = 18010
// available margin = unsafe
const poolStorage3: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0', shareTokenAddress: '0x0', fundingTime: 1579601290,
  ammCashBalance: new BigNumber('17877'),
  markets: {
    [TEST_MARKET_ID]: { ...market1, ammPositionAmount: new BigNumber('-80') },
    [TEST_MARKET_ID2]: { ...market1, ammPositionAmount: new BigNumber('10') },
  },
}

// [4] long 1: normal
// available cash = 8138 - 1.9 * (10) - 1.9 * (10)= 8100
// available margin = 10000
const poolStorage4: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0', shareTokenAddress: '0x0', fundingTime: 1579601290,
  ammCashBalance: new BigNumber('8138'),
  markets: {
    [TEST_MARKET_ID]: { ...market1, ammPositionAmount: new BigNumber('10') },
    [TEST_MARKET_ID2]: { ...market1, ammPositionAmount: new BigNumber('10') },
  },
}

// [5] long 2: loss but safe
// available cash = 1664 - 1.9 * (50) - 1.9 * (10) = 1550
// available margin = 4893.31346231725208539935787445
const poolStorage5: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0', shareTokenAddress: '0x0', fundingTime: 1579601290,
  ammCashBalance: new BigNumber('1664'),
  markets: {
    [TEST_MARKET_ID]: { ...market1, ammPositionAmount: new BigNumber('50') },
    [TEST_MARKET_ID2]: { ...market1, ammPositionAmount: new BigNumber('10') },
  },
}

// [6]
// long 3: unsafe
// available cash = 2501 - 1.9 * (80) - 1.9 * (10) = 2330
// available margin = unsafe
const poolStorage6: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0', shareTokenAddress: '0x0', fundingTime: 1579601290,
  ammCashBalance: new BigNumber('2501'),
  markets: {
    [TEST_MARKET_ID]: { ...market1, ammPositionAmount: new BigNumber('80') },
    [TEST_MARKET_ID2]: { ...market1, ammPositionAmount: new BigNumber('10') },
  },
}

describe('computeM0', function () {
  const beta1 = new BigNumber('100')

  interface ComputeAccountCase {
    amm: LiquidityPoolStorage
    availableCash: BigNumber
    isAMMSafe: boolean
    availableMargin: BigNumber
  }

  const successCases: Array<ComputeAccountCase> = [
    {
      amm: poolStorage0,
      availableCash: new BigNumber('10000'),
      isAMMSafe: true,
      availableMargin: new BigNumber('10000'),
    },
    {
      amm: poolStorage1,
      availableCash: new BigNumber('10100'),
      isAMMSafe: true,
      availableMargin: new BigNumber('10000'),
    },
    {
      amm: poolStorage2,
      availableCash: new BigNumber('14675'),
      isAMMSafe: true,
      availableMargin: new BigNumber('9273.09477715884768908142691791'),
    },
    {
      amm: poolStorage3,
      availableCash: new BigNumber('18010'),
      isAMMSafe: false,
      availableMargin: _0
    },
    {
      amm: poolStorage4,
      availableCash: new BigNumber('8100'),
      isAMMSafe: true,
      availableMargin: new BigNumber('10000'),
    },
    {
      amm: poolStorage5,
      availableCash: new BigNumber('1550'),
      isAMMSafe: true,
      availableMargin: new BigNumber('4893.31346231725208539935787445'),
    },
    {
      amm: poolStorage6,
      availableCash: new BigNumber('2330'),
      isAMMSafe: false,
      availableMargin: _0,
    },
  ]

  successCases.forEach((element, index) => {
    it(`${index}`, function () {
      const context1 = initAMMTradingContext(element.amm, TEST_MARKET_ID)
      expect(context1.cash).toApproximate(normalizeBigNumberish(element.availableCash))

      const safe = isAMMSafe(context1, beta1)
      expect(safe).toEqual(element.isAMMSafe)

      if (element.isAMMSafe) {
        const context2 = computeAMMAvailableMargin(context1, beta1)
        expect(context2.availableMargin).toApproximate(normalizeBigNumberish(element.availableMargin))
      }
    })
  })
})

describe('isAMMSafe', function () {
  // long: larger index is safer
  it(`long - always safe (sqrt < 0)`, function () {
    const context: AMMTradingContext = initAMMTradingContextEagerEvaluation({
      cash: new BigNumber('100000'),
      index: new BigNumber('1'),
      position1: new BigNumber('110'),
      otherIndex: [ new BigNumber('100') ],
      otherPosition: [ new BigNumber('1') ],
      otherHalfSpreadRate: [ _0 ],
      beta1: new BigNumber('1000'),
      beta2: new BigNumber('1000'),
      halfSpreadRate: _0, fundingRateCoefficient: _0, maxLeverage: _0,
      otherBeta1: [ new BigNumber('100') ],
      otherBeta2: [ new BigNumber('100') ],
      otherFundingRateCoefficient: [ _0 ], otherMaxLeverage: [ _0 ],
      availableMargin: _0, deltaMargin: _0, deltaPosition: _0,
      marginBalanceWithoutCurrent: _0, squareWithoutCurrent: _0
    })
    expect(isAMMSafe(context, new BigNumber('1000') /* beta */)).toBeTruthy()
  })
  it(`long - ok`, function () {
    const context: AMMTradingContext = initAMMTradingContextEagerEvaluation({
      cash: new BigNumber('10000'),
      index: new BigNumber('337.9088160260'),
      position1: new BigNumber('100'),
      otherIndex: [ new BigNumber('100') ],
      otherPosition: [ new BigNumber('1000') ],
      otherHalfSpreadRate: [ _0 ],
      beta1: new BigNumber('100'),
      beta2: new BigNumber('100'),
      halfSpreadRate: _0, fundingRateCoefficient: _0, maxLeverage: _0,
      otherBeta1: [ new BigNumber('100') ],
      otherBeta2: [ new BigNumber('100') ],
      otherFundingRateCoefficient: [ _0 ], otherMaxLeverage: [ _0 ],
      availableMargin: _0, deltaMargin: _0, deltaPosition: _0,
      marginBalanceWithoutCurrent: _0, squareWithoutCurrent: _0
    })
    expect(isAMMSafe(context, new BigNumber('100') /* beta */)).toBeTruthy()
  })
  it(`long - fail`, function () {
    const context: AMMTradingContext = initAMMTradingContextEagerEvaluation({
      cash: new BigNumber('10000'),
      index: new BigNumber('337.9088160259'),
      position1: new BigNumber('100'),
      otherIndex: [ new BigNumber('100') ],
      otherPosition: [ new BigNumber('1000') ],
      otherHalfSpreadRate: [ _0 ],
      beta1: new BigNumber('100'),
      beta2: new BigNumber('100'),
      halfSpreadRate: _0, fundingRateCoefficient: _0, maxLeverage: _0,
      otherBeta1: [ new BigNumber('100') ],
      otherBeta2: [ new BigNumber('100') ],
      otherFundingRateCoefficient: [ _0 ], otherMaxLeverage: [ _0 ],
      availableMargin: _0, deltaMargin: _0, deltaPosition: _0,
      marginBalanceWithoutCurrent: _0, squareWithoutCurrent: _0
    })
    expect(isAMMSafe(context, new BigNumber('100') /* beta */)).toBeFalsy()
  })
  // short: lower index is safer
  it(`short - unsafe (margin balance < 0)`, function () {
    const context: AMMTradingContext = initAMMTradingContextEagerEvaluation({
      cash: new BigNumber('100000'),
      index: new BigNumber('1'),
      position1: new BigNumber('-110'),
      otherIndex: [ new BigNumber('100') ],
      otherPosition: [ new BigNumber('-1001') ],
      otherHalfSpreadRate: [ _0 ],
      beta1: new BigNumber('1000'),
      beta2: new BigNumber('1000'),
      halfSpreadRate: _0, fundingRateCoefficient: _0, maxLeverage: _0,
      otherBeta1: [ new BigNumber('100') ],
      otherBeta2: [ new BigNumber('100') ],
      otherFundingRateCoefficient: [ _0 ], otherMaxLeverage: [ _0 ],
      availableMargin: _0, deltaMargin: _0, deltaPosition: _0,
      marginBalanceWithoutCurrent: _0, squareWithoutCurrent: _0
    })
    expect(isAMMSafe(context, new BigNumber('100') /* beta */)).toBeFalsy()
  })
  it(`short - ok`, function () {
    const context: AMMTradingContext = initAMMTradingContextEagerEvaluation({
      cash: new BigNumber('100000'),
      index: new BigNumber('482.1023652650379499133'),
      position1: new BigNumber('-110'),
      otherIndex: [ new BigNumber('100') ],
      otherPosition: [ new BigNumber('-100') ],
      otherHalfSpreadRate: [ _0 ],
      beta1: new BigNumber('100'),
      beta2: new BigNumber('100'),
      halfSpreadRate: _0, fundingRateCoefficient: _0, maxLeverage: _0,
      otherBeta1: [ new BigNumber('100') ],
      otherBeta2: [ new BigNumber('100') ],
      otherFundingRateCoefficient: [ _0 ], otherMaxLeverage: [ _0 ],
      availableMargin: _0, deltaMargin: _0, deltaPosition: _0,
      marginBalanceWithoutCurrent: _0, squareWithoutCurrent: _0
    })
    expect(isAMMSafe(context, new BigNumber('100') /* beta */)).toBeTruthy()
  })
  it(`short - fail`, function () {
    const context: AMMTradingContext = initAMMTradingContextEagerEvaluation({
      cash: new BigNumber('100000'),
      index: new BigNumber('482.1023652650379499134'),
      position1: new BigNumber('-110'),
      otherIndex: [ new BigNumber('100') ],
      otherPosition: [ new BigNumber('-100') ],
      otherHalfSpreadRate: [ _0 ],
      beta1: new BigNumber('100'),
      beta2: new BigNumber('100'),
      halfSpreadRate: _0, fundingRateCoefficient: _0, maxLeverage: _0,
      otherBeta1: [ new BigNumber('100') ],
      otherBeta2: [ new BigNumber('100') ],
      otherFundingRateCoefficient: [ _0 ], otherMaxLeverage: [ _0 ],
      availableMargin: _0, deltaMargin: _0, deltaPosition: _0,
      marginBalanceWithoutCurrent: _0, squareWithoutCurrent: _0
    })
    expect(isAMMSafe(context, new BigNumber('100') /* beta */)).toBeFalsy()
  })
})

describe('computeDeltaMargin', function () {
  const beta1 = new BigNumber('100')
  interface ComputeAccountCase {
    name: string
    amm: LiquidityPoolStorage
    pos2: BigNumber

    // expected
    deltaMargin: BigNumber
  }

  const successCases: Array<ComputeAccountCase> = [
    {
      name: '0 -> +5',
      amm: poolStorage0,
      pos2: new BigNumber('5'),
      deltaMargin: new BigNumber('-487.5')
    },
    {
      name: '0 -> -5',
      amm: poolStorage0,
      pos2: new BigNumber('-5'),
      deltaMargin: new BigNumber('512.5')
    },
  ]

  successCases.forEach(element => {
    it(element.name, function () {
      const context = computeAMMAvailableMargin(initAMMTradingContext(element.amm, TEST_MARKET_ID), beta1)
      const deltaMargin = computeDeltaMargin(context, beta1, element.pos2)
      expect(deltaMargin).toApproximate(normalizeBigNumberish(element.deltaMargin))
    })
  })
})

// describe('safePosition', function () {
//   it('shorts from 0', function () {
//     const beta = new BigNumber('0.2')
//     const context = computeM0(initAMMTradingContext(perpetualStorage, ammDetails0), beta)
//     const pos2 = computeAMMSafeShortPositionAmount(context, beta)
//     expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('-25')))
//   })

//   it('longs from 0', function () {
//     const beta = new BigNumber('0.2')
//     const context = computeM0(initAMMTradingContext(perpetualStorage, ammDetails0), beta)
//     const pos2 = computeAMMSafeLongPositionAmount(context, beta)
//     expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('37.2594670356232003')))
//   })

//   it('short: √(beta lev) < 1', function () {
//     const beta = new BigNumber('0.1')
//     const context = computeM0(initAMMTradingContext(perpetualStorage, ammDetails0), beta)
//     const pos2 = computeAMMSafeShortPositionAmount(context, beta)
//     expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('-29.28932188134524756')))
//   })

//   it('short: √(beta lev) = 1', function () {
//     const beta = new BigNumber('0.2')
//     const context = computeM0(initAMMTradingContext(perpetualStorage, ammDetails0), beta)
//     const pos2 = computeAMMSafeShortPositionAmount(context, beta)
//     expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('-25')))
//   })

//   it('short: √(beta lev) > 1', function () {
//     const beta = new BigNumber('0.99')
//     const context = computeM0(initAMMTradingContext(perpetualStorage, ammDetails0), beta)
//     const pos2 = computeAMMSafeShortPositionAmount(context, beta)
//     expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('-15.50455121681897322')))
//   })

//   it('long: (-1 + beta + beta lev) = 0, implies beta < 0.5', function () {
//     const beta = new BigNumber('0.2')
//     const perp: LiquidityPoolStorage = { ...perpetualStorage }
//     perp.targetLeverage = new BigNumber('4')
//     const context = computeM0(initAMMTradingContext(perp, ammDetails4), beta)
//     expect(context.m0).toApproximate(normalizeBigNumberish(new BigNumber('3815.73003084296943685467')))
//     const pos2 = computeAMMSafeLongPositionAmount(context, beta)
//     expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('31.7977502570247453')))
//   })

//   it('long: (-1 + beta + beta lev) < 0 && lev < 2 && beta < (2 - lev)/2', function () {
//     const beta = new BigNumber('0.1')
//     const perp: LiquidityPoolStorage = { ...perpetualStorage }
//     perp.targetLeverage = new BigNumber('1.5')
//     const context = computeM0(initAMMTradingContext(perp, ammDetails4), beta)
//     expect(context.m0).toApproximate(normalizeBigNumberish(new BigNumber('1198.496129103507772815')))
//     const pos2 = computeAMMSafeLongPositionAmount(context, beta)
//     expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('17.689313632528408')))
//   })

//   it('long: (-1 + beta + beta lev) < 0 && beta >= (2 - lev)/2', function () {
//     const beta = new BigNumber('0.3')
//     const perp: LiquidityPoolStorage = { ...perpetualStorage }
//     perp.targetLeverage = new BigNumber('1.5')
//     const context = computeM0(initAMMTradingContext(perp, ammDetails4), beta)
//     expect(context.m0).toApproximate(normalizeBigNumberish(new BigNumber('732.256192005801738225')))
//     const pos2 = computeAMMSafeLongPositionAmount(context, beta)
//     expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('15.875912065096235')))
//   })

//   it('long: (-1 + beta + beta lev) < 0 && lev >= 2', function () {
//     const beta = new BigNumber('0.1')
//     const perp: LiquidityPoolStorage = { ...perpetualStorage }
//     perp.targetLeverage = new BigNumber('2')
//     const context = computeM0(initAMMTradingContext(perp, ammDetails4), beta)
//     expect(context.m0).toApproximate(normalizeBigNumberish(new BigNumber('1828.289199652552845974')))
//     const pos2 = computeAMMSafeLongPositionAmount(context, beta)
//     expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('21.2517072860587530')))
//   })

//   it('long: (-1 + beta + beta lev) > 0', function () {
//     const beta = new BigNumber('0.99')
//     const perp: LiquidityPoolStorage = { ...perpetualStorage }
//     perp.targetLeverage = new BigNumber('2')
//     const context = computeM0(initAMMTradingContext(perp, ammDetails4), beta)
//     expect(context.m0).toApproximate(normalizeBigNumberish(new BigNumber('758.23018746237011297')))
//     const pos2 = computeAMMSafeLongPositionAmount(context, beta)
//     expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('18.2026549289986863')))
//   })
// })

// describe('trade - success', function () {
//   interface ComputeAccountCase {
//     name: string
//     amm: AccountDetails
//     amount: BigNumber

//     // expected
//     deltaMargin: BigNumber
//   }

//   const successCases: Array<ComputeAccountCase> = [
//     {
//       name: 'open 0 -> -25',
//       amm: ammDetails0,
//       amount: new BigNumber('-25'),
//       deltaMargin: new BigNumber('3003') // trader buy, 3000 (1 + α)
//     },
//     {
//       name: 'open -11 -> -24',
//       amm: ammDetails1,
//       amount: new BigNumber('-13'),
//       deltaMargin: new BigNumber('1710.76146848312296') // trader buy, 1709.052416067056 (1 + α)
//     },
//     {
//       name: 'open 0 -> 37',
//       amm: ammDetails0,
//       amount: new BigNumber('37'),
//       deltaMargin: new BigNumber('-2896.60792953216181') // trader sell, -2899.5074369691309 (1 - α)
//     },
//     {
//       name: 'open 11 -> 36',
//       amm: ammDetails4,
//       amount: new BigNumber('25'),
//       deltaMargin: new BigNumber('-1775.58545802588185') // trader sell, -1777.3628208467285 (1 - α)
//     },
//     {
//       name: 'close -11 -> -10',
//       amm: ammDetails1,
//       amount: new BigNumber('1'),
//       deltaMargin: new BigNumber('-105.919615384615385') // trader sell, -106.02564102564103 (1 - α)
//     },
//     {
//       name: 'close -11 -> 0',
//       amm: ammDetails1,
//       amount: new BigNumber('11'),
//       deltaMargin: new BigNumber('-1129.89461538461538') // trader sell, -1131.0256410256410 (1 - α)
//     },
//     {
//       name: 'close 11 -> 10',
//       amm: ammDetails4,
//       amount: new BigNumber('-1'),
//       deltaMargin: new BigNumber('94.6008831068813075') // trader buy, 94.5063767301511564 (1 + α)
//     },
//     {
//       name: 'close 11 -> 0',
//       amm: ammDetails4,
//       amount: new BigNumber('-11'),
//       deltaMargin: new BigNumber('1071.88792321443440') // trader buy, 1070.8171061083260751 (1 + α)
//     },
//     {
//       name: 'close unsafe -11 -> -10',
//       amm: ammDetails3,
//       amount: new BigNumber('1'),
//       deltaMargin: new BigNumber('-99.9') // trader sell, 100 (1 - α)
//     },
//     {
//       name: 'close unsafe 11 -> 10',
//       amm: ammDetails6,
//       amount: new BigNumber('-1'),
//       deltaMargin: new BigNumber('100.1') // trader buy, 100 (1 + α)
//     },
//   ]

//   successCases.forEach(element => {
//     it(element.name, function () {
//       const context = computeAMMInternalTrade(perpetualStorage, element.amm, element.amount)
//       expect(context.deltaMargin).toApproximate(normalizeBigNumberish(element.deltaMargin))
//     })
//   })
// })

// describe('trade - fail', function () {
//   interface ComputeAccountCase {
//     name: string
//     amm: AccountDetails
//     amount: BigNumber
//   }

//   const failCases: Array<ComputeAccountCase> = [
//     {
//       name: 'open 0 -> -25.01, pos2 too large',
//       amm: ammDetails0,
//       amount: new BigNumber('-25.01'),
//     },
//     {
//       name: 'open -11 -> -24.2, pos2 too large',
//       amm: ammDetails1,
//       amount: new BigNumber('-13.2'),
//     },
//     {
//       name: 'open -11 already unsafe',
//       amm: ammDetails3,
//       amount: new BigNumber('-0.01'),
//     },
//     {
//       name: 'open 0 -> 37.3',
//       amm: ammDetails0,
//       amount: new BigNumber('37.3'),
//     },
//     {
//       name: 'open 11 -> 36.3',
//       amm: ammDetails4,
//       amount: new BigNumber('25.3'),
//     },
//     {
//       name: 'open 11 already unsafe',
//       amm: ammDetails6,
//       amount: new BigNumber('0.01'),
//     },
//   ]

//   failCases.forEach(element => {
//     it(element.name, () => {
//       expect((): void => {
//         computeAMMInternalTrade(perpetualStorage, element.amm, element.amount)
//       }).toThrow(InsufficientLiquidityError)
//     })
//   })
// })

// TODO:
// describe('computeFundingRate', function () {
//   it('normal', () => {
  
//     console.log('[0]', computeFundingRate(perpetualStorage, ammDetails0).toFixed())
//     console.log('[1]', computeFundingRate(perpetualStorage, ammDetails1).toFixed())
//     console.log('[2]', computeFundingRate(perpetualStorage, ammDetails2).toFixed())
//     console.log('[3]', computeFundingRate(perpetualStorage, ammDetails3).toFixed())
//     console.log('[4]', computeFundingRate(perpetualStorage, ammDetails4).toFixed())
//     console.log('[5]', computeFundingRate(perpetualStorage, ammDetails5).toFixed())
//     console.log('[6]', computeFundingRate(perpetualStorage, ammDetails6).toFixed())
    
//   })
// })


DECIMALS
_0
_1
splitAmount
initAMMTradingContext
// computeAMMInternalTrade
// computeM0
// isAMMSafe
// computeDeltaMargin
// computeAMMSafeShortPositionAmount
// computeAMMSafeLongPositionAmount
let a: AccountDetails | null = null
a
normalizeBigNumberish
let b: InsufficientLiquidityError | null = null
b
let c: LiquidityPoolStorage | null = null
c
poolStorage0
poolStorage1
poolStorage2
poolStorage3
poolStorage4
poolStorage5
poolStorage6
initAMMTradingContextEagerEvaluation
let d: AMMTradingContext | null = null
d
