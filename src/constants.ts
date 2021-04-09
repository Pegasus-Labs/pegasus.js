import BigNumber from 'bignumber.js'

export const DECIMALS = 18
export const FUNDING_TIME = 28800

export const _0: BigNumber = new BigNumber('0')
export const _1: BigNumber = new BigNumber('1')
export const _2: BigNumber = new BigNumber('2')
export const _3: BigNumber = new BigNumber('3')

export const CHAIN_ID_TO_READER_ADDRESS: { [chainID: number]: string } = {
  // kovan
  42: '0x9ba69c0ef49AC2735Db933e450C0aaAA7B9E8C53',
  // s10poa
  1337: '0x097620778ae61D1E0a846DF3260c35ff2DaA4507',
  // bsc
  // 56: '',
  // bsc testnet
  97: '0x207eD1742cc0BeBD03E50e855d3a14E41f93A461',
}

export const CHAIN_ID_TO_POOL_CREATOR_ADDRESS: { [chainID: number]: string } = {
  42: '0x0956a627788199bE312c9a1f2d8cBA70ec30fCb5',
  1337: '0x94559e90eaac02719BA4277056E431871ED40F6a',
  // 56: '',
  97: '0x52e09568f4a3987FD8510711f31D37C5aD36cF63',
}

export const CHAIN_ID_TO_BROKER_ADDRESS: { [chainID: number]: string } = {
  42: '0xE852039e483F6E9aDbb0408a7d970d4cf5Ec879b',
  1337: '0xDaeD36C38b0C4BE607E07458a159203bEC54ad0d',
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
  1337: '0x1E191A99Cb0C196E7A6476C4Bd9785DB641f960B',
  // 56: '',
  97: '0x382746fed08817E98eA3923e9C3F1969E87d3e16',
}

// leave 1% when calculating withdrawal penalty if position != 0
export const REMOVE_LIQUIDITY_MAX_SHARE_RELAX = new BigNumber('0.99')
