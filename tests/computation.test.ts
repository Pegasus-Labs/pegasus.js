import BigNumber from 'bignumber.js'
import {
  computeAccount,
  computeDecreasePosition,
  computeIncreasePosition,
  computeFee,
  computeTradeWithPrice,
  computeAMMPrice,
  computeAMMTrade,
  computeMarginCost
} from '../src/computation'
import { _0, _1 } from '../src/constants'
import {
  BigNumberish,
  PerpetualState,
  PerpetualStorage,
  LiquidityPoolStorage,
  AccountStorage,
  AccountComputed,
  AccountDetails
} from '../src/types'
import { normalizeBigNumberish } from '../src/utils'
import { extendExpect } from './helper'

extendExpect()

const defaultPool: LiquidityPoolStorage = {
  isSynced: true,
  isRunning: true,
  isFastCreationEnabled: false,
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
  unitAccumulativeFunding: new BigNumber('9.9059375'),

  initialMarginRate: new BigNumber(0.1),
  maintenanceMarginRate: new BigNumber(0.05),
  operatorFeeRate: new BigNumber(0.0001),
  lpFeeRate: new BigNumber(0.0007),
  referrerRebateRate: new BigNumber(0.0),
  liquidationPenaltyRate: new BigNumber(0.005),
  keeperGasReward: new BigNumber(1),
  insuranceFundRate: new BigNumber(0.0001),
  insuranceFundCap: new BigNumber(10000),
  insuranceFund: _0,
  donatedInsuranceFund: _0,

  halfSpread: { value: new BigNumber(0.001), minValue: _0, maxValue: _0 },
  openSlippageFactor: { value: new BigNumber('0.0142857142857142857142857142857'), minValue: _0, maxValue: _0 },
  closeSlippageFactor: { value: new BigNumber('0.0128571428571428571428571428571'), minValue: _0, maxValue: _0 },
  fundingRateLimit: { value: new BigNumber(0.005), minValue: _0, maxValue: _0 },
  ammMaxLeverage: { value: new BigNumber(5), minValue: _0, maxValue: _0 },
  maxClosePriceDiscount: { value: new BigNumber(0.05), minValue: _0, maxValue: _0 },

  ammCashBalance: _0, // assign me later
  ammPositionAmount: _0 // assign me later
}

const TEST_MARKET_INDEX0 = 0

// long normal
// availableCashBalance = 83941.29865625 - (9.9059375 * 2.3) = 83918.515
// poolMargin = 100000, 100001.851808570406996527364893
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

// short unsafe
// availableCashBalance = 18119.79134375 - (9.9059375 * (-2.3)) = 18142.575
const poolStorage3: LiquidityPoolStorage = {
  ...defaultPool,
  poolCashBalance: new BigNumber('18119.79134375'),
  perpetuals: new Map([
    [
      TEST_MARKET_INDEX0,
      {
        ...perpetual1,
        ammPositionAmount: new BigNumber('-2.3')
      }
    ]
  ])
}

const accountStorage1: AccountStorage = {
  cashBalance: new BigNumber('7698.86'), // 10000 - 2300.23 + (-0.91)
  positionAmount: new BigNumber('2.3'),
  entryValue: new BigNumber('2300.23'),
  entryFunding: new BigNumber('-0.91')
}

const accountStorage2: AccountStorage = {
  cashBalance: new BigNumber('-1301.14'), // 1000 - 2300.23 + (-0.91)
  positionAmount: new BigNumber('2.3'),
  entryValue: new BigNumber('2300.23'),
  entryFunding: new BigNumber('-0.91')
}

const accountStorage3: AccountStorage = {
  cashBalance: new BigNumber('16301.14'), // 14000 + 2300.23 + 0.91
  positionAmount: new BigNumber('-2.3'),
  entryValue: new BigNumber('-2300.23'),
  entryFunding: new BigNumber('0.91')
}

const accountStorage4: AccountStorage = {
  cashBalance: new BigNumber('10000'),
  positionAmount: _0,
  entryValue: _0,
  entryFunding: _0
}

