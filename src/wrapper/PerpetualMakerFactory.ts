/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, BigNumberish } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import { Contract, ContractFactory, Overrides } from "@ethersproject/contracts";

import type { PerpetualMaker } from "./PerpetualMaker";

export class PerpetualMakerFactory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    governorTemplate: string,
    shareTokenTemplate: string,
    wethToken: string,
    globalVault: string,
    globalVaultFeeRate: BigNumberish,
    overrides?: Overrides
  ): Promise<PerpetualMaker> {
    return super.deploy(
      governorTemplate,
      shareTokenTemplate,
      wethToken,
      globalVault,
      globalVaultFeeRate,
      overrides || {}
    ) as Promise<PerpetualMaker>;
  }
  getDeployTransaction(
    governorTemplate: string,
    shareTokenTemplate: string,
    wethToken: string,
    globalVault: string,
    globalVaultFeeRate: BigNumberish,
    overrides?: Overrides
  ): TransactionRequest {
    return super.getDeployTransaction(
      governorTemplate,
      shareTokenTemplate,
      wethToken,
      globalVault,
      globalVaultFeeRate,
      overrides || {}
    );
  }
  attach(address: string): PerpetualMaker {
    return super.attach(address) as PerpetualMaker;
  }
  connect(signer: Signer): PerpetualMakerFactory {
    return super.connect(signer) as PerpetualMakerFactory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): PerpetualMaker {
    return new Contract(address, _abi, signerOrProvider) as PerpetualMaker;
  }
}

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "governorTemplate",
        type: "address",
      },
      {
        internalType: "address",
        name: "shareTokenTemplate",
        type: "address",
      },
      {
        internalType: "address",
        name: "wethToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "globalVault",
        type: "address",
      },
      {
        internalType: "int256",
        name: "globalVaultFeeRate",
        type: "int256",
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
        name: "implementation",
        type: "address",
      },
    ],
    name: "AddVersion",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "perpetual",
        type: "address",
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
        internalType: "int256[7]",
        name: "coreParams",
        type: "int256[7]",
      },
      {
        indexed: false,
        internalType: "int256[5]",
        name: "riskParams",
        type: "int256[5]",
      },
    ],
    name: "CreatePerpetual",
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
    inputs: [
      {
        internalType: "address",
        name: "trader",
        type: "address",
      },
    ],
    name: "activeProxy",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "implementation",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "compatibility",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "note",
        type: "string",
      },
    ],
    name: "addVersion",
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
        internalType: "int256[7]",
        name: "coreParams",
        type: "int256[7]",
      },
      {
        internalType: "int256[5]",
        name: "riskParams",
        type: "int256[5]",
      },
      {
        internalType: "int256[5]",
        name: "minRiskParamValues",
        type: "int256[5]",
      },
      {
        internalType: "int256[5]",
        name: "maxRiskParamValues",
        type: "int256[5]",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
    ],
    name: "createPerpetual",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "implementation",
        type: "address",
      },
      {
        internalType: "address",
        name: "oracle",
        type: "address",
      },
      {
        internalType: "int256[7]",
        name: "coreParams",
        type: "int256[7]",
      },
      {
        internalType: "int256[5]",
        name: "riskParams",
        type: "int256[5]",
      },
      {
        internalType: "int256[5]",
        name: "minRiskParamValues",
        type: "int256[5]",
      },
      {
        internalType: "int256[5]",
        name: "maxRiskParamValues",
        type: "int256[5]",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
    ],
    name: "createPerpetualWith",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "trader",
        type: "address",
      },
    ],
    name: "deactiveProxy",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "describe",
    outputs: [
      {
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "creationTime",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "compatibility",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "note",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "base",
        type: "address",
      },
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
    ],
    name: "isVersionCompatibleWith",
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
    inputs: [
      {
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "isVersionValid",
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
    name: "latestVersion",
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
        name: "trader",
        type: "address",
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
    name: "listActivePerpetualForTrader",
    outputs: [
      {
        internalType: "address[]",
        name: "",
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
        name: "begin",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "end",
        type: "uint256",
      },
    ],
    name: "listPerpetuals",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
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
        name: "trader",
        type: "address",
      },
    ],
    name: "totalActivePerpetualCountForTrader",
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
    name: "totalPerpetualCount",
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
    inputs: [],
    name: "vault",
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
    name: "vaultFeeRate",
    outputs: [
      {
        internalType: "int256",
        name: "",
        type: "int256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "weth",
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
];

const _bytecode =
  "0x60806040523480156200001157600080fd5b5060405162002df138038062002df1833981810160405260a08110156200003757600080fd5b5080516020820151604083015160608401516080909401519293919290919082828260006200006562000289565b600380546001600160a01b0319166001600160a01b038316908117909155604051919250906000907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908290a3506001600160a01b0382166200010f576040805162461bcd60e51b815260206004820152601560248201527f696e76616c6964207661756c7420616464726573730000000000000000000000604482015290519081900360640190fd5b6001600160a01b0383166200016b576040805162461bcd60e51b815260206004820152601460248201527f696e76616c696420776574682061646472657373000000000000000000000000604482015290519081900360640190fd5b600780546001600160a01b03199081166001600160a01b03958616179091556008805490911692841692909217909155600955620001b79086166200028d602090811b620010d917901c565b620001f45760405162461bcd60e51b815260040180806020018281038252602281526020018062002daa6022913960400191505060405180910390fd5b62000213846001600160a01b03166200028d60201b620010d91760201c565b620002505760405162461bcd60e51b815260040180806020018281038252602581526020018062002dcc6025913960400191505060405180910390fd5b5050600a80546001600160a01b039485166001600160a01b031991821617909155600b8054939094169216919091179091555062000293565b3390565b3b151590565b612b0780620002a36000396000f3fe60806040523480156200001157600080fd5b50600436106200013c5760003560e01c8063715018a611620000bd578063bc6f1e1f116200007b578063bc6f1e1f146200046c578063c07f47d414620004f7578063d3b3eb2b1462000501578063f2fde38b146200052a578063fbfa77cf1462000553576200013c565b8063715018a614620003615780637207c4ee146200036d578063806c40f114620003965780638da5cb5b146200045857806396550e8b1462000462576200013c565b806349789c17116200010b57806349789c17146200027b57806353a1c05314620002855780635b11089614620002cd57806365e0139b146200030a578063670e682c146200033b576200013c565b8063022b6511146200014157806304a42655146200017c5780633fc8cef314620002035780634298efd01462000229575b600080fd5b6200016a600480360360208110156200015957600080fd5b50356001600160a01b03166200055d565b60408051918252519081900360200190f35b620001b1600480360360608110156200019457600080fd5b506001600160a01b03813516906020810135906040013562000586565b60408051602080825283518183015283519192839290830191858101910280838360005b83811015620001ef578181015183820152602001620001d5565b505050509050019250505060405180910390f35b6200020d620006db565b604080516001600160a01b039092168252519081900360200190f35b6200020d60048036036103208110156200024257600080fd5b506001600160a01b03813581169160208101359091169060408101906101208101906101c08101906102608101906103000135620006ea565b6200016a62000709565b6200020d60048036036103008110156200029e57600080fd5b506001600160a01b038135169060208101906101008101906101a08101906102408101906102e001356200071c565b620002f660048036036020811015620002e557600080fd5b50356001600160a01b031662000743565b604080519115158252519081900360200190f35b620002f6600480360360408110156200032257600080fd5b506001600160a01b0381358116916020013516620007ed565b620001b1600480360360408110156200035357600080fd5b5080359060200135620008db565b6200036b62000a15565b005b620002f6600480360360208110156200038557600080fd5b50356001600160a01b031662000acc565b620003bf60048036036020811015620003ae57600080fd5b50356001600160a01b031662000adb565b60405180856001600160a01b0316815260200184815260200183815260200180602001828103825283818151815260200191508051906020019080838360005b8381101562000419578181015183820152602001620003ff565b50505050905090810190601f168015620004475780820380516001836020036101000a031916815260200191505b509550505050505060405180910390f35b6200020d62000c0b565b6200016a62000c1a565b6200036b600480360360608110156200048457600080fd5b6001600160a01b0382351691602081013591810190606081016040820135640100000000811115620004b557600080fd5b820183602082011115620004c857600080fd5b80359060200191846001830284011164010000000083111715620004eb57600080fd5b50909250905062000c20565b6200020d62000ea4565b620002f6600480360360208110156200051957600080fd5b50356001600160a01b031662000f10565b6200036b600480360360208110156200054257600080fd5b50356001600160a01b031662000fba565b6200020d620010ca565b6001600160a01b03811660009081526002602052604081206200058090620010df565b92915050565b6001600160a01b0383166000908152600260205260409020606090620005ac81620010df565b831115620005ec576040805162461bcd60e51b8152602060048201526008602482015267195e18d95959195960c21b604482015290519081900360640190fd5b8383116200062c576040805162461bcd60e51b815260206004820152600860248201526706040d8cadccee8d60c31b604482015290519081900360640190fd5b60606200063a8486620010ec565b67ffffffffffffffff811180156200065157600080fd5b506040519080825280602002602001820160405280156200067c578160200160208202803683370190505b509050845b84811015620006cf5762000696838262001130565b82620006a38389620010ec565b81518110620006ae57fe5b6001600160a01b039092166020928302919091019091015260010162000681565b509150505b9392505050565b6007546001600160a01b031690565b6000620006fd888888888888886200113e565b98975050505050505050565b6000620007176000620010df565b905090565b6000620007386200072c62000ea4565b8888888888886200113e565b979650505050505050565b6000620007503362001575565b6200077c576040805162461bcd60e51b8152602060048201526000602482015290519081900360640190fd5b6001600160a01b038216620007c9576040805162461bcd60e51b815260206004820152600e60248201526d34b73b30b634b2103a3930b232b960911b604482015290519081900360640190fd5b6001600160a01b038216600090815260026020526040902062000580903362001583565b6000620007fa8362000acc565b6200084c576040805162461bcd60e51b815260206004820152601760248201527f626173652076657273696f6e20697320696e76616c6964000000000000000000604482015290519081900360640190fd5b620008578262000acc565b620008a9576040805162461bcd60e51b815260206004820152601960248201527f7461726765742076657273696f6e20697320696e76616c696400000000000000604482015290519081900360640190fd5b506001600160a01b03808316600090815260066020526040808220600290810154938516835291200154101592915050565b6060620008e96000620010df565b82111562000929576040805162461bcd60e51b8152602060048201526008602482015267195e18d95959195960c21b604482015290519081900360640190fd5b82821162000969576040805162461bcd60e51b815260206004820152600860248201526706040d8cadccee8d60c31b604482015290519081900360640190fd5b6060620009778385620010ec565b67ffffffffffffffff811180156200098e57600080fd5b50604051908082528060200260200182016040528015620009b9578160200160208202803683370190505b509050835b8381101562000a0d57620009d460008262001130565b82620009e18388620010ec565b81518110620009ec57fe5b6001600160a01b0390921660209283029190910190910152600101620009be565b509392505050565b62000a1f6200159a565b6003546001600160a01b0390811691161462000a82576040805162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b6003546040516000916001600160a01b0316907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908390a3600380546001600160a01b0319169055565b6000620005806004836200159e565b6000806000606062000aed8562000acc565b62000b3f576040805162461bcd60e51b815260206004820152601960248201527f696d706c656d656e746174696f6e20697320696e76616c696400000000000000604482015290519081900360640190fd5b6001600160a01b0385811660009081526006602090815260409182902080546001808301546002808501546003909501805488516101009582161595909502600019011691909104601f8101879004870284018701909752868352929096169950949750909550919083018282801562000bfd5780601f1062000bd15761010080835404028352916020019162000bfd565b820191906000526020600020905b81548152906001019060200180831162000bdf57829003601f168201915b505050505090509193509193565b6003546001600160a01b031690565b60095490565b62000c2a6200159a565b6003546001600160a01b0390811691161462000c8d576040805162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b6001600160a01b03841662000ce2576040805162461bcd60e51b815260206004820152601660248201527534b73b30b634b21034b6b83632b6b2b73a30ba34b7b760511b604482015290519081900360640190fd5b62000cf6846001600160a01b0316620010d9565b62000d48576040805162461bcd60e51b815260206004820152601f60248201527f696d706c656d656e746174696f6e206d75737420626520636f6e747261637400604482015290519081900360640190fd5b62000d556004856200159e565b1562000d935760405162461bcd60e51b815260040180806020018281038252602181526020018062002ab16021913960400191505060405180910390fd5b62000da0600485620015b5565b506040518060800160405280336001600160a01b0316815260200142815260200184815260200183838080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201829052509390945250506001600160a01b03878116825260066020908152604092839020855181546001600160a01b03191693169290921782558481015160018301559184015160028201556060840151805191935062000e5e92600385019291019062001d91565b5050604080516001600160a01b038716815290517f51ea2037319ede313dbdbd0b178b14cf5fb14befaeaab5e24ed1d72f70ffc56792509081900360200190a150505050565b60008062000eb36004620010df565b1162000ef3576040805162461bcd60e51b815260206004820152600a6024820152693737903b32b939b4b7b760b11b604482015290519081900360640190fd5b62000717600162000f056004620010df565b600491900362001130565b600062000f1d3362001575565b62000f49576040805162461bcd60e51b8152602060048201526000602482015290519081900360640190fd5b6001600160a01b03821662000f96576040805162461bcd60e51b815260206004820152600e60248201526d34b73b30b634b2103a3930b232b960911b604482015290519081900360640190fd5b6001600160a01b0382166000908152600260205260409020620005809033620015b5565b62000fc46200159a565b6003546001600160a01b0390811691161462001027576040805162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b6001600160a01b0381166200106e5760405162461bcd60e51b815260040180806020018281038252602681526020018062002a656026913960400191505060405180910390fd5b6003546040516001600160a01b038084169216907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a3600380546001600160a01b0319166001600160a01b0392909216919091179055565b6008546001600160a01b031690565b3b151590565b60006200058082620015cc565b6000620006d483836040518060400160405280601e81526020017f536166654d6174683a207375627472616374696f6e206f766572666c6f770000815250620015d0565b6000620006d483836200166b565b60006200114b8862000acc565b62001196576040805162461bcd60e51b815260206004820152601660248201527534b73b30b634b21034b6b83632b6b2b73a30ba34b7b760511b604482015290519081900360640190fd5b600a54600090620011b0906001600160a01b0316620016d2565b600b54909150600090620011cd906001600160a01b0316620016d2565b90506000620011de8b848762001777565b604080516001600160a01b038084166024808401919091528351808403909101815260449092018352602082810180516001600160e01b031663189acdbd60e31b1790528351808501909452601884527f6661696c20746f20696e697420736861726520746f6b656e0000000000000000908401529293506200126492851691620019e4565b50604080516001600160a01b0380851660248301528084166044808401919091528351808403909101815260649092018352602082810180516001600160e01b031663485cc95560e01b179052835180850190945260158452743330b4b6103a379034b734ba1033b7bb32b93737b960591b90840152620012ea929086169190620019e4565b5062001416338b85858d8d8d8d60405160240180896001600160a01b03168152602001886001600160a01b03168152602001876001600160a01b03168152602001866001600160a01b0316815260200185600760200280828437600083820152601f01601f191690910190508460a080828437600083820152601f01601f191690910190508360a080828437600083820152601f01601f191690910190508260a08082843760008382015260408051601f909201601f199081169094018281039094018252928352602080820180516001600160e01b03166324fe7a4b60e11b1790528351808501909452601684527519985a5b081d1bc81a5b9a5d081c195c9c195d1d585b60521b908401526001600160a01b038e169b50995090975050620019e495505050505050565b506200142281620019fd565b7efed7a4317354cc24fd703396ae9c240add67e3eb2ca2ebe1400cf9218e0fdd818484338e8f6001600160a01b031663d8dfeb456040518163ffffffff1660e01b815260040160206040518083038186803b1580156200148157600080fd5b505afa15801562001496573d6000803e3d6000fd5b505050506040513d6020811015620014ad57600080fd5b81019080805190602001909291905050508f8f60405180896001600160a01b03168152602001886001600160a01b03168152602001876001600160a01b03168152602001866001600160a01b03168152602001856001600160a01b03168152602001846001600160a01b0316815260200183600760200280828437600083820152601f01601f191690910190508260a080828437600083820152604051601f909101601f19169092018290039a509098505050505050505050a19a9950505050505050505050565b60006200058081836200159e565b6000620006d4836001600160a01b03841662001a9d565b3390565b6000620006d4836001600160a01b03841662001b69565b6000620006d4836001600160a01b03841662001b81565b5490565b60008184841115620016635760405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b83811015620016275781810151838201526020016200160d565b50505050905090810190601f168015620016555780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b505050900390565b81546000908210620016af5760405162461bcd60e51b815260040180806020018281038252602281526020018062002a436022913960400191505060405180910390fd5b826000018281548110620016bf57fe5b9060005260206000200154905092915050565b60006001600160a01b03821662001729576040805162461bcd60e51b815260206004820152601660248201527534b73b30b634b21034b6b83632b6b2b73a30ba34b7b760511b604482015290519081900360640190fd5b6000826040516200173a9062001e26565b6001600160a01b03909116815260406020820181905260008183018190529051918290036080019190f08015801562000a0d573d6000803e3d6000fd5b60006001600160a01b038416620017ce576040805162461bcd60e51b815260206004820152601660248201527534b73b30b634b21034b6b83632b6b2b73a30ba34b7b760511b604482015290519081900360640190fd5b620017d984620010d9565b6200182b576040805162461bcd60e51b815260206004820152601f60248201527f696d706c656d656e746174696f6e206d75737420626520636f6e747261637400604482015290519081900360640190fd5b6060604051806020016200183f9062001e34565b601f1982820381018352601f9091011660408181526001600160a01b038089166020848101919091529088168284015260608084015260006080840152815180840360a001815260c084019092528351919260e0019182918501908083835b60208310620018bf5780518252601f1990920191602091820191016200189e565b51815160209384036101000a600019018019909216911617905285519190930192850191508083835b60208310620019095780518252601f199092019160209182019101620018e8565b51815160209384036101000a60001901801990921691161790526040805192909401828103601f190183528085526001600160a01b038d8116828401528c168186015233606082015260808082018c90528551808303909101815260a09091019094528351938101939093208151919750955085945092505084016000f592506001600160a01b038316620019db576040805162461bcd60e51b815260206004820152601360248201527218dc99585d194c8818d85b1b0819985a5b1959606a1b604482015290519081900360640190fd5b50509392505050565b6060620019f5848460008562001bd0565b949350505050565b6001600160a01b03811662001a49576040805162461bcd60e51b815260206004820152600d60248201526c696e76616c69642070726f787960981b604482015290519081900360640190fd5b600062001a578183620015b5565b90508062001a99576040805162461bcd60e51b815260206004820152600a602482015269191d5c1b1a58d85d195960b21b604482015290519081900360640190fd5b5050565b6000818152600183016020526040812054801562001b5e578354600019808301919081019060009087908390811062001ad257fe5b906000526020600020015490508087600001848154811062001af057fe5b60009182526020808320909101929092558281526001898101909252604090209084019055865487908062001b2157fe5b6001900381819060005260206000200160009055905586600101600087815260200190815260200160002060009055600194505050505062000580565b600091505062000580565b60009081526001919091016020526040902054151590565b600062001b8f838362001b69565b62001bc75750815460018181018455600084815260208082209093018490558454848252828601909352604090209190915562000580565b50600062000580565b60608247101562001c135760405162461bcd60e51b815260040180806020018281038252602681526020018062002a8b6026913960400191505060405180910390fd5b62001c1e85620010d9565b62001c70576040805162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e7472616374000000604482015290519081900360640190fd5b60006060866001600160a01b031685876040518082805190602001908083835b6020831062001cb15780518252601f19909201916020918201910162001c90565b6001836020036101000a03801982511681845116808217855250505050505090500191505060006040518083038185875af1925050503d806000811462001d15576040519150601f19603f3d011682016040523d82523d6000602084013e62001d1a565b606091505b5091509150620007388282866060831562001d37575081620006d4565b82511562001d485782518084602001fd5b60405162461bcd60e51b8152602060048201818152845160248401528451859391928392604401919085019080838360008315620016275781810151838201526020016200160d565b828054600181600116156101000203166002900490600052602060002090601f01602090048101928262001dc9576000855562001e14565b82601f1062001de457805160ff191683800117855562001e14565b8280016001018555821562001e14579182015b8281111562001e1457825182559160200191906001019062001df7565b5062001e2292915062001e42565b5090565b6103178062001e5a83390190565b6108d2806200217183390190565b5b8082111562001e22576000815560010162001e4356fe60806040526040516103173803806103178339818101604052604081101561002657600080fd5b81516020830180516040519294929383019291908464010000000082111561004d57600080fd5b90830190602082018581111561006257600080fd5b825164010000000081118282018810171561007c57600080fd5b82525081516020918201929091019080838360005b838110156100a9578181015183820152602001610091565b50505050905090810190601f1680156100d65780820380516001836020036101000a031916815260200191505b50604052506100e3915050565b6100ec826101ab565b8051156101a4576000826001600160a01b0316826040518082805190602001908083835b6020831061012f5780518252601f199092019160209182019101610110565b6001836020036101000a038019825116818451168082178552505050505050905001915050600060405180830381855af49150503d806000811461018f576040519150601f19603f3d011682016040523d82523d6000602084013e610194565b606091505b50509050806101a257600080fd5b505b5050610223565b6101be8161021d60201b6100271760201c565b6101f95760405162461bcd60e51b815260040180806020018281038252603b8152602001806102dc603b913960400191505060405180910390fd5b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc55565b3b151590565b60ab806102316000396000f3fe608060405236601057600e6013565b005b600e5b60196025565b60256021602d565b6052565b565b3b151590565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5490565b3660008037600080366000845af43d6000803e8080156070573d6000f35b3d6000fdfea26469706673582212202fe8069d3720fd4439d15b6e673680d3cc748c2ba3b481931876e9a92179614e64736f6c6343000704003343616e6e6f742073657420612070726f787920696d706c656d656e746174696f6e20746f2061206e6f6e2d636f6e7472616374206164647265737360806040526040516108d23803806108d28339818101604052606081101561002657600080fd5b8151602083015160408085018051915193959294830192918464010000000082111561005157600080fd5b90830190602082018581111561006657600080fd5b825164010000000081118282018810171561008057600080fd5b82525081516020918201929091019080838360005b838110156100ad578181015183820152602001610095565b50505050905090810190601f1680156100da5780820380516001836020036101000a031916815260200191505b50604052508491508290506100ee826101bf565b8051156101a6576000826001600160a01b0316826040518082805190602001908083835b602083106101315780518252601f199092019160209182019101610112565b6001836020036101000a038019825116818451168082178552505050505050905001915050600060405180830381855af49150503d8060008114610191576040519150601f19603f3d011682016040523d82523d6000602084013e610196565b606091505b50509050806101a457600080fd5b505b506101ae9050565b6101b782610231565b50505061025b565b6101d28161025560201b6103b41760201c565b61020d5760405162461bcd60e51b815260040180806020018281038252603b815260200180610897603b913960400191505060405180910390fd5b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc55565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d610355565b3b151590565b61062d8061026a6000396000f3fe60806040526004361061004e5760003560e01c80633659cfe6146100655780634f1ef286146100985780635c60da1b146101185780638f28397014610149578063f851a4401461017c5761005d565b3661005d5761005b610191565b005b61005b610191565b34801561007157600080fd5b5061005b6004803603602081101561008857600080fd5b50356001600160a01b03166101ab565b61005b600480360360408110156100ae57600080fd5b6001600160a01b0382351691908101906040810160208201356401000000008111156100d957600080fd5b8201836020820111156100eb57600080fd5b8035906020019184600183028401116401000000008311171561010d57600080fd5b5090925090506101e5565b34801561012457600080fd5b5061012d610292565b604080516001600160a01b039092168252519081900360200190f35b34801561015557600080fd5b5061005b6004803603602081101561016c57600080fd5b50356001600160a01b03166102cf565b34801561018857600080fd5b5061012d610389565b6101996103ba565b6101a96101a461041a565b61043f565b565b6101b3610463565b6001600160a01b0316336001600160a01b031614156101da576101d581610488565b6101e2565b6101e2610191565b50565b6101ed610463565b6001600160a01b0316336001600160a01b031614156102855761020f83610488565b6000836001600160a01b031683836040518083838082843760405192019450600093509091505080830381855af49150503d806000811461026c576040519150601f19603f3d011682016040523d82523d6000602084013e610271565b606091505b505090508061027f57600080fd5b5061028d565b61028d610191565b505050565b600061029c610463565b6001600160a01b0316336001600160a01b031614156102c4576102bd61041a565b90506102cc565b6102cc610191565b90565b6102d7610463565b6001600160a01b0316336001600160a01b031614156101da576001600160a01b0381166103355760405162461bcd60e51b81526004018080602001828103825260368152602001806105876036913960400191505060405180910390fd5b7f7e644d79422f17c01e4894b5f4f588d331ebfa28653d42ae832dc59e38c9798f61035e610463565b604080516001600160a01b03928316815291841660208301528051918290030190a16101d5816104c8565b6000610393610463565b6001600160a01b0316336001600160a01b031614156102c4576102bd610463565b3b151590565b6103c2610463565b6001600160a01b0316336001600160a01b031614156104125760405162461bcd60e51b81526004018080602001828103825260328152602001806105556032913960400191505060405180910390fd5b6101a96101a9565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5490565b3660008037600080366000845af43d6000803e80801561045e573d6000f35b3d6000fd5b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b610491816104ec565b6040516001600160a01b038216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d610355565b6104f5816103b4565b6105305760405162461bcd60e51b815260040180806020018281038252603b8152602001806105bd603b913960400191505060405180910390fd5b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5556fe43616e6e6f742063616c6c2066616c6c6261636b2066756e6374696f6e2066726f6d207468652070726f78792061646d696e43616e6e6f74206368616e6765207468652061646d696e206f6620612070726f787920746f20746865207a65726f206164647265737343616e6e6f742073657420612070726f787920696d706c656d656e746174696f6e20746f2061206e6f6e2d636f6e74726163742061646472657373a26469706673582212203fa5a8cd6a8d81c9f58dfb03f7580dc2e631669092c2df72770382ef143e4e4b64736f6c6343000704003343616e6e6f742073657420612070726f787920696d706c656d656e746174696f6e20746f2061206e6f6e2d636f6e74726163742061646472657373456e756d657261626c655365743a20696e646578206f7574206f6620626f756e64734f776e61626c653a206e6577206f776e657220697320746865207a65726f2061646472657373416464726573733a20696e73756666696369656e742062616c616e636520666f722063616c6c696d706c656d656e746174696f6e20697320616c72656164792065786973746564a26469706673582212203c32f6873c25811276776ce21e8b8f27eb7782bec51b98f2ea584e1486d2daef64736f6c63430007040033676f7665726e6f722074656d706c617465206d75737420626520636f6e7472616374736861726520746f6b656e2074656d706c617465206d75737420626520636f6e7472616374";