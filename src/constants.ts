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
  1337: '0xa919eCecCf48Fa73338FDE6d853Ca7223876cc5e'
}

export const CHAIN_ID_TO_POOL_CREATOR_ADDRESS: { [chainID: number]: string } = {
  42: '0xfa81036567A378C44C5bC13323416aECfeD29D09',
  1337: '0xa30EE44CF4D571f5DDD8397f07D781bc21eA80c7'
}

export const CHAIN_ID_TO_BROKER_ADDRESS: { [chainID: number]: string } = {
  42: '0x9eDd72FB5d5bF05D7012A782f8643E1052d71dad',
  1337: '0x9d30C84f2c1124b3460BA4C2c2fDda50B7cB2AC5'
}

// leave 1% when calculating withdrawal penalty if position != 0
export const REMOVE_LIQUIDITY_MAX_SHARE_RELAX = new BigNumber('0.99')