const accountDetails1 = computeAccount(poolStorage1, TEST_MARKET_INDEX0, accountStorage1)
const accountDetails3 = computeAccount(poolStorage1, TEST_MARKET_INDEX0, accountStorage3)
const accountDetails4 = computeAccount(poolStorage1, TEST_MARKET_INDEX0, accountStorage4)

describe('computeAccount', function() {
  interface ComputeAccountCase {
    name: string
    accountStorage: AccountStorage
    expectedOutput: AccountComputed
  }

  const expectOutput1: AccountComputed = {
    positionValue: new BigNumber('16019.5'),
    positionMargin: new BigNumber('1601.95'),
    maintenanceMargin: new BigNumber('800.975'),
    availableCashBalance: new BigNumber('7676.07634375'),
    marginBalance: new BigNumber('23695.57634375'), // 10000 + (6965 - 2300.23/2.3) * 2.3 - 23.69365625
    availableMargin: new BigNumber('22093.62634375'),
    withdrawableBalance: new BigNumber('22093.62634375'),
    isMMSafe: true,
    isIMSafe: true,
    isMarginSafe: true,
    leverage: new BigNumber('0.67605445706853804198'),
    entryPrice: new BigNumber('1000.1'),
    fundingPNL: new BigNumber('-23.69365625'), // 9.9059375 * 2.3 -(-0.91)
    pnl1: new BigNumber('13719.27'),
    pnl2: new BigNumber('13695.57634375'),
    roe: new BigNumber('1.369557634375'),
    liquidationPrice: _0
  }

  const expectOutput2: AccountComputed = {
    positionValue: new BigNumber('16019.5'),
    positionMargin: new BigNumber('1601.95'),
    maintenanceMargin: new BigNumber('800.975'),
    availableCashBalance: new BigNumber('-1323.92365625'),
    marginBalance: new BigNumber('14695.57634375'), // 1000 + (6965 - 2300.23/2.3) * 2.3 - 23.69365625
    availableMargin: new BigNumber('13093.62634375'),
    withdrawableBalance: new BigNumber('13093.62634375'),
    isMMSafe: true,
    isIMSafe: true,
    isMarginSafe: true,
    leverage: new BigNumber('1.0900899444350858789365744572076'),
    entryPrice: new BigNumber('1000.1'),
    fundingPNL: new BigNumber('-23.69365625'), // 9.9059375 * 2.3 -(-0.91)
    pnl1: new BigNumber('13719.27'),
    pnl2: new BigNumber('13695.57634375'),
    roe: new BigNumber('13.69557634375'),
    liquidationPrice: new BigNumber('607.01134203051266779676547395')
  }

  const expectOutput3: AccountComputed = {
    positionValue: new BigNumber('16019.5'),
    positionMargin: new BigNumber('1601.95'),
    maintenanceMargin: new BigNumber('800.975'),
    availableCashBalance: new BigNumber('16323.92365625'),
    marginBalance: new BigNumber('304.42365625'), // 14000 + (2300.23/2.3 - 6965) * 2.3 - (-23.69365625)
    availableMargin: _0,
    withdrawableBalance: _0,
    isMMSafe: false,
    isIMSafe: false,
    isMarginSafe: true,
    leverage: new BigNumber('52.622388802939575523397504968355'),
    entryPrice: new BigNumber('1000.1'),
    fundingPNL: new BigNumber('23.69365625'), // 9.9059375 * (-2.3) -(-0.91)
    pnl1: new BigNumber('-13719.27'),
    pnl2: new BigNumber('-13695.57634375'),
    roe: new BigNumber('-0.978255453125'),
    liquidationPrice: new BigNumber('6752.5436049518057336697968808')
  }

  const expectOutput4: AccountComputed = {
    positionValue: _0,
    positionMargin: _0,
    maintenanceMargin: _0,
    availableCashBalance: new BigNumber('10000'),
    marginBalance: new BigNumber('10000'),
    availableMargin: new BigNumber('10000'),
    withdrawableBalance: new BigNumber('10000'),
    isMMSafe: true,
    isIMSafe: true,
    isMarginSafe: true,
    leverage: _0,
    entryPrice: _0,
    fundingPNL: _0,
    pnl1: _0,
    pnl2: _0,
    roe: _0,
    liquidationPrice: _0
  }

  const successCases: Array<ComputeAccountCase> = [
    {
      name: 'long safe',
      accountStorage: accountStorage1,
      expectedOutput: expectOutput1
    },
    {
      name: 'long critical',
      accountStorage: accountStorage2,
      expectedOutput: expectOutput2
    },
    {
      name: 'short',
      accountStorage: accountStorage3,
      expectedOutput: expectOutput3
    },
    {
      name: 'flat',
      accountStorage: accountStorage4,
      expectedOutput: expectOutput4
    }
  ]

  successCases.forEach(element => {
    it(element.name, function() {
      const accountStorage = element.accountStorage
      const expectedOutput = element.expectedOutput
      const accountDetails = computeAccount(poolStorage1, TEST_MARKET_INDEX0, accountStorage)
      const computed = accountDetails.accountComputed
      expect(computed.positionValue).toBeBigNumber(expectedOutput.positionValue)
      expect(computed.positionMargin).toBeBigNumber(expectedOutput.positionMargin)
      expect(computed.maintenanceMargin).toBeBigNumber(expectedOutput.maintenanceMargin)
      expect(computed.availableCashBalance).toBeBigNumber(expectedOutput.availableCashBalance)
      expect(computed.marginBalance).toBeBigNumber(expectedOutput.marginBalance)
      expect(computed.availableMargin).toBeBigNumber(expectedOutput.availableMargin)
      expect(computed.withdrawableBalance).toBeBigNumber(expectedOutput.withdrawableBalance)
      expect(computed.isMMSafe).toEqual(expectedOutput.isMMSafe)
      expect(computed.isIMSafe).toEqual(expectedOutput.isIMSafe)
      expect(computed.isMarginSafe).toEqual(expectedOutput.isMarginSafe)
      expect(computed.leverage).toApproximate(expectedOutput.leverage)
      expect(computed.entryPrice).not.toBeNull()
      if (computed.entryPrice && expectedOutput.entryPrice) {
        expect(computed.entryPrice).toBeBigNumber(expectedOutput.entryPrice)
      }
      expect(computed.fundingPNL).not.toBeNull()
      if (computed.fundingPNL && expectedOutput.fundingPNL) {
        expect(computed.fundingPNL).toBeBigNumber(expectedOutput.fundingPNL)
      }
      expect(computed.pnl1).not.toBeNull()
      if (computed.pnl1 && expectedOutput.pnl1) {
        expect(computed.pnl1).toBeBigNumber(expectedOutput.pnl1)
      }
      expect(computed.pnl2).not.toBeNull()
      if (computed.pnl2 && expectedOutput.pnl2) {
        expect(computed.pnl2).toBeBigNumber(expectedOutput.pnl2)
      }
      expect(computed.roe).not.toBeNull()
      if (computed.roe && expectedOutput.roe) {
        expect(computed.roe).toBeBigNumber(expectedOutput.roe)
      }
      expect(computed.liquidationPrice).not.toBeNull()
      if (computed.liquidationPrice && expectedOutput.liquidationPrice) {
        expect(computed.liquidationPrice).toApproximate(expectedOutput.liquidationPrice)
      }
    })
  })
})

