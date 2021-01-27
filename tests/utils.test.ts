import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { BigNumberish, InvalidArgumentError } from '../src/types'
import { normalizeBigNumberish, hasTheSameSign, mostSignificantBit, sqrt, splitAmount } from '../src/utils'
import { _0, _1 } from '../src/constants'

import { extendExpect } from './helper'

extendExpect()

describe('hasTheSameSign', function() {
  expect(hasTheSameSign(_0, _0)).toBeTruthy()
  expect(hasTheSameSign(_0, _1)).toBeTruthy()
  expect(hasTheSameSign(_1, _1)).toBeTruthy()
  expect(hasTheSameSign(_1.negated(), _1.negated())).toBeTruthy()
  expect(hasTheSameSign(_1.negated(), _1)).toBeFalsy()
  expect(hasTheSameSign(_1, _1.negated())).toBeFalsy()
})

it('splitAmount', function() {
  {
    let { close, open } = splitAmount(new BigNumber(-5), new BigNumber(3))
    expect(close).toBeBigNumber(new BigNumber(3))
    expect(open).toBeBigNumber(new BigNumber(0))
  }
  {
    let { close, open } = splitAmount(new BigNumber(5), new BigNumber(-3))
    expect(close).toBeBigNumber(new BigNumber(-3))
    expect(open).toBeBigNumber(new BigNumber(0))
  }
  {
    let { close, open } = splitAmount(new BigNumber(-5), new BigNumber(6))
    expect(close).toBeBigNumber(new BigNumber(5))
    expect(open).toBeBigNumber(new BigNumber(1))
  }
  {
    let { close, open } = splitAmount(new BigNumber(5), new BigNumber(-6))
    expect(close).toBeBigNumber(new BigNumber(-5))
    expect(open).toBeBigNumber(new BigNumber(-1))
  }
  {
    let { close, open } = splitAmount(new BigNumber(-5), new BigNumber(-1))
    expect(close).toBeBigNumber(new BigNumber(0))
    expect(open).toBeBigNumber(new BigNumber(-1))
  }
  {
    let { close, open } = splitAmount(new BigNumber(5), new BigNumber(1))
    expect(close).toBeBigNumber(new BigNumber(0))
    expect(open).toBeBigNumber(new BigNumber(1))
  }
  {
    let { close, open } = splitAmount(new BigNumber(5), new BigNumber(-5))
    expect(close).toBeBigNumber(new BigNumber(-5))
    expect(open).toBeBigNumber(new BigNumber(0))
  }
  {
    let { close, open } = splitAmount(new BigNumber(-5), new BigNumber(5))
    expect(close).toBeBigNumber(new BigNumber(5))
    expect(open).toBeBigNumber(new BigNumber(0))
  }
  {
    let { close, open } = splitAmount(new BigNumber(0), new BigNumber(-5))
    expect(close).toBeBigNumber(new BigNumber(0))
    expect(open).toBeBigNumber(new BigNumber(-5))
  }
  {
    let { close, open } = splitAmount(new BigNumber(0), new BigNumber(5))
    expect(close).toBeBigNumber(new BigNumber(0))
    expect(open).toBeBigNumber(new BigNumber(5))
  }
  {
    let { close, open } = splitAmount(new BigNumber('2.3'), new BigNumber('-19.70657607600732600733'))
    expect(close).toBeBigNumber(new BigNumber('-2.3'))
    expect(open).toBeBigNumber(new BigNumber('-17.40657607600732600733'))
  }
})

describe('mostSignificantBit', function() {
  expect(mostSignificantBit(new BigNumber('0'))).toEqual(0)
  expect(mostSignificantBit(new BigNumber('1'))).toEqual(0)
  expect(mostSignificantBit(new BigNumber('2'))).toEqual(1)
  expect(mostSignificantBit(new BigNumber('3'))).toEqual(1)
  expect(mostSignificantBit(new BigNumber('4'))).toEqual(2)
  expect(mostSignificantBit(new BigNumber('7'))).toEqual(2)
  expect(mostSignificantBit(new BigNumber('8'))).toEqual(3)
})

