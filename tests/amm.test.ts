import BigNumber from 'bignumber.js'
import {
  computeAccount,
} from '../src/computation'
import {
  initAMMTradingContext,
  computeAMMInternalTrade,
  computeM0,
  isAMMSafe,
  computeDeltaMargin,
  computeAMMSafeShortPositionAmount,
  computeAMMSafeLongPositionAmount,
} from '../src/amm'
import { _0, _1 } from '../src/constants'
import {
  PerpetualStorage,
  AccountStorage,
  AccountDetails,
  AMMTradingContext
} from '../src/types'
import { normalizeBigNumberish } from '../src/utils'
import { extendExpect } from './helper'
import { InsufficientReservesError } from '../src/types'

extendExpect()

const perpetualStorage: PerpetualStorage = {
  underlyingSymbol: 'T',
  collateralTokenAddress: '0x0',
  shareTokenAddress: '0x0',
  oracleAddress: '0x0',

  initialMarginRate: new BigNumber(0.1),
  maintenanceMarginRate: new BigNumber(0.05),
  liquidatorPenaltyRate: new BigNumber(0.005),
  keeperGasReward: new BigNumber(2),

  halfSpreadRate: new BigNumber(0.001),
  beta1: new BigNumber(0.2),
  beta2: new BigNumber(0.1),
  fundingRateCoefficient: new BigNumber(0.005),
  targetLeverage: new BigNumber(5),
  lpFeeRate: new BigNumber(0.0008),
  vaultFeeRate: new BigNumber(0.0001),
  operatorFeeRate: new BigNumber(0.0001),
  referrerRebateRate: new BigNumber(0.0000),

  insuranceFund1: new BigNumber('0.0'),
  insuranceFund2: new BigNumber('0.0'),
  isEmergency: false,
  isGlobalSettled: false,
  markPrice: new BigNumber(95),
  indexPrice: new BigNumber(100),
  accumulatedFundingPerContract: new BigNumber('1.9'),
  fundingTime: 1579601290
}

// empty
const ammStorage0: AccountStorage = {
  cashBalance: new BigNumber('1000'),
  positionAmount: _0,
  entryValue: null,
  entryFundingLoss: _0,
}

// short 1: normal
const ammStorage1: AccountStorage = {
  cashBalance: new BigNumber('2109.21564102564103'),
  positionAmount: new BigNumber('-11'),
  entryValue: null,
  entryFundingLoss: new BigNumber('0.91'),
  // fundingLoss = 1.9 * (-11) - 0.91 = -21.81
  // available cash = 2109.21564102564103 - (-21.81) = 2131.02564102564103
}

// short 2: loss but safe
const ammStorage2: AccountStorage = {
  cashBalance: new BigNumber('1819.492395209580838'),
  positionAmount: new BigNumber('-11'),
  entryValue: null,
  entryFundingLoss: new BigNumber('0.91'),
  // fundingLoss = 1.9 * (-11) - 0.91 = -21.81
  // available cash = 1819.492395209580838 - (-21.81) = 1841.302395209580838
}

// short 3: unsafe
const ammStorage3: AccountStorage = {
  cashBalance: new BigNumber('1534.987752808988764'),
  positionAmount: new BigNumber('-11'),
  entryValue: null,
  entryFundingLoss: new BigNumber('0.91'),
  // fundingLoss = 1.9 * (-11) - 0.91 = -21.81
  // available cash = 1534.987752808988764 - (-21.81) = 1556.797752808988764
}

// long 1: normal
const ammStorage4: AccountStorage = {
  cashBalance: new BigNumber('-49.007106108326075085'),
  positionAmount: new BigNumber('11'),
  entryValue: null,
  entryFundingLoss: new BigNumber('-0.91'),
  // funding = 1.9 * 11 -(-0.91) = 21.81
  // available cash = -49.007106108326075085 - 21.81 = -70.817106108326075085
}