describe('computeTrade fail', function() {
  it('decrease flat', function() {
    expect((): void => {
      computeDecreasePosition(poolStorage1, TEST_MARKET_INDEX0, accountStorage4, new BigNumber(7000), _1)
    }).toThrow()
  })

  it('decrease zero price', function() {
    expect((): void => {
      computeDecreasePosition(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, _0, _1)
    }).toThrow()
  })

  it('decrease zero amount', function() {
    expect((): void => {
      computeDecreasePosition(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, _1, _0)
    }).toThrow()
  })

  it('decrease large amount', function() {
    expect((): void => {
      computeDecreasePosition(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, _1, new BigNumber(1000))
    }).toThrow()
  })

  it('increase bad side', function() {
    expect((): void => {
      computeIncreasePosition(
        poolStorage1,
        TEST_MARKET_INDEX0,
        accountStorage1,
        new BigNumber(7000),
        _1.negated() // sell
      )
    }).toThrow()
  })

  it('increase zero price', function() {
    expect((): void => {
      computeIncreasePosition(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, _0, _1)
    }).toThrow()
  })

  it('increase zero amount', function() {
    expect((): void => {
      computeIncreasePosition(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, _1, _0)
    }).toThrow()
  })

  it('increase bad side', function() {
    expect((): void => {
      computeIncreasePosition(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, _1, _0)
    }).toThrow()
  })

  it('fee zero price', function() {
    expect((): void => {
      computeFee(0, 1, 0.1)
    }).toThrow()
  })

  it('fee zero amount', function() {
    expect((): void => {
      computeFee(1, 0, 0.1)
    }).toThrow()
  })

  it('computeTradeWithPrice zero price', function() {
    expect((): void => {
      computeTradeWithPrice(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, _0, _1, _0)
    }).toThrow()
  })

  it('computeTradeWithPrice zero amount', function() {
    expect((): void => {
      computeTradeWithPrice(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, _1, _0, _0)
    }).toThrow()
  })
})

