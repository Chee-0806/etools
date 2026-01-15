/**
 * PluginList Component
 * Displays a list of plugins with selection and actions
 */

import React, { useRef, useEffect } from 'react';
import type { Plugin, PluginFilters } from '../../types/plugin';
import PluginListItem from './PluginListItem';
import { announceToScreenReader } from '../../lib/accessibility';
import './PluginList.css';

interface PluginListProps {
  /**
   * Array of plugins to display
   */
  plugins: Plugin[];

  /**
   * Set of selected plugin IDs
   */
  selectedIds: Set<string>;

  /**
   * Whether the list is in a loading state
   */
  loading?: boolean;

  /**
   * Current search query for highlighting
   */
  searchQuery?: string;

  /**
   * Current filters applied
   */
  filters?: PluginFilters;

  /**
   * Whether selection mode is active
   */
  selectionMode?: boolean;

  /**
   * Callback when plugin selection is toggled
   */
  onToggleSelect?: (pluginId: string) => void;

  /**
   * Callback when plugin enable/disable is toggled
   */
  onToggleEnable?: (pluginId: string) => void;

  /**
   * Callback when plugin is uninstalled
   */
  onUninstall?: (pluginId: string) => void;

  /**
   * Callback when plugin is updated
   */
  onUpdate?: (pluginId: string) => void;

  /**
   * Callback when plugin is clicked
   */
  onPluginClick?: (plugin: Plugin) => void;

  /**
   * Sort field
   */
  sortBy?: 'name' | 'usageCount' | 'installedAt';

  /**
   * Loading skeleton to show
   */
  loadingSkeleton?: boolean;
}

/**
 * PluginList - Renders a list of plugins with actions
 */
const PluginList: React.FC<PluginListProps> = ({
  plugins,
  selectedIds,
  loading = false,
  searchQuery = '',
  filters,
  selectionMode = false,
  onToggleSelect,
  onToggleEnable,
  onUninstall,
  onUpdate,
  onPluginClick,
  sortBy = 'name',
  loadingSkeleton = false,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const focusedIndexRef = useRef<number>(-1);

  /**
   * Handle keyboard navigation for the list
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = Array.from(
      listRef.current?.querySelectorAll('[role="listitem"]') || []
    ) as HTMLElement[];

    if (items.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusedIndexRef.current = Math.min(focusedIndexRef.current + 1, items.length - 1);
        items[focusedIndexRef.current]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusedIndexRef.current = Math.max(focusedIndexRef.current - 1, 0);
        items[focusedIndexRef.current]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        focusedIndexRef.current = 0;
        items[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        focusedIndexRef.current = items.length - 1;
        items[items.length - 1]?.focus();
        break;
    }
  };

  /**
   * Sort plugins
   */
  const getSortedPlugins = () => {
    const sorted = [...plugins];

    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name, 'zh-CN'));
      case 'usageCount':
        return sorted.sort(
          (a, b) => (b.usageStats?.usageCount || 0) - (a.usageStats?.usageCount || 0)
        );
      case 'installedAt':
        return sorted.sort(
          (a, b) => (b.installedAt || 0) - (a.installedAt || 0)
        );
      default:
        return sorted;
    }
  };

  const sortedPlugins = getSortedPlugins();

  /**
   * Announce list changes to screen readers
   */
  useEffect(() => {
    if (!loading && sortedPlugins.length > 0) {
      announceToScreenReader(`已加载 ${sortedPlugins.length} 个插件`);
    }
  }, [sortedPlugins.length, loading]);

  /**
   * Render loading skeleton
   */
  if (loading || loadingSkeleton) {
    return (
      <div
        className="plugin-list loading"
        data-testid="loading-skeleton"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="正在加载插件列表"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="plugin-list-item-skeleton">
            <div className="skeleton-checkbox" />
            <div className="skeleton-icon" />
            <div className="skeleton-content">
              <div className="skeleton-title" />
              <div className="skeleton-description" />
            </div>
            <div className="skeleton-actions" />
          </div>
        ))}
      </div>
    );
  }

  /**
   * Render empty state
   */
  if (sortedPlugins.length === 0) {
    return (
      <div
        className="plugin-list-empty"
        data-testid="empty-state"
        role="status"
        aria-live="polite"
        aria-label="没有找到插件"
      >
        <p className="empty-state-text">No plugins found</p>
      </div>
    );
  }

  /**
   * Render plugin list
   */
  return (
    <div
      ref={listRef}
      className="plugin-list"
      role="list"
      aria-label={`插件列表,共 ${sortedPlugins.length} 个插件`}
      data-testid="plugin-list"
      onKeyDown={handleKeyDown}
    >
      {sortedPlugins.map((plugin) => (
        <PluginListItem
          key={plugin.manifest.id}
          plugin={plugin}
          selected={selectedIds.has(plugin.manifest.id)}
          selectionMode={selectionMode}
          searchQuery={searchQuery}
          onToggleSelect={() => onToggleSelect?.(plugin.manifest.id)}
          onToggleEnable={() => onToggleEnable?.(plugin.manifest.id)}
          onUninstall={() => onUninstall?.(plugin.manifest.id)}
          onUpdate={() => onUpdate?.(plugin.manifest.id)}
          onClick={() => onPluginClick?.(plugin)}
        />
      ))}
    </div>
  );
};

export default PluginList;
