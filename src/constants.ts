import BigNumber from 'bignumber.js'

export const DECIMALS = 18
export const FUNDING_TIME = 28800

export const _0: BigNumber = new BigNumber('0')
export const _1: BigNumber = new BigNumber('1')
export const _2: BigNumber = new BigNumber('2')
export const _3: BigNumber = new BigNumber('3')

export const CHAIN_ID_TO_READER_ADDRESS: { [chainID: number]: string } = {
  // kovan
  42: '0x45Fe8E99F557F40E3B4d5Be501F4411c33023216',
  // s10poa
  1337: '0x79BFdFE7BD779d6c3a9F476C16044Ab21b9B0b37',
  // bsc
  // 56: '',
  // bsc testnet
  97: '0x5c32d02948165c75F682A59aF1a9f654F3Ece214',
}

export const CHAIN_ID_TO_POOL_CREATOR_ADDRESS: { [chainID: number]: string } = {
  42: '0xb3dBa7366ec3B765569c97effe0C4D32A9a85c55',
  1337: '0x30DF108a6f3ec3CAFaD55E68A3D14c0654BE626A',
  // 56: '',
  97: '0x6cadfF06B18d9AeF58A974C7073F37B622D660B0',
}

export const CHAIN_ID_TO_BROKER_ADDRESS: { [chainID: number]: string } = {
  42: '0x08698b63565E4C993beE35Ff4Ab912D8f7d028FD',
  1337: '0x70afC7cD35804fF1b69D1e2cF7150e2a60D4fd31',
  // 56: '',
  97: '0xde3093172Fe85691766391547169f903812d6450',
}

export const CHAIN_ID_TO_ORACLE_ROUTER_CREATOR_ADDRESS: { [chainID: number]: string } = {
  42: '0x380bd9EE6c4a00a4c98a64CBcC5bd6affBEa06a7',
  1337: '0xc7b1229fd865f8CC0964FeEDCE7ACa288a8E0A36',
  // 56: '',
  97: '0x8d44fd514E16c3148cEfA6b759a715d58a11e676',
}

export const CHAIN_ID_SYMBOL_SERVICE_ADDRESS: { [chainID: number]: string } = {
  42: '0x0521A90432624aa3e85AFcE73CB45E4243A82Bc3',
  1337: '0xAf85a1998ef007e85c95a2840cbfeE6dE9Bab48c',
  // 56: '',
  97: '0x63372427A3Bcc8A7d7F04f3A4581A37Cd41f89c4',
}

// leave 1% when calculating withdrawal penalty if position != 0
export const REMOVE_LIQUIDITY_MAX_SHARE_RELAX = new BigNumber('0.99')