describe('computeTradeWithPrice', function() {
  interface TradeCase {
    name: string
    input: {
      accountDetails: AccountDetails
      price: BigNumberish
      amount: BigNumberish
      targetLeverage: BigNumberish
      feeRate: BigNumberish
    }
    expectedOutput: {
      account: {
        cashBalance: BigNumberish
        marginBalance: BigNumberish
        positionAmount: BigNumberish
        entryValue: BigNumberish
        entryFunding: BigNumberish
      }
      tradeIsSafe: boolean
      marginCost: BigNumberish
      fee: BigNumberish
    }
  }

  //console.log(fundingResult.markPrice.toString())
  //fundingResult.unitAccumulativeFunding = 9.9059375
  //fundingResult.markPrice = 6965
  //new BigNumber('23694.9847500349122')
  const tradeCases: Array<TradeCase> = [
    {
      name: 'increase long',
      input: {
        accountDetails: accountDetails1,
        price: 2000,
        amount: 1,
        targetLeverage: 2,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 10000 - 20 - 4300.23 + 8.9959375
          cashBalance: '5688.7659375',
          /*
            10000 - 20 +
            (6965 * 3.3 - 4300.23) -
            (9.9059375 * 3.3 - 8.9959375),
          */
          marginBalance: '28640.57634375',
          positionAmount: '3.3',
          entryValue: '4300.23',
          entryFunding: '8.9959375'
        },
        tradeIsSafe: true,
        marginCost: '-17148.32634375',
        fee: 20
      }
    },
    {
      name: 'increase long with leverage cost',
      input: {
        accountDetails: accountDetails1,
        price: 7000,
        amount: 5,
        targetLeverage: 2,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 10000 - 350 - 37300.23 + 48.6196875
          cashBalance: '-27601.6103125',
          /*
            10000 - 350 +
            (6965 * 7.3 - 37300.23) -
            (9.9059375 * 7.3 - 48.6196875),
          */
          marginBalance: '23170.57634375',
          positionAmount: '7.3',
          entryValue: '37300.23',
          entryFunding: '48.6196875'
        },
        tradeIsSafe: true,
        /*  6965 * 7.3 / 2 -23170.44634375 */
        marginCost: '2251.67365625',
        fee: 350
      }
    },
    {
      name: 'increase long with loss',
      input: {
        accountDetails: accountDetails1,
        price: 10000,
        amount: 10,
        targetLeverage: 10,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 9000 - 102300.23 + 98.149375
          cashBalance: '-93202.080625',
          /*
            9000 +
            (6965 * 12.3 - 102300.23) -
            (9.9059375 * 12.3 - 98.149375),
          */
          marginBalance: '-7654.42365625',
          positionAmount: '12.3',
          entryValue: '102300.23',
          entryFunding: '98.149375'
        },
        tradeIsSafe: false,
        marginCost: '16221.37365625',
        fee: 1000
      }
    },
    {
      name: 'decrease long',
      input: {
        accountDetails: accountDetails1,
        price: 2000,
        amount: -1, // sell
        targetLeverage: 2,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 10000 + 999.9 - 20 - (9.9059375 - (-0.91)/2.3 ) * 1
          // = 10969.59841032608695652174
          // 10969.59841032608695652174 - 1300.13 + (-0.514347826087)
          cashBalance: '9668.95406249999995652174',
          positionAmount: '1.3',
          entryValue: '1300.13',
          entryFunding: '-0.514347826087',
          /*
            10969.59841032608695652174 +
            (6965 * 1.3 - 1300.13) -
            (9.9059375 * 1.3 - (-0.514347826087)),
          */
          marginBalance: '18710.57634375'
        },
        tradeIsSafe: true,
        marginCost: '-14183.32634375',
        fee: 20
      }
    },
    {
      name: 'decrease long to zero',
      input: {
        accountDetails: accountDetails1,
        price: 2000,
        amount: -2.3, // sell
        targetLeverage: 1,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 10000 + 2299.77‬ - 46 - (9.9059375 * 2.3 - (-0.91))
          cashBalance: '12230.07634375',
          positionAmount: 0,
          entryValue: 0,
          entryFunding: 0,
          marginBalance: '12230.07634375'
        },
        tradeIsSafe: true,
        marginCost: 0,
        fee: 46
      }
    },
    {
      name: 'decrease long to short',
      input: {
        accountDetails: accountDetails1,
        price: 2000,
        amount: -3.3, // sell
        targetLeverage: 1,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 10000 + 2299.77‬ - 66 - (9.9059375 * 2.3 - (-0.91))
          // = 12210.07634375
          // 12210.07634375 - (-2000) + (-9.9059375)
          cashBalance: '14200.17040625',
          positionAmount: -1,
          entryValue: -2000,
          entryFunding: '-9.9059375',
          /*
            12210.07634375 + (2000 - 6965 * 1)
          */
          marginBalance: '7245.076343750000000000002'
        },
        tradeIsSafe: true,
        marginCost: '-280.076343750000000000002',
        fee: 66
      }
    },
    {
      name: 'increase zero to long with cost',
      input: {
        accountDetails: accountDetails4,
        price: 7000,
        amount: 2,
        targetLeverage: 1,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 9860 - 14000 + 19.811875
          cashBalance: '-4120.188125',
          positionAmount: 2,
          entryValue: 14000,
          entryFunding: '19.811875',
          /*
            9860 + (6965 * 2 - 14000)
          */
          marginBalance: '9790'
        },
        tradeIsSafe: true,
        marginCost: 4140,
        fee: 140
      }
    },
    {
      name: 'decrease zero to short with cost',
      input: {
        accountDetails: accountDetails4,
        price: 7000,
        amount: -2, // sell
        targetLeverage: 1,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 10000 - 140 = 9860
          // 9860 - (-14000) + (-19.811875)
          cashBalance: '23840.188125',
          positionAmount: -2,
          entryValue: -14000,
          entryFunding: '-19.811875',
          /*
            9860 + (14000-6965 * 2)
          */
          marginBalance: '9930'
        },
        tradeIsSafe: true,
        marginCost: '4000',
        fee: 140
      }
    },
    {
      name: 'decrease short',
      input: {
        accountDetails: accountDetails3,
        price: 2000,
        amount: 1,
        targetLeverage: 2,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 14000 - 999.9 - 20 + (9.9059375 - (-0.91)/2.3 ) * 1
          // = 12990.401589673913
          // 12990.401589673913 - (-1300.13) + 0.514347826087
          cashBalance: '14291.0459375',
          positionAmount: '-1.3',
          entryValue: '-1300.13',
          entryFunding: '0.514347826087',
          /*
            12990.401589673913 +
            (1300.13 - 6965 * 1.3)
            + (9.9059375 * 1.3 - (-0.514347826087)),
          */
          marginBalance: '5249.42365625'
        },
        tradeIsSafe: true,
        marginCost: '-722.17365625',
        fee: 20
      }
    },
    {
      name: 'decrease short to zero',
      input: {
        accountDetails: accountDetails3,
        price: 2000,
        amount: 2.3,
        targetLeverage: 2,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 14000 - 2299.77 - 46 + (9.9059375 * 2.3 - (-0.91))
          cashBalance: '11677.92365625',
          positionAmount: 0,
          entryValue: 0,
          entryFunding: 0,
          marginBalance: '11677.92365625'
        },
        tradeIsSafe: true,
        marginCost: 0,
        fee: 46
      }
    },
    {
      name: 'decrease short to long with leverage',
      input: {
        accountDetails: accountDetails3,
        price: 2000,
        amount: 3.3,
        targetLeverage: 0.1,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 14000 - 2299.77 - 66 + (9.9059375 * 2.3 - (-0.91))
          // = 11657.92365625
          // 11657.92365625 - 2000 + 9.9059375
          cashBalance: '9667.82959375',
          positionAmount: 1,
          entryValue: 2000,
          entryFunding: '9.9059375',
          // 11657.92365625 + (6965-2000) * 1
          marginBalance: '16622.92365625'
        },
        tradeIsSafe: true,
        marginCost: '53027.07634375',
        fee: 66
      }
    }
  ]

  tradeCases.forEach(element => {
    const input = element.input
    const name = element.name
    const expectedOutput = element.expectedOutput

    it(name, function() {
      const result = computeTradeWithPrice(
        poolStorage1,
        TEST_MARKET_INDEX0,
        input.accountDetails.accountStorage,
        input.price,
        input.amount,
        input.feeRate
      )
      expect(result.afterTrade.accountStorage.cashBalance).toApproximate(
        normalizeBigNumberish(expectedOutput.account.cashBalance)
      )
      expect(result.afterTrade.accountStorage.positionAmount).toBeBigNumber(
        normalizeBigNumberish(expectedOutput.account.positionAmount)
      )
      expect(result.afterTrade.accountStorage.entryValue).toBeBigNumber(
        normalizeBigNumberish(expectedOutput.account.entryValue)
      )
      expect(result.afterTrade.accountStorage.entryFunding).toApproximate(
        normalizeBigNumberish(expectedOutput.account.entryFunding)
      )
      expect(result.afterTrade.accountComputed.marginBalance).toApproximate(
        normalizeBigNumberish(expectedOutput.account.marginBalance)
      )
      expect(result.tradeIsSafe).toEqual(expectedOutput.tradeIsSafe)

      const marginCost = computeMarginCost(poolStorage1, TEST_MARKET_INDEX0, result.afterTrade, input.targetLeverage)
      expect(marginCost).toApproximate(normalizeBigNumberish(expectedOutput.marginCost))
    })
  })
})

