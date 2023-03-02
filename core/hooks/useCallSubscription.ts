import { ContractPromise } from '@polkadot/api-contract';
import { useEffect, } from 'react';
import { ContractOptions } from '../types/mod.ts';
import { useBlockHeader } from "./substrate/useBlockHeader.ts";
import { useCall, UseCallResponse } from './useCall.ts';

export function useCallSubscription<T>(
  contract: ContractPromise | undefined,
  message: string,
  args = [] as unknown[],
  options?: ContractOptions,
  caller?: string,
): Omit<UseCallResponse<T>, 'send'> {
  const call = useCall<T>(contract, message);
  const { blockNumber } = useBlockHeader();

  useEffect(() => {
    call.send(args, options, caller);
  }, [blockNumber, args, options, caller]);

  return call;
}