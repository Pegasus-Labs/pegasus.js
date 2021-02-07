import BigNumber from 'bignumber.js'

export const DECIMALS = 18
export const FUNDING_TIME = 28800

export const _0: BigNumber = new BigNumber('0')
export const _1: BigNumber = new BigNumber('1')
export const _2: BigNumber = new BigNumber('2')
export const _3: BigNumber = new BigNumber('3')

export const CHAIN_ID_TO_READER_ADDRESS: { [chainID: number]: string } = {
  // kovan
  42: '0x623738FA73F8807B94576377BdF6781f968B761f',
  // s10poa
  1337: '0x39457166011481ECE2143F8834106e28cf17D6F0'
}

export const CHAIN_ID_TO_POOL_CREATOR_ADDRESS: { [chainID: number]: string } = {
  42: '0x0c8B800A797541bF43ABe26C850DBeD352B6230c',
  1337: '0xB7CF2e0cD6Ac6F30f00Ac0cDE2E95F553fE1d356'
}

export const CHAIN_ID_TO_BROKER_ADDRESS: { [chainID: number]: string } = {
  42: '0x7e63e0559a16614B999D8C9Fe806A09EAAc39842',
  1337: '0xA794E448e60a4e800DfEDa5Df87abddfEa3f686C',
}

export const CHAIN_ID_TO_ORACLE_ROUTER_CREATOR_ADDRESS: { [chainID: number]: string } = {
  42: '0xEb91772706F9ac9C89F223937A89D3308016dAF1',
  1337: '0xc7b1229fd865f8CC0964FeEDCE7ACa288a8E0A36',
}

// leave 1% when calculating withdrawal penalty if position != 0
export const REMOVE_LIQUIDITY_MAX_SHARE_RELAX = new BigNumber('0.99')
