import { useEffect } from 'react';
import { Tx } from '../../mod.ts';
import { useNotifications } from './useNotifications.ts';
import { ChainId } from '../../chains/types.ts';

export function useTxNotifications<T>(tx: Tx<T>, chain?: ChainId): void {
  const { addNotification } = useNotifications();

  useEffect(() => {
    addNotification({
      type: tx.status,
      message: tx.status,
      result: tx.result,
      chain,
    });
  }, [tx.status]);
}