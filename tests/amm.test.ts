import BigNumber from 'bignumber.js'
import {
  initAMMTradingContext,
  initAMMTradingContextEagerEvaluation,
  computeAMMInternalTrade,
  computeAMMPoolMargin,
  isAMMSafe,
  computeDeltaMargin,
  computeAMMSafeShortPositionAmount,
  computeAMMSafeLongPositionAmount,
  computeFundingRate,
} from '../src/amm'
import { _0, _1 } from '../src/constants'
import {
  MarketState,
  MarketStorage,
  LiquidityPoolStorage,
  AMMTradingContext,
  InsufficientLiquidityError,
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
  keeperGasReward: new BigNumber(2),

  halfSpread: new BigNumber(0.001),
  beta1: new BigNumber(100),
  beta2: new BigNumber(90),
  fundingRateLimit: new BigNumber(0.005),
  maxLeverage: new BigNumber(3),
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
// available margin = 10000, 10000
// max pos2 = 100, -141.42135623730950488
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
// available margin = 10000, 10005.0479311506160242805
// max pos2 = -141.067359796658844252
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
// available margin = 9273.09477715884768908142691791, 9428.820844177342198192
// max pos2 = -130.759540184393963844
const poolStorage2: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0', shareTokenAddress: '0x0', fundingTime: 1579601290,
  ammCashBalance: new BigNumber('14599'),
  markets: {
    [TEST_MARKET_ID]: { ...market1, ammPositionAmount: new BigNumber('-50') },
    [TEST_MARKET_ID2]: { ...market1, ammPositionAmount: new BigNumber('10') },
  },
}

// [3] short 3: unsafe
// available cash = 16753.12619691409782671538929731 - 1.9 * (-80) - 1.9 * (10) = 16886.12619691409782671538929731
// available margin = unsafe / unsafe
const poolStorage3: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0', shareTokenAddress: '0x0', fundingTime: 1579601290,
  ammCashBalance: new BigNumber('16753.12619691409782671538929731'),
  markets: {
    [TEST_MARKET_ID]: { ...market1, ammPositionAmount: new BigNumber('-80') },
    [TEST_MARKET_ID2]: { ...market1, ammPositionAmount: new BigNumber('10') },
  },
}

