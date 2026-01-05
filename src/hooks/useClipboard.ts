/**
 * useClipboard Hook (T091-T093)
 * Hook for managing clipboard history and search
 */

import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface ClipboardItem {
  id: string;
  content_type: 'text' | 'image' | 'file';
  content: string;
  timestamp: number;
  is_sensitive?: boolean;
}

export interface ClipboardSettings {
  max_items: number;
  sensitive_expiry_minutes: number;
  normal_expiry_days: number;
  enable_monitoring: boolean;
}

export function useClipboard() {
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<ClipboardSettings>({
    max_items: 1000,
    sensitive_expiry_minutes: 2,
    normal_expiry_days: 30,
    enable_monitoring: true,
  });

  // Load clipboard history
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const history = await invoke<ClipboardItem[]>('get_clipboard_history', {
        limit: 50,
      });
      setItems(history);
    } catch (e) {
      console.error('Failed to load clipboard history:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load settings
  const loadSettings = useCallback(async () => {
    try {
      const loaded = await invoke<ClipboardSettings>('get_clipboard_settings');
      setSettings(loaded);
    } catch (e) {
      console.error('Failed to load clipboard settings:', e);
    }
  }, []);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<ClipboardSettings>) => {
    try {
      await invoke('set_clipboard_settings', {
        settings: { ...settings, ...newSettings },
      });
      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (e) {
      console.error('Failed to update clipboard settings:', e);
    }
  }, [settings]);

  // Search clipboard items (T093)
  const searchItems = useCallback((query: string): ClipboardItem[] => {
    if (!query.trim()) {
      return items;
    }

    const lowerQuery = query.toLowerCase();
    return items.filter(item => {
      // Search in text content
      if (item.content_type === 'text') {
        return item.content.toLowerCase().includes(lowerQuery);
      }
      // For images and files, search in content (path/url)
      return item.content.toLowerCase().includes(lowerQuery);
    });
  }, [items]);

  // Paste item
  const pasteItem = useCallback(async (itemId: string) => {
    try {
      await invoke('paste_clipboard_item', { itemId });
    } catch (e) {
      console.error('Failed to paste clipboard item:', e);
      throw e;
    }
  }, []);

  // Delete item
  const deleteItem = useCallback(async (itemId: string) => {
    try {
      await invoke('delete_clipboard_item', { itemId });
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (e) {
      console.error('Failed to delete clipboard item:', e);
      throw e;
    }
  }, []);

  // Clear all history
  const clearHistory = useCallback(async () => {
    try {
      await invoke('clear_clipboard_history');
      setItems([]);
    } catch (e) {
      console.error('Failed to clear clipboard history:', e);
      throw e;
    }
  }, []);

  // Get item by ID
  const getItem = useCallback((itemId: string): ClipboardItem | undefined => {
    return items.find(item => item.id === itemId);
  }, [items]);

  // Load on mount
  useEffect(() => {
    loadHistory();
    loadSettings();
  }, [loadHistory, loadSettings]);

  return {
    // Data
    items,
    settings,
    isLoading,

    // Actions
    loadHistory,
    loadSettings,
    updateSettings,
    searchItems,
    pasteItem,
    deleteItem,
    clearHistory,
    getItem,
  };
}
