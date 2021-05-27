import BigNumber from 'bignumber.js'

export const DECIMALS = 18
export const FUNDING_TIME = 28800

export const _0: BigNumber = new BigNumber('0')
export const _1: BigNumber = new BigNumber('1')
export const _2: BigNumber = new BigNumber('2')
export const _3: BigNumber = new BigNumber('3')

export const CHAIN_ID_TO_READER_ADDRESS: { [chainID: number]: string } = {
  // kovan
  42: '0xA097B75919F7a41221f140215A4C71fD4EFf7582',
  // s10poa
  1337: '0xAcEe0E35dbE08f36563D9Dd6faa687331c39E09A',
  // bsc
  // 56: '',
  // bsc testnet
  97: '0x5c32d02948165c75F682A59aF1a9f654F3Ece214',
  // arbitrum kovan5
  144545313136048: '0x34Ee759Dd399F35E63d08A9A5834C148b3fC974F'
}

export const CHAIN_ID_TO_POOL_CREATOR_ADDRESS: { [chainID: number]: string } = {
  42: '0x0956a627788199bE312c9a1f2d8cBA70ec30fCb5',
  1337: '0x08E6c0e74799EAF55Ce8bdB13e976f038f86ad3e',
  // 56: '',
  97: '0x6cadfF06B18d9AeF58A974C7073F37B622D660B0',
  144545313136048: '0x59edD5AEBf97955F53a094B49221E63F544ddA5a'
}

export const CHAIN_ID_TO_BROKER_ADDRESS: { [chainID: number]: string } = {
  42: '0xE852039e483F6E9aDbb0408a7d970d4cf5Ec879b',
  1337: '0x70afC7cD35804fF1b69D1e2cF7150e2a60D4fd31',
  // 56: '',
  97: '0xde3093172Fe85691766391547169f903812d6450',
  144545313136048: '0x9CaDa02fC03671EA66BaAC7929Cb769214621947'
}

export const CHAIN_ID_TO_ORACLE_ROUTER_CREATOR_ADDRESS: { [chainID: number]: string } = {
  42: '0x380bd9EE6c4a00a4c98a64CBcC5bd6affBEa06a7',
  1337: '0xc7b1229fd865f8CC0964FeEDCE7ACa288a8E0A36',
  // 56: '',
  97: '0x8d44fd514E16c3148cEfA6b759a715d58a11e676',
  144545313136048: '0x93DAA4B9Baf4f1E9Cfe4100aA1f2c928C68e8DA3'
}

export const CHAIN_ID_SYMBOL_SERVICE_ADDRESS: { [chainID: number]: string } = {
  42: '0x0A701c621210859eAbE2F47BE37456BEc2427462',
  1337: '0x1cd81041577a334cc4cAD4012913De5DF30a3ef9',
  // 56: '',
  97: '0x63372427A3Bcc8A7d7F04f3A4581A37Cd41f89c4',
  144545313136048: '0x465fB17aCc62Efd26D5B3bE9B3FFC984Cebd03d1'
}

// leave 1% when calculating withdrawal penalty if position != 0
export const REMOVE_LIQUIDITY_MAX_SHARE_RELAX = new BigNumber('0.99')
