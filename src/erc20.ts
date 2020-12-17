import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { getAddress } from "@ethersproject/address"
import { CallOverrides } from "@ethersproject/contracts"
import { Provider } from '@ethersproject/providers'
import { parseBytes32String } from '@ethersproject/strings'
import { SignerOrProvider } from './types'
import { ERC20_ABI, ERC20_BYTES32_ABI } from './constants'
import { normalizeBigNumberish } from './utils'

export function getERC20Contract(
  erc20Address: string,
  signerOrProvider: SignerOrProvider
): ethers.Contract {
  getAddress(erc20Address)
  return new ethers.Contract(erc20Address, ERC20_ABI, signerOrProvider)
}

export function getERC20Bytes32Contract(
  erc20Address: string,
  signerOrProvider: SignerOrProvider
): ethers.Contract {
  getAddress(erc20Address)
  return new ethers.Contract(erc20Address, ERC20_BYTES32_ABI, signerOrProvider)
}

export async function erc20Symbol(
  erc20Contract: ethers.Contract
): Promise<string> {
  try {
    return await erc20Contract.symbol()
  } catch (err) {
    if (err.code === 'CALL_EXCEPTION') {
      return erc20SymbolBytes32(erc20Contract.address, erc20Contract.provider)
    } else {
      throw err
    }
  }
}

export async function erc20SymbolBytes32(
  erc20Address: string,
  provider: Provider
): Promise<string> {
  getAddress(erc20Address)
  const erc20Contract = new ethers.Contract(erc20Address, ERC20_BYTES32_ABI, provider)
  const bytes32 = await erc20Contract.symbol()
  return parseBytes32String(bytes32)
}

export async function erc20Decimals(
  erc20Contract: ethers.Contract
): Promise<number> {
  const decimals = await erc20Contract.decimals()
  return decimals.toNumber()
}

export async function allowance(
  erc20Contract: ethers.Contract,
  accountAddress: string,
  perpetualAddress: string,
  decimals: number,
): Promise<BigNumber> {
  getAddress(accountAddress)
  getAddress(perpetualAddress)
  const allowance = await erc20Contract.allowance(accountAddress, perpetualAddress)
  return normalizeBigNumberish(allowance).shiftedBy(-decimals)
}

export async function approveToken(
  erc20Contract: ethers.Contract,
  spenderAddress: string,
  allowance: BigNumber,
  decimals: number,
  overrides?: CallOverrides,
): Promise<ethers.providers.TransactionResponse> {
  getAddress(spenderAddress)
  allowance = allowance.shiftedBy(decimals)
  return erc20Contract.approve(spenderAddress, allowance.toFixed(), overrides)
}

export async function balanceOf(
  erc20Contract: ethers.Contract,
  accountAddress: string,
  decimals: number,
): Promise<BigNumber> {
  getAddress(accountAddress)
  const balance = await erc20Contract.balanceOf(accountAddress)
  return normalizeBigNumberish(balance).shiftedBy(-decimals)
}

export async function totalSupply(
  erc20Contract: ethers.Contract,
  decimals: number,
): Promise<BigNumber> {
  const totalSupply = await erc20Contract.totalSupply()
  return normalizeBigNumberish(totalSupply).shiftedBy(-decimals)
}
