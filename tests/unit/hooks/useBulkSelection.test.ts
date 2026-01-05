/**
 * useBulkSelection Hook Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PluginStoreProvider } from '../../src/services/pluginStateStore';
import { useBulkSelection } from '../../src/hooks/useBulkSelection';
import type { PluginManagerState } from '../../src/types/plugin';

describe('useBulkSelection Hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return <PluginStoreProvider>{children}</PluginStoreProvider>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have empty selection initially', () => {
      const { result } = renderHook(() => useBulkSelection(), { wrapper });

      expect(result.current.selectedCount).toBe(0);
      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.isAllSelected).toBe(false);
      expect(result.current.isSomeSelected).toBe(false);
    });
  });

  describe('Selection Actions', () => {
    it('should toggle selection for a plugin', () => {
      const { result } = renderHook(() => useBulkSelection(), { wrapper });

      act(() => {
        result.current.toggleSelection('plugin-1');
      });

      expect(result.current.selectedIds.has('plugin-1')).toBe(true);
      expect(result.current.selectedCount).toBe(1);
    });

    it('should deselect a plugin when toggling again', () => {
      const { result } = renderHook(() => useBulkSelection(), { wrapper });

      act(() => {
        result.current.toggleSelection('plugin-1');
      });
      act(() => {
        result.current.toggleSelection('plugin-1');
      });

      expect(result.current.selectedIds.has('plugin-1')).toBe(false);
      expect(result.current.selectedCount).toBe(0);
    });

    it('should select a specific plugin', () => {
      const { result } = renderHook(() => useBulkSelection(), { wrapper });

      act(() => {
        result.current.selectPlugin('plugin-1');
      });

      expect(result.current.selectedIds.has('plugin-1')).toBe(true);
    });

    it('should not duplicate selection when selecting already selected plugin', () => {
      const { result } = renderHook(() => useBulkSelection(), { wrapper });

      act(() => {
        result.current.selectPlugin('plugin-1');
      });
      act(() => {
        result.current.selectPlugin('plugin-1');
      });

      expect(result.current.selectedCount).toBe(1);
    });

    it('should deselect a specific plugin', () => {
      const { result } = renderHook(() => useBulkSelection(), { wrapper });

      act(() => {
        result.current.selectPlugin('plugin-1');
      });
      act(() => {
        result.current.deselectPlugin('plugin-1');
      });

      expect(result.current.selectedIds.has('plugin-1')).toBe(false);
    });

    it('should clear all selections', () => {
      const { result } = renderHook(() => useBulkSelection(), { wrapper });

      act(() => {
        result.current.toggleSelection('plugin-1');
        result.current.toggleSelection('plugin-2');
        result.current.toggleSelection('plugin-3');
      });

      expect(result.current.selectedCount).toBe(3);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedCount).toBe(0);
      expect(result.current.selectedIds.size).toBe(0);
    });
  });

  describe('Bulk Selection', () => {
    it('should select all provided plugins', () => {
      const { result } = renderHook(() => useBulkSelection(), { wrapper });

      const pluginIds = ['plugin-1', 'plugin-2', 'plugin-3'];

      act(() => {
        result.current.selectAll(pluginIds);
      });

      expect(result.current.selectedCount).toBe(3);
      expect(result.current.selectedIds.has('plugin-1')).toBe(true);
      expect(result.current.selectedIds.has('plugin-2')).toBe(true);
      expect(result.current.selectedIds.has('plugin-3')).toBe(true);
    });

    it('should select only unselected plugins when selectAll is called', () => {
      const { result } = renderHook(() => useBulkSelection(), { wrapper });

      const pluginIds = ['plugin-1', 'plugin-2', 'plugin-3'];

      act(() => {
        result.current.toggleSelection('plugin-1');
      });
      act(() => {
        result.current.selectAll(pluginIds);
      });

      expect(result.current.selectedCount).toBe(3);
    });

    it('should select all visible plugins', () => {
      const { result } = renderHook(() => useBulkSelection(), { wrapper });

      const visibleIds = ['plugin-1', 'plugin-2'];

      act(() => {
        result.current.selectVisible(visibleIds);
      });

      expect(result.current.selectedCount).toBe(2);
      expect(result.current.selectedIds.has('plugin-1')).toBe(true);
      expect(result.current.selectedIds.has('plugin-2')).toBe(true);
    });

    it('should replace current selection when selectVisible is called', () => {
      const { result } = renderHook(() => useBulkSelection(), { wrapper });

      // Select plugin-1 first
      act(() => {
        result.current.toggleSelection('plugin-1');
      });

      expect(result.current.selectedIds.has('plugin-1')).toBe(true);

      // Select visible plugins (plugin-2, plugin-3)
      const visibleIds = ['plugin-2', 'plugin-3'];
      act(() => {
        result.current.selectVisible(visibleIds);
      });

      // plugin-1 should be deselected, only visible ones selected
      expect(result.current.selectedIds.has('plugin-1')).toBe(false);
      expect(result.current.selectedIds.has('plugin-2')).toBe(true);
      expect(result.current.selectedIds.has('plugin-3')).toBe(true);
      expect(result.current.selectedCount).toBe(2);
    });
  });

  describe('Computed Properties', () => {
    it('should return correct selected count', () => {
      const { result } = renderHook(() => useBulkSelection(), { wrapper });

      expect(result.current.selectedCount).toBe(0);

      act(() => {
        result.current.toggleSelection('plugin-1');
        result.current.toggleSelection('plugin-2');
      });

      expect(result.current.selectedCount).toBe(2);
    });

    it('should return true for isSomeSelected when plugins selected', () => {
      const { result } = renderHook(() => useBulkSelection(), { wrapper });

      expect(result.current.isSomeSelected).toBe(false);

      act(() => {
        result.current.toggleSelection('plugin-1');
      });

      expect(result.current.isSomeSelected).toBe(true);
    });

    it('should return isAllSelected based on plugin count', () => {
      const { result } = renderHook(() => useBulkSelection(), { wrapper });

      // Note: This depends on state.plugins.length
      // In real scenario, this would compare selectedCount with total visible plugins
      act(() => {
        result.current.toggleSelection('plugin-1');
      });

      // Initially false unless all plugins are selected
      expect(result.current.isAllSelected).toBe(false);
    });
  });

  describe('getSelectedPlugins', () => {
    it('should return set of selected plugin IDs', () => {
      const { result } = renderHook(() => useBulkSelection(), { wrapper });

      act(() => {
        result.current.toggleSelection('plugin-1');
        result.current.toggleSelection('plugin-2');
      });

      const selected = result.current.getSelectedPlugins();

      expect(selected).toBeInstanceOf(Set);
      expect(selected.has('plugin-1')).toBe(true);
      expect(selected.has('plugin-2')).toBe(true);
      expect(selected.has('plugin-3')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle toggling same plugin multiple times', () => {
      const { result } = renderHook(() => useBulkSelection(), { wrapper });

      act(() => {
        result.current.toggleSelection('plugin-1');
        result.current.toggleSelection('plugin-1');
        result.current.toggleSelection('plugin-1');
      });

      // Toggle odd times = selected, even times = deselected
      expect(result.current.selectedIds.has('plugin-1')).toBe(true);
    });

    it('should handle empty plugin list for selectAll', () => {
      const { result } = renderHook(() => useBulkSelection(), { wrapper });

      act(() => {
        result.current.selectAll([]);
      });

      expect(result.current.selectedCount).toBe(0);
    });

    it('should handle deselecting non-selected plugin', () => {
      const { result } = renderHook(() => useBulkSelection(), { wrapper });

      // Should not throw error
      act(() => {
        result.current.deselectPlugin('plugin-1');
      });

      expect(result.current.selectedCount).toBe(0);
    });
  });
});
