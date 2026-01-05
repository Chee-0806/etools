/**
 * usePluginManager Hook
 * Custom hook for plugin management operations
 */

import { useCallback } from 'react';
import { usePluginDispatch, usePluginState } from '../services/pluginStateStore';
import { pluginManagerService } from '../services/pluginManager';
import type { Plugin, BulkOperation, PluginHealth, PluginUsageStats } from '../types/plugin';

export interface UsePluginManagerReturn {
  // State
  plugins: Plugin[];
  loading: boolean;
  error: string | null;

  // Operations
  loadPlugins: () => Promise<void>;
  enablePlugin: (pluginId: string) => Promise<void>;
  disablePlugin: (pluginId: string) => Promise<void>;
  bulkEnablePlugins: (pluginIds: string[]) => Promise<BulkOperation>;
  uninstallPlugin: (pluginId: string) => Promise<void>;

  // Health & Stats
  getPluginHealth: (pluginId: string) => Promise<PluginHealth>;
  refreshPluginHealth: (pluginId: string) => Promise<PluginHealth>;
  getPluginUsageStats: (pluginId: string) => Promise<PluginUsageStats>;

  // Configuration
  updatePluginConfig: (
    pluginId: string,
    config: Record<string, string | number | boolean>
  ) => Promise<void>;
  grantPermissions: (pluginId: string, permissions: string[]) => Promise<void>;
  revokePermissions: (pluginId: string, permissions: string[]) => Promise<void>;
}

/**
 * Custom hook for plugin management operations
 *
 * Provides methods for managing plugins with automatic state updates.
 *
 * @example
 * ```tsx
 * const { plugins, loading, enablePlugin, disablePlugin } = usePluginManager();
 *
 * if (loading) return <div>Loading...</div>;
 * return (
 *   <ul>
 *     {plugins.map(plugin => (
 *       <li key={plugin.id}>
 *         {plugin.name}
 *         <button onClick={() => enablePlugin(plugin.id)}>Enable</button>
 *       </li>
 *     ))}
 *   </ul>
 * );
 * ```
 */
