import { useContext, useMemo } from 'react';
import { getExpiredItem } from '../../core/mod.ts';
import { NotificationsContext } from '../context.ts';
import { HALF_A_SECOND } from '../../core/constants.ts';
import {
  AddNotificationPayload,
  Notification,
  Notifications,
} from '../model.ts';
import { useInterval } from '../../core/hooks/internal/mod.ts';

export interface UseNotifications {
  notifications: Notifications;
  addNotification: (payload: AddNotificationPayload) => void;
  removeNotification: (notificationId: string) => void;
}

export const useNotifications = (): UseNotifications => {
  const { addNotification, notifications, removeNotification, config } =
    useContext(
      NotificationsContext,
    );

  const chainNotifications = useMemo(() => {
    return notifications ?? [];
  }, [notifications]);

  useInterval(() => {
    if (config?.expiration === 0) return;

    const expiredNotifications = getExpiredItem<Notification>(
      chainNotifications,
      config?.expiration,
    );
    for (const notification of expiredNotifications) {
      removeNotification(notification.id);
    }
  }, config?.checkInterval || HALF_A_SECOND);

  return {
    notifications: chainNotifications,
    addNotification,
    removeNotification,
  };
};
