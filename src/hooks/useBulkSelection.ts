/**
 * useBulkSelection Hook
 * Custom hook for managing bulk plugin selection
 */

import { useCallback, useMemo } from 'react';
import { usePluginDispatch, usePluginState } from '../services/pluginStateStore';

export interface UseBulkSelectionReturn {
  // State
  selectedIds: Set<string>;
  selectedCount: number;
  isAllSelected: boolean;
  isSomeSelected: boolean;

  // Actions
  toggleSelection: (pluginId: string) => void;
  selectPlugin: (pluginId: string) => void;
  deselectPlugin: (pluginId: string) => void;
  selectAll: (pluginIds: string[]) => void;
  clearSelection: () => void;
  selectVisible: (visibleIds: string[]) => void;

  // Computed
  getSelectedPlugins: () => Set<string>;
}

/**
 * Custom hook for managing bulk plugin selection
 *
 * Provides convenient methods for managing plugin selection state.
 *
 * @example
 * ```tsx
 * const { selectedCount, toggleSelection, selectAll, clearSelection } = useBulkSelection();
 *
 * return (
 *   <div>
 *     <p>Selected: {selectedCount}</p>
 *     <button onClick={() => selectAll(pluginIds)}>Select All</button>
 *     <button onClick={clearSelection}>Clear</button>
 *   </div>
 * );
 * ```
 */
export const useBulkSelection = (): UseBulkSelectionReturn => {
  const dispatch = usePluginDispatch();
  const state = usePluginState();

  /**
   * Derived: Selected IDs
   */
  const selectedIds = useMemo(() => {
    return state.selectedPluginIds;
  }, [state.selectedPluginIds]);

  /**
   * Derived: Selected count
   */
  const selectedCount = useMemo(() => {
    return selectedIds.size;
  }, [selectedIds]);

  /**
   * Derived: Is all selected (for current filtered view)
   */
  const isAllSelected = useMemo(() => {
    return selectedCount > 0 && selectedCount === state.plugins.length;
  }, [selectedCount, state.plugins.length]);

  /**
   * Derived: Is some selected
   */
  const isSomeSelected = useMemo(() => {
    return selectedCount > 0;
  }, [selectedCount]);

  /**
   * Action: Toggle plugin selection
   */
  const toggleSelection = useCallback(
    (pluginId: string) => {
      dispatch({ type: 'TOGGLE_SELECTION', payload: pluginId });
    },
    [dispatch]
  );

  /**
   * Action: Select a plugin
   */
  const selectPlugin = useCallback(
    (pluginId: string) => {
      if (!selectedIds.has(pluginId)) {
        dispatch({ type: 'TOGGLE_SELECTION', payload: pluginId });
      }
    },
    [dispatch, selectedIds]
  );

  /**
   * Action: Deselect a plugin
   */
  const deselectPlugin = useCallback(
    (pluginId: string) => {
      if (selectedIds.has(pluginId)) {
        dispatch({ type: 'TOGGLE_SELECTION', payload: pluginId });
      }
    },
    [dispatch, selectedIds]
  );

  /**
   * Action: Select all plugins
   */
  const selectAll = useCallback(
    (pluginIds: string[]) => {
      // Select each plugin if not already selected
      pluginIds.forEach((id) => {
        if (!selectedIds.has(id)) {
          dispatch({ type: 'TOGGLE_SELECTION', payload: id });
        }
      });
    },
    [dispatch, selectedIds]
  );

  /**
   * Action: Clear all selections
   */
  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, [dispatch]);

  /**
   * Action: Select all visible plugins
   */
  const selectVisible = useCallback(
    (visibleIds: string[]) => {
      // Clear current selection and select all visible
      dispatch({ type: 'CLEAR_SELECTION' });
      visibleIds.forEach((id) => {
        dispatch({ type: 'TOGGLE_SELECTION', payload: id });
      });
    },
    [dispatch]
  );

  /**
   * Computed: Get selected plugins
   */
  const getSelectedPlugins = useCallback(() => {
    return new Set(selectedIds);
  }, [selectedIds]);

  return {
    selectedIds,
    selectedCount,
    isAllSelected,
    isSomeSelected,
    toggleSelection,
    selectPlugin,
    deselectPlugin,
    selectAll,
    clearSelection,
    selectVisible,
    getSelectedPlugins,
  };
};

export default useBulkSelection;