// long 2: loss but safe
const ammStorage5: AccountStorage = {
  cashBalance: new BigNumber('-355.79900789632941'),
  positionAmount: new BigNumber('11'),
  entryValue: null,
  entryFundingLoss: new BigNumber('-0.91'),
  // funding = 1.9 * 11 -(-0.91) = 21.81
  // available cash = -355.79900789632941 - 21.81 = -377.60900789632941
}

// long 3: unsafe
const ammStorage6: AccountStorage = {
  cashBalance: new BigNumber('-653.74080722289376'),
  positionAmount: new BigNumber('11'),
  entryValue: null,
  entryFundingLoss: new BigNumber('-0.91'),
  // funding = 1.9 * 11 -(-0.91) = 21.81
  // available cash = -653.74080722289376 - 21.81 = -675.55080722289376
}

const ammDetails0 = computeAccount(perpetualStorage, ammStorage0)
const ammDetails1 = computeAccount(perpetualStorage, ammStorage1)
const ammDetails2 = computeAccount(perpetualStorage, ammStorage2)
const ammDetails3 = computeAccount(perpetualStorage, ammStorage3)
const ammDetails4 = computeAccount(perpetualStorage, ammStorage4)
const ammDetails5 = computeAccount(perpetualStorage, ammStorage5)
const ammDetails6 = computeAccount(perpetualStorage, ammStorage6)

describe('isAMMSafe', function () {
  // long: larger index is safer
  it(`long - ok`, function () {
    const context: AMMTradingContext = {
      index: new BigNumber('11.026192936488206'),
      cash: new BigNumber('-70.81710610832608'),
      pos1: new BigNumber('11'),
      lev: new BigNumber('5'),
      isSafe: true, m0: _0, mv: _0, ma1: _0, deltaMargin: _0, deltaPosition: _0,
    }
    expect(isAMMSafe(context, new BigNumber('0.1') /* beta */)).toBeTruthy()
  })
  it(`long - fail`, function () {
    const context: AMMTradingContext = {
      index: new BigNumber('11.026192936488204'),
      cash: new BigNumber('-70.81710610832608'),
      pos1: new BigNumber('11'),
      lev: new BigNumber('5'),
      isSafe: true, m0: _0, mv: _0, ma1: _0, deltaMargin: _0, deltaPosition: _0,
    }
    expect(isAMMSafe(context, new BigNumber('0.1') /* beta */)).toBeFalsy()
  })
  it(`long - positive cash is always safe`, function () {
    const context: AMMTradingContext = {
      index: new BigNumber('-1'),
      cash: new BigNumber('0'),
      pos1: new BigNumber('11'),
      lev: new BigNumber('5'),
      isSafe: true, m0: _0, mv: _0, ma1: _0, deltaMargin: _0, deltaPosition: _0,
    }
    expect(isAMMSafe(context, new BigNumber('0.1') /* beta */)).toBeTruthy()
  })
  it(`short - ok`, function () {
    const context: AMMTradingContext = {
      index: new BigNumber('130.647439610301681'),
      cash: new BigNumber('2131.0256410256410'),
      pos1: new BigNumber('-11'),
      lev: new BigNumber('5'),
      isSafe: true, m0: _0, mv: _0, ma1: _0, deltaMargin: _0, deltaPosition: _0,
    }
    expect(isAMMSafe(context, new BigNumber('0.1') /* beta */)).toBeTruthy()
  })
  it(`short - fail`, function () {
    const context: AMMTradingContext = {
      index: new BigNumber('130.647439610301682'),
      cash: new BigNumber('2131.0256410256410'),
      pos1: new BigNumber('-11'),
      lev: new BigNumber('5'),
      isSafe: true, m0: _0, mv: _0, ma1: _0, deltaMargin: _0, deltaPosition: _0,
    }
    expect(isAMMSafe(context, new BigNumber('0.1') /* beta */)).toBeFalsy()
  })
})

