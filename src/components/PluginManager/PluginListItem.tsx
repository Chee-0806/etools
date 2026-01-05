/**
 * PluginListItem Component
 * Individual plugin item with selection, status, and actions
 */

import React, { useRef, useEffect } from 'react';
import type { Plugin } from '../../types/plugin';
import { getAriaLabel, getAriaDescription, announceToScreenReader } from '../../lib/accessibility';
import './PluginListItem.css';

interface PluginListItemProps {
  /**
   * Plugin data
   */
  plugin: Plugin;

  /**
   * Whether this plugin is selected
   */
  selected?: boolean;

  /**
   * Whether selection mode is active
   */
  selectionMode?: boolean;

  /**
   * Search query for highlighting
   */
  searchQuery?: string;

  /**
   * Callback when selection is toggled
   */
  onToggleSelect?: () => void;

  /**
   * Callback when enable/disable is toggled
   */
  onToggleEnable?: () => void;

  /**
   * Callback when uninstall is requested
   */
  onUninstall?: () => void;

  /**
   * Callback when item is clicked
   */
  onClick?: () => void;
}

/**
 * PluginListItem - Single plugin in the list
 */
const PluginListItem: React.FC<PluginListItemProps> = ({
  plugin,
  selected = false,
  selectionMode = false,
  searchQuery = '',
  onToggleSelect,
  onToggleEnable,
  onUninstall,
  onClick,
}) => {
  const itemRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        onClick?.();
        announceToScreenReader(`已选择 ${plugin.manifest.name}`);
        break;
      case 'Delete':
        if (onUninstall) {
          e.preventDefault();
          onUninstall();
        }
        break;
    }
  };

  // Announce status changes
  useEffect(() => {
    if (plugin.enabled) {
      announceToScreenReader(`${plugin.manifest.name} 已启用`);
    }
  }, [plugin.enabled, plugin.manifest.name]);

  /**
   * Get health status indicator color
   */
  const getHealthColor = () => {
    switch (plugin.health?.status) {
      case 'healthy':
        return 'var(--success-color)';
      case 'warning':
        return 'var(--warning-color)';
      case 'error':
        return 'var(--error-color)';
      default:
        return 'var(--text-tertiary)';
    }
  };

  /**
   * Highlight search text
   */
  const highlightText = (text: string) => {
    if (!searchQuery) return text;

    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="search-highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div
      ref={itemRef}
      className={`plugin-list-item ${selected ? 'selected' : ''} ${
        selectionMode ? 'selection-mode' : ''
      }`}
      role="listitem"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={getAriaLabel('view', plugin.manifest.name)}
      aria-describedby={`plugin-desc-${plugin.manifest.id}`}
      aria-selected={selected}
      data-testid={`plugin-item-${plugin.manifest.id}`}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="plugin-item-checkbox">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            aria-label={`选择 ${plugin.manifest.name}`}
          />
        </div>
      )}

      {/* Health Status Indicator */}
      <div
        className="plugin-item-status"
        style={{ backgroundColor: getHealthColor() }}
        title={`状态: ${plugin.health?.status || 'unknown'}`}
        role="img"
        aria-label={`${plugin.health?.status || 'unknown'} 状态`}
      />

      {/* Plugin Icon/Avatar */}
      <div className="plugin-item-icon" aria-hidden="true">
        {plugin.manifest.name.charAt(0).toUpperCase()}
      </div>

      {/* Plugin Info */}
      <div className="plugin-item-info">
        <div className="plugin-item-header">
          <h3 className="plugin-item-name" id={`plugin-name-${plugin.manifest.id}`}>
            {highlightText(plugin.manifest.name)}
          </h3>
          <span className="plugin-item-version">{plugin.manifest.version}</span>
        </div>
        <p
          className="plugin-item-description"
          id={`plugin-desc-${plugin.manifest.id}`}
        >
          {highlightText(plugin.manifest.description)}
        </p>
        <div className="plugin-item-meta">
          {plugin.manifest.author && (
            <span className="plugin-item-author">作者: {plugin.manifest.author}</span>
          )}
        </div>
      </div>

      {/* Plugin Actions */}
      <div className="plugin-item-actions" role="group" aria-label="插件操作">
        <button
          className={`plugin-toggle-btn ${plugin.enabled ? 'enabled' : 'disabled'}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleEnable?.();
          }}
          aria-label={getAriaLabel(plugin.enabled ? 'disable' : 'enable', plugin.manifest.name)}
          aria-pressed={plugin.enabled}
          title={plugin.enabled ? '点击禁用' : '点击启用'}
        >
          {plugin.enabled ? '已启用' : '已禁用'}
        </button>
        {onUninstall && (
          <button
            className="plugin-uninstall-btn"
            onClick={(e) => {
              e.stopPropagation();
              onUninstall();
            }}
            aria-label={getAriaLabel('uninstall', plugin.manifest.name)}
            title="卸载插件"
          >
            🗑️ 卸载
          </button>
        )}
      </div>

      {/* Selected Badge */}
      {selected && (
        <div className="plugin-item-selected-badge" data-testid="selected-badge">
          ✓ 已选择
        </div>
      )}
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(PluginListItem, (prevProps, nextProps) => {
  return (
    prevProps.plugin.manifest.id === nextProps.plugin.manifest.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.selectionMode === nextProps.selectionMode &&
    prevProps.plugin.enabled === nextProps.plugin.enabled &&
    prevProps.plugin.health?.status === nextProps.plugin.health?.status
  );
});
