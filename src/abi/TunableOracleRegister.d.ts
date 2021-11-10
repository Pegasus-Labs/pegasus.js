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
  CallOverrides,
} from "@ethersproject/contracts";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";

interface TunableOracleRegisterInterface extends ethers.utils.Interface {
  functions: {
    "DEFAULT_ADMIN_ROLE()": FunctionFragment;
    "TERMINATER_ROLE()": FunctionFragment;
    "getExternalOracle(address)": FunctionFragment;
    "getRoleAdmin(bytes32)": FunctionFragment;
    "getRoleMember(bytes32,uint256)": FunctionFragment;
    "getRoleMemberCount(bytes32)": FunctionFragment;
    "grantRole(bytes32,address)": FunctionFragment;
    "hasRole(bytes32,address)": FunctionFragment;
    "implementation()": FunctionFragment;
    "initialize()": FunctionFragment;
    "isAllTerminated()": FunctionFragment;
    "isTerminated(address)": FunctionFragment;
    "newExternalOracle(address,address)": FunctionFragment;
    "renounceRole(bytes32,address)": FunctionFragment;
    "revokeRole(bytes32,address)": FunctionFragment;
    "setAllTerminated()": FunctionFragment;
    "setExternalOracle(address,uint64,uint32)": FunctionFragment;
    "setTerminated(address)": FunctionFragment;
    "tunableOracles(address)": FunctionFragment;
    "upgradeTunableOracle(address)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "DEFAULT_ADMIN_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "TERMINATER_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getExternalOracle",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "getRoleAdmin",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getRoleMember",
    values: [BytesLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getRoleMemberCount",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "grantRole",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "hasRole",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "implementation",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "initialize",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "isAllTerminated",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "isTerminated",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "newExternalOracle",
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "renounceRole",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "revokeRole",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "setAllTerminated",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "setExternalOracle",
    values: [string, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "setTerminated",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "tunableOracles",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "upgradeTunableOracle",
    values: [string]
  ): string;

  decodeFunctionResult(
    functionFragment: "DEFAULT_ADMIN_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "TERMINATER_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getExternalOracle",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getRoleAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getRoleMember",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getRoleMemberCount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "grantRole", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "hasRole", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "implementation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "isAllTerminated",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isTerminated",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "newExternalOracle",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "renounceRole",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "revokeRole", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setAllTerminated",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setExternalOracle",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setTerminated",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "tunableOracles",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "upgradeTunableOracle",
    data: BytesLike
  ): Result;

  events: {
    "AllTerminated()": EventFragment;
    "RoleAdminChanged(bytes32,bytes32,bytes32)": EventFragment;
    "RoleGranted(bytes32,address,address)": EventFragment;
    "RoleRevoked(bytes32,address,address)": EventFragment;
    "SetExternalOracle(address,uint64,uint32)": EventFragment;
    "Terminated(address)": EventFragment;
    "TunableOracleCreated(address)": EventFragment;
    "Upgraded(address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "AllTerminated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleAdminChanged"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleGranted"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleRevoked"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "SetExternalOracle"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Terminated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TunableOracleCreated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Upgraded"): EventFragment;
}

export class TunableOracleRegister extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  on(event: EventFilter | string, listener: Listener): this;
  once(event: EventFilter | string, listener: Listener): this;
  addListener(eventName: EventFilter | string, listener: Listener): this;
  removeAllListeners(eventName: EventFilter | string): this;
  removeListener(eventName: any, listener: Listener): this;

  interface: TunableOracleRegisterInterface;

  functions: {
    DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<{
      0: string;
    }>;

    "DEFAULT_ADMIN_ROLE()"(overrides?: CallOverrides): Promise<{
      0: string;
    }>;

    TERMINATER_ROLE(overrides?: CallOverrides): Promise<{
      0: string;
    }>;

    "TERMINATER_ROLE()"(overrides?: CallOverrides): Promise<{
      0: string;
    }>;

    getExternalOracle(
      externalOracle: string,
      overrides?: CallOverrides
    ): Promise<{
      0: {
        isAdded: boolean;
        isTerminated: boolean;
        deviation: BigNumber;
        timeout: number;
        0: boolean;
        1: boolean;
        2: BigNumber;
        3: number;
      };
    }>;

    "getExternalOracle(address)"(
      externalOracle: string,
      overrides?: CallOverrides
    ): Promise<{
      0: {
        isAdded: boolean;
        isTerminated: boolean;
        deviation: BigNumber;
        timeout: number;
        0: boolean;
        1: boolean;
        2: BigNumber;
        3: number;
      };
    }>;

    getRoleAdmin(
      role: BytesLike,
      overrides?: CallOverrides
    ): Promise<{
      0: string;
    }>;

    "getRoleAdmin(bytes32)"(
      role: BytesLike,
      overrides?: CallOverrides
    ): Promise<{
      0: string;
    }>;

    getRoleMember(
      role: BytesLike,
      index: BigNumberish,
      overrides?: CallOverrides
    ): Promise<{
      0: string;
    }>;

    "getRoleMember(bytes32,uint256)"(
      role: BytesLike,
      index: BigNumberish,
      overrides?: CallOverrides
    ): Promise<{
      0: string;
    }>;

    getRoleMemberCount(
      role: BytesLike,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    "getRoleMemberCount(bytes32)"(
      role: BytesLike,
      overrides?: CallOverrides
    ): Promise<{
      0: BigNumber;
    }>;

    grantRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "grantRole(bytes32,address)"(
      role: BytesLike,
      account: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    hasRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<{
      0: boolean;
    }>;

    "hasRole(bytes32,address)"(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<{
      0: boolean;
    }>;

    implementation(overrides?: CallOverrides): Promise<{
      0: string;
    }>;

    "implementation()"(overrides?: CallOverrides): Promise<{
      0: string;
    }>;

    initialize(overrides?: Overrides): Promise<ContractTransaction>;

    "initialize()"(overrides?: Overrides): Promise<ContractTransaction>;

    isAllTerminated(overrides?: CallOverrides): Promise<{
      0: boolean;
    }>;

    "isAllTerminated()"(overrides?: CallOverrides): Promise<{
      0: boolean;
    }>;

    isTerminated(
      externalOracle: string,
      overrides?: CallOverrides
    ): Promise<{
      0: boolean;
    }>;

    "isTerminated(address)"(
      externalOracle: string,
      overrides?: CallOverrides
    ): Promise<{
      0: boolean;
    }>;

    newExternalOracle(
      liquidityPool: string,
      externalOracle: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "newExternalOracle(address,address)"(
      liquidityPool: string,
      externalOracle: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    renounceRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "renounceRole(bytes32,address)"(
      role: BytesLike,
      account: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    revokeRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "revokeRole(bytes32,address)"(
      role: BytesLike,
      account: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    setAllTerminated(overrides?: Overrides): Promise<ContractTransaction>;

    "setAllTerminated()"(overrides?: Overrides): Promise<ContractTransaction>;

    setExternalOracle(
      externalOracle: string,
      deviation: BigNumberish,
      timeout: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "setExternalOracle(address,uint64,uint32)"(
      externalOracle: string,
      deviation: BigNumberish,
      timeout: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    setTerminated(
      externalOracle: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "setTerminated(address)"(
      externalOracle: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    tunableOracles(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<{
      0: boolean;
    }>;

    "tunableOracles(address)"(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<{
      0: boolean;
    }>;

    upgradeTunableOracle(
      newImplementation: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "upgradeTunableOracle(address)"(
      newImplementation: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;
  };

  DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<string>;

  "DEFAULT_ADMIN_ROLE()"(overrides?: CallOverrides): Promise<string>;

  TERMINATER_ROLE(overrides?: CallOverrides): Promise<string>;

  "TERMINATER_ROLE()"(overrides?: CallOverrides): Promise<string>;

  getExternalOracle(
    externalOracle: string,
    overrides?: CallOverrides
  ): Promise<{
    isAdded: boolean;
    isTerminated: boolean;
    deviation: BigNumber;
    timeout: number;
    0: boolean;
    1: boolean;
    2: BigNumber;
    3: number;
  }>;

  "getExternalOracle(address)"(
    externalOracle: string,
    overrides?: CallOverrides
  ): Promise<{
    isAdded: boolean;
    isTerminated: boolean;
    deviation: BigNumber;
    timeout: number;
    0: boolean;
    1: boolean;
    2: BigNumber;
    3: number;
  }>;

  getRoleAdmin(role: BytesLike, overrides?: CallOverrides): Promise<string>;

  "getRoleAdmin(bytes32)"(
    role: BytesLike,
    overrides?: CallOverrides
  ): Promise<string>;

  getRoleMember(
    role: BytesLike,
    index: BigNumberish,
    overrides?: CallOverrides
  ): Promise<string>;

  "getRoleMember(bytes32,uint256)"(
    role: BytesLike,
    index: BigNumberish,
    overrides?: CallOverrides
  ): Promise<string>;

  getRoleMemberCount(
    role: BytesLike,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  "getRoleMemberCount(bytes32)"(
    role: BytesLike,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  grantRole(
    role: BytesLike,
    account: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "grantRole(bytes32,address)"(
    role: BytesLike,
    account: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  hasRole(
    role: BytesLike,
    account: string,
    overrides?: CallOverrides
  ): Promise<boolean>;

  "hasRole(bytes32,address)"(
    role: BytesLike,
    account: string,
    overrides?: CallOverrides
  ): Promise<boolean>;

  implementation(overrides?: CallOverrides): Promise<string>;

  "implementation()"(overrides?: CallOverrides): Promise<string>;

  initialize(overrides?: Overrides): Promise<ContractTransaction>;

  "initialize()"(overrides?: Overrides): Promise<ContractTransaction>;

  isAllTerminated(overrides?: CallOverrides): Promise<boolean>;

  "isAllTerminated()"(overrides?: CallOverrides): Promise<boolean>;

  isTerminated(
    externalOracle: string,
    overrides?: CallOverrides
  ): Promise<boolean>;

  "isTerminated(address)"(
    externalOracle: string,
    overrides?: CallOverrides
  ): Promise<boolean>;

  newExternalOracle(
    liquidityPool: string,
    externalOracle: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "newExternalOracle(address,address)"(
    liquidityPool: string,
    externalOracle: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  renounceRole(
    role: BytesLike,
    account: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "renounceRole(bytes32,address)"(
    role: BytesLike,
    account: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  revokeRole(
    role: BytesLike,
    account: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "revokeRole(bytes32,address)"(
    role: BytesLike,
    account: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  setAllTerminated(overrides?: Overrides): Promise<ContractTransaction>;

  "setAllTerminated()"(overrides?: Overrides): Promise<ContractTransaction>;

  setExternalOracle(
    externalOracle: string,
    deviation: BigNumberish,
    timeout: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "setExternalOracle(address,uint64,uint32)"(
    externalOracle: string,
    deviation: BigNumberish,
    timeout: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  setTerminated(
    externalOracle: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "setTerminated(address)"(
    externalOracle: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  tunableOracles(arg0: string, overrides?: CallOverrides): Promise<boolean>;

  "tunableOracles(address)"(
    arg0: string,
    overrides?: CallOverrides
  ): Promise<boolean>;

  upgradeTunableOracle(
    newImplementation: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "upgradeTunableOracle(address)"(
    newImplementation: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  callStatic: {
    DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<string>;

    "DEFAULT_ADMIN_ROLE()"(overrides?: CallOverrides): Promise<string>;

    TERMINATER_ROLE(overrides?: CallOverrides): Promise<string>;

    "TERMINATER_ROLE()"(overrides?: CallOverrides): Promise<string>;

    getExternalOracle(
      externalOracle: string,
      overrides?: CallOverrides
    ): Promise<{
      isAdded: boolean;
      isTerminated: boolean;
      deviation: BigNumber;
      timeout: number;
      0: boolean;
      1: boolean;
      2: BigNumber;
      3: number;
    }>;

    "getExternalOracle(address)"(
      externalOracle: string,
      overrides?: CallOverrides
    ): Promise<{
      isAdded: boolean;
      isTerminated: boolean;
      deviation: BigNumber;
      timeout: number;
      0: boolean;
      1: boolean;
      2: BigNumber;
      3: number;
    }>;

    getRoleAdmin(role: BytesLike, overrides?: CallOverrides): Promise<string>;

    "getRoleAdmin(bytes32)"(
      role: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    getRoleMember(
      role: BytesLike,
      index: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    "getRoleMember(bytes32,uint256)"(
      role: BytesLike,
      index: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    getRoleMemberCount(
      role: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "getRoleMemberCount(bytes32)"(
      role: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    grantRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "grantRole(bytes32,address)"(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<void>;

    hasRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    "hasRole(bytes32,address)"(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    implementation(overrides?: CallOverrides): Promise<string>;

    "implementation()"(overrides?: CallOverrides): Promise<string>;

    initialize(overrides?: CallOverrides): Promise<void>;

    "initialize()"(overrides?: CallOverrides): Promise<void>;

    isAllTerminated(overrides?: CallOverrides): Promise<boolean>;

    "isAllTerminated()"(overrides?: CallOverrides): Promise<boolean>;

    isTerminated(
      externalOracle: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    "isTerminated(address)"(
      externalOracle: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    newExternalOracle(
      liquidityPool: string,
      externalOracle: string,
      overrides?: CallOverrides
    ): Promise<string>;

    "newExternalOracle(address,address)"(
      liquidityPool: string,
      externalOracle: string,
      overrides?: CallOverrides
    ): Promise<string>;

    renounceRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "renounceRole(bytes32,address)"(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<void>;

    revokeRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "revokeRole(bytes32,address)"(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<void>;

    setAllTerminated(overrides?: CallOverrides): Promise<void>;

    "setAllTerminated()"(overrides?: CallOverrides): Promise<void>;

    setExternalOracle(
      externalOracle: string,
      deviation: BigNumberish,
      timeout: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    "setExternalOracle(address,uint64,uint32)"(
      externalOracle: string,
      deviation: BigNumberish,
      timeout: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    setTerminated(
      externalOracle: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "setTerminated(address)"(
      externalOracle: string,
      overrides?: CallOverrides
    ): Promise<void>;

    tunableOracles(arg0: string, overrides?: CallOverrides): Promise<boolean>;

    "tunableOracles(address)"(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    upgradeTunableOracle(
      newImplementation: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "upgradeTunableOracle(address)"(
      newImplementation: string,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    AllTerminated(): EventFilter;

    RoleAdminChanged(
      role: BytesLike | null,
      previousAdminRole: BytesLike | null,
      newAdminRole: BytesLike | null
    ): EventFilter;

    RoleGranted(
      role: BytesLike | null,
      account: string | null,
      sender: string | null
    ): EventFilter;

    RoleRevoked(
      role: BytesLike | null,
      account: string | null,
      sender: string | null
    ): EventFilter;

    SetExternalOracle(
      externalOracle: string | null,
      deviation: null,
      timeout: null
    ): EventFilter;

    Terminated(externalOracle: string | null): EventFilter;

    TunableOracleCreated(newOracle: null): EventFilter;

    Upgraded(implementation: string | null): EventFilter;
  };

  estimateGas: {
    DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    "DEFAULT_ADMIN_ROLE()"(overrides?: CallOverrides): Promise<BigNumber>;

    TERMINATER_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    "TERMINATER_ROLE()"(overrides?: CallOverrides): Promise<BigNumber>;

    getExternalOracle(
      externalOracle: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "getExternalOracle(address)"(
      externalOracle: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getRoleAdmin(
      role: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "getRoleAdmin(bytes32)"(
      role: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getRoleMember(
      role: BytesLike,
      index: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "getRoleMember(bytes32,uint256)"(
      role: BytesLike,
      index: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getRoleMemberCount(
      role: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "getRoleMemberCount(bytes32)"(
      role: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    grantRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "grantRole(bytes32,address)"(
      role: BytesLike,
      account: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    hasRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "hasRole(bytes32,address)"(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    implementation(overrides?: CallOverrides): Promise<BigNumber>;

    "implementation()"(overrides?: CallOverrides): Promise<BigNumber>;

    initialize(overrides?: Overrides): Promise<BigNumber>;

    "initialize()"(overrides?: Overrides): Promise<BigNumber>;

    isAllTerminated(overrides?: CallOverrides): Promise<BigNumber>;

    "isAllTerminated()"(overrides?: CallOverrides): Promise<BigNumber>;

    isTerminated(
      externalOracle: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "isTerminated(address)"(
      externalOracle: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    newExternalOracle(
      liquidityPool: string,
      externalOracle: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "newExternalOracle(address,address)"(
      liquidityPool: string,
      externalOracle: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    renounceRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "renounceRole(bytes32,address)"(
      role: BytesLike,
      account: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    revokeRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "revokeRole(bytes32,address)"(
      role: BytesLike,
      account: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    setAllTerminated(overrides?: Overrides): Promise<BigNumber>;

    "setAllTerminated()"(overrides?: Overrides): Promise<BigNumber>;

    setExternalOracle(
      externalOracle: string,
      deviation: BigNumberish,
      timeout: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "setExternalOracle(address,uint64,uint32)"(
      externalOracle: string,
      deviation: BigNumberish,
      timeout: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    setTerminated(
      externalOracle: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "setTerminated(address)"(
      externalOracle: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    tunableOracles(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

    "tunableOracles(address)"(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    upgradeTunableOracle(
      newImplementation: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "upgradeTunableOracle(address)"(
      newImplementation: string,
      overrides?: Overrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    DEFAULT_ADMIN_ROLE(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "DEFAULT_ADMIN_ROLE()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    TERMINATER_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "TERMINATER_ROLE()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getExternalOracle(
      externalOracle: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "getExternalOracle(address)"(
      externalOracle: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getRoleAdmin(
      role: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "getRoleAdmin(bytes32)"(
      role: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getRoleMember(
      role: BytesLike,
      index: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "getRoleMember(bytes32,uint256)"(
      role: BytesLike,
      index: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getRoleMemberCount(
      role: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "getRoleMemberCount(bytes32)"(
      role: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    grantRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "grantRole(bytes32,address)"(
      role: BytesLike,
      account: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    hasRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "hasRole(bytes32,address)"(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    implementation(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "implementation()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    initialize(overrides?: Overrides): Promise<PopulatedTransaction>;

    "initialize()"(overrides?: Overrides): Promise<PopulatedTransaction>;

    isAllTerminated(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "isAllTerminated()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    isTerminated(
      externalOracle: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "isTerminated(address)"(
      externalOracle: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    newExternalOracle(
      liquidityPool: string,
      externalOracle: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "newExternalOracle(address,address)"(
      liquidityPool: string,
      externalOracle: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    renounceRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "renounceRole(bytes32,address)"(
      role: BytesLike,
      account: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    revokeRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "revokeRole(bytes32,address)"(
      role: BytesLike,
      account: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    setAllTerminated(overrides?: Overrides): Promise<PopulatedTransaction>;

    "setAllTerminated()"(overrides?: Overrides): Promise<PopulatedTransaction>;

    setExternalOracle(
      externalOracle: string,
      deviation: BigNumberish,
      timeout: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "setExternalOracle(address,uint64,uint32)"(
      externalOracle: string,
      deviation: BigNumberish,
      timeout: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    setTerminated(
      externalOracle: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "setTerminated(address)"(
      externalOracle: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    tunableOracles(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "tunableOracles(address)"(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    upgradeTunableOracle(
      newImplementation: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "upgradeTunableOracle(address)"(
      newImplementation: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;
  };
}