describe('computeM0', function () {
  interface ComputeAccountCase {
    amm: AccountDetails
    beta: BigNumber

    // expected
    isSafe: boolean
    mv: BigNumber
    m0: BigNumber
    ma1: BigNumber
  }

  const successCases: Array<ComputeAccountCase> = [
    {
      amm: ammDetails0,
      beta: new BigNumber('0.1'),
      isSafe: true,
      mv: new BigNumber('4000'),
      m0: new BigNumber('5000'),
      ma1: new BigNumber('5000'),
    },
    {
      amm: ammDetails1,
      beta: new BigNumber('0.1'),
      isSafe: true,
      mv: new BigNumber('4000'),
      m0: new BigNumber('5000'),
      ma1: new BigNumber('6131.02564102564103'),
    },
    {
      amm: ammDetails2,
      beta: new BigNumber('0.1'),
      isSafe: true,
      mv: new BigNumber('2759.160077895718149991'),
      m0: new BigNumber('3448.950097369647687489'), // mv / 4 * 5
      ma1: new BigNumber('4600.462473105298987991'),
    },
    {
      amm: ammDetails3,
      beta: new BigNumber('0.1'),
      isSafe: false,
      mv: _0,
      m0: _0,
      ma1: _0,
    },
    {
      amm: ammDetails4,
      beta: new BigNumber('0.1'),
      isSafe: true,
      mv: new BigNumber('4000'),
      m0: new BigNumber('5000'),
      ma1: new BigNumber('3929.18289389167392'),
    },
    {
      amm: ammDetails5,
      beta: new BigNumber('0.1'),
      isSafe: true,
      mv: new BigNumber('2698.739297452669114401'),
      m0: new BigNumber('3373.424121815836393002'), // mv / 4 * 5
      ma1: new BigNumber('2321.130289556339704401'),
    },
    {
      amm: ammDetails6,
      beta: new BigNumber('0.1'),
      isSafe: false,
      mv: _0,
      m0: _0,
      ma1: _0,
    }
  ]

  successCases.forEach((element, index) => {
    it(`${index}`, function () {
      const context = computeM0(initAMMTradingContext(perpetualStorage, element.amm), element.beta)
      expect(context.isSafe).toEqual(element.isSafe)
      if (context.isSafe) {
        expect(context.mv).toApproximate(normalizeBigNumberish(element.mv))
        expect(context.m0).toApproximate(normalizeBigNumberish(element.m0))
        expect(context.ma1).toApproximate(normalizeBigNumberish(element.ma1))
      }
    })
  })
})

describe('computeDeltaMargin', function () {
  interface ComputeAccountCase {
    name: string
    amm: AccountDetails
    beta: BigNumber
    pos2: BigNumber

    // expected
    deltaMargin: BigNumber
  }

  const successCases: Array<ComputeAccountCase> = [
    {
      name: '0 -> +5',
      amm: ammDetails0,
      beta: new BigNumber('0.1'),
      pos2: new BigNumber('5'),
      deltaMargin: new BigNumber('-494.570984085309081')
    },
    {
      name: '0 -> -5',
      amm: ammDetails0,
      beta: new BigNumber('0.1'),
      pos2: new BigNumber('-5'),
      deltaMargin: new BigNumber('505.555555555555556')
    },
  ]

  successCases.forEach(element => {
    it(element.name, function () {
      const context = computeM0(initAMMTradingContext(perpetualStorage, element.amm), element.beta)
      const deltaMargin = computeDeltaMargin(context, element.beta, element.pos2)
      expect(deltaMargin).toApproximate(normalizeBigNumberish(element.deltaMargin))
    })
  })
})