// [4] long 1: normal
// available cash = 8138 - 1.9 * (10) - 1.9 * (10)= 8100
// available margin = 10000, 10005.0479311506160242805
// max pos2 = 100
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
// available margin = 4893.31346231725208539935787445, 5356.336460086846919343
// max pos2 = 48.933134623172520854
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
// available cash = 1925 - 1.9 * (80) - 1.9 * (10) = 1754
// available margin = unsafe / unsafe
const poolStorage6: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0', shareTokenAddress: '0x0', fundingTime: 1579601290,
  ammCashBalance: new BigNumber('1925'),
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
    poolMargin: BigNumber
  }

  const successCases: Array<ComputeAccountCase> = [
    {
      amm: poolStorage0,
      availableCash: new BigNumber('10000'),
      isAMMSafe: true,
      poolMargin: new BigNumber('10000'),
    },
    {
      amm: poolStorage1,
      availableCash: new BigNumber('10100'),
      isAMMSafe: true,
      poolMargin: new BigNumber('10000'),
    },
    {
      amm: poolStorage2,
      availableCash: new BigNumber('14675'),
      isAMMSafe: true,
      poolMargin: new BigNumber('9273.09477715884768908142691791'),
    },
    {
      amm: poolStorage3,
      availableCash: new BigNumber('16886.12619691409782671538929731'),
      isAMMSafe: false,
      poolMargin: _0
    },
    {
      amm: poolStorage4,
      availableCash: new BigNumber('8100'),
      isAMMSafe: true,
      poolMargin: new BigNumber('10000'),
    },
    {
      amm: poolStorage5,
      availableCash: new BigNumber('1550'),
      isAMMSafe: true,
      poolMargin: new BigNumber('4893.31346231725208539935787445'),
    },
    {
      amm: poolStorage6,
      availableCash: new BigNumber('1754'),
      isAMMSafe: false,
      poolMargin: _0,
    },
  ]

  successCases.forEach((element, index) => {
    it(`${index}`, function () {
      const context1 = initAMMTradingContext(element.amm, TEST_MARKET_ID)
      expect(context1.cash).toApproximate(normalizeBigNumberish(element.availableCash))

      const safe = isAMMSafe(context1, beta1)
      expect(safe).toEqual(element.isAMMSafe)

      if (element.isAMMSafe) {
        const context2 = computeAMMPoolMargin(context1, beta1)
        expect(context2.poolMargin).toApproximate(normalizeBigNumberish(element.poolMargin))
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
      otherHalfSpread: [ _0 ],
      beta1: new BigNumber('1000'),
      beta2: new BigNumber('1000'),
      halfSpread: _0, fundingRateLimit: _0, maxLeverage: _0,
      otherBeta1: [ new BigNumber('100') ],
      otherBeta2: [ new BigNumber('100') ],
      otherFundingRateCoefficient: [ _0 ], otherMaxLeverage: [ _0 ],
      poolMargin: _0, deltaMargin: _0, deltaPosition: _0,
      valueWithoutCurrent: _0, squareValueWithoutCurrent: _0, positionMarginWithoutCurrent: _0,
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
      otherHalfSpread: [ _0 ],
      beta1: new BigNumber('100'),
      beta2: new BigNumber('100'),
      halfSpread: _0, fundingRateLimit: _0, maxLeverage: _0,
      otherBeta1: [ new BigNumber('100') ],
      otherBeta2: [ new BigNumber('100') ],
      otherFundingRateCoefficient: [ _0 ], otherMaxLeverage: [ _0 ],
      poolMargin: _0, deltaMargin: _0, deltaPosition: _0,
      valueWithoutCurrent: _0, squareValueWithoutCurrent: _0, positionMarginWithoutCurrent: _0,
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
      otherHalfSpread: [ _0 ],
      beta1: new BigNumber('100'),
      beta2: new BigNumber('100'),
      halfSpread: _0, fundingRateLimit: _0, maxLeverage: _0,
      otherBeta1: [ new BigNumber('100') ],
      otherBeta2: [ new BigNumber('100') ],
      otherFundingRateCoefficient: [ _0 ], otherMaxLeverage: [ _0 ],
      poolMargin: _0, deltaMargin: _0, deltaPosition: _0,
      valueWithoutCurrent: _0, squareValueWithoutCurrent: _0, positionMarginWithoutCurrent: _0,
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
      otherHalfSpread: [ _0 ],
      beta1: new BigNumber('1000'),
      beta2: new BigNumber('1000'),
      halfSpread: _0, fundingRateLimit: _0, maxLeverage: _0,
      otherBeta1: [ new BigNumber('100') ],
      otherBeta2: [ new BigNumber('100') ],
      otherFundingRateCoefficient: [ _0 ], otherMaxLeverage: [ _0 ],
      poolMargin: _0, deltaMargin: _0, deltaPosition: _0,
      valueWithoutCurrent: _0, squareValueWithoutCurrent: _0, positionMarginWithoutCurrent: _0,
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
      otherHalfSpread: [ _0 ],
      beta1: new BigNumber('100'),
      beta2: new BigNumber('100'),
      halfSpread: _0, fundingRateLimit: _0, maxLeverage: _0,
      otherBeta1: [ new BigNumber('100') ],
      otherBeta2: [ new BigNumber('100') ],
      otherFundingRateCoefficient: [ _0 ], otherMaxLeverage: [ _0 ],
      poolMargin: _0, deltaMargin: _0, deltaPosition: _0,
      valueWithoutCurrent: _0, squareValueWithoutCurrent: _0, positionMarginWithoutCurrent: _0,
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
      otherHalfSpread: [ _0 ],
      beta1: new BigNumber('100'),
      beta2: new BigNumber('100'),
      halfSpread: _0, fundingRateLimit: _0, maxLeverage: _0,
      otherBeta1: [ new BigNumber('100') ],
      otherBeta2: [ new BigNumber('100') ],
      otherFundingRateCoefficient: [ _0 ], otherMaxLeverage: [ _0 ],
      poolMargin: _0, deltaMargin: _0, deltaPosition: _0,
      valueWithoutCurrent: _0, squareValueWithoutCurrent: _0, positionMarginWithoutCurrent: _0,
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
      const context = computeAMMPoolMargin(initAMMTradingContext(element.amm, TEST_MARKET_ID), beta1)
      const deltaMargin = computeDeltaMargin(context, beta1, element.pos2)
      expect(deltaMargin).toApproximate(normalizeBigNumberish(element.deltaMargin))
    })
  })
})

