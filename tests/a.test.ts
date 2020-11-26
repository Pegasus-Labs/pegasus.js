
import BigNumber from 'bignumber.js'
import { _0, _1 } from '../src/constants'

// // im = 0.02 => [0, 10, 20, 30, 40, 50]
// // im = 0.10 => [0, 1, 2, 3, 4, 5]
// // im = 0.075 => [0, 2.7, 5.3, 8, 10.7, 13.3]
// export function getPerpetualLeverageMarks(initialMarginRate: BigNumber): Array<BigNumber> {
//     const upper = _1.div(initialMarginRate)
//     const bucket = upper.div(5)
//     return [
//       _0,
//       bucket.dp(1),
//       bucket.times(2).dp(1),
//       bucket.times(3).dp(1),
//       bucket.times(4).dp(1),
//       upper.dp(1)
//     ]
// }

// it('trade - fail', function () {
//   const cases = [
//     '0.005', '0.01', '0.02', '0.03', '0.05', '0.075', '0.1', '0.2'
//   ]
//   for (let i = 0; i < cases.length; i++) {
//     let j = new BigNumber(cases[i])
//     const p = getPerpetualLeverageMarks(j)
//     console.log(p.map(x => x.toFixed()).join(','), j.toFixed())
//   }
// })

// import { DECIMALS } from '../src/constants'
// export const _E = new BigNumber('2.718281828459045235')
// const _LN_1_5 = new BigNumber('0.405465108108164381978013115464349137')
// const _LN_10 = new BigNumber('2.302585092994045684017991454684364208')

// export function bigLn(v: BigNumber): BigNumber {
//   if (v.lte(_0)) {
//     throw Error(`logE of negative number '${v}'`)
//   }
//   if (v.gt('10000000000000000000000000000000000000000')) {
//     throw Error(`logE only accepts v <= 1e22 * 1e18`)
//   }
//   let x = v
//   let r = _0
//   while (x.isLessThanOrEqualTo('0.1')) {
//     x = x.times('10')
//     r = r.minus(_LN_10)
//   }
//   while (x.isGreaterThanOrEqualTo('10')) {
//     x = x.div('10')
//     r = r.plus(_LN_10)
//   }
//   while (x.isLessThan(_1)) {
//     x = x.times(_E)
//     r = r.minus(_1)
//   }
//   while (x.isGreaterThan(_E)) {
//     x = x.div(_E)
//     r = r.plus(_1)
//   }
//   if (x.isEqualTo(_1)) {
//     return r.dp(DECIMALS)
//   }
//   if (x.isEqualTo(_E)) {
//     return _1.plus(r.dp(DECIMALS))
//   }
//   r = r.plus(_LN_1_5)
//   const a1_5 = new BigNumber(1.5)
//   let m = _1.times(x.minus(a1_5).div(x.plus(a1_5)))
//   r = r.plus(m.times(2))
//   const m2 = m.times(m)
//   let i = 3
//   while (true) {
//     m = m.times(m2)
//     r = r.plus(m.times(2).div(i))
//     i += 2
//     if (i >= 3 + 2 * DECIMALS) {
//       break
//     }
//   }
//   return r.dp(DECIMALS)
// }

// guess the price decimals by calculating significant figures.
// for example, if significantFigures = 5
//   $12.34567
//    ^^ ^^^  => the 3rd decimals contains 5 significant figures. return 3
// more examples:
//   $12345   => 0     $0.000081004 => 9
//   $12.345  => 3     $0.081004    => 6
//   $0.12345 => 5     $8.1004      => 4
export function guessPriceDecimals(indexPrice: BigNumber, isInverse: boolean, significantFigures: number = 5): number {
  if (isInverse) {
    indexPrice = _1.div(indexPrice)
  }
  if (!indexPrice.isFinite()) {
    return 0
  }
  if (indexPrice.lte(_0)) {
    return 0
  }
  const dp0 = indexPrice.precision(1).dp()
  if (dp0 > 0) {
    // 0.10000
    //   ^
    return dp0 + significantFigures - 1
  }
  // 10.000
  // ^
  const dp1 = indexPrice.integerValue().toFixed().length
  return Math.max(0, significantFigures - dp1)
}

it('trade - fail', function () {
  console.log(guessPriceDecimals(new BigNumber('123456.67890'), false))
  console.log(guessPriceDecimals(new BigNumber('12345.67890'), false))
  console.log(guessPriceDecimals(new BigNumber('1234.567890'), false))
  console.log(guessPriceDecimals(new BigNumber('123.4567890'), false))
  console.log(guessPriceDecimals(new BigNumber('12.34567890'), false))
  console.log(guessPriceDecimals(new BigNumber('1.234567890'), false))
  console.log(guessPriceDecimals(new BigNumber('0.123456789'), false))
  console.log(guessPriceDecimals(new BigNumber('0.0123456789'), false))
  console.log(guessPriceDecimals(new BigNumber('0.00123456789'), false))
  console.log(guessPriceDecimals(new BigNumber('0.000123456789'), false))
  console.log(guessPriceDecimals(new BigNumber('0.0000123456789'), false))
  console.log(guessPriceDecimals(new BigNumber('0.00000123456789'), false))
})