describe('safePosition', function () {
  it('shorts from 0', function () {
    const beta = new BigNumber('0.2')
    const context = computeM0(initAMMTradingContext(perpetualStorage, ammDetails0), beta)
    const pos2 = computeAMMSafeShortPositionAmount(context, beta)
    expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('-25')))
  })

  it('longs from 0', function () {
    const beta = new BigNumber('0.2')
    const context = computeM0(initAMMTradingContext(perpetualStorage, ammDetails0), beta)
    const pos2 = computeAMMSafeLongPositionAmount(context, beta)
    expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('37.2594670356232003')))
  })

  it('short: √(beta lev) < 1', function () {
    const beta = new BigNumber('0.1')
    const context = computeM0(initAMMTradingContext(perpetualStorage, ammDetails0), beta)
    const pos2 = computeAMMSafeShortPositionAmount(context, beta)
    expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('-29.28932188134524756')))
  })

  it('short: √(beta lev) = 1', function () {
    const beta = new BigNumber('0.2')
    const context = computeM0(initAMMTradingContext(perpetualStorage, ammDetails0), beta)
    const pos2 = computeAMMSafeShortPositionAmount(context, beta)
    expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('-25')))
  })

  it('short: √(beta lev) > 1', function () {
    const beta = new BigNumber('0.99')
    const context = computeM0(initAMMTradingContext(perpetualStorage, ammDetails0), beta)
    const pos2 = computeAMMSafeShortPositionAmount(context, beta)
    expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('-15.50455121681897322')))
  })

  it('long: (-1 + beta + beta lev) = 0, implies beta < 0.5', function () {
    const beta = new BigNumber('0.2')
    const perp: PerpetualStorage = { ...perpetualStorage }
    perp.targetLeverage = new BigNumber('4')
    const context = computeM0(initAMMTradingContext(perp, ammDetails4), beta)
    expect(context.m0).toApproximate(normalizeBigNumberish(new BigNumber('3815.73003084296943685467')))
    const pos2 = computeAMMSafeLongPositionAmount(context, beta)
    expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('31.7977502570247453')))
  })

  it('long: (-1 + beta + beta lev) < 0 && lev < 2 && beta < (2 - lev)/2', function () {
    const beta = new BigNumber('0.1')
    const perp: PerpetualStorage = { ...perpetualStorage }
    perp.targetLeverage = new BigNumber('1.5')
    const context = computeM0(initAMMTradingContext(perp, ammDetails4), beta)
    expect(context.m0).toApproximate(normalizeBigNumberish(new BigNumber('1198.496129103507772815')))
    const pos2 = computeAMMSafeLongPositionAmount(context, beta)
    expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('17.689313632528408')))
  })

  it('long: (-1 + beta + beta lev) < 0 && beta >= (2 - lev)/2', function () {
    const beta = new BigNumber('0.3')
    const perp: PerpetualStorage = { ...perpetualStorage }
    perp.targetLeverage = new BigNumber('1.5')
    const context = computeM0(initAMMTradingContext(perp, ammDetails4), beta)
    expect(context.m0).toApproximate(normalizeBigNumberish(new BigNumber('732.256192005801738225')))
    const pos2 = computeAMMSafeLongPositionAmount(context, beta)
    expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('15.875912065096235')))
  })

  it('long: (-1 + beta + beta lev) < 0 && lev >= 2', function () {
    const beta = new BigNumber('0.1')
    const perp: PerpetualStorage = { ...perpetualStorage }
    perp.targetLeverage = new BigNumber('2')
    const context = computeM0(initAMMTradingContext(perp, ammDetails4), beta)
    expect(context.m0).toApproximate(normalizeBigNumberish(new BigNumber('1828.289199652552845974')))
    const pos2 = computeAMMSafeLongPositionAmount(context, beta)
    expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('21.2517072860587530')))
  })

  it('long: (-1 + beta + beta lev) > 0', function () {
    const beta = new BigNumber('0.99')
    const perp: PerpetualStorage = { ...perpetualStorage }
    perp.targetLeverage = new BigNumber('2')
    const context = computeM0(initAMMTradingContext(perp, ammDetails4), beta)
    expect(context.m0).toApproximate(normalizeBigNumberish(new BigNumber('758.23018746237011297')))
    const pos2 = computeAMMSafeLongPositionAmount(context, beta)
    expect(pos2).toApproximate(normalizeBigNumberish(new BigNumber('18.2026549289986863')))
  })
})

