import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { BigNumberish } from '../src/types'
import {
  normalizeBigNumberish,
  hasTheSameSign,
  mostSignificantBit,
  sqrt,
  splitAmount,
} from '../src/utils'
import { _0, _1 } from '../src/constants'

import { extendExpect } from './helper'

extendExpect()

describe('hasTheSameSign', function () {
  expect(hasTheSameSign(_0, _0)).toBeTruthy()
  expect(hasTheSameSign(_0, _1)).toBeTruthy()
  expect(hasTheSameSign(_1, _1)).toBeTruthy()
  expect(hasTheSameSign(_1.negated(), _1.negated())).toBeTruthy()
  expect(hasTheSameSign(_1.negated(), _1)).toBeFalsy()
  expect(hasTheSameSign(_1, _1.negated())).toBeFalsy()
})

it('splitAmount', function () {
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

describe('mostSignificantBit', function () {
  expect(mostSignificantBit(new BigNumber('0'))).toEqual(0)
  expect(mostSignificantBit(new BigNumber('1'))).toEqual(0)
  expect(mostSignificantBit(new BigNumber('2'))).toEqual(1)
  expect(mostSignificantBit(new BigNumber('3'))).toEqual(1)
  expect(mostSignificantBit(new BigNumber('4'))).toEqual(2)
  expect(mostSignificantBit(new BigNumber('7'))).toEqual(2)
  expect(mostSignificantBit(new BigNumber('8'))).toEqual(3)
})

describe('sqrt', function () {
  it('sqrt0', function () {
    const i = sqrt(new BigNumber('0'))
    expect(i).toApproximate(new BigNumber('0'))
  })
  it('sqrt1e-36', function () {
    const i = sqrt(new BigNumber('1').shiftedBy(-36))
    expect(i).toApproximate(new BigNumber('0'))
  })
  it('sqrt2e-36', function () {
    const i = sqrt(new BigNumber('2').shiftedBy(-36))
    expect(i).toApproximate(new BigNumber('1').shiftedBy(-18))
  })
  it('sqrt3e-36', function () {
    const i = sqrt(new BigNumber('3').shiftedBy(-36))
    expect(i).toApproximate(new BigNumber('1').shiftedBy(-18))
  })
  it('sqrt4e-36', function () {
    const i = sqrt(new BigNumber('4').shiftedBy(-36))
    expect(i).toApproximate(new BigNumber('2').shiftedBy(-18))
  })
  it('sqrt0.1225', function () {
    const i = sqrt(new BigNumber('0.1225'))
    expect(i).toApproximate(new BigNumber('0.35'))
  })
  it('sqrt1', function () {
    const i = sqrt(new BigNumber('1'))
    expect(i).toApproximate(new BigNumber('1'))
  })
  it('sqrt25', function () {
    const i = sqrt(new BigNumber('25'))
    expect(i).toApproximate(new BigNumber('5'))
  })
  it('sqrt2^144', function () {
    const i = sqrt(new BigNumber('22300745198530623141535718272648361505980416'))
    expect(i).toApproximate(new BigNumber('4722366482869645213696'))
  })
  it('sqrt-1', function () {
    expect(() => {
      sqrt(new BigNumber('-1'))
    }).toThrow('negative sqrt')
  })
  it('max num', function () {
    const i = sqrt(new BigNumber('57896044618658097711785492504343953926634.992332820282019728792003956564819967'))
    expect(i).toApproximate(new BigNumber('240615969168004511545.033772477625056927'))
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
