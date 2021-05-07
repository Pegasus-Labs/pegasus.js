import { computeAccount } from './computation'
import { InvalidArgumentError, AccountStorage, LiquidityPoolStorage } from './types'
import { _0, _1, _2 } from './constants'
import { hasTheSameSign, splitAmount } from './utils'
import BigNumber from 'bignumber.js'

export interface Order {
  limitPrice: BigNumber
  amount: BigNumber // should be Pending + Available
}

export function splitOrderGroup(orders: Order[]) {
  let buyOrders: Order[] = []
  let sellOrders: Order[] = []
  orders.forEach(order => {
    if (order.amount.gt(_0)) {
      buyOrders.push(order)
    } else {
      sellOrders.push(order)
    }
  })
  buyOrders.sort((a, b) => b.limitPrice.comparedTo(a.limitPrice)) // desc
  sellOrders.sort((a, b) => a.limitPrice.comparedTo(b.limitPrice)) // asc
  return { buyOrders, sellOrders }
}

export function openOrderCost(
  p: LiquidityPoolStorage,
  perpetualIndex: number,
  order: Order,
  leverage: BigNumber,
): BigNumber {
  const perpetual = p.perpetuals.get(perpetualIndex)
  if (!perpetual) {
    throw new InvalidArgumentError(`perpetual {perpetualIndex} not found in the pool`)
  }
  const feeRate = p.vaultFeeRate.plus(perpetual.lpFeeRate).plus(perpetual.operatorFeeRate)
  const mark = perpetual.markPrice
  const potentialPNL = mark.minus(order.limitPrice).times(order.amount)
  // loss = pnl if pnl < 0 else 0
  const potentialLoss = BigNumber.minimum(potentialPNL, _0)
  // limitPrice * | amount | * (1 / lev + feeRate) + loss
  return order.limitPrice.times(order.amount.abs())
    .times(_1.div(leverage).plus(feeRate))
    .minus(potentialLoss)
}

// return available in wallet balance
export function sideAvailable(
  p: LiquidityPoolStorage,
  perpetualIndex: number,
  trader: AccountStorage,
  walletBalance: BigNumber,
  orders: Order[]
): { remainPosition: BigNumber; available: BigNumber } {
  const perpetual = p.perpetuals.get(perpetualIndex)
  if (!perpetual) {
    throw new InvalidArgumentError(`perpetual {perpetualIndex} not found in the pool`)
  }
  const feeRate = p.vaultFeeRate.plus(perpetual.lpFeeRate).plus(perpetual.operatorFeeRate)
  const mark = perpetual.markPrice
  const imRate = perpetual.initialMarginRate
  const computed = computeAccount(p, perpetualIndex, trader)
  let remainPosition = trader.positionAmount // position
  let remainMargin = computed.accountComputed.marginBalance
  let available = walletBalance
  let remainOrders: Order[] = []
  if (orders.length == 0) {
    return { remainPosition, available }
  }
  // close position
  if (!hasTheSameSign(trader.positionAmount, orders[0].amount)) {
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i]
      if (!remainPosition.isZero()) {
        const { close } = splitAmount(remainPosition, order.amount)
        const newPosition = remainPosition.plus(close)
        const newPositionMargin = mark.times(newPosition.abs()).times(imRate)
        const pnl = mark.minus(order.limitPrice).times(close)
        let afterMargin = remainMargin.plus(pnl)
        const fee = BigNumber.minimum(
          // marginBalance + pnl - mark * | newPosition | * imRate
          BigNumber.maximum(afterMargin.minus(newPositionMargin), _0),
          order.limitPrice.times(close.abs()).times(feeRate),
        )
        afterMargin = afterMargin.minus(fee)
        if (afterMargin.lt(_0)) {
          // bankrupt when close. pretend all orders as open orders
          remainPosition = _0
          remainOrders.push(order)
        } else {
          // withdraw only if marginBalance >= IM
          let withdraw = _0
          if (afterMargin.gte(newPositionMargin)) {
            // withdraw = afterMargin - remainMargin * (1 - | close / remainPosition |)
            withdraw = close.div(remainPosition).abs()
            withdraw = _1.minus(withdraw).times(remainMargin)
            withdraw = afterMargin.minus(withdraw)
            withdraw = BigNumber.maximum(_0, withdraw)
          }
          remainMargin = afterMargin.minus(withdraw)
          available = available.plus(withdraw)
          remainPosition = remainPosition.plus(close)
          const newOrderAmount = order.amount.minus(close)
          if (!newOrderAmount.isZero()) {
            remainOrders.push({ ...order, amount: newOrderAmount })
          }
        }
      } else {
        remainOrders.push(order)
      }
    }
  }

  // TODO: if pos = 0, afterMargin saves to available?

  // open position
  for (let i = 0; i < remainOrders.length; i++) {
    const cost = openOrderCost(p, perpetualIndex, remainOrders[i], trader.targetLeverage)
    available = available.minus(cost)

    // TODO:
    // if available < 0, the relayer should cancel some part of the order
  }

  return { remainPosition, available }
}

