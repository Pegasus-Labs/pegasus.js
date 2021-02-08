/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer } from "ethers";
import { Provider } from "@ethersproject/providers";

import type { LiquidityPool } from "./LiquidityPool";

export class LiquidityPoolFactory {
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): LiquidityPool {
    return new Contract(address, _abi, signerOrProvider) as LiquidityPool;
  }
}

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "trader",
        type: "address",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "addedCash",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "mintedShare",
        type: "int256",
      },
    ],
    name: "AddLiquidity",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "claimer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "amount",
        type: "int256",
      },
    ],
    name: "ClaimFee",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "newOperator",
        type: "address",
      },
    ],
    name: "ClaimOperator",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "trader",
        type: "address",
      },
    ],
    name: "Clear",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "governor",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "shareToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "oracle",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "collateral",
        type: "address",
      },
      {
        indexed: false,
        internalType: "int256[9]",
        name: "coreParams",
        type: "int256[9]",
      },
      {
        indexed: false,
        internalType: "int256[6]",
        name: "riskParams",
        type: "int256[6]",
      },
    ],
    name: "CreatePerpetual",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "trader",
        type: "address",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "amount",
        type: "int256",
      },
    ],
    name: "Deposit",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "amount",
        type: "int256",
      },
    ],
    name: "DonateInsuranceFund",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "amount",
        type: "int256",
      },
    ],
    name: "IncreaseFee",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "liquidator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "trader",
        type: "address",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "amount",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "price",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "penalty",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "penaltyToLP",
        type: "int256",
      },
    ],
    name: "Liquidate",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "OperatorCheckIn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "trader",
        type: "address",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "returnedCash",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "burnedShare",
        type: "int256",
      },
    ],
    name: "RemoveLiquidity",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "RevokeOperator",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "RunLiquidityPool",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
    ],
    name: "SetClearedState",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "settlementPrice",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "settlementTime",
        type: "uint256",
      },
    ],
    name: "SetEmergencyState",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32",
        name: "key",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "value",
        type: "int256",
      },
    ],
    name: "SetLiquidityPoolParameter",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
    ],
    name: "SetNormalState",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "key",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "value",
        type: "int256",
      },
    ],
    name: "SetPerpetualBaseParameter",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "key",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "value",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "minValue",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "maxValue",
        type: "int256",
      },
    ],
    name: "SetPerpetualRiskParameter",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "trader",
        type: "address",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "amount",
        type: "int256",
      },
    ],
    name: "Settle",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "trader",
        type: "address",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "position",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "price",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "fee",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "lpFee",
        type: "int256",
      },
    ],
    name: "Trade",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "operatorFee",
        type: "int256",
      },
    ],
    name: "TransferFeeToOperator",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "newOperator",
        type: "address",
      },
    ],
    name: "TransferOperatorTo",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "key",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "value",
        type: "int256",
      },
    ],
    name: "UpdatePerpetualRiskParameter",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "int256",
        name: "poolMargin",
        type: "int256",
      },
    ],
    name: "UpdatePoolMargin",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "unitAccumulativeFunding",
        type: "int256",
      },
    ],
    name: "UpdateUnitAccumulativeFunding",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "trader",
        type: "address",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "amount",
        type: "int256",
      },
    ],
    name: "Withdraw",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "amount",
        type: "int256",
      },
    ],
    name: "transferExcessInsuranceFundToLP",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "int256",
        name: "cashToAdd",
        type: "int256",
      },
    ],
    name: "addLiquidity",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "orderData",
        type: "bytes",
      },
      {
        internalType: "int256",
        name: "amount",
        type: "int256",
      },
    ],
    name: "brokerTrade",
    outputs: [
      {
        internalType: "int256",
        name: "tradeAmount",
        type: "int256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "checkIn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimOperator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
    ],
    name: "clear",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "oracle",
        type: "address",
      },
      {
        internalType: "int256[9]",
        name: "coreParams",
        type: "int256[9]",
      },
      {
        internalType: "int256[6]",
        name: "riskParams",
        type: "int256[6]",
      },
      {
        internalType: "int256[6]",
        name: "minRiskParamValues",
        type: "int256[6]",
      },
      {
        internalType: "int256[6]",
        name: "maxRiskParamValues",
        type: "int256[6]",
      },
    ],
    name: "createPerpetual",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "trader",
        type: "address",
      },
      {
        internalType: "int256",
        name: "amount",
        type: "int256",
      },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        internalType: "int256",
        name: "amount",
        type: "int256",
      },
    ],
    name: "donateInsuranceFund",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        internalType: "int256",
        name: "settlementPrice",
        type: "int256",
      },
    ],
    name: "forceToSetEmergencyState",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "forceToSyncState",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
    ],
    name: "getActiveAccountCount",
    outputs: [
      {
        internalType: "uint256",
        name: "activeAccountCount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
    ],
    name: "getClearProgress",
    outputs: [
      {
        internalType: "uint256",
        name: "left",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "total",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getLiquidityPoolInfo",
    outputs: [
      {
        internalType: "bool",
        name: "isRunning",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "isFastCreationEnabled",
        type: "bool",
      },
      {
        internalType: "address[7]",
        name: "addresses",
        type: "address[7]",
      },
      {
        internalType: "int256",
        name: "vaultFeeRate",
        type: "int256",
      },
      {
        internalType: "int256",
        name: "poolCash",
        type: "int256",
      },
      {
        internalType: "uint256[4]",
        name: "nums",
        type: "uint256[4]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "trader",
        type: "address",
      },
    ],
    name: "getMarginAccount",
    outputs: [
      {
        internalType: "int256",
        name: "cash",
        type: "int256",
      },
      {
        internalType: "int256",
        name: "position",
        type: "int256",
      },
      {
        internalType: "int256",
        name: "availableCash",
        type: "int256",
      },
      {
        internalType: "int256",
        name: "margin",
        type: "int256",
      },
      {
        internalType: "int256",
        name: "settleableMargin",
        type: "int256",
      },
      {
        internalType: "bool",
        name: "isInitialMarginSafe",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "isMaintenanceMarginSafe",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "isMarginSafe",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
    ],
    name: "getPerpetualInfo",
    outputs: [
      {
        internalType: "enum PerpetualState",
        name: "state",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "oracle",
        type: "address",
      },
      {
        internalType: "int256[34]",
        name: "nums",
        type: "int256[34]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPoolMargin",
    outputs: [
      {
        internalType: "int256",
        name: "poolMargin",
        type: "int256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "address",
        name: "collateral",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "collateralDecimals",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "governor",
        type: "address",
      },
      {
        internalType: "address",
        name: "shareToken",
        type: "address",
      },
      {
        internalType: "bool",
        name: "isFastCreationEnabled",
        type: "bool",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "trader",
        type: "address",
      },
    ],
    name: "liquidateByAMM",
    outputs: [
      {
        internalType: "int256",
        name: "",
        type: "int256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "trader",
        type: "address",
      },
      {
        internalType: "int256",
        name: "amount",
        type: "int256",
      },
      {
        internalType: "int256",
        name: "limitPrice",
        type: "int256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
    ],
    name: "liquidateByTrader",
    outputs: [
      {
        internalType: "int256",
        name: "",
        type: "int256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "begin",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "end",
        type: "uint256",
      },
    ],
    name: "listActiveAccounts",
    outputs: [
      {
        internalType: "address[]",
        name: "result",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        internalType: "int256",
        name: "amount",
        type: "int256",
      },
    ],
    name: "queryTradeWithAMM",
    outputs: [
      {
        internalType: "int256",
        name: "deltaCash",
        type: "int256",
      },
      {
        internalType: "int256",
        name: "deltaPosition",
        type: "int256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "int256",
        name: "shareToRemove",
        type: "int256",
      },
    ],
    name: "removeLiquidity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "revokeOperator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "runLiquidityPool",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
    ],
    name: "setEmergencyState",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "int256[1]",
        name: "params",
        type: "int256[1]",
      },
    ],
    name: "setLiquidityPoolParameter",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "oracle",
        type: "address",
      },
    ],
    name: "setOracle",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        internalType: "int256[9]",
        name: "baseParams",
        type: "int256[9]",
      },
    ],
    name: "setPerpetualBaseParameter",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        internalType: "int256[6]",
        name: "riskParams",
        type: "int256[6]",
      },
      {
        internalType: "int256[6]",
        name: "minRiskParamValues",
        type: "int256[6]",
      },
      {
        internalType: "int256[6]",
        name: "maxRiskParamValues",
        type: "int256[6]",
      },
    ],
    name: "setPerpetualRiskParameter",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "trader",
        type: "address",
      },
    ],
    name: "settle",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "trader",
        type: "address",
      },
      {
        internalType: "int256",
        name: "amount",
        type: "int256",
      },
      {
        internalType: "int256",
        name: "limitPrice",
        type: "int256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "referrer",
        type: "address",
      },
      {
        internalType: "uint32",
        name: "flags",
        type: "uint32",
      },
    ],
    name: "trade",
    outputs: [
      {
        internalType: "int256",
        name: "tradeAmount",
        type: "int256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOperator",
        type: "address",
      },
    ],
    name: "transferOperator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        internalType: "int256[6]",
        name: "riskParams",
        type: "int256[6]",
      },
    ],
    name: "updatePerpetualRiskParameter",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "trader",
        type: "address",
      },
      {
        internalType: "int256",
        name: "amount",
        type: "int256",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];