describe('safePosition', function () {
  it('short: condition3 √, condition2 ×. condition 3 selected', function () {
    const beta = new BigNumber('100')
    const context = computeAMMPoolMargin(initAMMTradingContext(poolStorage1, TEST_MARKET_ID), beta)
    expect(isAMMSafe(context, beta)).toBeTruthy()
    const pos2 = computeAMMSafeShortPositionAmount(context, beta)
    expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('-141.067359796658844252321636909')))
  })

  it('short: condition3 √, condition2 √. condition 2 selected', function () {
    const beta = new BigNumber('100')
    const context = computeAMMPoolMargin(initAMMTradingContext({
      ...poolStorage1,
      markets: {
        [TEST_MARKET_ID]: { ...poolStorage1.markets[TEST_MARKET_ID], maxLeverage: new BigNumber('0.5'), },
        [TEST_MARKET_ID2]: poolStorage1.markets[TEST_MARKET_ID2],
      }
    }, TEST_MARKET_ID), beta)
    expect(isAMMSafe(context, beta)).toBeTruthy()
    const pos2 = computeAMMSafeShortPositionAmount(context, beta)
    expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('-56.589168238006977708561982164')))
  })

  it('short: condition3 √, condition2 √. condition 3 selected', function () {
    const beta = new BigNumber('142.6933822319389')
    const context = computeAMMPoolMargin(initAMMTradingContext({
      ...poolStorage1,
      markets: {
        [TEST_MARKET_ID]: {
          ...poolStorage1.markets[TEST_MARKET_ID], maxLeverage: new BigNumber('0.5'), indexPrice: new BigNumber(100),
          ammPositionAmount: new BigNumber('-10'), beta1: beta },
        [TEST_MARKET_ID2]: {
          ...poolStorage1.markets[TEST_MARKET_ID2], indexPrice: new BigNumber('90'),
          ammPositionAmount: new BigNumber('85.5148648938521'), beta1: new BigNumber('200'), },
      }
    }, TEST_MARKET_ID), beta)
    expect(isAMMSafe(context, beta)).toBeTruthy()
    const pos2 = computeAMMSafeShortPositionAmount(context, beta)
    expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('-69.2197544117782')))
  })

  it('short: condition3 ×', function () {
    // TODO
  })

  it('long: condition3 √, condition2 ×, condition 1 selected', function () {
    const beta = new BigNumber('100')
    const context = computeAMMPoolMargin(initAMMTradingContext(poolStorage4, TEST_MARKET_ID), beta)
    expect(isAMMSafe(context, beta)).toBeTruthy()
    const pos2 = computeAMMSafeLongPositionAmount(context, beta)
    expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('100')))
  })

  it('long: condition3 √, condition2 √, condition 2 selected', function () {
    const beta = new BigNumber('100')
    const context = computeAMMPoolMargin(initAMMTradingContext({
      ...poolStorage4,
      markets: {
        [TEST_MARKET_ID]: { ...poolStorage4.markets[TEST_MARKET_ID], maxLeverage: new BigNumber('0.5'), },
        [TEST_MARKET_ID2]: poolStorage4.markets[TEST_MARKET_ID2],
      }
    }, TEST_MARKET_ID), beta)
    expect(isAMMSafe(context, beta)).toBeTruthy()
    const pos2 = computeAMMSafeLongPositionAmount(context, beta)
    expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('56.589168238006977708561982164')))
  })

  it('long: condition3 √, condition2 ×, condition 3 selected', function () {
    const beta = new BigNumber('39.77')
    const context = computeAMMPoolMargin(initAMMTradingContext({
      ...poolStorage4,
      markets: {
        [TEST_MARKET_ID]: { ...poolStorage4.markets[TEST_MARKET_ID], beta1: beta },
        [TEST_MARKET_ID2]: {
          ...poolStorage4.markets[TEST_MARKET_ID2], indexPrice: new BigNumber('10'),
          ammPositionAmount: new BigNumber('-109'), beta1: new BigNumber('30'), },
      }
    }, TEST_MARKET_ID), beta)
    expect(isAMMSafe(context, beta)).toBeTruthy()
    const pos2 = computeAMMSafeLongPositionAmount(context, beta)
    expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('176.61598769492977')))
  })

  it('long: condition3 ×', function () {
    // TODO
  })
})