describe('trade - success', function () {
  interface ComputeAccountCase {
    name: string
    amm: AccountDetails
    amount: BigNumber

    // expected
    deltaMargin: BigNumber
  }

  const successCases: Array<ComputeAccountCase> = [
    {
      name: 'open 0 -> -25',
      amm: ammDetails0,
      amount: new BigNumber('-25'),
      deltaMargin: new BigNumber('3003') // trader buy, 3000 (1 + α)
    },
    {
      name: 'open -11 -> -24',
      amm: ammDetails1,
      amount: new BigNumber('-13'),
      deltaMargin: new BigNumber('1710.76146848312296') // trader buy, 1709.052416067056 (1 + α)
    },
    {
      name: 'open 0 -> 37',
      amm: ammDetails0,
      amount: new BigNumber('37'),
      deltaMargin: new BigNumber('-2896.60792953216181') // trader sell, -2899.5074369691309 (1 - α)
    },
    {
      name: 'open 11 -> 36',
      amm: ammDetails4,
      amount: new BigNumber('25'),
      deltaMargin: new BigNumber('-1775.58545802588185') // trader sell, -1777.3628208467285 (1 - α)
    },
    {
      name: 'close -11 -> -10',
      amm: ammDetails1,
      amount: new BigNumber('1'),
      deltaMargin: new BigNumber('-105.919615384615385') // trader sell, -106.02564102564103 (1 - α)
    },
    {
      name: 'close -11 -> 0',
      amm: ammDetails1,
      amount: new BigNumber('11'),
      deltaMargin: new BigNumber('-1129.89461538461538') // trader sell, -1131.0256410256410 (1 - α)
    },
    {
      name: 'close 11 -> 10',
      amm: ammDetails4,
      amount: new BigNumber('-1'),
      deltaMargin: new BigNumber('94.6008831068813075') // trader buy, 94.5063767301511564 (1 + α)
    },
    {
      name: 'close 11 -> 0',
      amm: ammDetails4,
      amount: new BigNumber('-11'),
      deltaMargin: new BigNumber('1071.88792321443440') // trader buy, 1070.8171061083260751 (1 + α)
    },
    {
      name: 'close unsafe -11 -> -10',
      amm: ammDetails3,
      amount: new BigNumber('1'),
      deltaMargin: new BigNumber('-99.9') // trader sell, 100 (1 - α)
    },
    {
      name: 'close unsafe 11 -> 10',
      amm: ammDetails6,
      amount: new BigNumber('-1'),
      deltaMargin: new BigNumber('100.1') // trader buy, 100 (1 + α)
    },
  ]

  successCases.forEach(element => {
    it(element.name, function () {
      const context = computeAMMInternalTrade(perpetualStorage, element.amm, element.amount)
      expect(context.deltaMargin).toApproximate(normalizeBigNumberish(element.deltaMargin))
    })
  })
})

describe('trade - fail', function () {
  interface ComputeAccountCase {
    name: string
    amm: AccountDetails
    amount: BigNumber
  }

  const failCases: Array<ComputeAccountCase> = [
    {
      name: 'open 0 -> -25.01, pos2 too large',
      amm: ammDetails0,
      amount: new BigNumber('-25.01'),
    },
    {
      name: 'open -11 -> -24.2, pos2 too large',
      amm: ammDetails1,
      amount: new BigNumber('-13.2'),
    },
    {
      name: 'open -11 already unsafe',
      amm: ammDetails3,
      amount: new BigNumber('-0.01'),
    },
    {
      name: 'open 0 -> 37.3',
      amm: ammDetails0,
      amount: new BigNumber('37.3'),
    },
    {
      name: 'open 11 -> 36.3',
      amm: ammDetails4,
      amount: new BigNumber('25.3'),
    },
    {
      name: 'open 11 already unsafe',
      amm: ammDetails6,
      amount: new BigNumber('0.01'),
    },
  ]

  failCases.forEach(element => {
    it(element.name, () => {
      expect((): void => {
        computeAMMInternalTrade(perpetualStorage, element.amm, element.amount)
      }).toThrow(InsufficientReservesError)
    })
  })
})