describe('sqrt', function() {
  it('0', function() {
    const i = sqrt(new BigNumber('0'))
    expect(i).toApproximate(new BigNumber('0'))
  })
  it('1 * 1e-36', function() {
    const i = sqrt(new BigNumber('1').shiftedBy(-36))
    expect(i).toApproximate(new BigNumber('0'))
  })
  it('2 * 1e-36', function() {
    const i = sqrt(new BigNumber('2').shiftedBy(-36))
    expect(i).toApproximate(new BigNumber('1').shiftedBy(-18))
  })
  it('3 * 1e-36', function() {
    const i = sqrt(new BigNumber('3').shiftedBy(-36))
    expect(i).toApproximate(new BigNumber('1').shiftedBy(-18))
  })
  it('4 * 1e-36', function() {
    const i = sqrt(new BigNumber('4').shiftedBy(-36))
    expect(i).toApproximate(new BigNumber('2').shiftedBy(-18))
  })
  it('5 * 1e-36', function() {
    const i = sqrt(new BigNumber('5').shiftedBy(-36))
    expect(i).toApproximate(new BigNumber('2').shiftedBy(-18))
  })
  it('6 * 1e-36', function() {
    const i = sqrt(new BigNumber('6').shiftedBy(-36))
    expect(i).toApproximate(new BigNumber('2').shiftedBy(-18))
  })
  it('7 * 1e-36', function() {
    const i = sqrt(new BigNumber('7').shiftedBy(-36))
    expect(i).toApproximate(new BigNumber('2').shiftedBy(-18))
  })
  it('8 * 1e-36', function() {
    const i = sqrt(new BigNumber('8').shiftedBy(-36))
    expect(i).toApproximate(new BigNumber('2').shiftedBy(-18))
  })
  it('9 * 1e-36', function() {
    const i = sqrt(new BigNumber('9').shiftedBy(-36))
    expect(i).toApproximate(new BigNumber('3').shiftedBy(-18))
  })
  it('1e9 * 1e-36', function() {
    const i = sqrt(new BigNumber('1000000000000000000').shiftedBy(-36))
    expect(i).toApproximate(new BigNumber('1000000000').shiftedBy(-18))
  })
  it('0.1225 => 0.35', function() {
    const i = sqrt(new BigNumber('0.1225'))
    expect(i).toApproximate(new BigNumber('0.35'))
  })
  it('1', function() {
    const i = sqrt(new BigNumber('1'))
    expect(i).toApproximate(new BigNumber('1'))
  })
  it('25 => 5', function() {
    const i = sqrt(new BigNumber('25'))
    expect(i).toApproximate(new BigNumber('5'))
  })
  it('49e8 => 7e4', function() {
    const i = sqrt(new BigNumber('4900000000'))
    expect(i).toApproximate(new BigNumber('70000'))
  })
  it('1e24 => 1e12', function() {
    const i = sqrt(new BigNumber('1000000000000000000000000'))
    expect(i).toApproximate(new BigNumber('1000000000000'))
  })
  it('2^254 => 2^127', function() {
    const i = sqrt(new BigNumber('28948022309329048855892746252171976963317.496166410141009864396001978282409984'))
    expect(i).toApproximate(new BigNumber('170141183460469231731.687303715884105728'))
  })
  it('max num', function() {
    const i = sqrt(new BigNumber('57896044618658097711785492504343953926634.992332820282019728792003956564819967'))
    expect(i).toApproximate(new BigNumber('240615969168004511545.033772477625056927'))
  })
  it('sqrt-1', function() {
    expect(() => {
      sqrt(new BigNumber('-1'))
    }).toThrow(InvalidArgumentError)
  })
})

interface TestCase {
  input: BigNumberish
  expectedOutput: BigNumber
}

function constructTestCase(input: BigNumberish, expectedOutput: BigNumber): TestCase {
  return { input, expectedOutput }
}

function testSuccesses(expectedSuccesses: TestCase[]): void {
  test('failures', (): void => {
    expectedSuccesses.forEach(({ input, expectedOutput }: TestCase): void => {
      const output: BigNumber = normalizeBigNumberish(input)
      expect(output.isEqualTo(expectedOutput)).toBe(true)
    })
  })
}

function testFailures(expectedFailures: BigNumberish[]): void {
  test('failures', (): void => {
    expectedFailures.forEach((expectedFailure: BigNumberish): void => {
      expect((): void => {
        normalizeBigNumberish(expectedFailure)
      }).toThrow()
    })
  })
}

describe('normalizeBigNumberish', (): void => {
  describe('string', (): void => {
    const expectedSuccesses: TestCase[] = [
      constructTestCase('0', new BigNumber('0')),
      constructTestCase('1', new BigNumber('1')),
      constructTestCase('1.234', new BigNumber('1.234'))
    ]
    const expectedFailures: string[] = ['.', ',', 'a', '0.0.']

    testSuccesses(expectedSuccesses)
    testFailures(expectedFailures)
  })

  describe('number', (): void => {
    const expectedSuccesses: TestCase[] = [
      constructTestCase(0, new BigNumber('0')),
      constructTestCase(1, new BigNumber('1')),
      constructTestCase(1.234, new BigNumber('1.234'))
    ]
    const expectedFailures: number[] = [NaN]

    testSuccesses(expectedSuccesses)
    testFailures(expectedFailures)
  })

  describe('BigNumber', (): void => {
    const expectedSuccesses: TestCase[] = [
      constructTestCase(new BigNumber(0), new BigNumber('0')),
      constructTestCase(new BigNumber(1), new BigNumber('1')),
      constructTestCase(new BigNumber('1.234'), new BigNumber('1.234'))
    ]
    const expectedFailures: BigNumber[] = [new BigNumber(NaN)]

    testSuccesses(expectedSuccesses)
    testFailures(expectedFailures)
  })

  describe('ethers.utils.BigNumber', (): void => {
    const expectedSuccesses: TestCase[] = [
      constructTestCase(ethers.constants.Zero, new BigNumber('0')),
      constructTestCase(ethers.constants.One, new BigNumber('1')),
      constructTestCase(ethers.BigNumber.from('1234'), new BigNumber('1234')),
      constructTestCase(ethers.utils.parseUnits('1.234', 3), new BigNumber('1234'))
    ]
    const expectedFailures: ethers.BigNumber[] = []

    testSuccesses(expectedSuccesses)
    testFailures(expectedFailures)
  })
})
