/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, BigNumberish } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import { Contract, ContractFactory, Overrides } from "@ethersproject/contracts";

import type { SymbolService } from "./SymbolService";

export class SymbolServiceFactory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    reservedSymbolCount: BigNumberish,
    overrides?: Overrides
  ): Promise<SymbolService> {
    return super.deploy(
      reservedSymbolCount,
      overrides || {}
    ) as Promise<SymbolService>;
  }
  getDeployTransaction(
    reservedSymbolCount: BigNumberish,
    overrides?: Overrides
  ): TransactionRequest {
    return super.getDeployTransaction(reservedSymbolCount, overrides || {});
  }
  attach(address: string): SymbolService {
    return super.attach(address) as SymbolService;
  }
  connect(signer: Signer): SymbolServiceFactory {
    return super.connect(signer) as SymbolServiceFactory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): SymbolService {
    return new Contract(address, _abi, signerOrProvider) as SymbolService;
  }
}

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "reservedSymbolCount",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "factory",
        type: "address",
      },
    ],
    name: "AddWhitelistedFactory",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "liquidityPool",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "symbol",
        type: "uint256",
      },
    ],
    name: "AllocateSymbol",
    type: "event",
  },
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
        internalType: "address",
        name: "factory",
        type: "address",
      },
    ],
    name: "RemoveWhitelistedFactory",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "factory",
        type: "address",
      },
    ],
    name: "addWhitelistedFactory",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "liquidityPool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
    ],
    name: "allocateSymbol",
    outputs: [
      {
        internalType: "uint256",
        name: "symbol",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "liquidityPool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "symbol",
        type: "uint256",
      },
    ],
    name: "assignReservedSymbol",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "symbol",
        type: "uint256",
      },
    ],
    name: "getPerpetualUID",
    outputs: [
      {
        internalType: "address",
        name: "liquidityPool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "perpetualIndex",
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
        name: "liquidityPool",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "perpetualIndex",
        type: "uint256",
      },
    ],
    name: "getSymbols",
    outputs: [
      {
        internalType: "uint256[]",
        name: "symbols",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "factory",
        type: "address",
      },
    ],
    name: "isWhitelistedFactory",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
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
    inputs: [
      {
        internalType: "address",
        name: "factory",
        type: "address",
      },
    ],
    name: "removeWhitelistedFactory",
    outputs: [],
    stateMutability: "nonpayable",
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
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506040516112b53803806112b583398101604081905261002f91610094565b6000610039610090565b600080546001600160a01b0319166001600160a01b0383169081178255604051929350917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908290a35060038190556004556100ac565b3390565b6000602082840312156100a5578081fd5b5051919050565b6111fa806100bb6000396000f3fe608060405234801561001057600080fd5b506004361061009e5760003560e01c8063b719065811610066578063b71906581461011f578063bd086b861461013f578063dcb7a3e014610152578063f2fde38b14610172578063f3d15042146101855761009e565b806355467ce1146100a3578063715018a6146100cd578063735492f7146100d7578063745a3f74146100ea5780638da5cb5b1461010a575b600080fd5b6100b66100b1366004610e44565b610198565b6040516100c4929190610e92565b60405180910390f35b6100d56101f5565b005b6100d56100e5366004610ced565b610297565b6100fd6100f8366004610d09565b61035a565b6040516100c49190610ecc565b610112610421565b6040516100c49190610e7e565b61013261012d366004610d09565b610430565b6040516100c4919061113b565b6100d561014d366004610d34565b61062a565b610165610160366004610ced565b6108b8565b6040516100c49190610f10565b6100d5610180366004610ced565b6108cd565b6100d5610193366004610ced565b6109c5565b600081815260016020526040812080548291906001600160a01b03166101d95760405162461bcd60e51b81526004016101d0906110aa565b60405180910390fd5b80546001909101546001600160a01b0390911694909350915050565b6101fd610a7e565b6000546001600160a01b0390811691161461024d576040805162461bcd60e51b815260206004820181905260248201526000805160206111a5833981519152604482015290519081900360640190fd5b600080546040516001600160a01b03909116907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908390a3600080546001600160a01b0319169055565b61029f610a7e565b6000546001600160a01b039081169116146102ef576040805162461bcd60e51b815260206004820181905260248201526000805160206111a5833981519152604482015290519081900360640190fd5b6102f8816108b8565b6103145760405162461bcd60e51b81526004016101d090611054565b61031f600582610a82565b507ff127e51db2d456506cf1c13b384bede8716dd162ed3ac47e59ba5d8f71e79c828160405161034f9190610e7e565b60405180910390a150565b606060006103688484610a9e565b60008181526002602052604081209192509061038390610ad1565b90508061039157505061041b565b8067ffffffffffffffff811180156103a857600080fd5b506040519080825280602002602001820160405280156103d2578160200160208202803683370190505b50925060005b818110156104175760008381526002602052604090206103f89082610adc565b84828151811061040457fe5b60209081029190910101526001016103d8565b5050505b92915050565b6000546001600160a01b031690565b60003361043c81610ae8565b6104585760405162461bcd60e51b81526004016101d0906110d4565b610460610cb4565b816001600160a01b0316630cdc105a6040518163ffffffff1660e01b81526004016101c06040518083038186803b15801561049a57600080fd5b505afa1580156104ae573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104d29190610d68565b5050505050925050506104f8816000600781106104eb57fe5b6020020151600590610aee565b6105145760405162461bcd60e51b81526004016101d090610f52565b60006105208686610a9e565b600081815260026020526040902090915061053a90610ad1565b156105575760405162461bcd60e51b81526004016101d090610f1b565b6003549350600019841061057d5760405162461bcd60e51b81526004016101d09061107f565b6040805180820182526001600160a01b038881168252602080830189815260008981526001808452868220955186546001600160a01b0319169516949094178555905193909201929092558381526002909152206105db9085610b03565b506003805460010190556040517f55f7c390672d1d8da79d269a8c6ed5c6bdedcd43ccd36a70772a517c169c52ac9061061990889088908890610eab565b60405180910390a150505092915050565b610632610a7e565b6000546001600160a01b03908116911614610682576040805162461bcd60e51b815260206004820181905260248201526000805160206111a5833981519152604482015290519081900360640190fd5b8261068c81610ae8565b6106a85760405162461bcd60e51b81526004016101d0906110d4565b6106b0610cb4565b816001600160a01b0316630cdc105a6040518163ffffffff1660e01b81526004016101c06040518083038186803b1580156106ea57600080fd5b505afa1580156106fe573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906107229190610d68565b50505050509250505061073b816000600781106104eb57fe5b6107575760405162461bcd60e51b81526004016101d090610f52565b60045483106107785760405162461bcd60e51b81526004016101d090610f79565b6000838152600160205260409020546001600160a01b0316156107ad5760405162461bcd60e51b81526004016101d090610fbd565b60006107b98686610a9e565b60008181526002602052604090209091506107d390610ad1565b60011480156107fa575060045460008281526002602052604081206107f791610adc565b10155b6108165760405162461bcd60e51b81526004016101d090610fec565b6040805180820182526001600160a01b038881168252602080830189815260008981526001808452868220955186546001600160a01b0319169516949094178555905193909201929092558381526002909152206108749085610b03565b507f55f7c390672d1d8da79d269a8c6ed5c6bdedcd43ccd36a70772a517c169c52ac8686866040516108a893929190610eab565b60405180910390a1505050505050565b60006108c5600583610aee565b90505b919050565b6108d5610a7e565b6000546001600160a01b03908116911614610925576040805162461bcd60e51b815260206004820181905260248201526000805160206111a5833981519152604482015290519081900360640190fd5b6001600160a01b03811661096a5760405162461bcd60e51b815260040180806020018281038252602681526020018061117f6026913960400191505060405180910390fd5b600080546040516001600160a01b03808516939216917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e091a3600080546001600160a01b0319166001600160a01b0392909216919091179055565b6109cd610a7e565b6000546001600160a01b03908116911614610a1d576040805162461bcd60e51b815260206004820181905260248201526000805160206111a5833981519152604482015290519081900360640190fd5b610a26816108b8565b15610a435760405162461bcd60e51b81526004016101d09061110b565b610a4e600582610b0f565b507fc8dfd666771ee017e7cf86b4e85b8a1e6a5e8a1b84e33914193996a94d02bb3f8160405161034f9190610e7e565b3390565b6000610a97836001600160a01b038416610b24565b9392505050565b60008282604051602001610ab3929190610e5c565b60405160208183030381529060405280519060200120905092915050565b60006108c582610bea565b6000610a978383610bee565b3b151590565b6000610a97836001600160a01b038416610c52565b6000610a978383610c6a565b6000610a97836001600160a01b038416610c6a565b60008181526001830160205260408120548015610be05783546000198083019190810190600090879083908110610b5757fe5b9060005260206000200154905080876000018481548110610b7457fe5b600091825260208083209091019290925582815260018981019092526040902090840190558654879080610ba457fe5b6001900381819060005260206000200160009055905586600101600087815260200190815260200160002060009055600194505050505061041b565b600091505061041b565b5490565b81546000908210610c305760405162461bcd60e51b815260040180806020018281038252602281526020018061115d6022913960400191505060405180910390fd5b826000018281548110610c3f57fe5b9060005260206000200154905092915050565b60009081526001919091016020526040902054151590565b6000610c768383610c52565b610cac5750815460018181018455600084815260208082209093018490558454848252828601909352604090209190915561041b565b50600061041b565b6040518060e001604052806007906020820280368337509192915050565b80516108c881611144565b805180151581146108c857600080fd5b600060208284031215610cfe578081fd5b8135610a9781611144565b60008060408385031215610d1b578081fd5b8235610d2681611144565b946020939093013593505050565b600080600060608486031215610d48578081fd5b8335610d5381611144565b95602085013595506040909401359392505050565b6000806000806000806000806101c0898b031215610d84578384fd5b610d8d89610cdd565b97506020610d9c818b01610cdd565b97508a605f8b0112610dac578485fd5b60405160e0810181811067ffffffffffffffff82111715610dc957fe5b80604052508060408c016101208d018e811115610de4578889fd5b885b6007811015610e0a57610df883610cd2565b84529285019291850191600101610de6565b50839a508051995050505050506101408901519350610160890151925061018089015191506101a089015190509295985092959890939650565b600060208284031215610e55578081fd5b5035919050565b60609290921b6bffffffffffffffffffffffff19168252601482015260340190565b6001600160a01b0391909116815260200190565b6001600160a01b03929092168252602082015260400190565b6001600160a01b039390931683526020830191909152604082015260600190565b6020808252825182820181905260009190848201906040850190845b81811015610f0457835183529284019291840191600101610ee8565b50909695505050505050565b901515815260200190565b60208082526018908201527f70657270657475616c20616c7265616479206578697374730000000000000000604082015260600190565b6020808252600d908201526c77726f6e6720666163746f727960981b604082015260600190565b60208082526024908201527f73796d626f6c20657863656564732072657365727665642073796d626f6c20636040820152631bdd5b9d60e21b606082015260800190565b60208082526015908201527473796d626f6c20616c72656164792065786973747360581b604082015260600190565b60208082526042908201527f70657270657475616c206d7573742068617665206e6f726d616c2073796d626f60408201527f6c20616e64206d7573746e277420686176652072657665727365642073796d626060820152611bdb60f21b608082015260a00190565b602080825260119082015270199858dd1bdc9e481b9bdd08199bdd5b99607a1b604082015260600190565b6020808252601190820152701b9bdd08195b9bdd59da081cde5b589bdb607a1b604082015260600190565b60208082526010908201526f1cde5b589bdb081b9bdd08199bdd5b9960821b604082015260600190565b60208082526017908201527f6d7573742063616c6c656420627920636f6e7472616374000000000000000000604082015260600190565b602080825260169082015275666163746f727920616c72656164792065786973747360501b604082015260600190565b90815260200190565b6001600160a01b038116811461115957600080fd5b5056fe456e756d657261626c655365743a20696e646578206f7574206f6620626f756e64734f776e61626c653a206e6577206f776e657220697320746865207a65726f20616464726573734f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572a26469706673582212207a5bedcb5e751ab0c5d36a0ab381a9722f847dfc33463a19c54852c60c143e5d64736f6c63430007040033";
