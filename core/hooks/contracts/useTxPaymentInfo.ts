import { useCallback, useState } from 'react';
import { ContractOptions, ContractPromise } from '../../types/mod.ts';
import { useWallet } from '../wallets/useWallet.ts';
import { RuntimeDispatchInfo, SignerOptions } from '../../types/substrate.ts';

type Send = (
  options?: ContractOptions,
  params?: unknown[],
  signerOptions?: Partial<SignerOptions>,
) => Promise<RuntimeDispatchInfo | undefined>;

interface TxPaymentInfo {
  isSubmitting: boolean;
  result?: RuntimeDispatchInfo;
  send: Send;
  resolved: boolean;
}

export function useTxPaymentInfo(
  contract: ContractPromise | undefined,
  message: string,
): TxPaymentInfo {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<RuntimeDispatchInfo>();
  const { account } = useWallet();

  const send = useCallback<Send>(async (options, params, signerOptions) => {
    const tx = contract?.tx?.[message];
    if (!tx || !account) return;

    try {
      setIsSubmitting(true);

      const requiresNoArguments = tx.meta.args.length === 0;
      const paymentInfoResult = await (requiresNoArguments
        ? tx(options || {})
        : tx(options || {}, params))
        .paymentInfo(account.address, signerOptions);

      setResult(paymentInfoResult);
      setIsSubmitting(false);

      return paymentInfoResult;
    } catch (e: unknown) {
      console.error(e);
      setIsSubmitting(false);
      return;
    }
  }, [contract, message, account]);

  return {
    isSubmitting,
    resolved: Boolean(!isSubmitting && result),
    result,
    send,
  };
}