describe('computeAMMPrice', function() {
  it(`amm holds long. trader sells`, function() {
    const { tradingPrice } = computeAMMPrice(poolStorage1, TEST_MARKET_INDEX0, '-0.5')
    expect(tradingPrice).toApproximate(new BigNumber('6976.9161'))
  })

  it(`amm holds long. trader buys without cross 0`, function() {
    const { tradingPrice } = computeAMMPrice(poolStorage1, TEST_MARKET_INDEX0, '0.5')
    expect(tradingPrice).toApproximate(new BigNumber('6992.4957785904151334990367462'))
  })

  it(`amm holds long. trader buys cross 0. spread only effects closing`, function() {
    const { tradingPrice } = computeAMMPrice(poolStorage1, TEST_MARKET_INDEX0, '3.3')
    expect(tradingPrice).toApproximate(new BigNumber('6996.0111344722143116062591487')) // 16083.3368085704069965273648933 + 7003.49993518790023177329029757141254665377
  })

  it(`amm holds short unsafe. trader sells cross 0. spread effects closing and part of opening`, function() {
    const { tradingPrice } = computeAMMPrice(poolStorage3, TEST_MARKET_INDEX0, '-3.3')
    // m0 = 18142.575 - 7000 * 2.3 when pos = 0
    expect(tradingPrice).toApproximate(new BigNumber('6948.0750493565200491506747091'))
  })

  it(`amm holds short unsafe. trader sells cross 0. spread effects all`, function() {
    const { tradingPrice } = computeAMMPrice(poolStorage3, TEST_MARKET_INDEX0, '-2.31')
    // m0 = 18142.575 - 7000 * 2.3 when pos = 0
    expect(tradingPrice).toApproximate(new BigNumber('6999.9925821499080742927358107'))
  })

  it(`buy too large`, function() {
    expect((): void => {
      computeAMMPrice(poolStorage1, TEST_MARKET_INDEX0, '95.398') // 2.3 to -93.098
    }).toThrow()
  })

  it(`sell too large`, function() {
    expect((): void => {
      computeAMMPrice(poolStorage1, TEST_MARKET_INDEX0, '-90.796') // 2.3 to 93.096
    }).toThrow()
  })
})

