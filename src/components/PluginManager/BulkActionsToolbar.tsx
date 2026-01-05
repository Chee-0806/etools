/**
 * BulkActionsToolbar Component
 * Toolbar for bulk plugin operations
 */

import React, { useState } from 'react';
import { usePluginDispatch, usePluginState } from '../../services/pluginStateStore';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { pluginManagerService } from '../../services/pluginManager';
import './BulkActionsToolbar.css';

interface BulkActionsToolbarProps {
  /**
   * Total number of filtered plugins
   */
  totalFiltered: number;

  /**
   * Filtered plugin IDs for select all
   */
  filteredPluginIds?: string[];

  /**
   * Callback when operation completes
   */
  onOperationComplete?: () => void;
}

/**
 * BulkActionsToolbar - Toolbar for bulk operations
 */
const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  totalFiltered,
  filteredPluginIds = [],
  onOperationComplete,
}) => {
  const dispatch = usePluginDispatch();
  const state = usePluginState();
  const { selectedCount, clearSelection, selectAll } = useBulkSelection();

  const [operationInProgress, setOperationInProgress] = useState(false);
  const [operationResult, setOperationResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);

  /**
   * Handle bulk enable
   */
  const handleBulkEnable = async () => {
    const selectedIds = Array.from(state.selectedPluginIds);
    if (selectedIds.length === 0) return;

    setOperationInProgress(true);
    setOperationResult(null);

    try {
      const result = await pluginManagerService.bulkEnablePlugins(selectedIds);

      setOperationResult({
        success: result.results.filter((r) => r.success).length,
        failed: result.results.filter((r) => !r.success).length,
      });

      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'success',
          title: '批量启用完成',
          message: `成功启用 ${result.results.filter((r) => r.success).length}/${selectedIds.length} 个插件`,
        },
      });

      onOperationComplete?.();
    } catch (error) {
      setOperationResult({
        success: 0,
        failed: selectedIds.length,
      });

      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'error',
          title: '批量启用失败',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } finally {
      setOperationInProgress(false);
      clearSelection();
    }
  };

  /**
   * Handle bulk disable
   */
  const handleBulkDisable = async () => {
    const selectedIds = Array.from(state.selectedPluginIds);
    if (selectedIds.length === 0) return;

    setOperationInProgress(true);
    setOperationResult(null);

    try {
      const result = await pluginManagerService.bulkDisablePlugins(selectedIds);

      setOperationResult({
        success: result.results.filter((r) => r.success).length,
        failed: result.results.filter((r) => !r.success).length,
      });

      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'success',
          title: '批量禁用完成',
          message: `成功禁用 ${result.results.filter((r) => r.success).length}/${selectedIds.length} 个插件`,
        },
      });

      onOperationComplete?.();
    } catch (error) {
      setOperationResult({
        success: 0,
        failed: selectedIds.length,
      });

      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'error',
          title: '批量禁用失败',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } finally {
      setOperationInProgress(false);
      clearSelection();
    }
  };

  /**
   * Handle bulk uninstall
   */
  const handleBulkUninstall = async () => {
    const selectedIds = Array.from(state.selectedPluginIds);
    if (selectedIds.length === 0) return;

    const confirmed = confirm(
      `确定要卸载选中的 ${selectedIds.length} 个插件吗？此操作不可撤销。`
    );

    if (!confirmed) return;

    setOperationInProgress(true);
    setOperationResult(null);

    try {
      const result = await pluginManagerService.bulkUninstallPlugins(selectedIds);

      setOperationResult({
        success: result.results.filter((r) => r.success).length,
        failed: result.results.filter((r) => !r.success).length,
      });

      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'success',
          title: '批量卸载完成',
          message: `成功卸载 ${result.results.filter((r) => r.success).length}/${selectedIds.length} 个插件`,
        },
      });

      onOperationComplete?.();
    } catch (error) {
      setOperationResult({
        success: 0,
        failed: selectedIds.length,
      });

      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'error',
          title: '批量卸载失败',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } finally {
      setOperationInProgress(false);
      clearSelection();
    }
  };

  /**
   * Handle select all visible
   */
  const handleSelectAll = () => {
    if (filteredPluginIds.length > 0) {
      selectAll(filteredPluginIds);
    }
  };

  const hasSelection = selectedCount > 0;
  const canSelectAll = selectedCount < totalFiltered;

  return (
    <div className="bulk-actions-toolbar">
      <div className="bulk-actions-info">
        <span className="bulk-actions-count">
          {hasSelection ? `已选择 ${selectedCount} 个插件` : '未选择插件'}
        </span>
        {operationResult && (
          <span className="bulk-actions-result">
            ✓ {operationResult.success} 成功
            {operationResult.failed > 0 && ` ✗ ${operationResult.failed} 失败`}
          </span>
        )}
        {canSelectAll && !hasSelection && (
          <button
            className="bulk-select-all-btn"
            onClick={handleSelectAll}
            title="选择所有可见插件"
          >
            全选 ({totalFiltered})
          </button>
        )}
      </div>

      {hasSelection && (
        <div className="bulk-actions-buttons">
          <button
            className="bulk-action-btn bulk-enable"
            onClick={handleBulkEnable}
            disabled={operationInProgress}
            title="启用所有选中的插件"
          >
            <span className="bulk-action-icon">▶</span>
            批量启用
          </button>

          <button
            className="bulk-action-btn bulk-disable"
            onClick={handleBulkDisable}
            disabled={operationInProgress}
            title="禁用所有选中的插件"
          >
            <span className="bulk-action-icon">⏸</span>
            批量禁用
          </button>

          <button
            className="bulk-action-btn bulk-uninstall"
            onClick={handleBulkUninstall}
            disabled={operationInProgress}
            title="卸载所有选中的插件"
          >
            <span className="bulk-action-icon">🗑</span>
            批量卸载
          </button>

          <button
            className="bulk-action-btn bulk-cancel"
            onClick={clearSelection}
            disabled={operationInProgress}
            title="取消选择"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default BulkActionsToolbar;
