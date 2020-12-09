import BigNumber from 'bignumber.js'
import {
  computeAccount,
  computeDecreasePosition,
  computeIncreasePosition,
  computeFee,
  computeTradeWithPrice,
  // computeAMMPrice,
  // computeAMMTrade,
} from '../src/computation'
import { _0, _1 } from '../src/constants'
import {
  BigNumberish,
  MarketState,
  MarketStorage,
  LiquidityPoolStorage,
  AccountStorage,
  AccountComputed,
  AccountDetails,
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

  halfSpreadRate: new BigNumber(0.001),
  beta1: new BigNumber(0.2),
  beta2: new BigNumber(0.1),
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

// original cash = 10000, entryValue: 2300.23, entryFunding: -0.91
// fundingLoss: 23.69365625, // 9.9059375 * 2.3 -(-0.91)
// availableCashBalance = 10000 - 2300.23 - 23.69365625 = 7676.07634375
const amm1 = {
  cashBalance: new BigNumber('7698.86'), // 10000 - 2300.23 - 0.91
  positionAmount: new BigNumber('2.3'),
}

// original cash = 14000, entryValue: -2300.23, entryFunding: 0.91
// fundingLoss: -23.69365625, // 9.9059375 * (-2.3) -(-0.91)
// availableCashBalance = 14000 + 2300.23 + 23.69365625 = 16323.92365625
// unsafe
const amm3 = {
  cashBalance: new BigNumber('16301.14'), // 14000 + 2300.23 + 0.91
  positionAmount: new BigNumber('-2.3'),
}

const TEST_MARKET_ID = '0x0'

const poolStorage1: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0',
  shareTokenAddress: '0x0',
  fundingTime: 1579601290,
  ammCashBalance: amm1.cashBalance,
  markets: {
    [TEST_MARKET_ID]: {
      ...market1,
      ammPositionAmount: amm1.positionAmount,
    }
  },
}

const poolStorage3: LiquidityPoolStorage = {
  collateralTokenAddress: '0x0',
  shareTokenAddress: '0x0',
  fundingTime: 1579601290,
  ammCashBalance: amm3.cashBalance,
  markets: {
    '0': {
      ...market1,
      ammPositionAmount: amm3.positionAmount,
    }
  },
}

const accountStorage1: AccountStorage = {
  cashBalance: new BigNumber('7698.86'), // 10000 - 2300.23 + (-0.91)
  positionAmount: new BigNumber('2.3'),
  entryValue: new BigNumber('2300.23'),
  entryFunding: new BigNumber('-0.91'),
}

const accountStorage2: AccountStorage = {
  cashBalance: new BigNumber('-1301.14'), // 1000 - 2300.23 + (-0.91)
  positionAmount: new BigNumber('2.3'),
  entryValue: new BigNumber('2300.23'),
  entryFunding: new BigNumber('-0.91'),
}

const accountStorage3: AccountStorage = {
  cashBalance: new BigNumber('16301.14'), // 14000 + 2300.23 + 0.91
  positionAmount: new BigNumber('-2.3'),
  entryValue: new BigNumber('-2300.23'),
  entryFunding: new BigNumber('0.91'),
}

const accountStorage4: AccountStorage = {
  cashBalance: new BigNumber('10000'),
  positionAmount: _0,
  entryValue: _0,
  entryFunding: _0,
}

const accountDetails1 = computeAccount(poolStorage1, TEST_MARKET_ID, accountStorage1)
const accountDetails3 = computeAccount(poolStorage1, TEST_MARKET_ID, accountStorage3)
const accountDetails4 = computeAccount(poolStorage1, TEST_MARKET_ID, accountStorage4)

