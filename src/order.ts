import { computeAccount } from './computation'
import { InvalidArgumentError, AccountStorage, LiquidityPoolStorage, Order } from './types'
import { _0, _1, _2 } from './constants'
import { splitAmount } from './utils'
import BigNumber from 'bignumber.js'

// split orders into buyOrders and sellOrders
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

// filter orders that will be executed before and after a new order
export function splitOrdersByLimitPrice(orders: Order[], limitPrice: BigNumber, isBuy: boolean): { preOrders: Order[], postOrders: Order[] } {
  const preOrders: Order[] = []
  const postOrders: Order[] = []
  orders.forEach(order => {
    if ((isBuy && order.amount.gte(_0) && order.limitPrice.gte(limitPrice))
      || (!isBuy && order.amount.lte(_0) && order.limitPrice.lte(limitPrice))) {
      preOrders.push(order)
    } else {
      postOrders.push(order)
    }
  })
  if (isBuy) {
    preOrders.sort((a, b) => b.limitPrice.comparedTo(a.limitPrice)) // desc
    postOrders.sort((a, b) => b.limitPrice.comparedTo(a.limitPrice)) // desc
  } else {
    preOrders.sort((a, b) => a.limitPrice.comparedTo(b.limitPrice)) // asc
    postOrders.sort((a, b) => a.limitPrice.comparedTo(b.limitPrice)) // asc
  }
  return { preOrders, postOrders }
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
export function orderSideAvailable(
  p: LiquidityPoolStorage,
  perpetualIndex: number,
  marginBalance: BigNumber,
  position: BigNumber,
  targetLeverage: BigNumber,
  walletBalance: BigNumber,
  orders: Order[]
): { remainPosition: BigNumber; remainMargin: BigNumber, remainWalletBalance: BigNumber } {
  const perpetual = p.perpetuals.get(perpetualIndex)
  if (!perpetual) {
    throw new InvalidArgumentError(`perpetual {perpetualIndex} not found in the pool`)
  }
  const feeRate = p.vaultFeeRate.plus(perpetual.lpFeeRate).plus(perpetual.operatorFeeRate)
  const mark = perpetual.markPrice
  const imRate = perpetual.initialMarginRate
  let remainPosition = position
  let remainMargin = marginBalance
  let remainWalletBalance = walletBalance
  let remainOrders: Order[] = []
  if (orders.length == 0) {
    return { remainPosition, remainMargin, remainWalletBalance }
  }

  // close position
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i]
    const { close } = splitAmount(remainPosition, order.amount)
    if (!close.isZero()) {
      const newPosition = remainPosition.plus(close)
      const newPositionMargin = mark.times(newPosition.abs()).times(imRate)
      const potentialPNL = mark.minus(order.limitPrice).times(close)
      // loss = pnl if pnl < 0 else 0
      const potentialLoss = BigNumber.minimum(potentialPNL, _0)
      let afterMargin = remainMargin.plus(potentialLoss)
      const fee = BigNumber.minimum(
        // marginBalance + pnl - mark * | newPosition | * imRate
        BigNumber.maximum(afterMargin.minus(newPositionMargin), _0),
        order.limitPrice.times(close.abs()).times(feeRate),
      )
      afterMargin = afterMargin.minus(fee)
      if (afterMargin.lt(_0)) {
        // bankrupt when close. pretend all orders as open orders
        remainPosition = _0
        remainMargin = _0 // TODO:
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
        remainWalletBalance = remainWalletBalance.plus(withdraw)
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

  // if close = 0 && position = 0 && margin > 0
  if (remainPosition.isZero()) {
    remainWalletBalance = remainWalletBalance.plus(remainMargin)
    remainMargin = _0
  }

  // open position
  for (let i = 0; i < remainOrders.length; i++) {
    const cost = openOrderCost(p, perpetualIndex, remainOrders[i], targetLeverage)
    remainWalletBalance = remainWalletBalance.minus(cost)
    // TODO:
    // if remainWalletBalance < 0, the relayer should cancel some part of the order
  }

  return { remainPosition, remainMargin, remainWalletBalance }
}

// available = remainWalletBalance = walletBalance - orderMargin
export function orderAvailable(
  p: LiquidityPoolStorage,
  perpetualIndex: number,
  trader: AccountStorage,
  walletBalance: BigNumber,
  orders: Order[]
) : BigNumber {
  const { buyOrders, sellOrders } = splitOrderGroup(orders)
  const marginBalance = computeAccount(p, perpetualIndex, trader).accountComputed.marginBalance
  const buySide = orderSideAvailable(p, perpetualIndex, marginBalance, trader.positionAmount, trader.targetLeverage, walletBalance, buyOrders)
  const sellSide = orderSideAvailable(p, perpetualIndex, marginBalance, trader.positionAmount, trader.targetLeverage, walletBalance, sellOrders)
  return BigNumber.minimum(buySide.remainWalletBalance, sellSide.remainWalletBalance)
}

export function orderCost(
  p: LiquidityPoolStorage,
  perpetualIndex: number,
  trader: AccountStorage,
  walletBalance: BigNumber,
  orders: Order[],
  oldAvailable: BigNumber, // please pass the returned value of orderAvailable(orders)
  newOrder: Order,
): BigNumber {
  const newAvailable = orderAvailable(p, perpetualIndex, trader, walletBalance, orders.concat([newOrder]))
  // old - new if old > new else 0
  return BigNumber.maximum(_0, oldAvailable.minus(newAvailable))
}
