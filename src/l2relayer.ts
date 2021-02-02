import { BigNumberish, getDefaultProvider, Signer } from 'ethers'

import { shallowCopy, Deferrable, resolveProperties } from '@ethersproject/properties'
import { poll } from '@ethersproject/web'
import { toUtf8String } from '@ethersproject/strings'

import { Provider, TransactionRequest, TransactionResponse } from '@ethersproject/abstract-provider'
import { Logger, LogLevel } from '@ethersproject/logger'
const logger = new Logger('mai3')
Logger.setLogLevel(LogLevel.DEBUG)

import { arrayify, Bytes, hexDataLength, hexlify, isBytesLike } from '@ethersproject/bytes'
import { TypedDataSigner } from '@ethersproject/abstract-signer'
import { _TypedDataEncoder } from '@ethersproject/hash'
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

import { LiquidityPoolFactory } from './abi/LiquidityPoolFactory'
import { Broker } from './abi/Broker'
import { BrokerFactory } from './abi/BrokerFactory'
import { CHAIN_ID_TO_BROKER_ADDRESS } from './constants'

export const DEFAULT_L2_TX_TIMEOUT = 30000

export interface L2Signer extends TypedDataSigner {
  getAddress(): Promise<string>
  signMessage(message: Bytes | string): Promise<string>
}

export interface L2RelayerCallRequest {
  method: string
  broker: string
  from: string
  to: string
  callData: string
  nonce: number
  expiration: number
  gasLimit: BigNumberish
  signature?: string
}

export interface L2RelayerClient {
  callFunction(req: L2RelayerCallRequest): Promise<string>
}

let _supportedFunctionList: { [signHash: string]: string } = {}

function _initSupportedFunctionList() {
  let lp = LiquidityPoolFactory.connect('0x0000000000000000000000000000000000000000', getDefaultProvider())
  for (let func in lp.interface.functions) {
    let signHash = lp.interface.getSighash(func)
    _supportedFunctionList[signHash] = func
  }
}

_initSupportedFunctionList()

// L2RelaySigner is used for sign by some signer and send transaction by a relayer
// - provider: the provider of the relayer's network
// - signer: the true singer
// -
export class L2RelaySigner extends Signer {
  readonly provider: Provider
  readonly l2Signer: L2Signer
  readonly relayerClient: L2RelayerClient
  txTimeout: number
  broker: Broker | null = null
  private chainId?: number

  constructor(provider: Provider, l2Signer: L2Signer, relayer: L2RelayerClient, txTimeout = DEFAULT_L2_TX_TIMEOUT) {
    super()

    this.provider = provider
    this.l2Signer = l2Signer
    this.relayerClient = relayer
    this.txTimeout = txTimeout
  }

  getAddress(): Promise<string> {
    return this.l2Signer.getAddress()
  }

  signMessage(message: Bytes | string): Promise<string> {
    return this.l2Signer.signMessage(message)
  }

  signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
    transaction = transaction
    return logger.throwError('signing transactions is unsupported', Logger.errors.UNSUPPORTED_OPERATION, {
      operation: 'signTransaction'
    })
  }

  sendTransaction(transaction: Deferrable<TransactionRequest>): Promise<TransactionResponse> {
    return this.sendUncheckedTransaction(transaction).then(hash => {
      return poll(
        () => {
          return this.provider.getTransaction(hash).then((tx: TransactionResponse) => {
            if (tx === null) {
              logger.throwError('provider.getTransaction fail', Logger.errors.UNKNOWN_ERROR, {
                transactionHash: hash,
                resultTx: tx
              })
            }
            return this._wrapTransaction(tx, hash)
          })
        },
        { onceBlock: this.provider }
      ).catch((error: Error) => {
        ;(<any>error).transactionHash = hash
        throw error
      })
    })
  }

  sendUncheckedTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
    transaction = shallowCopy(transaction)
    const fromAddress = this.getAddress().then(address => {
      if (address) {
        address = address.toLowerCase()
      }
      return address
    })

    const chainId = this.chainId ? this.chainId : this.provider.getNetwork().then(network => network.chainId)

    return resolveProperties({
      tx: resolveProperties(transaction),
      sender: fromAddress,
      cid: chainId
    }).then(({ tx, sender, cid }) => {
      if (tx.from !== undefined) {
        if (tx.from.toLowerCase() !== sender) {
          return logger.throwArgumentError('from address mismatch', 'transaction', transaction)
        }
      } else {
        tx.from = sender
      }
      this.chainId = cid

      if (tx.chainId !== undefined) {
        if (tx.chainId !== cid) {
          return logger.throwArgumentError('chainId mismatch', 'transaction', transaction)
        }
      }
      tx.chainId = cid

      if (!(cid in CHAIN_ID_TO_BROKER_ADDRESS)) {
        return logger.throwArgumentError('get broker address fail', 'chainId', chainId)
      }
      const brokerAddress = CHAIN_ID_TO_BROKER_ADDRESS[cid]
      const broker = BrokerFactory.connect(brokerAddress, this.provider)

      return broker.getNonce(sender).then(nonce => {
        if (!tx.gasLimit) {
          return logger.throwArgumentError('missing gasLimit', 'transaction', transaction)
        }
        //TODO
        tx.gasLimit = 0
        if (!tx.data || !tx.to || !tx.chainId) {
          return logger.throwArgumentError('null field', 'transaction', transaction)
        }
        const bytes = arrayify(tx.data)
        const sigHash = hexlify(bytes.slice(0, 4))
        let method: string

        if (!(sigHash in _supportedFunctionList)) {
          return logger.throwArgumentError('unknown sigHash', 'transaction', transaction)
        } else {
          method = _supportedFunctionList[sigHash]
        }
        const expiration = Math.trunc((new Date().getTime() + this.txTimeout) / 1000)

        let req: L2RelayerCallRequest = {
          method: method,
          broker: broker.address,
          from: sender,
          to: tx.to,
          callData: hexlify(bytes.slice(4)),
          nonce: nonce,
          expiration: expiration,
          gasLimit: tx.gasLimit
        }

        return this._signCallData(tx.chainId, req).then(signature => {
          req.signature = signature
          console.log(req)
          return this.relayerClient.callFunction(req)
        })
      })
    })
  }

  _signCallData(chainId: number, req: L2RelayerCallRequest): Promise<string> {
    const domain = {
      name: 'Mai L2 Call',
      version: 'v3.0'
    }
    const types = {
      Call: [
        { name: 'chainId', type: 'uint256' },
        { name: 'method', type: 'string' },
        { name: 'broker', type: 'address' },
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'callData', type: 'bytes' },
        { name: 'nonce', type: 'uint32' },
        { name: 'expiration', type: 'uint32' },
        { name: 'gasLimit', type: 'uint64' }
      ]
    }

    return this.l2Signer._signTypedData(domain, types, { chainId: chainId, ...req })
  }

  _wrapTransaction(tx: TransactionResponse, hash?: string): TransactionResponse {
    if (hash != null && hexDataLength(hash) !== 32) {
      throw new Error('invalid response - sendTransaction')
    }

    const result = <TransactionResponse>tx

    // Check the hash we expect is the same as the hash the server reported
    if (hash != null && tx.hash !== hash) {
      logger.throwError('Transaction hash mismatch from Provider.sendTransaction.', Logger.errors.UNKNOWN_ERROR, {
        expectedHash: tx.hash,
        returnedHash: hash
      })
    }

    // @TODO: (confirmations? number, timeout? number)
    result.wait = async (confirmations?: number) => {
      const receipt = await this.provider.waitForTransaction(tx.hash, confirmations)

      if (receipt.status === 0) {
        logger.throwError('transaction failed', Logger.errors.CALL_EXCEPTION, {
          transactionHash: tx.hash,
          transaction: tx,
          receipt: receipt
        })
      }
      return receipt
    }

    return result
  }

  connect(provider: Provider): Signer {
    provider = provider
    return logger.throwError('cannot alter L2 Relay Signer connection', Logger.errors.UNSUPPORTED_OPERATION, {
      operation: 'connect'
    })
  }
}

