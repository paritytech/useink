import { ContractPromise } from '@polkadot/api-contract';
import { useCallback, useMemo, useState } from 'react';
import { callRaw } from '../utils/mod.ts';
import {
  ContractExecResult,
  ContractExecResultDecoded,
  ContractOptions,
  Result,
} from '../types/mod.ts';
import { decodeContractExecResult } from '../utils/mod.ts';
import { useAbiMessage } from './useAbiMessage.ts';
import { useExtension } from './useExtension.ts';

export type CallSend = (
  args?: unknown[],
  options?: ContractOptions,
  caller?: string,
) => void;

export interface UseCall {
  send: CallSend;
  isSubmitting: boolean;
}

export enum CallError {
  ContractUndefined = 'Contract is undefined',
  InvalidAbiMessage = 'Invalid ABI Message',
  NoResponse = 'No response',
}

export type UseCallResponse<T> =
  & UseCall
  & Result<ContractExecResultDecoded<T>, CallError | string>;

export function useCall<T>(
  contract: ContractPromise | undefined,
  message: string,
): UseCallResponse<T> {
  const [raw, setRaw] = useState<ContractExecResult>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const abiMessage = useAbiMessage(contract, message);
  const { account } = useExtension();

  const send = useCallback<CallSend>((args, options, caller) => {
    if (!abiMessage || !contract) return;

    setIsSubmitting(true);

    callRaw(
      contract,
      abiMessage,
      caller || account?.address,
      args,
      options,
    )
      .then(setRaw)
      .catch(console.error)
      .finally(() => setIsSubmitting(false));
  }, [account, abiMessage]);

  if (!abiMessage) {
    return {
      ok: false,
      error: CallError.InvalidAbiMessage,
      send,
      isSubmitting,
    };
  }
  if (!raw) {
    return { ok: false, error: CallError.NoResponse, send, isSubmitting };
  }
  if (!contract) {
    return {
      ok: false,
      error: CallError.ContractUndefined,
      send,
      isSubmitting,
    };
  }

  return useMemo(() => {
    const decodedResult = decodeContractExecResult<T>(
      raw.result,
      abiMessage,
      contract.abi.registry,
    );
    if (!decodedResult.ok) return { ...decodedResult, send, isSubmitting };

    const { gasConsumed, gasRequired, storageDeposit } = raw;

    return {
      ok: true,
      value: {
        gasConsumed,
        gasRequired,
        storageDeposit,
        rawResult: raw.result,
        decodedResult: decodedResult.value,
      },
      isSubmitting,
      send,
    };
  }, [raw]);
}
