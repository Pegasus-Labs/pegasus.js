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
  1337: '0x46400398981CB50937d016C11D3101Ea72AA94BB',
}
