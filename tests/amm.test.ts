import BigNumber from 'bignumber.js'
import {
  initAMMTradingContext,
  initAMMTradingContextEagerEvaluation,
  // computeAMMInternalTrade,
  // computeM0,
  isAMMSafe,
  // computeDeltaMargin,
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
  beta1: new BigNumber(0.2),
  beta2: new BigNumber(0.1),
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

const amms = [
  // [0] zero
  // original cash = 1000, entryValue: 0, entryFunding: 0
  {
    cashBalance: new BigNumber('1000'),
    positionAmount: new BigNumber('0'),
  },

  // [1] short 1: normal
  // available cash = 2110.12564102564103 - 1.9 * (-11) = 2131.02564102564103
  {
    cashBalance: new BigNumber('2110.12564102564103'),
    positionAmount: new BigNumber('-11'),
  },

  // [2] short 2: loss but safe
  // available cash = 1820.402395209580838 - 1.9 * (-11) = 1841.302395209580838
  {
    cashBalance: new BigNumber('1820.402395209580838'),
    positionAmount: new BigNumber('-11'),
  },

  // [3] short 3: unsafe
  // available cash = 1535.897752808988764 - 1.9 * (-11) = 1556.797752808988764
  {
    cashBalance: new BigNumber('1535.897752808988764'),
    positionAmount: new BigNumber('-11'),
  },

  // [4] long 1: normal
  // available cash = -49.917106108326075085 - 1.9 * 11 = -70.817106108326075085
  {
    cashBalance: new BigNumber('-49.917106108326075085'),
    positionAmount: new BigNumber('11'),
  },

  // [5] long 2: loss but safe
  // available cash = -356.70900789632941 - 1.9 * 11 = -377.60900789632941
  {
    cashBalance: new BigNumber('-356.70900789632941'),
    positionAmount: new BigNumber('11'),
  },

  // [6]
  // long 3: unsafe
  // available cash = -654.65080722289376 - 1.9 * 11 = -675.55080722289376
  {
    cashBalance: new BigNumber('-654.65080722289376'),
    positionAmount: new BigNumber('11'),
  },
]

const TEST_MARKET_ID = '0x0'

const poolStorage: LiquidityPoolStorage[] = []
for (let i = 0; i < amms.length; i++) {
  poolStorage.push({
    collateralTokenAddress: '0x0',
    shareTokenAddress: '0x0',
    fundingTime: 1579601290,
    ammCashBalance: amms[i].cashBalance,
    markets: {
      [TEST_MARKET_ID]: {
        ...market1,
        ammPositionAmount: amms[i].positionAmount,
      }
    },
  })
}

describe('initAMMTradingContext', function () {
  it('0', function () {
    const context: AMMTradingContext = initAMMTradingContext(poolStorage[0], TEST_MARKET_ID)
    expect(context.cash).toBeBigNumber(normalizeBigNumberish("1000"))
  })
  it('1', function () {
    const context: AMMTradingContext = initAMMTradingContext(poolStorage[1], TEST_MARKET_ID)
    expect(context.cash).toBeBigNumber(normalizeBigNumberish("2131.02564102564103"))
  })
  it('2', function () {
    const context: AMMTradingContext = initAMMTradingContext(poolStorage[2], TEST_MARKET_ID)
    expect(context.cash).toBeBigNumber(normalizeBigNumberish("1841.302395209580838"))
  })
  it('3', function () {
    const context: AMMTradingContext = initAMMTradingContext(poolStorage[3], TEST_MARKET_ID)
    expect(context.cash).toBeBigNumber(normalizeBigNumberish("1556.797752808988764"))
  })
  it('4', function () {
    const context: AMMTradingContext = initAMMTradingContext(poolStorage[4], TEST_MARKET_ID)
    expect(context.cash).toBeBigNumber(normalizeBigNumberish("-70.817106108326075085"))
  })
  it('5', function () {
    const context: AMMTradingContext = initAMMTradingContext(poolStorage[5], TEST_MARKET_ID)
    expect(context.cash).toBeBigNumber(normalizeBigNumberish("-377.60900789632941"))
  })
  it('6', function () {
    const context: AMMTradingContext = initAMMTradingContext(poolStorage[6], TEST_MARKET_ID)
    expect(context.cash).toBeBigNumber(normalizeBigNumberish("-675.55080722289376"))
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
      isAMMSafe: false, availableMargin: _0, deltaMargin: _0, deltaPosition: _0,
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
      isAMMSafe: false, availableMargin: _0, deltaMargin: _0, deltaPosition: _0,
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
      isAMMSafe: false, availableMargin: _0, deltaMargin: _0, deltaPosition: _0,
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
      isAMMSafe: false, availableMargin: _0, deltaMargin: _0, deltaPosition: _0,
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
      isAMMSafe: false, availableMargin: _0, deltaMargin: _0, deltaPosition: _0,
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
      isAMMSafe: false, availableMargin: _0, deltaMargin: _0, deltaPosition: _0,
      marginBalanceWithoutCurrent: _0, squareWithoutCurrent: _0
    })
    expect(isAMMSafe(context, new BigNumber('100') /* beta */)).toBeFalsy()
  })
  it(`zero - ok`, function () {
  })
  it(`zero - fail`, function () {
  })
})

