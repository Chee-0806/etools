/**
 * usePluginState Hook
 * Custom hook for accessing plugin state with derived values
 */

import { useMemo, useCallback } from 'react';
import {
  usePluginState as usePluginStateBase,
  usePluginDispatch,
} from '../services/pluginStateStore';
import type { Plugin, MarketplacePlugin } from '../types/plugin';

export interface UsePluginStateReturn {
  // Raw state
  plugins: Plugin[];
  marketplacePlugins: MarketplacePlugin[];
  currentView: 'installed' | 'marketplace' | 'install';
  selectedPluginIds: Set<string>;
  searchQuery: string;
  statusFilter: 'all' | 'enabled' | 'disabled';
  categoryFilter: string;
  loading: boolean;
  error: string | null;

  // Derived values
  enabledPlugins: Plugin[];
  disabledPlugins: Plugin[];
  healthyPlugins: Plugin[];
  errorPlugins: Plugin[];
  selectedPlugins: Plugin[];
  filteredPlugins: Plugin[];
  selectedCount: number;

  // Actions
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: 'all' | 'enabled' | 'disabled') => void;
  setCategoryFilter: (filter: string) => void;
  clearFilters: () => void;
  toggleSelection: (pluginId: string) => void;
  clearSelection: () => void;
  setCurrentView: (view: 'installed' | 'marketplace' | 'install') => void;
}

/**
 * Custom hook for accessing plugin state with derived values
 *
 * Provides convenient access to plugin state and computed values.
 *
 * @example
 * ```tsx
 * const { enabledPlugins, disabledPlugins, toggleSelection } = usePluginState();
 *
 * return (
 *   <div>
 *     <h3>Enabled ({enabledPlugins.length})</h3>
 *     <ul>
 *       {enabledPlugins.map(plugin => (
 *         <li key={plugin.id}>{plugin.name}</li>
 *       ))}
 *     </ul>
 *   </div>
 * );
 * ```
 */
export const usePluginState = (): UsePluginStateReturn => {
  const dispatch = usePluginDispatch();
  const state = usePluginStateBase();

  /**
   * Derived: Enabled plugins
   */
  const enabledPlugins = useMemo(() => {
    return state.plugins.filter((p) => p.enabled);
  }, [state.plugins]);

  /**
   * Derived: Disabled plugins
   */
  const disabledPlugins = useMemo(() => {
    return state.plugins.filter((p) => !p.enabled);
  }, [state.plugins]);

  /**
   * Derived: Healthy plugins
   */
  const healthyPlugins = useMemo(() => {
    return state.plugins.filter((p) => p.health?.status === 'healthy');
  }, [state.plugins]);

  /**
   * Derived: Error plugins
   */
  const errorPlugins = useMemo(() => {
    return state.plugins.filter((p) => p.health?.status === 'error');
  }, [state.plugins]);

  /**
   * Derived: Selected plugins
   */
  const selectedPlugins = useMemo(() => {
    return state.plugins.filter((p) => state.selectedPluginIds.has(p.manifest.id));
  }, [state.plugins, state.selectedPluginIds]);

  /**
   * Derived: Filtered plugins
   */
  const filteredPlugins = useMemo(() => {
    return state.plugins.filter((plugin) => {
      // Search filter
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        const matchesSearch =
          plugin.manifest.name.toLowerCase().includes(query) ||
          plugin.manifest.description.toLowerCase().includes(query) ||
          plugin.manifest.id.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (state.statusFilter === 'enabled' && !plugin.enabled) return false;
      if (state.statusFilter === 'disabled' && plugin.enabled) return false;

      // Note: Plugin type doesn't have category field
      // Category filtering only applies to MarketplacePlugin
      // Skip category filter for installed plugins

      return true;
    });
  }, [state.plugins, state.searchQuery, state.statusFilter]);

  /**
   * Derived: Selected count
   */
  const selectedCount = useMemo(() => {
    return state.selectedPluginIds.size;
  }, [state.selectedPluginIds]);

  /**
   * Action: Set search query
   */
  const setSearchQuery = useCallback(
    (query: string) => {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
    },
    [dispatch]
  );

  /**
   * Action: Set status filter
   */
  const setStatusFilter = useCallback(
    (filter: 'all' | 'enabled' | 'disabled') => {
      dispatch({ type: 'SET_STATUS_FILTER', payload: filter });
    },
    [dispatch]
  );

  /**
   * Action: Set category filter
   */
  const setCategoryFilter = useCallback(
    (filter: string) => {
      const validFilter = filter === 'all' ? 'all' : filter;
      dispatch({ type: 'SET_CATEGORY_FILTER', payload: validFilter as any });
    },
    [dispatch]
  );

  /**
   * Action: Clear all filters
   */
  const clearFilters = useCallback(() => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
    dispatch({ type: 'SET_STATUS_FILTER', payload: 'all' });
    dispatch({ type: 'SET_CATEGORY_FILTER', payload: 'all' });
  }, [dispatch]);

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
   * Action: Clear selection
   */
  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, [dispatch]);

  /**
   * Action: Set current view
   */
  const setCurrentView = useCallback(
    (view: 'installed' | 'marketplace' | 'install') => {
      dispatch({ type: 'SET_VIEW', payload: view });
    },
    [dispatch]
  );

  return {
    // Raw state
    plugins: state.plugins,
    marketplacePlugins: state.marketplacePlugins,
    currentView: state.currentView,
    selectedPluginIds: state.selectedPluginIds,
    searchQuery: state.searchQuery,
    statusFilter: state.statusFilter,
    categoryFilter: state.categoryFilter,
    loading: state.loading,
    error: state.error,

    // Derived values
    enabledPlugins,
    disabledPlugins,
    healthyPlugins,
    errorPlugins,
    selectedPlugins,
    filteredPlugins,
    selectedCount,

    // Actions
    setSearchQuery,
    setStatusFilter,
    setCategoryFilter,
    clearFilters,
    toggleSelection,
    clearSelection,
    setCurrentView,
  };
};

export default usePluginState;
