import BigNumber from 'bignumber.js'

export const DECIMALS = 18
export const FUNDING_TIME = 28800

export const _0: BigNumber = new BigNumber('0')
export const _1: BigNumber = new BigNumber('1')
export const _2: BigNumber = new BigNumber('2')
export const _3: BigNumber = new BigNumber('3')
export const _4: BigNumber = new BigNumber('4')
export const _INF: BigNumber = new BigNumber('Infinity')
export const _MAX_UINT256: BigNumber = new BigNumber(
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
)

export const CHAIN_ID_TO_READER_ADDRESS: { [chainID: number]: string } = {
  42: '0x034f78c7Ef34CBad13C1039e3e6457F20469Cb6C',
  1337: '0x3563cb8eDEB55f12861a3c194143874b05b1aB9e'
}

export const CHAIN_ID_TO_POOL_CREATOR_ADDRESS: { [chainID: number]: string } = {
  42: '0xfa81036567A378C44C5bC13323416aECfeD29D09',
  1337: '0x0bA40541929FdC4abC40BF3AC2C2db66b8695364'
}

export const CHAIN_ID_TO_BROKER_ADDRESS: { [chainID: number]: string } = {
  42: '0x9eDd72FB5d5bF05D7012A782f8643E1052d71dad',
  1337: '0xebEeEA5228721A39096c78f27583d7493f70dEBF'
}

// leave 1% when calculating withdrawal penalty if position != 0
export const REMOVE_LIQUIDITY_MAX_SHARE_RELAX = new BigNumber('0.99')
