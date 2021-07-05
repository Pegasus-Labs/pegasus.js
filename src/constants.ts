import BigNumber from 'bignumber.js'

export const DECIMALS = 18
export const FUNDING_TIME = 28800

export const _0: BigNumber = new BigNumber('0')
export const _1: BigNumber = new BigNumber('1')
export const _2: BigNumber = new BigNumber('2')
export const _3: BigNumber = new BigNumber('3')

export const CHAIN_ID_TO_READER_ADDRESS: { [chainID: number]: string } = {
  // kovan
  42: '0xA097B75919F7a41221f140215A4C71fD4EFf7582',
  // s10poa
  1337: '0xDcb4594238c1a6DD6878E814BDb718C34B8ec781',
  // arb testnet
  421611: '0x25E74e6D8A414Dff02c9CCC680B49F3708955ECF',
  // arb one
  42161: '0xa48823Ff78e0D4D73D90b0Bf4B22Bf8a6EdBbb57'
}

export const CHAIN_ID_TO_POOL_CREATOR_ADDRESS: { [chainID: number]: string } = {
  // kovan
  42: '0x0956a627788199bE312c9a1f2d8cBA70ec30fCb5',
  // s10poa
  1337: '0x43B368193Be128ED2e39806F1C1F8CEc860d1BF0',
  // arb testnet
  421611: '0x0A1334aCea4E38a746daC7DCf7C3E61F0AB3D834',
  // arb one
  42161: '0xbCCF6C081d9aa6E8B85602C04e66c5405D9be4A7'
}

export const CHAIN_ID_TO_BROKER_ADDRESS: { [chainID: number]: string } = {
  // kovan
  42: '0xE852039e483F6E9aDbb0408a7d970d4cf5Ec879b',
  // s10poa
  1337: '0x3b07b719366F7D20881DC0F89D7Bd21cC34D65FF',
  // arb testnet
  421611: '0xC9010d5B798286651dC24A2c49BbAd673Dd4978b',
  // arb one
  42161: '0xAAF4d5019F98f12c7ab0Ca877856Bcdd65213867'
}

export const CHAIN_ID_TO_ORACLE_ROUTER_CREATOR_ADDRESS: { [chainID: number]: string } = {
  // kovan
  42: '0x5374F824c4EB93e37Ee21B5CF4e762F246D82d12',
  // s10poa
  1337: '0x372d180ef40873887768eb1d29dA1ca657895CBF',
  // arb testnet
  421611: '0x9730DD5a6eb170082c7c71c2e41332853681bb92',
  // arb one
  42161: '0xB9553f5665f7512dFCBf0a0D96dd6Bc9Ceb218f2'
}

export const CHAIN_ID_TO_UNISWAP_V3_ORACLE_ROUTER_CREATOR_ADDRESS: { [chainID: number]: string } = {
  // kovan
  42: '0xF67b243CF00ae7343Bd177Edf2d0EC4bAC4F47B7',
  // arb testnet
  421611: '0x6154996e1C80dE982f9eebC3E93B4DFd4F30a74a',
  // arb one
  42161: '0x812d693eD9a6F8F0b4aE7881B723fCBFae992D5F'
}

export const CHAIN_ID_SYMBOL_SERVICE_ADDRESS: { [chainID: number]: string } = {
  // kovan
  42: '0x0A701c621210859eAbE2F47BE37456BEc2427462',
  // s10poa
  1337: '0x3567788fD2a50eeAE932DF705E976787FB39C4ce',
  // arb testnet
  421611: '0xA4109D0a36E0e66d64F3B7794C60694Ca6D66E22',
  // arb one
  42161: '0x9a2b7B8117548D2DDaeF3fCF4102EF6930C8542A'
}

export const CHAIN_ID_INVERSE_SERVICE_ADDRESS: { [chainID: number]: string } = {
  // kovan
  42: '0xa72F2f8B0Dd531635f71C43fAC9C817eB4F80f9D',
  // s10poa
  1337: '0x0CeF74EDC3BA4de2C20AC8a40547a24e4d57988D',
  // arb testnet
  421611: '0xc4F97bD99f10Ca08Ce9ec9C9CB05C72F358dbC5E',
  // arb one
  42161: '0xa4F6b7D4EC1BA48B6506D4557Ce547727e59654A'
}

// leave 1% when calculating withdrawal penalty if position != 0
export const REMOVE_LIQUIDITY_MAX_SHARE_RELAX = new BigNumber('0.99')
