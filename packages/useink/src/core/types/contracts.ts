import { Result } from './result.ts';
import { AbiMessage } from '@polkadot/api-contract/types';
import {
  Balance,
  ContractExecResult,
  DispatchError,
  StorageDeposit,
  Weight,
} from '@polkadot/types/interfaces';

export type {
  ContractExecResult,
  ContractExecResultResult,
} from '@polkadot/types/interfaces';
export type { AbiMessage, ContractOptions } from '@polkadot/api-contract/types';
export { Abi, ContractPromise } from '@polkadot/api-contract';
export { ContractSubmittableResult } from '@polkadot/api-contract/base/contract';

export interface ContractCallResultRaw {
  readonly callResult: ContractExecResult;
  readonly abiMessage: AbiMessage;
}

export interface CallInfo {
  gasRequired: Weight;
  gasConsumed: Weight;
  storageDeposit: StorageDeposit;
}

export interface TxInfo {
  gasRequired: Weight;
  gasConsumed: Weight;
  storageDeposit: StorageDeposit;
  partialFee: Balance;
}

export interface ContractExecResultDecoded<T>
  extends Omit<TxInfo, 'partialFee'> {
  readonly decoded: T;
  readonly raw: ContractExecResult;
}

export interface TxExecResultDecoded<T> extends TxInfo {
  readonly decoded: T;
  readonly raw: ContractExecResult;
}

export type DecodedResult<T> = Result<T, DispatchError>;

export type DecodedContractResult<T> = DecodedResult<
  ContractExecResultDecoded<T>
>;

export type DecodedTxResult<T> = DecodedResult<TxExecResultDecoded<T>>;
