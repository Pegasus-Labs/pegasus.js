import BigNumber from 'bignumber.js'
import ERC20_ABI_JSON from './abi/ERC20.json'
import ERC20_BYTES32_ABI_JSON from './abi/ERC20Bytes32.json'

export const DECIMALS = 18
export const FUNDING_TIME = 28800
export const ERC20_ABI: string = JSON.stringify(ERC20_ABI_JSON)
export const ERC20_BYTES32_ABI: string = JSON.stringify(ERC20_BYTES32_ABI_JSON)

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
  1337: '0x7d2D6d715540caC7A72E1bf3712fcDBb00967F60'
}

export const CHAIN_ID_TO_POOL_CREATOR_ADDRESS: { [chainID: number]: string } = {
  42: '0xfa81036567A378C44C5bC13323416aECfeD29D09',
  1337: '0xef46f6112568ab1211Dc7e57c4F1f3957A115caF'
}

// leave 1% when calculating withdrawal penalty if position != 0
export const REMOVE_LIQUIDITY_MAX_SHARE_RELAX = new BigNumber('0.99')
