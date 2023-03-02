import { ContractPromise } from '@polkadot/api-contract';
import BN from 'bn.js';
import {
  AbiMessage,
  AccountId,
  ContractExecResult,
  ContractOptions,
} from '../../types/mod.ts';

export async function callRaw<T>(
  contract: ContractPromise,
  abiMessage: AbiMessage,
  caller: AccountId | undefined,
  args = [] as unknown[],
  options?: ContractOptions,
): Promise<ContractExecResult | undefined> {
  const { value, gasLimit, storageDepositLimit } = options || {};

  const { call } = contract.api.call.contractsApi || {};
  if (!call) return undefined;

  return await call<ContractExecResult>(
    caller,
    contract.address,
    value ?? new BN(0),
    gasLimit ?? null,
    storageDepositLimit ?? null,
    abiMessage.toU8a(args),
  );
}