describe('computeAMMTrade', function() {
  it(`sell`, function() {
    const res = computeAMMTrade(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, '-0.5')
    expect(res.tradingPrice).toApproximate(new BigNumber('6976.9161')) // see computeAMMPrice's test case
    expect(res.lpFee).toApproximate(new BigNumber('2.441920635'))
    expect(res.vaultFee).toApproximate(new BigNumber('0.697691610'))
    expect(res.operatorFee).toApproximate(new BigNumber('0.348845805'))

    // 7698.86 - 6976.9161 * (-0.5) + 9.9059375 * (-0.5) - 6976.9161 * 0.5 * 0.001
    expect(res.trader.accountStorage.cashBalance).toApproximate(new BigNumber('11178.8766232'))
    // 83941.29865625 - 6976.9161 * 0.5 + 9.9059375 * (0.5) + 2.441920635
    expect(res.newPool.poolCashBalance).toApproximate(new BigNumber('80460.235495635'))
    expect(res.newPool.perpetuals.get(TEST_MARKET_INDEX0)?.ammPositionAmount).toApproximate(new BigNumber('2.8'))
  })

  it(`buy without cross 0`, function() {
    const res = computeAMMTrade(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, '0.5')
    expect(res.tradingPrice).toApproximate(new BigNumber('6992.4957785904151334990367462')) // see computeAMMPrice's test case
    expect(res.lpFee).toApproximate(new BigNumber('2.44737352250664529672466286117'))
    expect(res.vaultFee).toApproximate(new BigNumber('0.69924957785904151334990367462'))
    expect(res.operatorFee).toApproximate(new BigNumber('0.34962478892952075667495183731'))

    // 7698.86 - 6992.4957785904151334990367462 * (0.5) + 9.9059375 * (0.5) - 6992.4957785904151334990367462 * 0.5 * 0.001
    expect(res.trader.accountStorage.cashBalance).toApproximate(new BigNumber('4204.0688315654972256837321085'))
    // 83941.29865625 - 6992.4957785904151334990367462 * (-0.5) + 9.9059375 * (-0.5) + 2.44737352250664529672466286117
    expect(res.newPool.poolCashBalance).toApproximate(new BigNumber('87435.0409503177142120462430360'))
    expect(res.newPool.perpetuals.get(TEST_MARKET_INDEX0)?.ammPositionAmount).toApproximate(new BigNumber('1.8'))
  })

  it(`buy cross 0`, function() {
    const res = computeAMMTrade(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, '3.3')
    expect(res.tradingPrice).toApproximate(new BigNumber('6996.0111344722143116062591487')) // see computeAMMPrice's test case
    expect(res.lpFee).toApproximate(new BigNumber('16.1607857206308150598104586335'))
    expect(res.vaultFee).toApproximate(new BigNumber('4.6173673487516614456601310381'))
    expect(res.operatorFee).toApproximate(new BigNumber('2.30868367437583072283006551907'))

    // 7698.86 - 6996.0111344722143116062591487 * (3.3) + 9.9059375 * (3.3) - 6996.0111344722143116062591487 * 3.3 * 0.001
    expect(res.trader.accountStorage.cashBalance).toApproximate(new BigNumber('-15378.3739867520655355289558459'))
    // 83941.29865625 - 6996.0111344722143116062591487 * (-3.3) + 9.9059375 * (-3.3) + 16.1607857206308150598104586335
    expect(res.newPool.poolCashBalance).toApproximate(new BigNumber('107011.606591978938043360465649'))
    expect(res.newPool.perpetuals.get(TEST_MARKET_INDEX0)?.ammPositionAmount).toApproximate(new BigNumber('-1'))
  })

  it(`(saw) buy+sell`, function() {
    const res1 = computeAMMTrade(poolStorage1, TEST_MARKET_INDEX0, accountStorage1, '0.5')
    expect(res1.tradingPrice).toApproximate(new BigNumber('6992.4957785904151334990367462'))
    expect(res1.newPool.poolCashBalance).toApproximate(new BigNumber('87435.0409503177142120462430360')) // see the above case
    expect(res1.newPool.perpetuals.get(TEST_MARKET_INDEX0)?.ammPositionAmount).toApproximate(new BigNumber('1.8'))

    // availableCash = 87435.0409503177142120462430360 - 9.9059375 * (1.8) = 87417.2102628177142120462430360
    // m0 = 100005.870928541926673731114517
    const res2 = computeAMMTrade(res1.newPool, TEST_MARKET_INDEX0, res1.trader.accountStorage, '-0.5')
    expect(res2.tradingPrice).toApproximate(new BigNumber('6980.4133389538758324702073441'))

    // 4204.0688315654972256837321085 - 6980.4133389538758324702073441 * (-0.5) + 9.9059375 * (-0.5) - 6980.4133389538758324702073441 * 0.5 * 0.001
    expect(res2.trader.accountStorage.cashBalance).toApproximate(new BigNumber('7685.8323256229582040026006769'))
    // 87435.0409503177142120462430360 - 6980.4133389538758324702073441 * (0.5) + 9.9059375 * (0.5) + 6980.4133389538758324702073441 * 0.5 * 0.0007
    expect(res2.newPool.poolCashBalance).toApproximate(new BigNumber('83952.2303942594101523525039365'))
    expect(res2.newPool.perpetuals.get(TEST_MARKET_INDEX0)?.ammPositionAmount).toApproximate(new BigNumber('2.3'))
  })
})