// describe('computeM0', function () {
//   interface ComputeAccountCase {
//     amm: AccountDetails
//     beta: BigNumber

//     // expected
//     isSafe: boolean
//     mv: BigNumber
//     m0: BigNumber
//     ma1: BigNumber
//   }

//   const successCases: Array<ComputeAccountCase> = [
//     {
//       amm: ammDetails0,
//       beta: new BigNumber('0.1'),
//       isSafe: true,
//       mv: new BigNumber('4000'),
//       m0: new BigNumber('5000'),
//       ma1: new BigNumber('5000'),
//     },
//     {
//       amm: ammDetails1,
//       beta: new BigNumber('0.1'),
//       isSafe: true,
//       mv: new BigNumber('4000'),
//       m0: new BigNumber('5000'),
//       ma1: new BigNumber('6131.02564102564103'),
//     },
//     {
//       amm: ammDetails2,
//       beta: new BigNumber('0.1'),
//       isSafe: true,
//       mv: new BigNumber('2759.160077895718149991'),
//       m0: new BigNumber('3448.950097369647687489'), // mv / 4 * 5
//       ma1: new BigNumber('4600.462473105298987991'),
//     },
//     {
//       amm: ammDetails3,
//       beta: new BigNumber('0.1'),
//       isSafe: false,
//       mv: _0,
//       m0: _0,
//       ma1: _0,
//     },
//     {
//       amm: ammDetails4,
//       beta: new BigNumber('0.1'),
//       isSafe: true,
//       mv: new BigNumber('4000'),
//       m0: new BigNumber('5000'),
//       ma1: new BigNumber('3929.18289389167392'),
//     },
//     {
//       amm: ammDetails5,
//       beta: new BigNumber('0.1'),
//       isSafe: true,
//       mv: new BigNumber('2698.739297452669114401'),
//       m0: new BigNumber('3373.424121815836393002'), // mv / 4 * 5
//       ma1: new BigNumber('2321.130289556339704401'),
//     },
//     {
//       amm: ammDetails6,
//       beta: new BigNumber('0.1'),
//       isSafe: false,
//       mv: _0,
//       m0: _0,
//       ma1: _0,
//     }
//   ]

//   successCases.forEach((element, index) => {
//     it(`${index}`, function () {
//       const context = computeM0(initAMMTradingContext(perpetualStorage, element.amm), element.beta)
//       expect(context.isSafe).toEqual(element.isSafe)
//       if (context.isSafe) {
//         expect(context.mv).toApproximate(normalizeBigNumberish(element.mv))
//         expect(context.m0).toApproximate(normalizeBigNumberish(element.m0))
//         expect(context.ma1).toApproximate(normalizeBigNumberish(element.ma1))
//       }
//     })
//   })
// })

// describe('computeDeltaMargin', function () {
//   interface ComputeAccountCase {
//     name: string
//     amm: AccountDetails
//     beta: BigNumber
//     pos2: BigNumber

//     // expected
//     deltaMargin: BigNumber
//   }

//   const successCases: Array<ComputeAccountCase> = [
//     {
//       name: '0 -> +5',
//       amm: ammDetails0,
//       beta: new BigNumber('0.1'),
//       pos2: new BigNumber('5'),
//       deltaMargin: new BigNumber('-494.570984085309081')
//     },
//     {
//       name: '0 -> -5',
//       amm: ammDetails0,
//       beta: new BigNumber('0.1'),
//       pos2: new BigNumber('-5'),
//       deltaMargin: new BigNumber('505.555555555555556')
//     },
//   ]

//   successCases.forEach(element => {
//     it(element.name, function () {
//       const context = computeM0(initAMMTradingContext(perpetualStorage, element.amm), element.beta)
//       const deltaMargin = computeDeltaMargin(context, element.beta, element.pos2)
//       expect(deltaMargin).toApproximate(normalizeBigNumberish(element.deltaMargin))
//     })
//   })
// })

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