describe('computeAccount', function () {
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
    maxWithdrawable: new BigNumber('22092.62634375'),
    availableMargin: new BigNumber('22092.62634375'),
    withdrawableBalance: new BigNumber('22092.62634375'),
    isSafe: true,
    leverage: new BigNumber('0.67605445706853804198'),
    entryPrice: new BigNumber('1000.1'),
    fundingPNL: new BigNumber('-23.69365625'), // 9.9059375 * 2.3 -(-0.91)
    pnl1: new BigNumber('13719.27'),
    pnl2: new BigNumber('13695.57634375'),
    roe: new BigNumber('1.369557634375'),
    liquidationPrice: _0,
  }

  const expectOutput2: AccountComputed = {
    positionValue: new BigNumber('16019.5'),
    positionMargin: new BigNumber('1601.95'),
    maintenanceMargin: new BigNumber('800.975'),
    availableCashBalance: new BigNumber('-1323.92365625'),
    marginBalance: new BigNumber('14695.57634375'), // 1000 + (6965 - 2300.23/2.3) * 2.3 - 23.69365625
    maxWithdrawable: new BigNumber('13092.62634375'),
    availableMargin: new BigNumber('13092.62634375'),
    withdrawableBalance: new BigNumber('13092.62634375'),
    isSafe: true,
    leverage: new BigNumber('1.0900899444350858789365744572076'),
    entryPrice: new BigNumber('1000.1'),
    fundingPNL: new BigNumber('-23.69365625'), // 9.9059375 * 2.3 -(-0.91)
    pnl1: new BigNumber('13719.27'),
    pnl2: new BigNumber('13695.57634375'),
    roe: new BigNumber('13.69557634375'),
    liquidationPrice: new BigNumber('606.37238272311212814645'),
  }

  const expectOutput3: AccountComputed = {
    positionValue: new BigNumber('16019.5'),
    positionMargin: new BigNumber('1601.95'),
    maintenanceMargin: new BigNumber('800.975'),
    availableCashBalance: new BigNumber('16323.92365625'),
    marginBalance: new BigNumber('304.42365625'), // 14000 + (2300.23/2.3 - 6965) * 2.3 - (-23.69365625)
    maxWithdrawable: _0,
    availableMargin: _0,
    withdrawableBalance: _0,
    isSafe: false,
    leverage: new BigNumber('52.622388802939575523397504968355'),
    entryPrice: new BigNumber('1000.1'),
    fundingPNL: new BigNumber('23.69365625'), // 9.9059375 * (-2.3) -(-0.91)
    pnl1: new BigNumber('-13719.27'),
    pnl2: new BigNumber('-13695.57634375'),
    roe: new BigNumber('-0.978255453125'),
    liquidationPrice: new BigNumber('6758.97459886128364389234')
  }

  const expectOutput4: AccountComputed = {
    positionValue: _0,
    positionMargin: _0,
    maintenanceMargin: _0,
    availableCashBalance: new BigNumber('10000'),
    marginBalance: new BigNumber('10000'),
    availableMargin: new BigNumber('10000'),
    maxWithdrawable: new BigNumber('10000'),
    withdrawableBalance: new BigNumber('10000'),
    isSafe: true,
    leverage: _0,
    entryPrice: _0,
    fundingPNL: _0,
    pnl1: _0,
    pnl2: _0,
    roe: _0,
    liquidationPrice: _0,
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
    it(element.name, function () {
      const accountStorage = element.accountStorage
      const expectedOutput = element.expectedOutput
      const accountDetails = computeAccount(poolStorage1, TEST_MARKET_ID, accountStorage)
      const computed = accountDetails.accountComputed
      expect(computed.positionValue).toBeBigNumber(expectedOutput.positionValue)
      expect(computed.positionMargin).toBeBigNumber(expectedOutput.positionMargin)
      expect(computed.maintenanceMargin).toBeBigNumber(expectedOutput.maintenanceMargin)
      expect(computed.availableCashBalance).toBeBigNumber(expectedOutput.availableCashBalance)
      expect(computed.marginBalance).toBeBigNumber(expectedOutput.marginBalance)
      expect(computed.maxWithdrawable).toBeBigNumber(expectedOutput.maxWithdrawable)
      expect(computed.availableMargin).toBeBigNumber(expectedOutput.availableMargin)
      expect(computed.withdrawableBalance).toBeBigNumber(expectedOutput.withdrawableBalance)
      expect(computed.isSafe).toEqual(expectedOutput.isSafe)
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

describe('computeTrade fail', function () {
  it('decrease flat', function () {
    expect((): void => {
      computeDecreasePosition(poolStorage1, TEST_MARKET_ID, accountStorage4, new BigNumber(7000), _1)
    }).toThrow()
  })

  it('decrease zero price', function () {
    expect((): void => {
      computeDecreasePosition(poolStorage1, TEST_MARKET_ID, accountStorage1, _0, _1)
    }).toThrow()
  })

  it('decrease zero amount', function () {
    expect((): void => {
      computeDecreasePosition(poolStorage1, TEST_MARKET_ID, accountStorage1, _1, _0)
    }).toThrow()
  })

  it('decrease large amount', function () {
    expect((): void => {
      computeDecreasePosition(poolStorage1, TEST_MARKET_ID, accountStorage1, _1, new BigNumber(1000))
    }).toThrow()
  })

  it('increase bad side', function () {
    expect((): void => {
      computeIncreasePosition(
        poolStorage1, TEST_MARKET_ID, accountStorage1,
        new BigNumber(7000), _1.negated() // sell
      )
    }).toThrow()
  })

  it('increase zero price', function () {
    expect((): void => {
      computeIncreasePosition(poolStorage1, TEST_MARKET_ID, accountStorage1, _0, _1)
    }).toThrow()
  })

  it('increase zero amount', function () {
    expect((): void => {
      computeIncreasePosition(poolStorage1, TEST_MARKET_ID, accountStorage1, _1, _0)
    }).toThrow()
  })

  it('increase bad side', function () {
    expect((): void => {
      computeIncreasePosition(poolStorage1, TEST_MARKET_ID, accountStorage1, _1, _0)
    }).toThrow()
  })

  it('fee zero price', function () {
    expect((): void => {
      computeFee(0, 1, 0.1)
    }).toThrow()
  })

  it('fee zero amount', function () {
    expect((): void => {
      computeFee(1, 0, 0.1)
    }).toThrow()
  })

  it('computeTradeWithPrice zero price', function () {
    expect((): void => {
      computeTradeWithPrice(poolStorage1, TEST_MARKET_ID, accountStorage1, _0, _1, _0)
    }).toThrow()
  })

  it('computeTradeWithPrice zero amount', function () {
    expect((): void => {
      computeTradeWithPrice(poolStorage1, TEST_MARKET_ID, accountStorage1, _1, _0, _0)
    }).toThrow()
  })
})

describe('computeTradeWithPrice', function () {
  interface TradeCase {
    name: string
    input: {
      accountDetails: AccountDetails
      price: BigNumberish
      amount: BigNumberish
      feeRate: BigNumberish
    }
    expectedOutput: {
      account: {
        cashBalance: BigNumberish
        marginBalance: BigNumberish
        positionAmount: BigNumberish
        entryValue: BigNumberish
        entryFunding: BigNumberish
      },
      fee: BigNumberish
    }
  }

  //console.log(fundingResult.markPrice.toString())
  //fundingResult.accumulatedFundingPerContract = 9.9059375
  //fundingResult.markPrice = 6965
  //new BigNumber('23694.9847500349122')
  const tradeCases: Array<TradeCase> = [
    {
      name: 'increase long',
      input: {
        accountDetails: accountDetails1,
        price: 2000,
        amount: 1,
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
        fee: 20
      }
    },
    {
      name: 'increase long with leverage cost',
      input: {
        accountDetails: accountDetails1,
        price: 7000,
        amount: 5,
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
        fee: 350
      }
    },
    {
      name: 'increase long with loss',
      input: {
        accountDetails: accountDetails1,
        price: 10000,
        amount: 10,
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
        fee: 1000
      }
    },
    {
      name: 'decrease long',
      input: {
        accountDetails: accountDetails1,
        price: 2000,
        amount: -1, // sell
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
        fee: 20
      }
    },
    {
      name: 'decrease long to zero',
      input: {
        accountDetails: accountDetails1,
        price: 2000,
        amount: -2.3, // sell
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
        fee: 46
      }
    },
    {
      name: 'decrease long to short',
      input: {
        accountDetails: accountDetails1,
        price: 2000,
        amount: -3.3, // sell
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
        fee: 66
      }
    },
    {
      name: 'increase zero to long with cost',
      input: {
        accountDetails: accountDetails4,
        price: 7000,
        amount: 2,
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
        fee: 140
      }
    },
    {
      name: 'decrease zero to short with cost',
      input: {
        accountDetails: accountDetails4,
        price: 7000,
        amount: -2, // sell
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
        fee: 140
      }
    },
    {
      name: 'decrease short',
      input: {
        accountDetails: accountDetails3,
        price: 2000,
        amount: 1,
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
        fee: 20
      }
    },
    {
      name: 'decrease short to zero',
      input: {
        accountDetails: accountDetails3,
        price: 2000,
        amount: 2.3,
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
        fee: 46
      }
    },
    {
      name: 'decrease short to long with leverage',
      input: {
        accountDetails: accountDetails3,
        price: 2000,
        amount: 3.3,
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
        fee: 66
      }
    }
  ]

  tradeCases.forEach(element => {
    const input = element.input
    const name = element.name
    const expectedOutput = element.expectedOutput

    it(name, function () {
      const newAccount = computeTradeWithPrice(
        poolStorage1,
        TEST_MARKET_ID,
        input.accountDetails.accountStorage,
        input.price,
        input.amount,
        input.feeRate,
      )
      expect(newAccount.cashBalance).toApproximate(
        normalizeBigNumberish(expectedOutput.account.cashBalance)
      )
      expect(newAccount.positionAmount).toBeBigNumber(
        normalizeBigNumberish(expectedOutput.account.positionAmount)
      )
      expect(newAccount.entryValue).toBeBigNumber(
        normalizeBigNumberish(expectedOutput.account.entryValue)
      )
      expect(newAccount.entryFunding).toApproximate(
        normalizeBigNumberish(expectedOutput.account.entryFunding)
      )
      const details = computeAccount(poolStorage1, TEST_MARKET_ID, newAccount)
      expect(details.accountComputed.marginBalance).toApproximate(
        normalizeBigNumberish(expectedOutput.account.marginBalance)
      )
    })
  })
})

// describe('computeAMMPrice', function () {
//   it(`holds long, sell`, function () {
//     const { tradingPrice } = computeAMMPrice(poolStorage, ammStorage1, '-0.5')
//     expect(tradingPrice).toApproximate(new BigNumber('6501.300190232855501915'))
//   })

//   it(`holds long, buy without cross 0`, function () {
//     const { tradingPrice } = computeAMMPrice(poolStorage, ammStorage1, '0.5')
//     expect(tradingPrice).toApproximate(new BigNumber('6807.834634007232478054'))
//   })

//   it(`holds long, buy cross 0`, function () {
//     const { tradingPrice } = computeAMMPrice(poolStorage, ammStorage1, '3.3')
//     expect(tradingPrice).toApproximate(new BigNumber('6958.975118459550521339')) // (close (without spread) 15853.1053843801274454660887584 + open (without spread) 7088.57083032168746005019591999) / 3.3 * 1.001
//   })

//   it(`holds short, sell cross 0`, function () {
//     const { tradingPrice } = computeAMMPrice(poolStorage, ammStorage3, '-2.4')
//     expect(tradingPrice).toApproximate(new BigNumber('6941.873815005349466655')) // (unsafe close (without spread) 16100 + open (without spread) 577.174330343181901875950289565) / 2.4 * 0.999
//   })

//   it(`buy too large`, function () {
//     expect((): void => {
//       computeAMMPrice(poolStorage, ammStorage1, 11) // > 2.3 + 8.4
//     }).toThrow()
//   })

//   it(`sell too large`, function () {
//     expect((): void => {
//       computeAMMPrice(poolStorage, ammStorage1, -10.1) // 12.4 - 2.3
//     }).toThrow()
//   })
// })

// describe('computeAMMTrade', function () {
//   it(`sell`, function () {
//     const res = computeAMMTrade(poolStorage, accountStorage1, ammStorage1, '-0.5')
//     expect(res.tradingPrice).toApproximate(new BigNumber('6501.300190232855501915'))
//     expect(res.lpFee).toApproximate(new BigNumber('2.275455066581499430'))
//     expect(res.vaultFee).toApproximate(new BigNumber('0.650130019023285599'))
//     expect(res.operatorFee).toApproximate(new BigNumber('0.325065009511642799'))

//     // fundingLoss: 5.150794836956521739, // 9.9059375 * 0.5 -(-0.91 * 0.5 / 2.3)
//     // 7699.77 - 5.150794836956521739 + 6501.300190232855501915 * 0.5 - 6501.300190232855501915 * 0.5 * 0.001
//     expect(res.takerAccount.cashBalance).toApproximate(new BigNumber('10942.01865018435480146754'))
//     // 7699.77 - 6501.300190232855501915 * 0.5 + 2.275455066581499430
//     expect(res.makerAccount.cashBalance).toApproximate(new BigNumber('4451.395359950153748472500'))
//   })

//   it(`buy without cross 0`, function () {
//     const res = computeAMMTrade(poolStorage, accountStorage1, ammStorage1, '0.5')
//     expect(res.tradingPrice).toApproximate(new BigNumber('6807.834634007232478054'))
//     expect(res.lpFee).toApproximate(new BigNumber('2.382742121902531367318900'))
//     expect(res.vaultFee).toApproximate(new BigNumber('0.6807834634007232478054000'))
//     expect(res.operatorFee).toApproximate(new BigNumber('0.3403917317003616239027000'))

//     // 7699.77 - 6807.834634007232478054 * 0.5 - 6807.834634007232478054 * 0.5 * 0.001
//     expect(res.takerAccount.cashBalance).toApproximate(new BigNumber('4292.448765679380144733973'))
//     // fundingLoss: 5.150794836956521739, // 9.9059375 * 0.5 -(-0.91 * 0.5 / 2.3)
//     // 7699.77 - 5.150794836956521739 + 6807.834634007232478054 * 0.5 + 2.382742121902531367318900
//     expect(res.makerAccount.cashBalance).toApproximate(new BigNumber('11100.91926428856224865532'))
//   })

//   it(`buy cross 0`, function () {
//     const res = computeAMMTrade(poolStorage, accountStorage1, ammStorage1, '3.3')
//     expect(res.tradingPrice).toApproximate(new BigNumber('6958.975118459550521339')) // see computeAMMPrice's test case
//     expect(res.lpFee).toApproximate(new BigNumber('16.075232523641561704'))
//     expect(res.vaultFee).toApproximate(new BigNumber('4.592923578183303344'))
//     expect(res.operatorFee).toApproximate(new BigNumber('2.296461789091651672'))

//     // 7699.77 - 6958.975118459550521339 * 3.3 - 6958.975118459550521339 * 3.3 * 0.001
//     expect(res.takerAccount.cashBalance).toApproximate(new BigNumber('-15287.812508807433237139'))
//     // fundingLoss: 23.69365625, // 9.9059375 * 2.3 -(-0.91 * 2.3 / 2.3)
//     // 7699.77 - 23.69365625 + 6958.975118459550521339 * 3.3 + 16.075232523641561704
//     expect(res.makerAccount.cashBalance).toApproximate(new BigNumber('30656.769467190158282122'))
//   })
// })






poolStorage1
poolStorage3
accountDetails1
accountDetails3
accountDetails4
normalizeBigNumberish
let a: AccountDetails | null = null
a
let b: BigNumberish | null = null
b
