import {

  LIT_NETWORKS,
} from './constants/constants';
import { AccsCOSMOSParams, AccsDefaultParams, AccsEVMParams, AccsOperatorParams, AccsRegularParams, AccsSOLV2Params, JsonEncryptionRetrieveRequest, JsonExecutionRequest, JsonSignChainDataRequest, JsonSigningRetrieveRequest } from './interfaces/interfaces';

export type AccessControlConditions = AccsRegularParams[] | AccsDefaultParams[];

export type EvmContractConditions = AccsEVMParams[];
export type SolRpcConditions = AccsSOLV2Params[];
export type UnifiedAccessControlConditions =
  | AccsRegularParams[]
  | AccsDefaultParams[]
  | AccsEVMParams[]
  | AccsSOLV2Params[]
  | AccsCOSMOSParams[];

export type JsonRequest = JsonExecutionRequest | JsonSignChainDataRequest;

export type SupportedJsonRequests =
  | JsonSigningRetrieveRequest
  | JsonEncryptionRetrieveRequest;

export type Chain = string;

/**
 *
 * The default required properties of all chains
 *
 * @typedef { Object } LITChainRequiredProps
 */
export type LITChainRequiredProps = {
  name: string;
  symbol: string;
  decimals: number;
  rpcUrls: Array<String>;
  blockExplorerUrls: Array<String>;
  vmType: string;
};

/**
 * @typedef { Object } LITEVMChain
 * @property { string } contractAddress - The address of the token contract for the optional predeployed ERC1155 contract.  Only present on EVM chains.
 * @property { string } chainId - The chain ID of the chain that this token contract is deployed on.  Used for EVM chains.
 * @property { string } name - The human readable name of the chain
 */
export type LITEVMChain = LITChainRequiredProps & {
  contractAddress: string | null;
  chainId: number;
  type: string | null;
};

/**
 * @typedef { Object } LITSVMChain
 */
export type LITSVMChain = LITChainRequiredProps;

/**
 * @typedef { Object } LITCosmosChain
 * @property {string} chainId - The chain ID of the chain that this token contract is deployed on.  Used for Cosmos chains.
 */
export type LITCosmosChain = LITChainRequiredProps & {
  chainId: string;
};

/**
 * @typedef {Object} LITChain
 * @property {string} vmType - Either EVM for an Ethereum compatible chain or SVM for a Solana compatible chain
 * @property {string} name - The human readable name of the chain
 */
export type LITChain<T> = {
  [chainName: string]: T;
};

export type LIT_NETWORKS_KEYS = keyof typeof LIT_NETWORKS;

export type ConditionType = 'solRpc' | 'evmBasic' | 'evmContract' | 'cosmos';

// union type for all the different types of conditions
export type ConditionItem = (AccsOperatorParams | AccsRegularParams | AccsDefaultParams | AccsSOLV2Params);
