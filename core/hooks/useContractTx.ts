import { ContractPromise } from '@polkadot/api-contract';
import { useMemo, useState } from 'react';
import { ContractSubmittableResult } from '../types/mod.ts';
import {
  ContractExecResultResult,
  ContractOptions,
  ContractTxFunc,
  Status,
} from '../types/mod.ts';
import { callRaw, toRegistryErrorDecoded } from '../utils/mod.ts';
import { useAbiMessage } from './useAbiMessage.ts';
import { useExtension } from './useExtension.ts';
import { useNotifications } from './useNotifications.ts';

export type NotificationMessageHandler = (
  result: ContractExecResultResult,
) => string;

export interface ContractTxConfig {
  notifications?:
    & Partial<Record<Status, NotificationMessageHandler>>
    & Partial<{
      None: () => string;
      PendingSignature: () => string;
    }>;
  notificationErrorHandler?: (e?: unknown) => string;
}

export function useContractTx(
  contract: ContractPromise | undefined,
  message: string,
  config?: ContractTxConfig,
): ContractTxFunc {
  const { account, extension } = useExtension();
  const { addNotification } = useNotifications();
  const [status, setStatus] = useState<Status>('None');
  const [result, setResult] = useState<ContractSubmittableResult>();
  const [error, setError] = useState<string | null>(null);
  const abiMessage = useAbiMessage(contract, message);
  const { notificationErrorHandler } = config || {};

  const send: (args: unknown[], o?: ContractOptions) => void = useMemo(
    () => (args, options) => {
      if (!account || !contract || !extension || !abiMessage) return;

      error && setError(null);

      setStatus('PendingSignature');
      config?.notifications?.PendingSignature &&
        addNotification({
          notification: {
            type: 'PendingSignature',
            message: config.notifications.PendingSignature(),
          },
        });

      callRaw(
        contract,
        abiMessage,
        account.address,
        args,
        options,
      )
        .then((response) => {
          if (!response) {
            console.error('undefined response');
            return;
          }

          const { gasRequired, result } = response;

          try {
            const dispatchError = toRegistryErrorDecoded(
              contract.abi.registry,
              result,
            );

            if (result.isErr && dispatchError) {
              setError(dispatchError.docs.join(', '));
              console.error('dispatch error', dispatchError);

              config?.notificationErrorHandler &&
                addNotification({
                  notification: {
                    type: 'Errored',
                    message: config.notificationErrorHandler(dispatchError),
                  },
                });

              return;
            }
          } catch (e) {
            console.error('errored', e);
          }

          const contractTx = contract.tx[message];

          if (!contractTx) {
            console.error(`'${message}' not found on contract instance`);
          }

          contractTx && contractTx(
            { gasLimit: gasRequired, ...(options || {}) },
            ...args,
          )
            .signAndSend(
              account.address,
              { signer: extension.signer },
              (response: ContractSubmittableResult) => {
                setResult(response);
                setStatus(response.status.type);

                const notificationMessageHandler = config?.notifications
                  ?.[response.status.type];

                notificationMessageHandler &&
                  addNotification({
                    notification: {
                      type: response.status.type,
                      message: notificationMessageHandler(result),
                    },
                  });
              },
            )
            .catch((e: unknown) => {
              setStatus('None');
              const err = JSON.stringify(e);
              const message = err === '{}'
                ? (config?.notificationErrorHandler
                  ? config.notificationErrorHandler(e)
                  : 'Something went wrong')
                : err;
              setError(message);
              console.error('tx error', message);

              notificationErrorHandler &&
                addNotification({
                  notification: {
                    type: 'Errored',
                    message,
                  },
                });
            });
        })
        .catch((e) => {
          setStatus('None');
          const err = JSON.stringify(e);

          const message = err === '{}'
            ? (notificationErrorHandler
              ? notificationErrorHandler(e)
              : 'Something went wrong')
            : err;
          setError(message);

          console.log('raw-error', e);
          console.error('pre-flight error:', message);

          notificationErrorHandler &&
            addNotification({
              notification: {
                type: 'Errored',
                message,
              },
            });
        });
    },
    [account, extension, contract, abiMessage],
  );

  return {
    send,
    status,
    error,
    result,
    resetState: () => {
      setStatus('None');
      setError(null);
    },
  };
}
