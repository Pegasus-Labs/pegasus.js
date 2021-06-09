import BigNumber from 'bignumber.js'

export const DECIMALS = 18
export const FUNDING_TIME = 28800

export const _0: BigNumber = new BigNumber('0')
export const _1: BigNumber = new BigNumber('1')
export const _2: BigNumber = new BigNumber('2')
export const _3: BigNumber = new BigNumber('3')

export const CHAIN_ID_TO_READER_ADDRESS: { [chainID: number]: string } = {
  // rinkeby
  4: '0x25E74e6D8A414Dff02c9CCC680B49F3708955ECF',
  // kovan
  42: '0xA097B75919F7a41221f140215A4C71fD4EFf7582',
  // s10poa
  1337: '0xb972336415C9A8e264Ab44dfd1188293e23511ba'
}

export const CHAIN_ID_TO_POOL_CREATOR_ADDRESS: { [chainID: number]: string } = {
  // rinkeby
  4: '0x0A1334aCea4E38a746daC7DCf7C3E61F0AB3D834',
  // kovan
  42: '0x0956a627788199bE312c9a1f2d8cBA70ec30fCb5',
  // s10poa
  1337: '0xf9d087E0687356101078DC80A24e9A2296B87228'
}

export const CHAIN_ID_TO_BROKER_ADDRESS: { [chainID: number]: string } = {
  // rinkeby
  4: '0xC9010d5B798286651dC24A2c49BbAd673Dd4978b',
  // kovan
  42: '0xE852039e483F6E9aDbb0408a7d970d4cf5Ec879b',
  // s10poa
  1337: '0x70afC7cD35804fF1b69D1e2cF7150e2a60D4fd31'
}

export const CHAIN_ID_TO_ORACLE_ROUTER_CREATOR_ADDRESS: { [chainID: number]: string } = {
  // rinkeby
  4: '0x7984190eE85B64590547F2814Cb696C2f2b7b1f6',
  // kovan
  42: '0x6434a5968C51F969D1c91C53eDf2A53b4a2F7cc3',
  // s10poa
  1337: '0xc7b1229fd865f8CC0964FeEDCE7ACa288a8E0A36'
}

export const CHAIN_ID_SYMBOL_SERVICE_ADDRESS: { [chainID: number]: string } = {
  // rinkeby
  4: '0xA4109D0a36E0e66d64F3B7794C60694Ca6D66E22',
  // kovan
  42: '0x0A701c621210859eAbE2F47BE37456BEc2427462',
  // s10poa
  1337: '0x0211f31C7113aDF3BDf869891827C23d7d4d443c'
}

export const CHAIN_ID_INVERSE_SERVICE_ADDRESS: { [chainID: number]: string } = {
  // rinkeby
  4: '0xc4F97bD99f10Ca08Ce9ec9C9CB05C72F358dbC5E',
  // kovan
  42: '0xa72F2f8B0Dd531635f71C43fAC9C817eB4F80f9D',
  // s10poa
  1337: '0xaEE38A00A7667B672b8a2bB0687Ac301F02f15c5'
}

// leave 1% when calculating withdrawal penalty if position != 0
export const REMOVE_LIQUIDITY_MAX_SHARE_RELAX = new BigNumber('0.99')
