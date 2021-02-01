import BigNumber from 'bignumber.js'

export const DECIMALS = 18
export const FUNDING_TIME = 28800

export const _0: BigNumber = new BigNumber('0')
export const _1: BigNumber = new BigNumber('1')
export const _2: BigNumber = new BigNumber('2')
export const _3: BigNumber = new BigNumber('3')

export const CHAIN_ID_TO_READER_ADDRESS: { [chainID: number]: string } = {
  42: '0x47F926680deE7fBe66E0A7b07399F68E3f2e61fE',
  1337: '0x3563cb8eDEB55f12861a3c194143874b05b1aB9e'
}

export const CHAIN_ID_TO_POOL_CREATOR_ADDRESS: { [chainID: number]: string } = {
  42: '0x0c8B800A797541bF43ABe26C850DBeD352B6230c',
  1337: '0x0bA40541929FdC4abC40BF3AC2C2db66b8695364'
}

export const CHAIN_ID_TO_BROKER_ADDRESS: { [chainID: number]: string } = {
  42: '0x7e63e0559a16614B999D8C9Fe806A09EAAc39842',
  1337: '0xebEeEA5228721A39096c78f27583d7493f70dEBF',
  246955447367734: '0x54Cf8F0d976E39F2F55A8b9bCa8ff336657ddea3'
}

// leave 1% when calculating withdrawal penalty if position != 0
export const REMOVE_LIQUIDITY_MAX_SHARE_RELAX = new BigNumber('0.99')