// available = walletBalance - orderMargin
export function orderAvailable(
  p: LiquidityPoolStorage,
  perpetualIndex: number,
  trader: AccountStorage,
  walletBalance: BigNumber,
  orders: Order[]
) : BigNumber {
  const { buyOrders, sellOrders } = splitOrderGroup(orders)
  const buySide = sideAvailable(p, perpetualIndex, trader, walletBalance, buyOrders)
  const sellSide = sideAvailable(p, perpetualIndex, trader, walletBalance, sellOrders)
  return BigNumber.minimum(buySide.available, sellSide.available)
}

export function orderCost(
  p: LiquidityPoolStorage,
  perpetualIndex: number,
  trader: AccountStorage,
  walletBalance: BigNumber,
  orders: Order[],
  newOrder: Order,
): BigNumber {
  const oldAvailable = orderAvailable(p, perpetualIndex, trader, walletBalance, orders)
  const newAvailable = orderAvailable(p, perpetualIndex, trader, walletBalance, orders.concat([newOrder]))
  // old - new if old > new else 0
  return BigNumber.maximum(_0, oldAvailable.minus(newAvailable))
}

// export function orderMaxOpen(perp: Perp, limitPrice: number, side: Side, leverage: number, available: number): number {
//   let potentialLoss = 0
//   if (side == Side.BUY && perp.mark < limitPrice) {
//     potentialLoss = limitPrice - perp.mark
//   } else if (side == Side.SELL && perp.mark > limitPrice) {
//     potentialLoss = perp.mark - limitPrice
//   }
//   return available / (limitPrice * (1 / leverage + perp.fee) + potentialLoss)
// }

// export function orderMaxClose(perp: Perp, position: Position, remainPosition: number, limitPrice: number) {
//   if (remainPosition == 0) {
//     return { maxClose: 0, withdraw: position.size == 0 ? position.margin : 0 }
//   }
//   const pnl = position.side == Side.BUY ? limitPrice - position.entryPrice : position.entryPrice - limitPrice
//   let withdraw = (position.margin / position.size + pnl) * remainPosition
//   const delta = Math.max(0, withdraw - remainPosition * perp.mark * perp.im)
//   const fee = Math.min(limitPrice * remainPosition * perp.fee, delta)
//   withdraw -= fee

//   if (withdraw < 0) {
//     throw 'bad limit price'
//   }

//   return { maxClose: remainPosition, withdraw }
// }

// export function orderMax(
//   perp: Perp,
//   position: Position,
//   remainPosition: number,
//   limitPrice: number,
//   side: Side,
//   leverage: number,
//   available: number
// ) {
//   let max = 0
//   if (side != position.size) {
//     const { maxClose, withdraw } = orderMaxClose(perp, position, remainPosition, limitPrice)
//     max += maxClose
//     available += withdraw
//   }
//   const maxOpen = orderMaxOpen(perp, limitPrice, side, leverage, available)
//   max += maxOpen
//   return max
// }
