/**
 * PluginDetailPanel Component
 * Display detailed plugin information including health and usage stats
 */

import React, { useEffect, useState, useCallback } from 'react';
import { usePluginState, usePluginDispatch } from '../../services/pluginStateStore';
import { pluginManagerService } from '../../services/pluginManager';
import { pluginAbbreviationService, PluginAbbreviationService } from '../../services/pluginAbbreviationService';
import type { Plugin, PluginHealth, PluginUsageStats, PluginPermission, PluginAbbreviation } from '../../types/plugin';
import './PluginDetailPanel.css';

/**
 * PluginDetailPanel Props
 */
interface PluginDetailPanelProps {
  pluginId: string;
  onClose?: () => void;
}

/**
 * PluginDetailPanel Component
 */
const PluginDetailPanel: React.FC<PluginDetailPanelProps> = ({ pluginId, onClose }) => {
  const dispatch = usePluginDispatch();
  const state = usePluginState();

  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [health, setHealth] = useState<PluginHealth | null>(null);
  const [usageStats, setUsageStats] = useState<PluginUsageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshingHealth, setRefreshingHealth] = useState(false);

  // Abbreviation state
  const [abbreviations, setAbbreviations] = useState<PluginAbbreviation[]>([]);
  const [newAbbrKeyword, setNewAbbrKeyword] = useState('');
  const [abbrError, setAbbrError] = useState<string | null>(null);

  /**
   * Load plugin details
   */
  const loadPluginDetails = useCallback(async () => {
    if (!pluginId) return;

    setLoading(true);
    try {
      // Find plugin from state
      const foundPlugin = state.plugins.find((p) => p.manifest.id === pluginId);
      if (foundPlugin) {
        setPlugin(foundPlugin);

        // Load health
        const healthData = await pluginManagerService.getPluginHealth(pluginId);
        setHealth(healthData);

        // Load usage stats
        const statsData = await pluginManagerService.getPluginUsageStats(pluginId);
        setUsageStats(statsData);

        // Load abbreviations
        await pluginAbbreviationService.loadConfig();
        const abbrs = pluginAbbreviationService.getAbbreviations(pluginId);
        setAbbreviations(abbrs);
      }
    } catch (error) {
      console.error('Failed to load plugin details:', error);
    } finally {
      setLoading(false);
    }
  }, [pluginId, state.plugins]);

  /**
   * Refresh health status
   */
  const handleRefreshHealth = async () => {
    if (!pluginId) return;

    setRefreshingHealth(true);
    try {
      const healthData = await pluginManagerService.refreshPluginHealth(pluginId);
      setHealth(healthData);

      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'success',
          title: '健康检查完成',
          message: '插件健康状态已更新',
        },
      });
    } catch (error) {
      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'error',
          title: '健康检查失败',
          message: error instanceof Error ? error.message : '未知错误',
        },
      });
    } finally {
      setRefreshingHealth(false);
    }
  };

  /**
   * Toggle permission
   */
  const handleTogglePermission = async (permission: PluginPermission) => {
    if (!plugin) return;

    const currentPermissions = plugin.grantedPermissions || new Set<PluginPermission>();
    const hasPermission = currentPermissions.has(permission);

    try {
      if (hasPermission) {
        await pluginManagerService.revokePermissions(plugin.manifest.id, [permission]);
      } else {
        await pluginManagerService.grantPermissions(plugin.manifest.id, [permission]);
      }

      // Reload plugin details
      await loadPluginDetails();
    } catch (error) {
      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'error',
          title: '权限更新失败',
          message: error instanceof Error ? error.message : '未知错误',
        },
      });
    }
  };

  /**
   * Add abbreviation
   */
  const handleAddAbbreviation = async () => {
    if (!plugin || !newAbbrKeyword.trim()) return;

    // Validate keyword
    const validation = PluginAbbreviationService.isValidKeyword(newAbbrKeyword.trim());
    if (!validation.valid) {
      setAbbrError(validation.error || '无效的关键词');
      return;
    }

    // Check for duplicates
    if (abbreviations.some(abbr => abbr.keyword.toLowerCase() === newAbbrKeyword.trim().toLowerCase())) {
      setAbbrError('此关键词已存在');
      return;
    }

    try {
      const newAbbr: PluginAbbreviation = {
        keyword: newAbbrKeyword.trim().toLowerCase(),
        enabled: true,
      };

      await pluginAbbreviationService.setAbbreviation(plugin.manifest.id, newAbbr);
      setAbbreviations([...abbreviations, newAbbr]);
      setNewAbbrKeyword('');
      setAbbrError(null);

      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'success',
          title: '缩写添加成功',
          message: `已添加缩写 "${newAbbr.keyword}"`,
        },
      });
    } catch (error) {
      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'error',
          title: '添加失败',
          message: error instanceof Error ? error.message : '未知错误',
        },
      });
    }
  };

  /**
   * Remove abbreviation
   */
  const handleRemoveAbbreviation = async (keyword: string) => {
    if (!plugin) return;

    try {
      await pluginAbbreviationService.removeAbbreviation(plugin.manifest.id, keyword);
      setAbbreviations(abbreviations.filter(abbr => abbr.keyword !== keyword));

      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'success',
          title: '缩写已删除',
          message: `已删除缩写 "${keyword}"`,
        },
      });
    } catch (error) {
      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'error',
          title: '删除失败',
          message: error instanceof Error ? error.message : '未知错误',
        },
      });
    }
  };

  /**
   * Toggle abbreviation enabled state
   */
  const handleToggleAbbreviation = async (keyword: string) => {
    if (!plugin) return;

    try {
      const abbr = abbreviations.find(a => a.keyword === keyword);
      if (!abbr) return;

      const updatedAbbr: PluginAbbreviation = {
        keyword,
        enabled: !abbr.enabled,
      };

      await pluginAbbreviationService.setAbbreviation(plugin.manifest.id, updatedAbbr);
      setAbbreviations(abbreviations.map(a =>
        a.keyword === keyword ? updatedAbbr : a
      ));
    } catch (error) {
      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'error',
          title: '更新失败',
          message: error instanceof Error ? error.message : '未知错误',
        },
      });
    }
  };

  /**
   * Format timestamp
   */
  const formatTimestamp = (timestamp: number | null): string => {
    if (!timestamp) return '从未';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} 周前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  /**
   * Initial load
   */
  useEffect(() => {
    loadPluginDetails();
  }, [loadPluginDetails]);

  if (loading) {
    return (
      <div className="plugin-detail-panel">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>加载插件详情...</p>
        </div>
      </div>
    );
  }

  if (!plugin) {
    return (
      <div className="plugin-detail-panel">
        <div className="error-state">
          <p>插件未找到</p>
        </div>
      </div>
    );
  }

  return (
    <div className="plugin-detail-panel">
      {/* Header */}
      <div className="detail-header">
        <div className="plugin-info">
          <h2 className="plugin-name">{plugin.manifest.name}</h2>
          <p className="plugin-version">v{plugin.manifest.version}</p>
          <p className="plugin-author">by {plugin.manifest.author || '未知作者'}</p>
        </div>
        {onClose && (
          <button
            className="close-btn"
            onClick={onClose}
            title="关闭"
          >
            ✕
          </button>
        )}
      </div>

      {/* Description */}
      {plugin.manifest.description && (
        <div className="detail-section">
          <h3>描述</h3>
          <p className="plugin-description">{plugin.manifest.description}</p>
        </div>
      )}

      {/* Health Status */}
      <div className="detail-section">
        <div className="section-header">
          <h3>健康状态</h3>
          <button
            className="refresh-btn"
            onClick={handleRefreshHealth}
            disabled={refreshingHealth}
            title="刷新健康状态"
          >
            {refreshingHealth ? '刷新中...' : '🔄 刷新'}
          </button>
        </div>

        {health && (
          <div className={`health-status ${health.status}`}>
            <div className="health-indicator">
              <span className={`health-icon ${health.status}`}>
                {health.status === 'healthy' ? '✓' : health.status === 'warning' ? '⚠' : '✗'}
              </span>
              <span className="health-text">
                {health.status === 'healthy' ? '健康' : health.status === 'warning' ? '警告' : health.status === 'error' ? '错误' : '未知'}
              </span>
            </div>

            {health.message && (
              <p className="health-message">{health.message}</p>
            )}

            {health.errors && health.errors.length > 0 && (
              <div className="health-errors">
                <h4>错误详情:</h4>
                {health.errors.map((error, index) => (
                  <div key={index} className="error-item">
                    <code>{error.code}</code>
                    <p>{error.message}</p>
                    {error.timestamp && (
                      <small>{formatTimestamp(error.timestamp)}</small>
                    )}
                  </div>
                ))}
              </div>
            )}

            {health.lastChecked && (
              <p className="last-checked">
                上次检查: {formatTimestamp(health.lastChecked)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Usage Statistics */}
      {usageStats && (
        <div className="detail-section">
          <h3>使用统计</h3>
          <div className="usage-stats">
            <div className="stat-item">
              <span className="stat-label">使用次数:</span>
              <span className="stat-value">{usageStats.usageCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">上次使用:</span>
              <span className="stat-value">
                {formatTimestamp(usageStats.lastUsed)}
              </span>
            </div>
            {usageStats.lastExecutionTime && (
              <div className="stat-item">
                <span className="stat-label">上次执行时间:</span>
                <span className="stat-value">
                  {usageStats.lastExecutionTime}ms
                </span>
              </div>
            )}
            {usageStats.averageExecutionTime && (
              <div className="stat-item">
                <span className="stat-label">平均执行时间:</span>
                <span className="stat-value">
                  {usageStats.averageExecutionTime}ms
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Permissions */}
      {plugin.manifest.permissions && plugin.manifest.permissions.length > 0 && (
        <div className="detail-section">
          <h3>权限</h3>
          <div className="permissions-list">
            {plugin.manifest.permissions.map((permission) => {
              const granted = plugin.grantedPermissions?.has(permission);
              return (
                <div key={permission} className="permission-item">
                  <span className="permission-name">{permission}</span>
                  <button
                    className={`permission-toggle ${granted ? 'granted' : ''}`}
                    onClick={() => handleTogglePermission(permission)}
                  >
                    {granted ? '已授予' : '未授予'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Triggers */}
      {plugin.manifest.triggers && plugin.manifest.triggers.length > 0 && (
        <div className="detail-section">
          <h3>触发器</h3>
          <div className="triggers-list">
            {plugin.manifest.triggers.map((trigger) => (
              <code key={trigger} className="trigger-item">
                {trigger}
              </code>
            ))}
          </div>
        </div>
      )}

      {/* User-defined Abbreviations */}
      <div className="detail-section">
        <h3>自定义缩写</h3>
        <p className="section-description">
          为此插件设置自定义缩写，快速搜索和触发插件功能
        </p>

        {/* Add new abbreviation */}
        <div className="add-abbreviation-form">
          <input
            type="text"
            className="abbreviation-input"
            placeholder="输入缩写关键词（如：hw）"
            value={newAbbrKeyword}
            onChange={(e) => {
              setNewAbbrKeyword(e.target.value);
              setAbbrError(null);
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddAbbreviation();
              }
            }}
          />
          <button
            className="add-abbr-btn"
            onClick={handleAddAbbreviation}
            disabled={!newAbbrKeyword.trim()}
          >
            添加
          </button>
        </div>

        {abbrError && (
          <p className="abbr-error">{abbrError}</p>
        )}

        {/* Suggested abbreviations */}
        {plugin.manifest.name && (
          <div className="suggestions">
            <span className="suggestions-label">建议：</span>
            {PluginAbbreviationService.generateSuggestions(plugin.manifest.name).map((suggestion) => (
              <button
                key={suggestion}
                className="suggestion-chip"
                onClick={() => setNewAbbrKeyword(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Abbreviations list */}
        <div className="abbreviations-list">
          {abbreviations.length === 0 ? (
            <p className="empty-state">暂无自定义缩写</p>
          ) : (
            abbreviations.map((abbr) => (
              <div key={abbr.keyword} className={`abbr-item ${abbr.enabled ? '' : 'disabled'}`}>
                <div className="abbr-info">
                  <code className="abbr-keyword">{abbr.keyword}</code>
                  <span className="abbr-status">
                    {abbr.enabled ? '已启用' : '已禁用'}
                  </span>
                </div>
                <div className="abbr-actions">
                  <button
                    className="abbr-toggle-btn"
                    onClick={() => handleToggleAbbreviation(abbr.keyword)}
                    title={abbr.enabled ? '禁用' : '启用'}
                  >
                    {abbr.enabled ? '🔒' : '🔓'}
                  </button>
                  <button
                    className="abbr-remove-btn"
                    onClick={() => handleRemoveAbbreviation(abbr.keyword)}
                    title="删除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="detail-section">
        <h3>元数据</h3>
        <div className="metadata">
          <div className="metadata-item">
            <span className="metadata-label">插件 ID:</span>
            <span className="metadata-value">{plugin.manifest.id}</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">触发器:</span>
            <span className="metadata-value">
              {plugin.manifest.triggers?.join(', ') || '无'}
            </span>
          </div>
          {plugin.installedAt && (
            <div className="metadata-item">
              <span className="metadata-label">安装时间:</span>
              <span className="metadata-value">
                {formatTimestamp(plugin.installedAt)}
              </span>
            </div>
          )}
          <div className="metadata-item">
            <span className="metadata-label">状态:</span>
            <span className={`metadata-value ${plugin.enabled ? 'enabled' : 'disabled'}`}>
              {plugin.enabled ? '已启用' : '已禁用'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PluginDetailPanel;
