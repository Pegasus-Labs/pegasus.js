import { getDefaultProvider, Signer } from 'ethers'

import { shallowCopy, Deferrable, resolveProperties } from '@ethersproject/properties'
import { poll } from '@ethersproject/web'

import { Provider, TransactionRequest, TransactionResponse } from '@ethersproject/abstract-provider'
import { Logger } from '@ethersproject/logger'
const logger = new Logger('mai3')

import { arrayify, Bytes, hexDataLength, hexlify } from '@ethersproject/bytes'
import { TypedDataSigner } from '@ethersproject/abstract-signer'

import { LiquidityPoolFactory } from './wrapper/LiquidityPoolFactory'

export interface L2Signer extends TypedDataSigner {
  getAddress(): Promise<string>
  signMessage(message: Bytes | string): Promise<string>
}

export interface L2RelayerCallRequest {
  from: string
  to: string
  functionSignature: string
  callData: string
  nonce: string
  expiration: string
  gasLimit: string
  signature?: string
}

export interface L2RelayerClinet {
  callFunction(req: L2RelayerCallRequest): Promise<string>
}

let _supportedFunctionList: { [signHash: string]: string } = {}

function _initSupportedFunctionList() {
  let lp = LiquidityPoolFactory.connect('', getDefaultProvider())
  for (let func in lp.functions) {
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
  readonly relayerClient: L2RelayerClinet
  txTimeout: number

  constructor(provider: Provider, l2Signer: L2Signer, relayer: L2RelayerClinet, txTimeout = 30) {
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

    return resolveProperties({
      tx: resolveProperties(transaction),
      sender: fromAddress
    }).then(({ tx, sender }) => {
      if (tx.from !== undefined) {
        if (tx.from.toLowerCase() !== sender) {
          return logger.throwArgumentError('from address mismatch', 'transaction', transaction)
        }
      } else {
        tx.from = sender
      }

      if (!tx.chainId) {
        return logger.throwArgumentError('no chainId', 'transaction', transaction)
      }

      if (!tx.data || !tx.to || !tx.gasLimit) {
        return logger.throwArgumentError('null field', 'transaction', transaction)
      }

      const bytes = arrayify(tx.data)
      const sigHash = hexlify(bytes.slice(0, 4))
      let func: string

      if (!(sigHash in _supportedFunctionList)) {
        return logger.throwArgumentError('unknown sigHash', 'transaction', transaction)
      } else {
        func = _supportedFunctionList[sigHash]
      }
      const expiration = new Date().getTime() + this.txTimeout

      let req: L2RelayerCallRequest = {
        from: sender,
        to: tx.to,
        functionSignature: func,
        callData: hexlify(bytes.slice(4)),
        nonce: '11',
        expiration: expiration.toString(),
        gasLimit: tx.gasLimit.toString()
      }

      return this._signCallData(tx.chainId, req).then(signature => {
        req.signature = signature
        return this.relayerClient.callFunction(req)
      })
    })
  }

  _signCallData(chainId: number, req: L2RelayerCallRequest): Promise<string> {
    const domain = {
      name: 'Mai Protocol Relayer Call',
      version: 'v3.0',
      chainId: chainId
    }

    const types = {
      Call: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'functionSignature', type: 'string' },
        { name: 'callData', type: 'bytes' },
        { name: 'nonce', type: 'uint32' },
        { name: 'expiration', type: 'uint32' },
        { name: 'gasLimit', type: 'uint64' }
      ]
    }

    return this.l2Signer._signTypedData(domain, types, req)
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
