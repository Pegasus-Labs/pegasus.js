import BigNumber from 'bignumber.js'

export const DECIMALS = 18
export const FUNDING_TIME = 28800

export const _0: BigNumber = new BigNumber('0')
export const _1: BigNumber = new BigNumber('1')
export const _2: BigNumber = new BigNumber('2')
export const _3: BigNumber = new BigNumber('3')

export const CHAIN_ID_TO_READER_ADDRESS: { [chainID: number]: string } = {
  // kovan
  42: '0xF65efAf648938926134F9F245BF1fE77a6Ec7486',
  // s10poa
  1337: '0x33C92C61ba0278253dab37F5ACfef661196d9cef',
  // bsc
  // 56: '',
  // bsc testnet
  97: '0x74F5b3581d70FfdEcE47090E568a8743f9659787',
}

export const CHAIN_ID_TO_POOL_CREATOR_ADDRESS: { [chainID: number]: string } = {
  42: '0xF55cF7BbaF548115DCea6DF10c57DF7c7eD88b9b',
  1337: '0x0e770Cc6292Da25787CA1D736d3c8513422c3862',
  // 56: '',
  97: '0x52e09568f4a3987FD8510711f31D37C5aD36cF63',
}

export const CHAIN_ID_TO_BROKER_ADDRESS: { [chainID: number]: string } = {
  42: '0x243d3bB879779911a5299592d38e84E54B83fd19',
  1337: '0xe40891d986789B89104Bf5e52649222a07910466',
  // 56: '',
  97: '0xebd233F44D57915d1F23c69E4b296F05EfB1FB85',
}

export const CHAIN_ID_TO_ORACLE_ROUTER_CREATOR_ADDRESS: { [chainID: number]: string } = {
  42: '0x380bd9EE6c4a00a4c98a64CBcC5bd6affBEa06a7',
  1337: '0xc7b1229fd865f8CC0964FeEDCE7ACa288a8E0A36',
  // 56: '',
  97: '0x8d44fd514E16c3148cEfA6b759a715d58a11e676',
}

export const CHAIN_ID_SYMBOL_SERVICE_ADDRESS: { [chainID: number]: string } = {
  42: '0x0A701c621210859eAbE2F47BE37456BEc2427462',
  1337: '0xfF7ae9AeCb23701720E24bF3f8DA51ddddce6E50',
  // 56: '',
  97: '0x382746fed08817E98eA3923e9C3F1969E87d3e16',
}

// leave 1% when calculating withdrawal penalty if position != 0
export const REMOVE_LIQUIDITY_MAX_SHARE_RELAX = new BigNumber('0.99')
