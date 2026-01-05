/**
 * Accessibility Utilities
 * Helper functions for accessibility improvements
 */

/**
 * Re-export SkipLinks component from ui directory
 * This component is now defined in src/components/ui/SkipLinks.tsx
 */
export { SkipLinks } from '../components/ui/SkipLinks';

/**
 * Generate ARIA labels for plugin actions
 */
export const getAriaLabel = (action: string, pluginName: string): string => {
  const labels: Record<string, string> = {
    enable: `启用插件 ${pluginName}`,
    disable: `禁用插件 ${pluginName}`,
    uninstall: `卸载插件 ${pluginName}`,
    select: `选择插件 ${pluginName}`,
    view_details: `查看 ${pluginName} 详情`,
  };
  return labels[action] || `${action} ${pluginName}`;
};

/**
 * Generate ARIA descriptions for plugin states
 */
export const getAriaDescription = (plugin: any): string => {
  const parts: string[] = [];

  if (plugin.enabled) {
    parts.push('状态: 已启用');
  } else {
    parts.push('状态: 已禁用');
  }

  if (plugin.health?.status) {
    const statusMap: Record<string, string> = {
      healthy: '健康',
      warning: '警告',
      error: '错误',
      unknown: '未知',
    };
    parts.push(`健康: ${statusMap[plugin.health.status] || plugin.health.status}`);
  }

  if (plugin.manifest?.version) {
    parts.push(`版本: ${plugin.manifest.version}`);
  }

  return parts.join(', ');
};

/**
 * Keyboard navigation keys
 */
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_DOWN: 'ArrowDown',
  ARROW_UP: 'ArrowUp',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  TAB: 'Tab',
} as const;

/**
 * Check if key press is a keyboard navigation command
 */
export const isNavigationKey = (key: string): boolean => {
  return Object.values(KEYBOARD_KEYS).includes(key as any);
};

/**
 * Get focus trap configuration
 */
export const createFocusTrap = (containerRef: React.RefObject<HTMLElement>) => {
  return {
    activate: () => {
      const container = containerRef.current;
      if (!container) return;

      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (firstElement) {
        firstElement.focus();
      }

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      container.addEventListener('keydown', handleTabKey);

      return () => {
        container.removeEventListener('keydown', handleTabKey);
      };
    },
  };
};

/**
 * Announce to screen readers
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';

  document.body.appendChild(announcement);
  announcement.textContent = message;

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};