interface RelayerRPCResponse {
  status: number
  desc: string
  chainError?: {
    code: number
    message: string
  }
  data?: any
}

function isRelayerRPCResponse(x: any): x is RelayerRPCResponse {
  return typeof x.status === 'number' && typeof x.desc === 'string'
}
export class L2RelayerRPCClient implements L2RelayerClient {
  private axios: AxiosInstance

  constructor(rpcBaseURL: string, timeout: number = DEFAULT_L2_TX_TIMEOUT) {
    this.axios = axios.create({
      baseURL: rpcBaseURL,
      timeout: timeout
    })
  }

  async callFunction(req: L2RelayerCallRequest) {
    const r = { ...req }
    r.gasLimit = r.gasLimit.toString()
    const response = await this.callRPC({
      url: 'l2relayer/call',
      method: 'post',
      data: r
    })
    if (response.status != 0) {
      return checkRPCError(response, req)
    }
    if (!response.data || !response.data.transactionHash || typeof response.data.transactionHash !== 'string') {
      return logger.throwError('bad relayer server response, no transaction hash', Logger.errors.SERVER_ERROR, {
        response,
        req
      })
    }
    return response.data.transactionHash as string
  }

  private async callRPC(request: AxiosRequestConfig) {
    const response = await this.axios(request)
    if (response.status != 200 || !isRelayerRPCResponse(response.data)) {
      return logger.throwError('bad response', Logger.errors.SERVER_ERROR, {
        status: response.status,
        headers: response.headers,
        body: bodyify(response.data, response.headers ? response.headers['content-type'] : null),
        requestMethod: request.method,
        url: request.url
      })
    }
    return response.data
  }
}

function bodyify(value: any, type: string): string {
  if (value == null) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  if (isBytesLike(value)) {
    if (type && (type.split('/')[0] === 'text' || type.split(';')[0].trim() === 'application/json')) {
      try {
        return toUtf8String(value)
      } catch (error) {}
    }
    return hexlify(value)
  }

  return value
}

export enum RelayerRPCError {
  InternalServerError = 1,
  InvalidRequestError = 2,
  InsufficientGasError = 3,
  EstimateGasError = 4,
  SendTransactionError = 5
}

function checkRPCError(response: RelayerRPCResponse, request: any): never {
  switch (response.status) {
    case RelayerRPCError.InternalServerError:
      return logger.throwError('relayer server internal error', Logger.errors.SERVER_ERROR, { response, request })
    case RelayerRPCError.InvalidRequestError:
      return logger.throwError('bad relayer rpc request', Logger.errors.INVALID_ARGUMENT, { response, request })
    case RelayerRPCError.InsufficientGasError:
      return logger.throwError('insufficient broker gas', Logger.errors.INSUFFICIENT_FUNDS, { response, request })
    case RelayerRPCError.EstimateGasError:
      return logger.throwError('cannot estimate gas; transaction always fail', Logger.errors.UNPREDICTABLE_GAS_LIMIT, {
        response,
        request
      })
    case RelayerRPCError.SendTransactionError:
      return logger.throwError('send transaction to block chain fail', Logger.errors.CALL_EXCEPTION, {
        response,
        request
      })
    default:
      return logger.throwError('unknown server error', Logger.errors.UNKNOWN_ERROR, { response, request })
  }
}
