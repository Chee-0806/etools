/**
 * NotificationSystem Component
 * Display toast/alert notifications for plugin operations
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { usePluginState, usePluginDispatch } from '../../services/pluginStateStore';
import type { PluginNotification } from '../../types/plugin';
import './NotificationSystem.css';

/**
 * NotificationSystem Component
 */
const NotificationSystem: React.FC = () => {
  const dispatch = usePluginDispatch();
  const state = usePluginState();
  const { notifications } = state;
  const processedIds = useRef<Set<string>>(new Set());

  /**
   * Dismiss notification on close button click
   */
  const handleDismiss = useCallback((notificationId: string) => {
    dispatch({
      type: 'DISMISS_NOTIFICATION',
      payload: notificationId,
    });
  }, [dispatch]);

  /**
   * Set up auto-dismiss for new notifications
   */
  useEffect(() => {
    notifications.forEach((notification) => {
      // Only process new notifications
      if (!processedIds.current.has(notification.id)) {
        // Mark as processed
        processedIds.current.add(notification.id);

        // Only auto-dismiss if duration is not explicitly set to 0
        if (notification.duration !== 0) {
          const duration = notification.duration ?? 5000; // default 5 seconds

          setTimeout(() => {
            dispatch({
              type: 'DISMISS_NOTIFICATION',
              payload: notification.id,
            });
          }, duration);
        }
      }
    });

    // Clean up processed IDs for removed notifications
    const currentIds = new Set(notifications.map((n) => n.id));
    processedIds.current = new Set([...processedIds.current].filter((id) => currentIds.has(id)));
  }, [notifications, dispatch]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-system">
      <div className="notification-container" role="alert" aria-live="polite">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * NotificationItem Component
 */
interface NotificationItemProps {
  notification: PluginNotification;
  onDismiss: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onDismiss,
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  };

  return (
    <div
      className={`notification-item notification-${notification.type}`}
      role="alert"
      aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="notification-icon">{getIcon()}</div>
      <div className="notification-content">
        {notification.title && (
          <h4 className="notification-title">{notification.title}</h4>
        )}
        {notification.message && (
          <p className="notification-message">{notification.message}</p>
        )}
      </div>
      <button
        className="notification-close"
        onClick={() => onDismiss(notification.id)}
        aria-label="关闭通知"
      >
        ✕
      </button>
    </div>
  );
};

export default NotificationSystem;
