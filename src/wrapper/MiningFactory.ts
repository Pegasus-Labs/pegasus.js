/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import { Contract, ContractFactory, Overrides } from "@ethersproject/contracts";

import type { Mining } from "./Mining";

export class MiningFactory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(overrides?: Overrides): Promise<Mining> {
    return super.deploy(overrides || {}) as Promise<Mining>;
  }
  getDeployTransaction(overrides?: Overrides): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): Mining {
    return super.attach(address) as Mining;
  }
  connect(signer: Signer): MiningFactory {
    return super.connect(signer) as MiningFactory;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): Mining {
    return new Contract(address, _abi, signerOrProvider) as Mining;
  }
}

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "reward",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "periodFinish",
        type: "uint256",
      },
    ],
    name: "RewardAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "reward",
        type: "uint256",
      },
    ],
    name: "RewardPaid",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "previousRate",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "currentRate",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "periodFinish",
        type: "uint256",
      },
    ],
    name: "RewardRateChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Stake",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Withdraw",
    type: "event",
  },
  {
    inputs: [],
    name: "_rewardToken",
    outputs: [
      {
        internalType: "contract IERC20Upgradeable",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "deposits",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "earned",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "lastTimeRewardApplicable",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "lastUpdateTime",
    outputs: [
      {
        internalType: "uint256",
        name: "",
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
        name: "reward",
        type: "uint256",
      },
    ],
    name: "notifyRewardAmount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "periodFinish",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "rewardDistribution",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rewardPerToken",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rewardPerTokenStored",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rewardRate",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "rewards",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_rewardDistribution",
        type: "address",
      },
    ],
    name: "setRewardDistribution",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "newRewardRate",
        type: "uint256",
      },
    ],
    name: "setRewardRate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "shareToken",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "stake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "userRewardPerTokenPaid",
    outputs: [
      {
        internalType: "uint256",
        name: "",
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
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506113b7806100206000396000f3fe608060405234801561001057600080fd5b50600436106101575760003560e01c806380faa57d116100c3578063c8f33c911161007c578063c8f33c9114610306578063cd3daf9d1461030e578063df136d6514610316578063ebe2b12b1461031e578063f2fde38b14610326578063fc7e286d1461034c57610157565b806380faa57d1461028e5780638b876347146102965780638da5cb5b146102bc5780639e447fc6146102c4578063a694fc3a146102e1578063b59c6e0e146102fe57610157565b80633c6b16ab116101155780633c6b16ab1461022b5780633d18b912146102485780636c9fa59e1461025057806370a0823114610258578063715018a61461027e5780637b0a47ee1461028657610157565b80628cc2621461015c5780630700037d146101945780630d68b761146101ba578063101114cf146101e257806318160ddd146102065780632e1a7d4d1461020e575b600080fd5b6101826004803603602081101561017257600080fd5b50356001600160a01b0316610372565b60408051918252519081900360200190f35b610182600480360360208110156101aa57600080fd5b50356001600160a01b03166103e0565b6101e0600480360360208110156101d057600080fd5b50356001600160a01b03166103f2565b005b6101ea61047e565b604080516001600160a01b039092168252519081900360200190f35b61018261048d565b6101e06004803603602081101561022457600080fd5b5035610494565b6101e06004803603602081101561024157600080fd5b50356105d7565b6101e06107a3565b6101ea610875565b6101826004803603602081101561026e57600080fd5b50356001600160a01b031661088a565b6101e06108a5565b610182610959565b61018261095f565b610182600480360360208110156102ac57600080fd5b50356001600160a01b031661097a565b6101ea61098c565b6101e0600480360360208110156102da57600080fd5b503561099b565b6101e0600480360360208110156102f757600080fd5b5035610adb565b6101ea610bc4565b610182610bd3565b610182610bd9565b610182610c27565b610182610c2d565b6101e06004803603602081101561033c57600080fd5b50356001600160a01b0316610c33565b6101826004803603602081101561036257600080fd5b50356001600160a01b0316610d3e565b6001600160a01b0381166000908152606e6020908152604080832054606d9092528220546103da91906103d490670de0b6b3a7640000906103ce906103bf906103b9610bd9565b90610d49565b6103c88861088a565b90610d92565b90610deb565b90610e2d565b92915050565b606e6020526000908152604090205481565b6103fa610e87565b6035546001600160a01b0390811691161461045c576040805162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b606c80546001600160a01b0319166001600160a01b0392909216919091179055565b606c546001600160a01b031681565b6001545b90565b600081116104e9576040805162461bcd60e51b815260206004820152601b60248201527f63616e6e6f74207769746864726177207a65726f20616d6f756e740000000000604482015290519081900360640190fd5b33600090815260026020526040902054811115610544576040805162461bcd60e51b8152602060048201526014602482015273696e73756666696369656e742062616c616e636560601b604482015290519081900360640190fd5b6001546105519082610d49565b6001553360009081526002602052604090205461056e9082610d49565b33600081815260026020526040812092909255905461059e91620100009091046001600160a01b03169083610e8b565b60408051828152905133917f884edad9ce6fa2440d8a54cc123490eb96d2768479d49ff9c7366125a9424364919081900360200190a250565b606c546001600160a01b03166105eb610e87565b6001600160a01b0316146106305760405162461bcd60e51b81526004018080602001828103825260218152602001806113376021913960400191505060405180910390fd5b600061063a610bd9565b606b5561064561095f565b606a556001600160a01b0381161561068c5761066081610372565b6001600160a01b0382166000908152606e6020908152604080832093909355606b54606d909152919020555b6000606954116106d8576040805162461bcd60e51b815260206004820152601260248201527172657761726452617465206973207a65726f60701b604482015290519081900360640190fd5b60006106ef60695484610deb90919063ffffffff16565b90506068544311156107505743606a81905561070b9082610e2d565b606881905560408051858152602081019290925280517f6c07ee05dcf262f13abf9d87b846ee789d2f90fe991d495acd7d7fc109ee1f559281900390910190a161079e565b60685461075d9082610e2d565b606881905560408051858152602081019290925280517f6c07ee05dcf262f13abf9d87b846ee789d2f90fe991d495acd7d7fc109ee1f559281900390910190a15b505050565b336107ac610bd9565b606b556107b761095f565b606a556001600160a01b038116156107fe576107d281610372565b6001600160a01b0382166000908152606e6020908152604080832093909355606b54606d909152919020555b600061080933610372565b9050801561087157336000818152606e602052604081205560675461083a916001600160a01b039091169083610e8b565b60408051828152905133917fe2403640ba68fed3a2f88b7557551d1993f84b99bb10ff833f0cf8db0c5e0486919081900360200190a25b5050565b6000546201000090046001600160a01b031690565b6001600160a01b031660009081526002602052604090205490565b6108ad610e87565b6035546001600160a01b0390811691161461090f576040805162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b6035546040516000916001600160a01b0316907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908390a3603580546001600160a01b0319169055565b60695481565b600060685443111561097357606854610975565b435b905090565b606d6020526000908152604090205481565b6035546001600160a01b031690565b606c546001600160a01b03166109af610e87565b6001600160a01b0316146109f45760405162461bcd60e51b81526004018080602001828103825260218152602001806113376021913960400191505060405180910390fd5b60006109fe610bd9565b606b55610a0961095f565b606a556001600160a01b03811615610a5057610a2481610372565b6001600160a01b0382166000908152606e6020908152604080832093909355606b54606d909152919020555b81610a5e5743606855610a8f565b60685415610a8f57610a8b436103d4846103ce6069546103c8606a54606854610d4990919063ffffffff16565b6068555b606954606854604080519283526020830185905282810191909152517f3d209aed8ecb665e2e6cc55772bfc177e7aa7f6fa40ce4af171a43ed8fa2e2db9181900360600190a150606955565b60008111610b30576040805162461bcd60e51b815260206004820152601860248201527f63616e6e6f74207374616b65207a65726f20616d6f756e740000000000000000604482015290519081900360640190fd5b600054610b4e906201000090046001600160a01b0316333084610edd565b600154610b5b9082610e2d565b60015533600090815260026020526040902054610b789082610e2d565b33600081815260026020908152604091829020939093558051848152905191927febedb8b3c678666e7f36970bc8f57abf6d8fa2e828c0da91ea5b75bf68ed101a92918290030190a250565b6067546001600160a01b031681565b606a5481565b6000610be361048d565b610bf05750606b54610491565b610975610c1e610bfe61048d565b6103ce670de0b6b3a76400006103c86069546103c8606a546103b961095f565b606b5490610e2d565b606b5481565b60685481565b610c3b610e87565b6035546001600160a01b03908116911614610c9d576040805162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b6001600160a01b038116610ce25760405162461bcd60e51b81526004018080602001828103825260268152602001806112ca6026913960400191505060405180910390fd5b6035546040516001600160a01b038084169216907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a3603580546001600160a01b0319166001600160a01b0392909216919091179055565b60006103da8261088a565b6000610d8b83836040518060400160405280601e81526020017f536166654d6174683a207375627472616374696f6e206f766572666c6f770000815250610f3d565b9392505050565b600082610da1575060006103da565b82820282848281610dae57fe5b0414610d8b5760405162461bcd60e51b81526004018080602001828103825260218152602001806113166021913960400191505060405180910390fd5b6000610d8b83836040518060400160405280601a81526020017f536166654d6174683a206469766973696f6e206279207a65726f000000000000815250610fd4565b600082820183811015610d8b576040805162461bcd60e51b815260206004820152601b60248201527f536166654d6174683a206164646974696f6e206f766572666c6f770000000000604482015290519081900360640190fd5b3390565b604080516001600160a01b038416602482015260448082018490528251808303909101815260649091019091526020810180516001600160e01b031663a9059cbb60e01b17905261079e908490611039565b604080516001600160a01b0380861660248301528416604482015260648082018490528251808303909101815260849091019091526020810180516001600160e01b03166323b872dd60e01b179052610f37908590611039565b50505050565b60008184841115610fcc5760405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b83811015610f91578181015183820152602001610f79565b50505050905090810190601f168015610fbe5780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b505050900390565b600081836110235760405162461bcd60e51b8152602060048201818152835160248401528351909283926044909101919085019080838360008315610f91578181015183820152602001610f79565b50600083858161102f57fe5b0495945050505050565b606061108e826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b03166110ea9092919063ffffffff16565b80519091501561079e578080602001905160208110156110ad57600080fd5b505161079e5760405162461bcd60e51b815260040180806020018281038252602a815260200180611358602a913960400191505060405180910390fd5b60606110f98484600085611101565b949350505050565b6060824710156111425760405162461bcd60e51b81526004018080602001828103825260268152602001806112f06026913960400191505060405180910390fd5b61114b8561125d565b61119c576040805162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e7472616374000000604482015290519081900360640190fd5b60006060866001600160a01b031685876040518082805190602001908083835b602083106111db5780518252601f1990920191602091820191016111bc565b6001836020036101000a03801982511681845116808217855250505050505090500191505060006040518083038185875af1925050503d806000811461123d576040519150601f19603f3d011682016040523d82523d6000602084013e611242565b606091505b5091509150611252828286611263565b979650505050505050565b3b151590565b60608315611272575081610d8b565b8251156112825782518084602001fd5b60405162461bcd60e51b8152602060048201818152845160248401528451859391928392604401919085019080838360008315610f91578181015183820152602001610f7956fe4f776e61626c653a206e6577206f776e657220697320746865207a65726f2061646472657373416464726573733a20696e73756666696369656e742062616c616e636520666f722063616c6c536166654d6174683a206d756c7469706c69636174696f6e206f766572666c6f7743616c6c6572206973206e6f742072657761726420646973747269627574696f6e5361666545524332303a204552433230206f7065726174696f6e20646964206e6f742073756363656564a2646970667358221220c0eac1ca9acb02ba99cf6c9a7dceda4af260b8a7f9a67361cdef611a50b2d55a64736f6c63430007040033";
