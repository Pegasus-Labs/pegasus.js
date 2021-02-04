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
  1337: '0xE9201A67b494588056Ccd192c2c2FA9a76D26CC4'
}

export const CHAIN_ID_TO_POOL_CREATOR_ADDRESS: { [chainID: number]: string } = {
  42: '0x0c8B800A797541bF43ABe26C850DBeD352B6230c',
  1337: '0xb918CC5eB7cC8864E9007Cc1f8484977b6Fce151'
}

export const CHAIN_ID_TO_BROKER_ADDRESS: { [chainID: number]: string } = {
  42: '0x7e63e0559a16614B999D8C9Fe806A09EAAc39842',
  1337: '0x10028d1fbB813066Bfa21C7B99a67278238a603d',
}

// leave 1% when calculating withdrawal penalty if position != 0
export const REMOVE_LIQUIDITY_MAX_SHARE_RELAX = new BigNumber('0.99')