describe('lower than keeperGasReward', function() {
  it(`computeAMMTrade should fail`, function() {
    const trader: AccountStorage = {
      ...accountStorage4,
      cashBalance: new BigNumber('1')
    }

    // trade should fail
    const amount = '0.0001'
    const targetLeverage = 10
    const query1 = computeAMMTrade(poolStorage1, TEST_MARKET_INDEX0, trader, amount)
    expect(query1.trader.accountComputed.availableMargin).toBeBigNumber(new BigNumber('0'))
    expect(query1.tradeIsSafe).toBeFalsy()
    expect(query1.tradingPrice).toApproximate(normalizeBigNumberish('6992.495778590415133499'))

    // cost
    const marginCost = computeMarginCost(poolStorage1, TEST_MARKET_INDEX0, query1.trader, targetLeverage)
    expect(marginCost).toApproximate(normalizeBigNumberish('0.0034488274369005548632499'))
    trader.cashBalance = trader.cashBalance.plus('0.0034488274369005548632499')

    // trade again, should success
    const query2 = computeAMMTrade(poolStorage1, TEST_MARKET_INDEX0, trader, amount)
    expect(query2.tradeIsSafe).toBeTruthy()
    expect(query2.trader.accountComputed.availableMargin).toApproximate(normalizeBigNumberish('0'))
  })
})
