/**
 * useKeyboardShortcuts Hook
 * Handle keyboard shortcuts for plugin manager
 *
 * Provides comprehensive keyboard shortcut management with:
 * - Cross-platform support (Mac/Windows/Linux)
 * - Accessibility integration (screen reader announcements)
 * - Input field awareness (ignores shortcuts when typing)
 * - Help display for available shortcuts
 */

import { useEffect, useRef } from 'react';
import { announceToScreenReader } from '../lib/accessibility';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: () => void;
  description: string;
  label?: string;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: ShortcutConfig[];
  enabled?: boolean;
  onShortcutTriggered?: (shortcut: ShortcutConfig) => void;
}

// Detect platform
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

/**
 * Default plugin management shortcuts
 */
export const DEFAULT_PLUGIN_SHORTCUTS: Omit<ShortcutConfig, 'handler'>[] = [
  {
    key: 'f',
    ctrlKey: true,
    label: '聚焦搜索框',
    description: '快速聚焦到插件搜索框',
  },
  {
    key: 'a',
    ctrlKey: true,
    label: '全选插件',
    description: '选择当前列表中的所有插件',
  },
  {
    key: 'e',
    ctrlKey: true,
    label: '切换选择模式',
    description: '启用或禁用批量选择模式',
  },
  {
    key: 'Delete',
    label: '卸载选中',
    description: '卸载当前选中的插件',
  },
  {
    key: 'e',
    ctrlKey: true,
    shiftKey: true,
    label: '启用插件',
    description: '启用当前选中的插件',
  },
  {
    key: 'd',
    ctrlKey: true,
    shiftKey: true,
    label: '禁用插件',
    description: '禁用当前选中的插件',
  },
  {
    key: 'r',
    ctrlKey: true,
    label: '刷新列表',
    description: '刷新插件列表',
  },
  {
    key: 'ArrowDown',
    label: '向下导航',
    description: '移动到下一个插件',
  },
  {
    key: 'ArrowUp',
    label: '向上导航',
    description: '移动到上一个插件',
  },
  {
    key: 'i',
    ctrlKey: true,
    label: '安装插件',
    description: '切换到安装插件视图',
  },
  {
    key: 'Escape',
    label: '取消选择',
    description: '取消当前选择或关闭对话框',
  },
];

export const useKeyboardShortcuts = ({
  shortcuts,
  enabled = true,
  onShortcutTriggered,
}: UseKeyboardShortcutsOptions) => {
  const handlersRef = useRef<Map<string, ShortcutConfig>>(new Map());

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Build handler map with cross-platform support
    const handlerMap = new Map<string, ShortcutConfig>();
    shortcuts.forEach((shortcut) => {
      // Skip disabled shortcuts
      if (shortcut.enabled === false) return;

      // For Mac, use metaKey; for others, use ctrlKey
      const keysToRegister: ShortcutConfig[] = [shortcut];

      // If shortcut uses metaKey, also register ctrlKey for non-Mac (and vice versa)
      if (shortcut.metaKey && !isMac) {
        keysToRegister.push({ ...shortcut, metaKey: false, ctrlKey: true });
      } else if (shortcut.ctrlKey && isMac) {
        keysToRegister.push({ ...shortcut, ctrlKey: false, metaKey: true });
      }

      keysToRegister.forEach((s) => {
        const key = buildShortcutKey(s);
        handlerMap.set(key, s);
        handlersRef.current.set(key, s);
      });
    });

    // Handle keyboard events
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      // Ignore shortcuts in input fields, textareas, and contenteditable elements
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = buildShortcutKey({
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
      });

      const shortcutConfig = handlerMap.get(key);
      if (shortcutConfig) {
        event.preventDefault();
        event.stopPropagation();

        // Execute handler
        shortcutConfig.handler();

        // Announce to screen reader
        const label = shortcutConfig.label || shortcutConfig.description;
        announceToScreenReader(`${label}`);

        // Trigger callback
        onShortcutTriggered?.(shortcutConfig);
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      handlersRef.current.clear();
    };
  }, [shortcuts, enabled, onShortcutTriggered]);

  /**
   * Get enabled shortcuts for help display
   */
  const getEnabledShortcuts = () => {
    return shortcuts
      .filter((s) => s.enabled !== false)
      .map((s) => ({
        keys: buildShortcutDisplay(s),
        label: s.label || s.description,
        description: s.description,
      }));
  };

  /**
   * Get shortcuts by category
   */
  const getShortcutsByCategory = () => {
    const enabled = getEnabledShortcuts();
    const categories: Record<string, typeof enabled> = {
      navigation: [],
      selection: [],
      actions: [],
      view: [],
    };

    for (const shortcut of enabled) {
      const desc = shortcut.description.toLowerCase();

      if (desc.includes('导航') || desc.includes('移动')) {
        categories.navigation.push(shortcut);
      } else if (
        desc.includes('选择') ||
        desc.includes('取消')
      ) {
        categories.selection.push(shortcut);
      } else if (
        desc.includes('启用') ||
        desc.includes('禁用') ||
        desc.includes('卸载') ||
        desc.includes('刷新')
      ) {
        categories.actions.push(shortcut);
      } else {
        categories.view.push(shortcut);
      }
    }

    return categories;
  };

  return {
    shortcuts: getEnabledShortcuts(),
    getShortcutsByCategory,
  };
};

/**
 * Build a unique key for the shortcut combination
 */
function buildShortcutKey(shortcut: {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}): string {
  const parts: string[] = [];

  if (shortcut.ctrlKey) parts.push('ctrl');
  if (shortcut.metaKey) parts.push('meta');
  if (shortcut.shiftKey) parts.push('shift');
  if (shortcut.altKey) parts.push('alt');

  parts.push(shortcut.key.toLowerCase());

  return parts.join('+');
}

/**
 * Build display string for shortcut (e.g., "⌘A" or "Ctrl+A")
 */
function buildShortcutDisplay(shortcut: ShortcutConfig): string {
  const parts: string[] = [];

  // Display the correct modifier for the platform
  const displayMetaKey = shortcut.metaKey;
  const displayCtrlKey = shortcut.ctrlKey;

  if (displayCtrlKey) {
    parts.push(isMac ? '⌃' : 'Ctrl');
  }
  if (displayMetaKey) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shiftKey) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (shortcut.altKey) {
    parts.push(isMac ? '⌥' : 'Alt');
  }

  // Format key (capitalize first letter)
  const key = shortcut.key.length === 1
    ? shortcut.key.toUpperCase()
    : shortcut.key;

  parts.push(key);

  return parts.join(isMac ? '' : '+');
}
