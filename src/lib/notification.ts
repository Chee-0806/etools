/**
 * Simple notification utility for showing toast messages
 */

// ============================================================================
// Constants
// ============================================================================

/** Element ID for notification styles */
const NOTIFICATION_STYLES_ID = 'notification-styles';

/** Animation names */
const ANIMATION = {
  slideIn: 'notificationSlideIn',
  slideOut: 'notificationSlideOut',
} as const;

/** Notification colors by type */
const COLORS: Record<NotificationType, string> = {
  success: '#10b981',
  error: '#ef4444',
} as const;

/** Default notification duration in milliseconds */
const DEFAULT_DURATION = 2000;

/** Animation duration in milliseconds */
const ANIMATION_DURATION = 300;

/** CSS styles for notification element */
const NOTIFICATION_STYLES = `
  position: fixed;
  top: 20px;
  right: 20px;
  background: {COLOR};
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  font-size: 14px;
  font-family: system-ui, -apple-system, sans-serif;
  animation: ${ANIMATION.slideIn} 0.3s ease-out;
`;

/** Keyframe CSS for animations */
const KEYFRAME_CSS = `
  @keyframes ${ANIMATION.slideIn} {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes ${ANIMATION.slideOut} {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;

// ============================================================================
// Types
// ============================================================================

/**
 * Notification type
 */
export type NotificationType = 'success' | 'error';

/**
 * Notification options
 */
export interface NotificationOptions {
  message: string;
  type?: NotificationType;
  duration?: number;
}

// ============================================================================
// Style Management
// ============================================================================

/**
 * Check if notification styles are already injected
 */
function hasStyles(): boolean {
  return document.getElementById(NOTIFICATION_STYLES_ID) !== null;
}

/**
 * Inject animation styles if not already present
 */
function injectStyles(): void {
  if (hasStyles()) return;

  const style = document.createElement('style');
  style.id = NOTIFICATION_STYLES_ID;
  style.textContent = KEYFRAME_CSS;
  document.head.appendChild(style);
}

/**
 * Get CSS for notification element with color placeholder replaced
 */
function getNotificationCss(type: NotificationType): string {
  return NOTIFICATION_STYLES.replace('{COLOR}', COLORS[type]);
}

// ============================================================================
// Notification Functions
// ============================================================================

/**
 * Create notification DOM element
 */
function createNotificationElement(message: string, type: NotificationType): HTMLElement {
  const notification = document.createElement('div');
  notification.className = `plugin-notification plugin-notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = getNotificationCss(type);
  return notification;
}

/**
 * Show notification and schedule removal
 */
function showAndScheduleRemoval(
  notification: HTMLElement,
  duration: number
): void {
  document.body.appendChild(notification);

  // Schedule removal
  setTimeout(() => {
    notification.style.animation = `${ANIMATION.slideOut} ${ANIMATION_DURATION / 1000}s ease-out`;
    setTimeout(() => notification.remove(), ANIMATION_DURATION);
  }, duration);
}

/**
 * Show a temporary notification toast
 *
 * @param message - Message to display
 * @param type - Notification type (success or error)
 * @param duration - Duration in milliseconds (default: 2000)
 */
export function showNotification(
  message: string,
  type: NotificationType = 'success',
  duration: number = DEFAULT_DURATION
): void {
  injectStyles();

  const notification = createNotificationElement(message, type);
  showAndScheduleRemoval(notification, duration);
}

/**
 * Show success notification
 */
export function showSuccessNotification(message: string, duration?: number): void {
  showNotification(message, 'success', duration);
}

/**
 * Show error notification
 */
export function showErrorNotification(message: string, duration?: number): void {
  showNotification(message, 'error', duration);
}
