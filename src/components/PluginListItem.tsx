/**
 * PluginListItem Component (T113)
 * Displays a single plugin in the plugin list with toggle and settings
 */

import { memo } from 'react';
import type { PluginManifest } from '@/types/plugin';
import './PluginListItem.css';

interface PluginListItemProps {
  plugin: PluginManifest;
  isEnabled: boolean;
  onToggle: (pluginId: string) => void;
  onSettings: (pluginId: string) => void;
  onUninstall: (pluginId: string) => void;
  className?: string;
}

export const PluginListItem = memo(({
  plugin,
  isEnabled,
  onToggle,
  onSettings,
  onUninstall,
  className = '',
}: PluginListItemProps) => {
  const handleToggle = () => {
    onToggle(plugin.id);
  };

  const handleSettings = () => {
    onSettings(plugin.id);
  };

  const handleUninstall = () => {
    if (confirm(`确定要卸载 "${plugin.name}" 插件吗？`)) {
      onUninstall(plugin.id);
    }
  };

  return (
    <div
      className={`plugin-list-item ${isEnabled ? 'enabled' : 'disabled'} ${className}`}
      role="listitem"
      aria-label={`${plugin.name} 插件，${isEnabled ? '已启用' : '已禁用'}`}
    >
      {/* Plugin Icon */}
      <div className="plugin-list-item__icon" aria-hidden="true">
        {plugin.icon ? (
          <img src={plugin.icon} alt="" className="plugin-list-item__icon-img" />
        ) : (
          <div className="plugin-list-item__icon-placeholder">🔌</div>
        )}
      </div>

      {/* Plugin Info */}
      <div className="plugin-list-item__info">
        <div className="plugin-list-item__name">{plugin.name}</div>
        <div className="plugin-list-item__version">v{plugin.version}</div>
        {plugin.author && (
          <div className="plugin-list-item__author">by {plugin.author}</div>
        )}
        {plugin.description && (
          <div className="plugin-list-item__description">{plugin.description}</div>
        )}

        {/* Triggers */}
        {plugin.triggers && plugin.triggers.length > 0 && (
          <div className="plugin-list-item__triggers" aria-label="触发器">
            {plugin.triggers.map((trigger) => (
              <span key={trigger} className="trigger-badge">
                {trigger}
              </span>
            ))}
          </div>
        )}

        {/* Permissions */}
        {plugin.permissions && plugin.permissions.length > 0 && (
          <div className="plugin-list-item__permissions" aria-label="权限">
            {plugin.permissions.map((permission) => (
              <span key={permission} className="permission-badge" title={permission}>
                {formatPermission(permission)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="plugin-list-item__actions">
        {/* Enable/Disable Toggle */}
        <button
          className={`toggle-button ${isEnabled ? 'enabled' : 'disabled'}`}
          onClick={handleToggle}
          aria-pressed={isEnabled}
          aria-label={`${isEnabled ? '禁用' : '启用'} ${plugin.name}`}
          type="button"
        >
          <span className="toggle-slider" aria-hidden="true">
            <span className="toggle-slider-circle" />
          </span>
          <span className="toggle-label">{isEnabled ? '已启用' : '已禁用'}</span>
        </button>

        {/* Settings Button */}
        <button
          className="icon-button settings-button"
          onClick={handleSettings}
          aria-label={`${plugin.name} 设置`}
          type="button"
          title="设置"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 3.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
              fill="currentColor"
            />
          </svg>
        </button>

        {/* Uninstall Button */}
        <button
          className="icon-button uninstall-button"
          onClick={handleUninstall}
          aria-label={`卸载 ${plugin.name}`}
          type="button"
          title="卸载"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M6 6l8 8M14 6l-8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
});

PluginListItem.displayName = 'PluginListItem';

/**
 * Format permission for display
 */
function formatPermission(permission: string): string {
  const permissionLabels: Record<string, string> = {
    'read_clipboard': '剪贴板',
    'write_clipboard': '写入剪贴板',
    'read_file': '读取文件',
    'write_file': '写入文件',
    'network': '网络',
    'shell': '命令行',
    'notification': '通知',
  };
  return permissionLabels[permission] || permission;
}
