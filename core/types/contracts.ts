import { AbiMessage, ContractOptions } from '@polkadot/api-contract/types';
import { ContractExecResult, ContractExecResultResult } from '@polkadot/types/interfaces';
import { ContractSubmittableResult } from './mod.ts';
import { Result } from './result.ts';
import { Status, StorageDeposit, Weight } from './substrate.ts';

export type {
  ContractExecResult,
  ContractExecResultResult,
} from '@polkadot/types/interfaces';
export type { AbiMessage, ContractOptions } from '@polkadot/api-contract/types';
export type { ContractSubmittableResult } from '@polkadot/api-contract/base/contract';

export type AccountId = string;

export type DecodedResult<T> = Result<T, string>;

export interface ContractCallResultRaw {
  readonly callResult: ContractExecResult;
  readonly abiMessage: AbiMessage;
}

export interface ContractExecResultDecoded<T> {
  readonly gasConsumed: Weight;
  readonly gasRequired: Weight;
  readonly storageDeposit: StorageDeposit;
  readonly decodedResult: T;
  readonly rawResult: ContractExecResultResult;
}

export type ContractTxFunc = {
  send: (args: unknown[], options?: ContractOptions) => any;
  status: Status;
  error?: string | null;
  result: ContractSubmittableResult | undefined;
  resetState: () => void;
};
