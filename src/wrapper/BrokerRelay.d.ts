/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
} from "ethers";
import {
  Contract,
  ContractTransaction,
  Overrides,
  PayableOverrides,
  CallOverrides,
} from "@ethersproject/contracts";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";

interface BrokerRelayInterface extends ethers.utils.Interface {
  functions: {
    "balanceOf(address)": FunctionFragment;
    "batchTrade(bytes[],int256[],uint256[])": FunctionFragment;
    "cancelOrder(tuple)": FunctionFragment;
    "deposit()": FunctionFragment;
    "execute(address,bytes,uint256)": FunctionFragment;
    "withdraw(uint256)": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "balanceOf", values: [string]): string;
  encodeFunctionData(
    functionFragment: "batchTrade",
    values: [BytesLike[], BigNumberish[], BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "cancelOrder",
    values: [
      {
        trader: string;
        broker: string;
        relayer: string;
        referrer: string;
        liquidityPool: string;
        minTradeAmount: BigNumberish;
        amount: BigNumberish;
        limitPrice: BigNumberish;
        triggerPrice: BigNumberish;
        chainID: BigNumberish;
        expiredAt: BigNumberish;
        perpetualIndex: BigNumberish;
        brokerFeeLimit: BigNumberish;
        flags: BigNumberish;
        salt: BigNumberish;
      }
    ]
  ): string;
  encodeFunctionData(functionFragment: "deposit", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "execute",
    values: [string, BytesLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "withdraw",
    values: [BigNumberish]
  ): string;

  decodeFunctionResult(functionFragment: "balanceOf", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "batchTrade", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "cancelOrder",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "deposit", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "execute", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "withdraw", data: BytesLike): Result;

  events: {
    "CancelOrder(bytes32)": EventFragment;
    "Deposit(address,uint256)": EventFragment;
    "FillOrder(bytes32,int256)": EventFragment;
    "TradeFailed(bytes32,tuple,int256,string)": EventFragment;
    "TradeSuccess(bytes32,tuple,int256,uint256)": EventFragment;
    "Transfer(address,address,uint256)": EventFragment;
    "Withdraw(address,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "CancelOrder"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Deposit"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "FillOrder"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TradeFailed"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TradeSuccess"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Transfer"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Withdraw"): EventFragment;
}

export class BrokerRelay extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  on(event: EventFilter | string, listener: Listener): this;
  once(event: EventFilter | string, listener: Listener): this;
  addListener(eventName: EventFilter | string, listener: Listener): this;
  removeAllListeners(eventName: EventFilter | string): this;
  removeListener(eventName: any, listener: Listener): this;

  interface: BrokerRelayInterface;

  functions: {
    balanceOf(
      trader: string,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    "balanceOf(address)"(
      trader: string,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    batchTrade(
      compressedOrders: BytesLike[],
      amounts: BigNumberish[],
      gasRewards: BigNumberish[],
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "batchTrade(bytes[],int256[],uint256[])"(
      compressedOrders: BytesLike[],
      amounts: BigNumberish[],
      gasRewards: BigNumberish[],
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    cancelOrder(
      order: {
        trader: string;
        broker: string;
        relayer: string;
        referrer: string;
        liquidityPool: string;
        minTradeAmount: BigNumberish;
        amount: BigNumberish;
        limitPrice: BigNumberish;
        triggerPrice: BigNumberish;
        chainID: BigNumberish;
        expiredAt: BigNumberish;
        perpetualIndex: BigNumberish;
        brokerFeeLimit: BigNumberish;
        flags: BigNumberish;
        salt: BigNumberish;
      },
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "cancelOrder(tuple)"(
      order: {
        trader: string;
        broker: string;
        relayer: string;
        referrer: string;
        liquidityPool: string;
        minTradeAmount: BigNumberish;
        amount: BigNumberish;
        limitPrice: BigNumberish;
        triggerPrice: BigNumberish;
        chainID: BigNumberish;
        expiredAt: BigNumberish;
        perpetualIndex: BigNumberish;
        brokerFeeLimit: BigNumberish;
        flags: BigNumberish;
        salt: BigNumberish;
      },
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    deposit(overrides?: PayableOverrides): Promise<ContractTransaction>;

    "deposit()"(overrides?: PayableOverrides): Promise<ContractTransaction>;

    execute(
      liqidityPool: string,
      callData: BytesLike,
      gasReward: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "execute(address,bytes,uint256)"(
      liqidityPool: string,
      callData: BytesLike,
      gasReward: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    withdraw(
      amount: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "withdraw(uint256)"(
      amount: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;
  };

  balanceOf(trader: string, overrides?: CallOverrides): Promise<BigNumber>;

  "balanceOf(address)"(
    trader: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  batchTrade(
    compressedOrders: BytesLike[],
    amounts: BigNumberish[],
    gasRewards: BigNumberish[],
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "batchTrade(bytes[],int256[],uint256[])"(
    compressedOrders: BytesLike[],
    amounts: BigNumberish[],
    gasRewards: BigNumberish[],
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  cancelOrder(
    order: {
      trader: string;
      broker: string;
      relayer: string;
      referrer: string;
      liquidityPool: string;
      minTradeAmount: BigNumberish;
      amount: BigNumberish;
      limitPrice: BigNumberish;
      triggerPrice: BigNumberish;
      chainID: BigNumberish;
      expiredAt: BigNumberish;
      perpetualIndex: BigNumberish;
      brokerFeeLimit: BigNumberish;
      flags: BigNumberish;
      salt: BigNumberish;
    },
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "cancelOrder(tuple)"(
    order: {
      trader: string;
      broker: string;
      relayer: string;
      referrer: string;
      liquidityPool: string;
      minTradeAmount: BigNumberish;
      amount: BigNumberish;
      limitPrice: BigNumberish;
      triggerPrice: BigNumberish;
      chainID: BigNumberish;
      expiredAt: BigNumberish;
      perpetualIndex: BigNumberish;
      brokerFeeLimit: BigNumberish;
      flags: BigNumberish;
      salt: BigNumberish;
    },
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  deposit(overrides?: PayableOverrides): Promise<ContractTransaction>;

  "deposit()"(overrides?: PayableOverrides): Promise<ContractTransaction>;

  execute(
    liqidityPool: string,
    callData: BytesLike,
    gasReward: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "execute(address,bytes,uint256)"(
    liqidityPool: string,
    callData: BytesLike,
    gasReward: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  withdraw(
    amount: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "withdraw(uint256)"(
    amount: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  callStatic: {
    balanceOf(trader: string, overrides?: CallOverrides): Promise<BigNumber>;

    "balanceOf(address)"(
      trader: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    batchTrade(
      compressedOrders: BytesLike[],
      amounts: BigNumberish[],
      gasRewards: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<void>;

    "batchTrade(bytes[],int256[],uint256[])"(
      compressedOrders: BytesLike[],
      amounts: BigNumberish[],
      gasRewards: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<void>;

    cancelOrder(
      order: {
        trader: string;
        broker: string;
        relayer: string;
        referrer: string;
        liquidityPool: string;
        minTradeAmount: BigNumberish;
        amount: BigNumberish;
        limitPrice: BigNumberish;
        triggerPrice: BigNumberish;
        chainID: BigNumberish;
        expiredAt: BigNumberish;
        perpetualIndex: BigNumberish;
        brokerFeeLimit: BigNumberish;
        flags: BigNumberish;
        salt: BigNumberish;
      },
      overrides?: CallOverrides
    ): Promise<void>;

    "cancelOrder(tuple)"(
      order: {
        trader: string;
        broker: string;
        relayer: string;
        referrer: string;
        liquidityPool: string;
        minTradeAmount: BigNumberish;
        amount: BigNumberish;
        limitPrice: BigNumberish;
        triggerPrice: BigNumberish;
        chainID: BigNumberish;
        expiredAt: BigNumberish;
        perpetualIndex: BigNumberish;
        brokerFeeLimit: BigNumberish;
        flags: BigNumberish;
        salt: BigNumberish;
      },
      overrides?: CallOverrides
    ): Promise<void>;

    deposit(overrides?: CallOverrides): Promise<void>;

    "deposit()"(overrides?: CallOverrides): Promise<void>;

    execute(
      liqidityPool: string,
      callData: BytesLike,
      gasReward: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    "execute(address,bytes,uint256)"(
      liqidityPool: string,
      callData: BytesLike,
      gasReward: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    withdraw(amount: BigNumberish, overrides?: CallOverrides): Promise<void>;

    "withdraw(uint256)"(
      amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    CancelOrder(orderHash: null): EventFilter;

    Deposit(trader: null, amount: null): EventFilter;

    FillOrder(orderHash: null, fillAmount: null): EventFilter;

    TradeFailed(
      orderHash: null,
      order: null,
      amount: null,
      reason: null
    ): EventFilter;

    TradeSuccess(
      orderHash: null,
      order: null,
      amount: null,
      gasReward: null
    ): EventFilter;

    Transfer(sender: null, recipient: null, amount: null): EventFilter;

    Withdraw(trader: null, amount: null): EventFilter;
  };

  estimateGas: {
    balanceOf(trader: string, overrides?: CallOverrides): Promise<BigNumber>;

    "balanceOf(address)"(
      trader: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    batchTrade(
      compressedOrders: BytesLike[],
      amounts: BigNumberish[],
      gasRewards: BigNumberish[],
      overrides?: Overrides
    ): Promise<BigNumber>;

    "batchTrade(bytes[],int256[],uint256[])"(
      compressedOrders: BytesLike[],
      amounts: BigNumberish[],
      gasRewards: BigNumberish[],
      overrides?: Overrides
    ): Promise<BigNumber>;

    cancelOrder(
      order: {
        trader: string;
        broker: string;
        relayer: string;
        referrer: string;
        liquidityPool: string;
        minTradeAmount: BigNumberish;
        amount: BigNumberish;
        limitPrice: BigNumberish;
        triggerPrice: BigNumberish;
        chainID: BigNumberish;
        expiredAt: BigNumberish;
        perpetualIndex: BigNumberish;
        brokerFeeLimit: BigNumberish;
        flags: BigNumberish;
        salt: BigNumberish;
      },
      overrides?: Overrides
    ): Promise<BigNumber>;

    "cancelOrder(tuple)"(
      order: {
        trader: string;
        broker: string;
        relayer: string;
        referrer: string;
        liquidityPool: string;
        minTradeAmount: BigNumberish;
        amount: BigNumberish;
        limitPrice: BigNumberish;
        triggerPrice: BigNumberish;
        chainID: BigNumberish;
        expiredAt: BigNumberish;
        perpetualIndex: BigNumberish;
        brokerFeeLimit: BigNumberish;
        flags: BigNumberish;
        salt: BigNumberish;
      },
      overrides?: Overrides
    ): Promise<BigNumber>;

    deposit(overrides?: PayableOverrides): Promise<BigNumber>;

    "deposit()"(overrides?: PayableOverrides): Promise<BigNumber>;

    execute(
      liqidityPool: string,
      callData: BytesLike,
      gasReward: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "execute(address,bytes,uint256)"(
      liqidityPool: string,
      callData: BytesLike,
      gasReward: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    withdraw(amount: BigNumberish, overrides?: Overrides): Promise<BigNumber>;

    "withdraw(uint256)"(
      amount: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    balanceOf(
      trader: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "balanceOf(address)"(
      trader: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    batchTrade(
      compressedOrders: BytesLike[],
      amounts: BigNumberish[],
      gasRewards: BigNumberish[],
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "batchTrade(bytes[],int256[],uint256[])"(
      compressedOrders: BytesLike[],
      amounts: BigNumberish[],
      gasRewards: BigNumberish[],
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    cancelOrder(
      order: {
        trader: string;
        broker: string;
        relayer: string;
        referrer: string;
        liquidityPool: string;
        minTradeAmount: BigNumberish;
        amount: BigNumberish;
        limitPrice: BigNumberish;
        triggerPrice: BigNumberish;
        chainID: BigNumberish;
        expiredAt: BigNumberish;
        perpetualIndex: BigNumberish;
        brokerFeeLimit: BigNumberish;
        flags: BigNumberish;
        salt: BigNumberish;
      },
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "cancelOrder(tuple)"(
      order: {
        trader: string;
        broker: string;
        relayer: string;
        referrer: string;
        liquidityPool: string;
        minTradeAmount: BigNumberish;
        amount: BigNumberish;
        limitPrice: BigNumberish;
        triggerPrice: BigNumberish;
        chainID: BigNumberish;
        expiredAt: BigNumberish;
        perpetualIndex: BigNumberish;
        brokerFeeLimit: BigNumberish;
        flags: BigNumberish;
        salt: BigNumberish;
      },
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    deposit(overrides?: PayableOverrides): Promise<PopulatedTransaction>;

    "deposit()"(overrides?: PayableOverrides): Promise<PopulatedTransaction>;

    execute(
      liqidityPool: string,
      callData: BytesLike,
      gasReward: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "execute(address,bytes,uint256)"(
      liqidityPool: string,
      callData: BytesLike,
      gasReward: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    withdraw(
      amount: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "withdraw(uint256)"(
      amount: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;
  };
}