describe('trade - success', function () {
  interface ComputeAccountCase {
    name: string
    amm: LiquidityPoolStorage
    amount: BigNumber

    // expected
    deltaMargin: BigNumber
  }

  const successCases: Array<ComputeAccountCase> = [
    {
      name: 'open 0 -> -141.421',
      amm: poolStorage0,
      amount: new BigNumber('-141.421'),
      deltaMargin: new BigNumber('24166.1916701205') // trader buy, 24142.0496205 (1 + α)
    },
    {
      name: 'open -10 -> -141.067',
      amm: poolStorage1,
      amount: new BigNumber('-131.067'),
      deltaMargin: new BigNumber('23029.6558937445') // trader buy, 23006.6492445 (1 + α)
    },
    {
      name: 'open 0 -> 100',
      amm: poolStorage0,
      amount: new BigNumber('100'),
      deltaMargin: new BigNumber('-4995') // trader sell, -5000 (1 - α)
    },
    {
      name: 'open 10 -> 100',
      amm: poolStorage4,
      amount: new BigNumber('90'),
      deltaMargin: new BigNumber('-4045.95') // trader sell, -4050 (1 - α)
    },
    {
      name: 'close -10 -> -9',
      amm: poolStorage1,
      amount: new BigNumber('1'),
      deltaMargin: new BigNumber('-108.4371405102481132569021') // trader sell, -108.5456861964445578147169 (1 - α)
    },
    {
      name: 'close -10 -> 0',
      amm: poolStorage1,
      amount: new BigNumber('10'),
      deltaMargin: new BigNumber('-1043.932318474990069773169') // trader sell, -1044.977295770760830603773 (1 - α)
    },
    {
      name: 'close 10 -> 9',
      amm: poolStorage4,
      amount: new BigNumber('-1'),
      deltaMargin: new BigNumber('91.5457681173589976274684') // trader buy, 91.4543138035554421852831 (1 + α)
    },
    {
      name: 'close 10 -> 0',
      amm: poolStorage4,
      amount: new BigNumber('-10'),
      deltaMargin: new BigNumber('955.977726933468408565623') // trader buy, 955.022704229239169396227 (1 + α)
    },
    {
      name: 'close unsafe -10 -> -9',
      amm: poolStorage3,
      amount: new BigNumber('1'),
      deltaMargin: new BigNumber('-99.9') // trader sell, 100 (1 - α)
    },
    {
      name: 'close unsafe 10 -> 9',
      amm: poolStorage6,
      amount: new BigNumber('-1'),
      deltaMargin: new BigNumber('100.1') // trader buy, 100 (1 + α)
    },
  ]

  successCases.forEach(element => {
    it(element.name, function () {
      const context = computeAMMInternalTrade(element.amm, TEST_MARKET_ID, element.amount)
      expect(context.deltaMargin).toApproximate(normalizeBigNumberish(element.deltaMargin))
    })
  })
})

describe('trade - fail', function () {
  interface ComputeAccountCase {
    name: string
    amm: LiquidityPoolStorage
    amount: BigNumber
  }

  const failCases: Array<ComputeAccountCase> = [
    {
      name: 'open 0 -> -141.422, pos2 too large',
      amm: poolStorage0,
      amount: new BigNumber('-141.422'),
    },
    {
      name: 'open -10 -> -141.068, pos2 too large',
      amm: poolStorage1,
      amount: new BigNumber('-131.068'),
    },
    {
      name: 'open -10 already unsafe',
      amm: poolStorage3,
      amount: new BigNumber('-0.01'),
    },
    {
      name: 'open 0 -> 100.001',
      amm: poolStorage0,
      amount: new BigNumber('100.001'),
    },
    {
      name: 'open 10 -> 100.001',
      amm: poolStorage4,
      amount: new BigNumber('90.001'),
    },
    {
      name: 'open 10 already unsafe',
      amm: poolStorage6,
      amount: new BigNumber('0.01'),
    },
  ]

  failCases.forEach(element => {
    it(element.name, () => {
      expect((): void => {
        computeAMMInternalTrade(element.amm, TEST_MARKET_ID, element.amount)
      }).toThrow(InsufficientLiquidityError)
    })
  })
})

describe('computeFundingRate', function () {
  it('normal', () => {
    expect(computeFundingRate(poolStorage0, TEST_MARKET_ID)).toApproximate(normalizeBigNumberish('0'))
    expect(computeFundingRate(poolStorage1, TEST_MARKET_ID)).toApproximate(normalizeBigNumberish('0.0005'))
    expect(computeFundingRate(poolStorage2, TEST_MARKET_ID)).toApproximate(normalizeBigNumberish('0.00269597158238683137'))
    expect(computeFundingRate(poolStorage3, TEST_MARKET_ID)).toApproximate(normalizeBigNumberish('0.005'))
    expect(computeFundingRate(poolStorage4, TEST_MARKET_ID)).toApproximate(normalizeBigNumberish('-0.0005'))
    expect(computeFundingRate(poolStorage5, TEST_MARKET_ID)).toApproximate(normalizeBigNumberish('-0.00510901257246682291'))
    expect(computeFundingRate(poolStorage6, TEST_MARKET_ID)).toApproximate(normalizeBigNumberish('-0.005'))
  })
})