export const usePluginManager = (): UsePluginManagerReturn => {
  const dispatch = usePluginDispatch();
  const state = usePluginState();

  /**
   * Load all installed plugins
   */
  const loadPlugins = useCallback(async () => {
    try {
      dispatch({ type: 'LOAD_PLUGINS_START' });
      const plugins = await pluginManagerService.getInstalledPlugins();
      dispatch({ type: 'LOAD_PLUGINS_SUCCESS', payload: plugins });
    } catch (error) {
      dispatch({
        type: 'LOAD_PLUGINS_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to load plugins',
      });
      throw error;
    }
  }, [dispatch]);

  /**
   * Enable a plugin
   */
  const enablePlugin = useCallback(async (pluginId: string) => {
    try {
      await pluginManagerService.enablePlugin(pluginId);
      dispatch({ type: 'ENABLE_PLUGIN', payload: pluginId });
      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'success',
          title: '成功',
          message: '插件已启用',
        },
      });
    } catch (error) {
      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'error',
          title: '错误',
          message: `启用插件失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
      throw error;
    }
  }, [dispatch]);

  /**
   * Disable a plugin
   */
  const disablePlugin = useCallback(async (pluginId: string) => {
    try {
      await pluginManagerService.disablePlugin(pluginId);
      dispatch({ type: 'DISABLE_PLUGIN', payload: pluginId });
      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'success',
          title: '成功',
          message: '插件已禁用',
        },
      });
    } catch (error) {
      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'error',
          title: '错误',
          message: `禁用插件失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
      throw error;
    }
  }, [dispatch]);

  /**
   * Bulk enable plugins
   */
  const bulkEnablePlugins = useCallback(async (pluginIds: string[]) => {
    try {
      dispatch({ type: 'BULK_ENABLE_START', payload: pluginIds });
      const result = await pluginManagerService.bulkEnablePlugins(pluginIds);

      // Update individual plugin states
      for (const resultItem of result.results) {
        if (resultItem.success) {
          dispatch({ type: 'ENABLE_PLUGIN', payload: resultItem.pluginId });
        }
        // Report progress
        dispatch({
          type: 'BULK_ENABLE_PROGRESS',
          payload: { pluginId: resultItem.pluginId, success: resultItem.success },
        });
      }

      dispatch({ type: 'BULK_ENABLE_COMPLETE' });

      return result;
    } catch (error) {
      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'error',
          title: '错误',
          message: `批量启用失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
      throw error;
    }
  }, [dispatch]);

  /**
   * Uninstall a plugin
   */
  const uninstallPlugin = useCallback(async (pluginId: string) => {
    try {
      await pluginManagerService.uninstallPlugin(pluginId);
      dispatch({ type: 'UNINSTALL_PLUGIN', payload: pluginId });
      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'success',
          title: '成功',
          message: '插件已卸载',
        },
      });
    } catch (error) {
      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'error',
          title: '错误',
          message: `卸载插件失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
      throw error;
    }
  }, [dispatch]);

  /**
   * Get plugin health
   */
  const getPluginHealth = useCallback(async (pluginId: string): Promise<PluginHealth> => {
    return await pluginManagerService.getPluginHealth(pluginId);
  }, []);

  /**
   * Refresh plugin health
   */
  const refreshPluginHealth = useCallback(async (pluginId: string): Promise<PluginHealth> => {
    return await pluginManagerService.refreshPluginHealth(pluginId);
  }, []);

  /**
   * Get plugin usage stats
   */
  const getPluginUsageStats = useCallback(async (pluginId: string): Promise<PluginUsageStats> => {
    return await pluginManagerService.getPluginUsageStats(pluginId);
  }, []);

  /**
   * Update plugin configuration
   */
  const updatePluginConfig = useCallback(
    async (pluginId: string, config: Record<string, string | number | boolean>) => {
      try {
        await pluginManagerService.updatePluginConfig(pluginId, config);
        dispatch({
          type: 'SHOW_NOTIFICATION',
          payload: {
            type: 'success',
            title: '成功',
            message: '配置已更新',
          },
        });
      } catch (error) {
        dispatch({
          type: 'SHOW_NOTIFICATION',
          payload: {
            type: 'error',
            title: '错误',
            message: `更新配置失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        });
        throw error;
      }
    },
    [dispatch]
  );

  /**
   * Grant permissions
   */
  const grantPermissions = useCallback(
    async (pluginId: string, permissions: string[]) => {
      try {
        await pluginManagerService.grantPermissions(pluginId, permissions);
        dispatch({
          type: 'SHOW_NOTIFICATION',
          payload: {
            type: 'success',
            title: '成功',
            message: '权限已授予',
          },
        });
      } catch (error) {
        dispatch({
          type: 'SHOW_NOTIFICATION',
          payload: {
            type: 'error',
            title: '错误',
            message: `授予权限失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        });
        throw error;
      }
    },
    [dispatch]
  );

  /**
   * Revoke permissions
   */
  const revokePermissions = useCallback(
    async (pluginId: string, permissions: string[]) => {
      try {
        await pluginManagerService.revokePermissions(pluginId, permissions);
        dispatch({
          type: 'SHOW_NOTIFICATION',
          payload: {
            type: 'success',
            title: '成功',
            message: '权限已撤销',
          },
        });
      } catch (error) {
        dispatch({
          type: 'SHOW_NOTIFICATION',
          payload: {
            type: 'error',
            title: '错误',
            message: `撤销权限失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        });
        throw error;
      }
    },
    [dispatch]
  );

  return {
    plugins: state.plugins,
    loading: state.loading,
    error: state.error,
    loadPlugins,
    enablePlugin,
    disablePlugin,
    bulkEnablePlugins,
    uninstallPlugin,
    getPluginHealth,
    refreshPluginHealth,
    getPluginUsageStats,
    updatePluginConfig,
    grantPermissions,
    revokePermissions,
  };
};

export default usePluginManager;
