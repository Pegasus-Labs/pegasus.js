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
  42: '0x90b24561Ba9cf98dC6bbA3aF0B19442AE37c1fcf',
  1337: '0x2Fe77342fab6F5f44C3E1C705Bf4E61b1631080a',
}

// leave 1% when calculating withdrawal penalty if position != 0
export const REMOVE_LIQUIDITY_MAX_SHARE_RELAX = new BigNumber('0.99')
