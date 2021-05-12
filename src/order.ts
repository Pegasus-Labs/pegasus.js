import { computeAccount } from './computation'
import { InvalidArgumentError, AccountStorage, LiquidityPoolStorage, Order, OrderContext } from './types'
import { _0, _1, _2 } from './constants'
import { splitAmount } from './utils'
import BigNumber from 'bignumber.js'

// split orders into different perpetuals
export function splitOrderPerpetual(orders: Order[]): Map<number /* symbol */, Order[]> {
  const ret: Map<number, Order[]> = new Map()
  orders.forEach(order => {
    let orders = ret.get(order.symbol)
    if (!orders) {
      orders = []
      ret.set(order.symbol, orders)
    }
    orders.push(order)
  })
  return ret
}

// split orders into buyOrders and sellOrders
// note: one perpetual only
export function splitOrderSide(orders: Order[]) {
  const buyOrders: Order[] = []
  const sellOrders: Order[] = []
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
// note: one perpetual only
export function splitOrdersByLimitPrice(orders: Order[], limitPrice: BigNumber, isBuy: boolean): { preOrders: Order[], postOrders: Order[] } {
  const preOrders: Order[] = []
  const postOrders: Order[] = []
  orders.forEach(order => {
    if ((isBuy && order.amount.lt(_0)) || (!isBuy && order.amount.gt(_0))) {
      return
    }
    if ((isBuy && order.limitPrice.gte(limitPrice)) || (!isBuy && order.limitPrice.lte(limitPrice))) {
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
    throw new InvalidArgumentError(`perpetual ${perpetualIndex} not found in the pool`)
  }
  const feeRate = p.vaultFeeRate.plus(perpetual.lpFeeRate).plus(perpetual.operatorFeeRate)
  const mark = perpetual.markPrice
  const potentialPNL = mark.minus(order.limitPrice).times(order.amount)
  // loss = pnl if pnl < 0 else 0
  const potentialLoss = BigNumber.minimum(potentialPNL, _0)
  // limitPrice * | amount | * (1 / lev + feeRate) - loss
  return order.limitPrice.times(order.amount.abs())
    .times(_1.div(leverage).plus(feeRate))
    .minus(potentialLoss)
}

// return available in wallet balance. note: remainPosition and remainMargin are meaningless when open positions
// note: one perpetual + one side only
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
    throw new InvalidArgumentError(`perpetual ${perpetualIndex} not found in the pool`)
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
      // fee
      let fee = _0
      if (close.eq(order.amount)) {
        // close only
        fee = BigNumber.minimum(
          // marginBalance + pnl - mark * | newPosition | * imRate
          BigNumber.maximum(afterMargin.minus(newPositionMargin), _0),
          order.limitPrice.times(close.abs()).times(feeRate)
        )
      } else {
        // close + open
        fee = order.limitPrice.times(close.abs()).times(feeRate)
      }
      afterMargin = afterMargin.minus(fee)
      // order
      if (afterMargin.lt(_0)) {
        // bankrupt when close. pretend all orders as open orders
        remainPosition = _0
        remainMargin = _0 // TODO:
        remainOrders.push(order)

        // // bankrupt
        // if (close.eq(order.amount)) {
        //   // close only. always allows
        //   continue
        // } else {
        //   // close + open
        //   remainPosition = _0
        //   remainMargin = afterMargin // < 0!
        //   remainOrders.push({ ...order, amount: order.amount.minus(close) })
        // }
      } else {
        // !bankrupt
        let withdraw = _0
        if (afterMargin.gte(newPositionMargin)) {
          // withdraw only if marginBalance >= IM
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
    // remainMargin and remainPosition are ignored
    // TODO:
    // if remainWalletBalance < 0, the relayer should cancel some part of the order
  }

  return { remainPosition, remainMargin, remainWalletBalance }
}

// available = remainWalletBalance = walletBalance - orderMargin
// note: one perpetual only
export function orderPerpetualAvailable(
  p: LiquidityPoolStorage,
  perpetualIndex: number,
  trader: AccountStorage,
  walletBalance: BigNumber,
  orders: Order[]
) : BigNumber {
  const { buyOrders, sellOrders } = splitOrderSide(orders)
  const marginBalance = computeAccount(p, perpetualIndex, trader).accountComputed.marginBalance
  const buySide = orderSideAvailable(p, perpetualIndex, marginBalance, trader.positionAmount, trader.targetLeverage, walletBalance, buyOrders)
  const sellSide = orderSideAvailable(p, perpetualIndex, marginBalance, trader.positionAmount, trader.targetLeverage, walletBalance, sellOrders)
  return BigNumber.minimum(buySide.remainWalletBalance, sellSide.remainWalletBalance)
}

// note: one perpetual only
export function orderPerpetualCost(
  p: LiquidityPoolStorage,
  perpetualIndex: number,
  trader: AccountStorage,
  walletBalance: BigNumber,
  orders: Order[],
  oldAvailable: BigNumber, // please pass the returned value of orderAvailable(orders)
  newOrder: Order,
): BigNumber {
  const newAvailable = orderPerpetualAvailable(p, perpetualIndex, trader, walletBalance, orders.concat([newOrder]))
  // old - new if old > new else 0
  return BigNumber.maximum(_0, oldAvailable.minus(newAvailable))
}

// available = remainWalletBalance = walletBalance - orderMargin
export function orderAvailable(
  context: Map<number /* symbol */, OrderContext>,
  walletBalance: BigNumber,
  orders: Order[],
) : BigNumber {
  const symbol2Orders = splitOrderPerpetual(orders)
  let available = walletBalance
  symbol2Orders.forEach((orders, symbol) => {
    const c = context.get(symbol)
    if (!c) {
      throw new InvalidArgumentError(`unknown symbol ${symbol}`)
    }
    available = orderPerpetualAvailable(c.pool, c.perpetualIndex, c.account, available, orders)
  })
  return available
}

export function orderCost(
  context: Map<number /* symbol */, OrderContext>,
  walletBalance: BigNumber,
  orders: Order[],
  oldAvailable: BigNumber, // please pass the returned value of orderAvailable(orders)
  newOrder: Order,
): BigNumber {
  const newAvailable = orderAvailable(context, walletBalance, orders.concat([newOrder]))
  // old - new if old > new else 0
  return BigNumber.maximum(_0, oldAvailable.minus(newAvailable))
}
