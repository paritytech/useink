import { ContractPromise } from '@polkadot/api-contract';
import {
  AbiMessage,
  AccountId,
  ContractExecResultDecoded,
  Result,
} from '../../types/mod.ts';
import { callRaw } from './callRaw.ts';
import { decodeContractExecResult } from './decodeContractExecResult.ts';

export async function callContract<T>(
  contract: ContractPromise,
  abiMessage: AbiMessage,
  caller: AccountId,
  args = [] as unknown[],
): Promise<Result<ContractExecResultDecoded<T>, string>> {
  const raw = await callRaw(contract, abiMessage, caller, args);

  if (!raw) {
    return {
      ok: false,
      error: 'No response',
    };
  }

  const decoded = decodeContractExecResult<T>(
    raw.result,
    abiMessage,
    contract.abi.registry,
  );
  if (!decoded.ok) return decoded;

  const { gasConsumed, gasRequired, storageDeposit } = raw;

  return {
    ok: true,
    value: {
      gasConsumed,
      gasRequired,
      storageDeposit,
      decodedResult: decoded.value,
      rawResult: raw.result
    },
  };
}
