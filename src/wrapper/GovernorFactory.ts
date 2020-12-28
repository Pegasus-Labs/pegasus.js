/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import { Contract, ContractFactory, Overrides } from "@ethersproject/contracts";

import type { Governor } from "./Governor";

export class GovernorFactory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(overrides?: Overrides): Promise<Governor> {
    return super.deploy(overrides || {}) as Promise<Governor>;
  }
  getDeployTransaction(overrides?: Overrides): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): Governor {
    return super.attach(address) as Governor;
  }
  connect(signer: Signer): GovernorFactory {
    return super.connect(signer) as GovernorFactory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Governor {
    return new Contract(address, _abi, signerOrProvider) as Governor;
  }
}

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "txHash",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "signature",
        type: "string",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "eta",
        type: "uint256",
      },
    ],
    name: "ExecuteTransaction",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "proposer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "targets",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "signature",
        type: "string",
      },
      {
        indexed: false,
        internalType: "bytes[]",
        name: "calldatas",
        type: "bytes[]",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "startBlock",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "endBlock",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "description",
        type: "string",
      },
    ],
    name: "ProposalCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "ProposalExecuted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "voter",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "proposalId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "support",
        type: "bool",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "votes",
        type: "uint256",
      },
    ],
    name: "VoteCast",
    type: "event",
  },
  {
    inputs: [],
    name: "BALLOT_TYPEHASH",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DOMAIN_TYPEHASH",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "signature",
        type: "string",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "eta",
        type: "uint256",
      },
    ],
    name: "_executeTransaction",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "proposalId",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "support",
        type: "bool",
      },
    ],
    name: "castVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "proposalId",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "support",
        type: "bool",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "castVoteBySig",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "proposalId",
        type: "uint256",
      },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "executingDelay",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "executingTimeout",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "proposalId",
        type: "uint256",
      },
    ],
    name: "getActions",
    outputs: [
      {
        internalType: "string",
        name: "signatures",
        type: "string",
      },
      {
        internalType: "bytes[]",
        name: "calldatas",
        type: "bytes[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "proposalId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "voter",
        type: "address",
      },
    ],
    name: "getReceipt",
    outputs: [
      {
        components: [
          {
            internalType: "bool",
            name: "hasVoted",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "support",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "votes",
            type: "uint256",
          },
        ],
        internalType: "struct Receipt",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_voteToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_target",
        type: "address",
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
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "latestProposalIds",
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
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "proposalCount",
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
    name: "proposalMaxOperations",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "proposalRateThreshold",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "proposals",
    outputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "proposer",
        type: "address",
      },
      {
        internalType: "string",
        name: "signature",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "startBlock",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "endBlock",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "forVotes",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "againstVotes",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "executed",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32[]",
        name: "keys",
        type: "bytes32[]",
      },
      {
        internalType: "int256[]",
        name: "values",
        type: "int256[]",
      },
    ],
    name: "proposeCoreParameterUpdate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "targetImplementation",
        type: "address",
      },
    ],
    name: "proposeLiquidityPoolUpgrade",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32[]",
        name: "keys",
        type: "bytes32[]",
      },
      {
        internalType: "int256[]",
        name: "values",
        type: "int256[]",
      },
      {
        internalType: "int256[]",
        name: "minValues",
        type: "int256[]",
      },
      {
        internalType: "int256[]",
        name: "maxValues",
        type: "int256[]",
      },
    ],
    name: "proposeRiskParameterUpdate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "quorumVoteRate",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "proposalId",
        type: "uint256",
      },
    ],
    name: "state",
    outputs: [
      {
        internalType: "enum ProposalState",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "target",
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
    name: "voteToken",
    outputs: [
      {
        internalType: "contract IVoteToken",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "votingDelay",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "votingPeriod",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506126d3806100206000396000f3fe6080604052600436106101815760003560e01c8063485cc955116100d1578063d4b839921161008a578063deaaa7cc11610064578063deaaa7cc14610416578063e23a9a521461042b578063f8ef206c14610458578063fe0d94c11461047857610181565b8063d4b83992146103d7578063da35c664146103ec578063db148eee1461040157610181565b8063485cc955146103505780634dc886ca1461037057806351e8f981146103835780637bdbe4d014610398578063a46fb46e146103ad578063b2c86096146103c257610181565b806320606b701161013e578063344551a811610118578063344551a8146102ce5780633932abb1146102ee5780633e4f49e6146103035780634634c61f1461033057610181565b806320606b701461026b57806327ae8ff314610280578063328dd982146102a057610181565b8063013cf08b1461018657806302a251a3146101c357806306fdde03146101e557806315373e3d14610207578063160d66ae1461022957806317977c611461024b575b600080fd5b34801561019257600080fd5b506101a66101a1366004611e3d565b610498565b6040516101ba989796959493929190612555565b60405180910390f35b3480156101cf57600080fd5b506101d8610570565b6040516101ba91906120cf565b3480156101f157600080fd5b506101fa610576565b6040516101ba9190612132565b34801561021357600080fd5b50610227610222366004611e8f565b6105a3565b005b34801561023557600080fd5b5061023e6105b2565b6040516101ba9190612032565b34801561025757600080fd5b506101d8610266366004611c7e565b6105c1565b34801561027757600080fd5b506101d86105d3565b34801561028c57600080fd5b5061022761029b366004611c7e565b6105f7565b3480156102ac57600080fd5b506102c06102bb366004611e3d565b6106b8565b6040516101ba929190612159565b3480156102da57600080fd5b506102276102e9366004611cca565b61083e565b3480156102fa57600080fd5b506101d86109aa565b34801561030f57600080fd5b5061032361031e366004611e3d565b6109af565b6040516101ba9190612145565b34801561033c57600080fd5b5061022761034b366004611eb1565b610b24565b34801561035c57600080fd5b5061022761036b366004611c98565b610cd1565b6101fa61037e366004611dd3565b610cff565b34801561038f57600080fd5b506101d8610eae565b3480156103a457600080fd5b506101d8610eb9565b3480156103b957600080fd5b506101d8610ebe565b3480156103ce57600080fd5b506101d8610ec5565b3480156103e357600080fd5b5061023e610ed0565b3480156103f857600080fd5b506101d8610edf565b34801561040d57600080fd5b506101d8610ee5565b34801561042257600080fd5b506101d8610eec565b34801561043757600080fd5b5061044b610446366004611e6d565b610f10565b6040516101ba91906124ba565b34801561046457600080fd5b50610227610473366004611d2b565b610f74565b34801561048457600080fd5b50610227610493366004611e3d565b61114f565b60036020908152600091825260409182902080546001808301546002808501805488516101009582161595909502600019011691909104601f810187900487028401870190975286835292956001600160a01b03909116949192918301828280156105445780601f1061051957610100808354040283529160200191610544565b820191906000526020600020905b81548152906001019060200180831161052757829003601f168201915b505050600484015460058501546006860154600787015460089097015495969295919450925060ff1688565b61438090565b6040518060400160405280601181526020017026a1a222ac1026281023b7bb32b93737b960791b81525081565b6105ae33838361133a565b5050565b6000546001600160a01b031681565b60046020526000908152604090205481565b7f8cad95687ba82c2ce50e74f7b754645e5117c3a5bec8151c0726d5857980a86681565b604080516001808252818301909252606091816020015b606081526020019060019003908161060e579050509050816040516020016106369190611f84565b6040516020818303038152906040528160008151811061065257fe5b60200260200101819052506106b36040518060400160405280601281526020017175706772616465546f28616464726573732960701b815250826040518060400160405280600981526020016875706772616465546f60b81b8152506114d9565b505050565b6000818152600360208181526040928390206002808201805486516001821615610100026000190190911692909204601f81018590048502830185019096528582526060958695939491938501929184919083018282801561075b5780601f106107305761010080835404028352916020019161075b565b820191906000526020600020905b81548152906001019060200180831161073e57829003601f168201915b5050505050915080805480602002602001604051908101604052809291908181526020016000905b8282101561082e5760008481526020908190208301805460408051601f600260001961010060018716150201909416939093049283018590048502810185019091528181529283018282801561081a5780601f106107ef5761010080835404028352916020019161081a565b820191906000526020600020905b8154815290600101906020018083116107fd57829003601f168201915b505050505081526020019060010190610783565b5050505090509250925050915091565b610846610eb9565b8251111561086f5760405162461bcd60e51b815260040161086690612402565b60405180910390fd5b80518251146108905760405162461bcd60e51b815260040161086690612402565b815160608167ffffffffffffffff811180156108ab57600080fd5b506040519080825280602002602001820160405280156108df57816020015b60608152602001906001900390816108ca5790505b50905060005b82811015610954578481815181106108f957fe5b602002602001015184828151811061090d57fe5b6020026020010151604051602001610926929190611fa1565b60405160208183030381529060405282828151811061094157fe5b60209081029190910101526001016108e5565b506109a3604051806060016040528060258152602001612621602591398260405180604001604052806013815260200172436f7265506172616d6574657255706461746560681b8152506114d9565b5050505050565b600190565b600081600254101580156109c35750600082115b6109df5760405162461bcd60e51b815260040161086690612213565b600082815260036020526040902060048101544311610a02576000915050610b1f565b80600501544311610a17576001915050610b1f565b80600701548160060154111580610abc5750600054604080516318160ddd60e01b81529051610ab5926001600160a01b0316916318160ddd916004808301926020929190829003018186803b158015610a6f57600080fd5b505afa158015610a83573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610aa79190611e55565b610aaf610ec5565b9061183d565b8160060154105b15610acb576002915050610b1f565b600881015460ff1615610ae2576005915050610b1f565b610b09610aed610ee5565b610b03610af8610ebe565b60058501549061186d565b9061186d565b4310610b19576004915050610b1f565b60039150505b919050565b60408051808201909152601181527026a1a222ac1026281023b7bb32b93737b960791b60209091015260007f8cad95687ba82c2ce50e74f7b754645e5117c3a5bec8151c0726d5857980a8667f57bf0e8f910207a0bda11fc500387beb353e744a09505ddd5573e804eecf11d1610b996118ce565b30604051602001610bad94939291906120d8565b60405160208183030381529060405280519060200120905060007f8e25870c07e0b0b3884c78da52790939a455c275406c44ae8b434b692fb916ee8787604051602001610bfc939291906120fc565b60405160208183030381529060405280519060200120905060008282604051602001610c29929190612017565b604051602081830303815290604052805190602001209050600060018288888860405160008152602001604052604051610c669493929190612114565b6020604051602081039080840390855afa158015610c88573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b038116610cbb5760405162461bcd60e51b8152600401610866906121e8565b610cc6818a8a61133a565b505050505050505050565b600080546001600160a01b039384166001600160a01b03199182161790915560018054929093169116179055565b600154604051606091600091610d27916001600160a01b03169087908790879060200161205f565b60405160208183030381529060405280519060200120905082431015610d5f5760405162461bcd60e51b8152600401610866906122b1565b610d71610d6a610ee5565b849061186d565b431115610d905760405162461bcd60e51b8152600401610866906122d7565b6060855160001415610da3575083610dcf565b858051906020012085604051602001610dbd929190611fca565b60405160208183030381529060405290505b6001546040516000916060916001600160a01b0390911690610df2908590611ffb565b6000604051808303816000865af19150503d8060008114610e2f576040519150601f19603f3d011682016040523d82523d6000602084013e610e34565b606091505b509150915081610e565760405162461bcd60e51b815260040161086690612380565b6001546040516001600160a01b039091169085907f73bcadb73827ad9a900198359278e77086ae03e9e17ef173ad7de9e7e39acaff90610e9b908c908c908c90612187565b60405180910390a3979650505050505050565b662386f26fc1000090565b600a90565b6201518090565b668e1bc9bf04000090565b6001546001600160a01b031681565b60025481565b62093a8090565b7f8e25870c07e0b0b3884c78da52790939a455c275406c44ae8b434b692fb916ee81565b610f18611a04565b5060008281526003602090815260408083206001600160a01b03851684526009018252918290208251606081018452815460ff808216151583526101009091041615159281019290925260010154918101919091525b92915050565b610f7c610eb9565b84511115610f9c5760405162461bcd60e51b815260040161086690612402565b8251845114610fbd5760405162461bcd60e51b815260040161086690612402565b8151845114610fde5760405162461bcd60e51b815260040161086690612402565b8051845114610fff5760405162461bcd60e51b815260040161086690612402565b835160608167ffffffffffffffff8111801561101a57600080fd5b5060405190808252806020026020018201604052801561104e57816020015b60608152602001906001900390816110395790505b50905060005b828110156110ed5786818151811061106857fe5b602002602001015186828151811061107c57fe5b602002602001015186838151811061109057fe5b60200260200101518684815181106110a457fe5b60200260200101516040516020016110bf9493929190611faf565b6040516020818303038152906040528282815181106110da57fe5b6020908102919091010152600101611054565b5061114660405180606001604052806037815260200161266760379139826040518060400160405280601981526020017f73657450657270657475616c5269736b506172616d65746572000000000000008152506114d9565b50505050505050565b600361115a826109af565b600581111561116557fe5b146111825760405162461bcd60e51b815260040161086690612288565b600081815260036020526040812060088101805460ff19166001179055905b60038201548110156112fe57600282810180546040805160206001841615610100026000190190931694909404601f81018390048302850183019091528084526112f59392918301828280156112385780601f1061120d57610100808354040283529160200191611238565b820191906000526020600020905b81548152906001019060200180831161121b57829003601f168201915b505050505083600301838154811061124c57fe5b600091825260209182902001805460408051601f60026000196101006001871615020190941693909304928301859004850281018501909152818152928301828280156112da5780601f106112af576101008083540402835291602001916112da565b820191906000526020600020905b8154815290600101906020018083116112bd57829003601f168201915b505050505061037e6112ea610ebe565b60058701549061186d565b506001016111a1565b507f712ae1383f79ac853f8d882153778e0260ef8f03b504e2866e0593e04d2b291f8260405161132e91906120cf565b60405180910390a15050565b6001611345836109af565b600581111561135057fe5b1461136d5760405162461bcd60e51b8152600401610866906121bd565b60008281526003602090815260408083206001600160a01b038716845260098101909252909120805460ff16156113b65760405162461bcd60e51b815260040161086690612237565b6000805460048085015460405163782d6fe160e01b81526001600160a01b039093169263782d6fe1926113ed928b92909101612046565b60206040518083038186803b15801561140557600080fd5b505afa158015611419573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061143d9190611e55565b9050831561145e576006830154611454908261186d565b6006840155611473565b600783015461146d908261186d565b60078401555b8154600160ff19909116811761ff0019166101008615150217835582018190556040517f877856338e13f63d0c36822ff0ef736b80934cd90574a3a5bc9262c39d217c46906114c99088908890889086906120a7565b60405180910390a1505050505050565b60008054604080516318160ddd60e01b81529051611560926001600160a01b0316916318160ddd916004808301926020929190829003018186803b15801561152057600080fd5b505afa158015611534573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906115589190611e55565b610aaf610eae565b6000546001600160a01b031663782d6fe13361157d4360016118d2565b6040518363ffffffff1660e01b815260040161159a929190612046565b60206040518083038186803b1580156115b257600080fd5b505afa1580156115c6573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906115ea9190611e55565b116116075760405162461bcd60e51b8152600401610866906123a5565b82516116255760405162461bcd60e51b815260040161086690612496565b61162d610eb9565b8351111561164d5760405162461bcd60e51b81526004016108669061225e565b3360009081526004602052604090205480156116ca57600061166e826109af565b9050600181600581111561167e57fe5b141561169c5760405162461bcd60e51b815260040161086690612413565b60008160058111156116aa57fe5b14156116c85760405162461bcd60e51b8152600401610866906122fd565b505b60006116de6116d76109aa565b439061186d565b905060006116f46116ed610570565b839061186d565b60028054600190810180835560008181526003602090815260408083209384559290930180546001600160a01b0319163317905583548152208a5193945061174293920191908a0190611a24565b506002546000908152600360208181526040909220885161176b93919092019190890190611ab0565b50600280546000908152600360209081526040808320600490810187905584548452818420600501869055845484528184206006018490558454845281842060070184905584548452818420600801805460ff1916905593548084528184206001908101546001600160a01b0390811686529590935292819020839055905490517f80ad2ddbf67973e962717c563288d406470ed36c7d3842c8f30f2d5f7c90e25c93611827939233929116908c908c90899089908e906124df565b60405180910390a1505060025495945050505050565b6000670de0b6b3a764000061185e6706f05b59d3b20000610b038686611914565b8161186557fe5b049392505050565b6000828201838110156118c7576040805162461bcd60e51b815260206004820152601b60248201527f536166654d6174683a206164646974696f6e206f766572666c6f770000000000604482015290519081900360640190fd5b9392505050565b4690565b60006118c783836040518060400160405280601e81526020017f536166654d6174683a207375627472616374696f6e206f766572666c6f77000081525061196d565b60008261192357506000610f6e565b8282028284828161193057fe5b04146118c75760405162461bcd60e51b81526004018080602001828103825260218152602001806126466021913960400191505060405180910390fd5b600081848411156119fc5760405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b838110156119c15781810151838201526020016119a9565b50505050905090810190601f1680156119ee5780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b505050900390565b604080516060810182526000808252602082018190529181019190915290565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282611a5a5760008555611aa0565b82601f10611a7357805160ff1916838001178555611aa0565b82800160010185558215611aa0579182015b82811115611aa0578251825591602001919060010190611a85565b50611aac929150611b09565b5090565b828054828255906000526020600020908101928215611afd579160200282015b82811115611afd5782518051611aed918491602090910190611a24565b5091602001919060010190611ad0565b50611aac929150611b1e565b5b80821115611aac5760008155600101611b0a565b80821115611aac576000611b328282611b3b565b50600101611b1e565b50805460018160011615610100020316600290046000825580601f10611b615750611b7f565b601f016020900490600052602060002090810190611b7f9190611b09565b50565b80356001600160a01b0381168114610b1f57600080fd5b600082601f830112611ba9578081fd5b8135611bbc611bb7826125d2565b6125ae565b818152915060208083019084810181840286018201871015611bdd57600080fd5b60005b84811015611bfc57813584529282019290820190600101611be0565b505050505092915050565b80358015158114610b1f57600080fd5b600082601f830112611c27578081fd5b813567ffffffffffffffff811115611c3b57fe5b611c4e601f8201601f19166020016125ae565b9150808252836020828501011115611c6557600080fd5b8060208401602084013760009082016020015292915050565b600060208284031215611c8f578081fd5b6118c782611b82565b60008060408385031215611caa578081fd5b611cb383611b82565b9150611cc160208401611b82565b90509250929050565b60008060408385031215611cdc578182fd5b823567ffffffffffffffff80821115611cf3578384fd5b611cff86838701611b99565b93506020850135915080821115611d14578283fd5b50611d2185828601611b99565b9150509250929050565b60008060008060808587031215611d40578182fd5b843567ffffffffffffffff80821115611d57578384fd5b611d6388838901611b99565b95506020870135915080821115611d78578384fd5b611d8488838901611b99565b94506040870135915080821115611d99578384fd5b611da588838901611b99565b93506060870135915080821115611dba578283fd5b50611dc787828801611b99565b91505092959194509250565b600080600060608486031215611de7578283fd5b833567ffffffffffffffff80821115611dfe578485fd5b611e0a87838801611c17565b94506020860135915080821115611e1f578384fd5b50611e2c86828701611c17565b925050604084013590509250925092565b600060208284031215611e4e578081fd5b5035919050565b600060208284031215611e66578081fd5b5051919050565b60008060408385031215611e7f578182fd5b82359150611cc160208401611b82565b60008060408385031215611ea1578182fd5b82359150611cc160208401611c07565b600080600080600060a08688031215611ec8578081fd5b85359450611ed860208701611c07565b9350604086013560ff81168114611eed578182fd5b94979396509394606081013594506080013592915050565b6000815180845260208085018081965082840281019150828601855b85811015611f4b578284038952611f39848351611f58565b98850198935090840190600101611f21565b5091979650505050505050565b60008151808452611f708160208601602086016125f0565b601f01601f19169290920160200192915050565b60609190911b6bffffffffffffffffffffffff1916815260140190565b918252602082015260400190565b93845260208401929092526040830152606082015260800190565b6001600160e01b0319831681528151600090611fed8160048501602087016125f0565b919091016004019392505050565b6000825161200d8184602087016125f0565b9190910192915050565b61190160f01b81526002810192909252602282015260420190565b6001600160a01b0391909116815260200190565b6001600160a01b03929092168252602082015260400190565b6001600160a01b038516815260806020820181905260009061208390830186611f58565b82810360408401526120958186611f58565b91505082606083015295945050505050565b6001600160a01b03949094168452602084019290925215156040830152606082015260800190565b90815260200190565b938452602084019290925260408301526001600160a01b0316606082015260800190565b92835260208301919091521515604082015260600190565b93845260ff9290921660208401526040830152606082015260800190565b6000602082526118c76020830184611f58565b602081016006831061215357fe5b91905290565b60006040825261216c6040830185611f58565b828103602084015261217e8185611f05565b95945050505050565b60006060825261219a6060830186611f58565b82810360208401526121ac8186611f58565b915050826040830152949350505050565b602080825260119082015270766f74696e67206e6f742061637469766560781b604082015260600190565b602080825260119082015270696e76616c6964207369676e617475726560781b604082015260600190565b6020808252600a90820152691a5b9d985b1a59081a5960b21b604082015260600190565b6020808252600d908201526c185b1c9958591e481d9bdd1959609a1b604082015260600190565b60208082526010908201526f746f6f206d616e7920616374696f6e7360801b604082015260600190565b6020808252600f908201526e1c1c9bdc1bdcd85b0819985a5b1959608a1b604082015260600190565b6020808252600c908201526b1d1e081a5cc81b1bd8dad95960a21b604082015260600190565b6020808252600c908201526b3a3c1034b99039ba30b6329760a11b604082015260600190565b60208082526059908201527f476f7665726e6f72416c7068613a3a70726f706f73653a206f6e65206c69766560408201527f2070726f706f73616c207065722070726f706f7365722c20666f756e6420616e60608201527f20616c72656164792070656e64696e672070726f706f73616c00000000000000608082015260a00190565b6020808252600b908201526a1d1e081c995d995c9d195960aa1b604082015260600190565b6020808252603f908201527f476f7665726e6f72416c7068613a3a70726f706f73653a2070726f706f73657260408201527f20766f7465732062656c6f772070726f706f73616c207468726573686f6c6400606082015260800190565b602080825260009082015260400190565b60208082526058908201527f476f7665726e6f72416c7068613a3a70726f706f73653a206f6e65206c69766560408201527f2070726f706f73616c207065722070726f706f7365722c20666f756e6420616e60608201527f20616c7265616479206163746976652070726f706f73616c0000000000000000608082015260a00190565b6020808252600a90820152696e6f20616374696f6e7360b01b604082015260600190565b8151151581526020808301511515908201526040918201519181019190915260600190565b8881526001600160a01b038881166020830152871660408201526101006060820181905260009061251283820189611f58565b905082810360808401526125268188611f05565b90508560a08401528460c084015282810360e08401526125468185611f58565b9b9a5050505050505050505050565b8881526001600160a01b0388166020820152610100604082018190526000906125808382018a611f58565b60608401989098525050608081019490945260a084019290925260c0830152151560e0909101529392505050565b60405181810167ffffffffffffffff811182821017156125ca57fe5b604052919050565b600067ffffffffffffffff8211156125e657fe5b5060209081020190565b60005b8381101561260b5781810151838201526020016125f3565b8381111561261a576000848401525b5050505056fe73657450657270657475616c506172616d6574657228627974657333322c696e7432353629536166654d6174683a206d756c7469706c69636174696f6e206f766572666c6f7773657450657270657475616c5269736b506172616d6574657228627974657333322c696e743235362c696e743235362c696e7432353629a26469706673582212208d0a1dc871e3676f4f50bc6943cea858e2c4cdad2ee4e7dd477f2c00d9ddb3e564736f6c63430007040033";
