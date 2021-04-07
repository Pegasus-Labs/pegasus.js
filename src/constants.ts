import BigNumber from 'bignumber.js'

export const DECIMALS = 18
export const FUNDING_TIME = 28800

export const _0: BigNumber = new BigNumber('0')
export const _1: BigNumber = new BigNumber('1')
export const _2: BigNumber = new BigNumber('2')
export const _3: BigNumber = new BigNumber('3')

export const CHAIN_ID_TO_READER_ADDRESS: { [chainID: number]: string } = {
  // kovan
  42: '0x50DD9E7d582F13637137F8bDD8357E0b6b5f6B5B',
  // s10poa
  1337: '0x7Ef622CaA0516bEC19447625A9dC248ad156f034',
  // bsc
  // 56: '',
  // bsc testnet
  97: '0x207eD1742cc0BeBD03E50e855d3a14E41f93A461',
}

export const CHAIN_ID_TO_POOL_CREATOR_ADDRESS: { [chainID: number]: string } = {
  42: '0xF55cF7BbaF548115DCea6DF10c57DF7c7eD88b9b',
  1337: '0xA800Bcb48c188508167FAa1d12e8A023a3a3D044',
  // 56: '',
  97: '0x52e09568f4a3987FD8510711f31D37C5aD36cF63',
}

export const CHAIN_ID_TO_BROKER_ADDRESS: { [chainID: number]: string } = {
  42: '0x243d3bB879779911a5299592d38e84E54B83fd19',
  1337: '0xCE94e2df92B47A59B8887f146d2647d2cE175ced',
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
  1337: '0x64469dFE912274474aedb74cd991932cd4CDE7f0',
  // 56: '',
  97: '0x382746fed08817E98eA3923e9C3F1969E87d3e16',
}

// leave 1% when calculating withdrawal penalty if position != 0
export const REMOVE_LIQUIDITY_MAX_SHARE_RELAX = new BigNumber('0.99')
