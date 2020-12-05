import { ethers } from 'ethers'
import { SignerOrProvider } from './types'
import { ERC20_ABI } from './constants'
import { normalizeBigNumberish } from './utils'
import BigNumber from 'bignumber.js'
import { CallOverrides } from "@ethersproject/contracts"

export function getERC20Contract(
  erc20Address: string,
  signerOrProvider: SignerOrProvider
): ethers.Contract {
  return new ethers.Contract(erc20Address, ERC20_ABI, signerOrProvider)
}

export async function erc20Symbol(
  erc20Contract: ethers.Contract
): Promise<string> {
  return await erc20Contract.symbol()
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
  const allowance = await erc20Contract.allowance(accountAddress, perpetualAddress)
  return normalizeBigNumberish(allowance).shiftedBy(-decimals)
}

export async function approveToken(
  erc20Contract: ethers.Contract,
  ownerAddress: string | Promise<string>,
  spenderAddress: string,
  allowance: BigNumber,
  decimals: number,
  overrides?: CallOverrides,
): Promise<ethers.providers.TransactionResponse> {
  if (!overrides) {
    overrides = {}
  }
  overrides.from = ownerAddress
  allowance = allowance.shiftedBy(decimals)
  return erc20Contract.approve(spenderAddress, allowance, overrides)
}

export async function balanceOf(
  erc20Contract: ethers.Contract,
  accountAddress: string,
  decimals: number,
): Promise<BigNumber> {
  const balance = await erc20Contract.balanceOf(accountAddress)
  return normalizeBigNumberish(balance).shiftedBy(-decimals)
}

export async function totalSupply(
  erc20Contract: ethers.Contract,
  decimals: number,
): Promise<BigNumber> {
  const totalSupply = erc20Contract.totalSupply()
  return normalizeBigNumberish(totalSupply).shiftedBy(-decimals)
}
