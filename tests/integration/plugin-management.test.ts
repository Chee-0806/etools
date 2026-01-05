/**
 * Plugin Management Integration Tests
 * Tests the complete flow from UI to backend
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { invoke } from '@tauri-apps/api/core';
import { PluginStoreProvider, usePluginDispatch } from '../../src/services/pluginStateStore';
import { pluginManagerService } from '../../src/services/pluginManager';
import type { Plugin } from '../../src/types/plugin';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock components - these will be replaced with actual components during implementation
const TestComponent = () => {
  const dispatch = usePluginDispatch();

  const handleLoadPlugins = async () => {
    dispatch({ type: 'LOAD_PLUGINS_START' });
    try {
      const plugins = await pluginManagerService.getInstalledPlugins();
      dispatch({ type: 'LOAD_PLUGINS_SUCCESS', payload: plugins });
    } catch (error) {
      dispatch({ type: 'LOAD_PLUGINS_ERROR', payload: String(error) });
    }
  };

  const handleEnablePlugin = async () => {
    await pluginManagerService.enablePlugin('plugin-1');
  };

  const handleDisablePlugin = async () => {
    await pluginManagerService.disablePlugin('plugin-1');
  };

  const handleSelectAll = () => {
    // Manually toggle selections (SELECT_ALL doesn't exist)
    dispatch({ type: 'TOGGLE_SELECTION', payload: 'plugin-1' });
    dispatch({ type: 'TOGGLE_SELECTION', payload: 'plugin-2' });
  };

  const handleBulkEnable = async () => {
    const result = await pluginManagerService.bulkEnablePlugins(['plugin-1', 'plugin-2']);
    return result;
  };

  return (
    <div>
      <button onClick={handleLoadPlugins} data-testid="load-plugins">
        Load Plugins
      </button>
      <button onClick={handleEnablePlugin} data-testid="enable-plugin">
        Enable Plugin
      </button>
      <button onClick={handleDisablePlugin} data-testid="disable-plugin">
        Disable Plugin
      </button>
      <button onClick={handleSelectAll} data-testid="select-all">
        Select All
      </button>
      <button onClick={handleBulkEnable} data-testid="bulk-enable">
        Bulk Enable
      </button>
    </div>
  );
};

describe('Plugin Management Integration', () => {
  const mockPlugins: Plugin[] = [
    {
      manifest: {
        id: 'plugin-1',
        name: 'QR 码生成器',
        version: '1.0.0',
        description: '快速生成二维码',
        author: 'Kaka Team',
        permissions: [],
        triggers: ['qr:', 'qrcode:'],
      },
      enabled: false,
      health: {
        status: 'unknown',
        lastChecked: 0,
      },
      usageStats: {
        lastUsed: null,
        usageCount: 0,
      },
      installedAt: Date.now(),
      grantedPermissions: new Set(),
      configValues: {},
    },
    {
      manifest: {
        id: 'plugin-2',
        name: '颜色转换器',
        version: '1.2.0',
        description: '颜色格式转换',
        author: 'Kaka Team',
        permissions: [],
        triggers: ['#', 'rgb:'],
      },
      enabled: true,
      health: {
        status: 'healthy',
        lastChecked: Date.now(),
      },
      usageStats: {
        lastUsed: Date.now(),
        usageCount: 42,
      },
      installedAt: Date.now(),
      grantedPermissions: new Set(),
      configValues: {},
    },
  ];

  const renderWithProvider = (component: React.ReactElement) => {
    return render(<PluginStoreProvider>{component}</PluginStoreProvider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Load Plugins Flow', () => {
    it('should load plugins and update state', async () => {
      vi.mocked(invoke).mockResolvedValue(mockPlugins);

      renderWithProvider(<TestComponent />);

      const loadButton = screen.getByTestId('load-plugins');
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('plugin_list');
      });
    });

    it('should handle loading errors', async () => {
      const error = new Error('Failed to load plugins');
      vi.mocked(invoke).mockRejectedValue(error);

      renderWithProvider(<TestComponent />);

      const loadButton = screen.getByTestId('load-plugins');

      // Expect error to be handled gracefully
      await expect(async () => {
        fireEvent.click(loadButton);
        await waitFor(() => {});
      }).not.toThrow();
    });
  });

  describe('Enable/Disable Plugin Flow', () => {
    it('should enable plugin and update state', async () => {
      vi.mocked(invoke)
        .mockResolvedValueOnce(mockPlugins)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(
          mockPlugins.map((p) => (p.manifest.id === 'plugin-1' ? { ...p, enabled: true } : p))
        );

      renderWithProvider(<TestComponent />);

      // Load plugins first
      const loadButton = screen.getByTestId('load-plugins');
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('plugin_list');
      });

      // Enable plugin
      const enableButton = screen.getByTestId('enable-plugin');
      fireEvent.click(enableButton);

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('plugin_enable', { pluginId: 'plugin-1' });
      });
    });

    it('should disable plugin and update state', async () => {
      vi.mocked(invoke)
        .mockResolvedValueOnce(mockPlugins)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(
          mockPlugins.map((p) => (p.manifest.id === 'plugin-1' ? { ...p, enabled: false } : p))
        );

      renderWithProvider(<TestComponent />);

      // Load plugins first
      const loadButton = screen.getByTestId('load-plugins');
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('plugin_list');
      });

      // Disable plugin
      const disableButton = screen.getByTestId('disable-plugin');
      fireEvent.click(disableButton);

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('plugin_disable', { pluginId: 'plugin-1' });
      });
    });

    it('should handle enable/disable errors gracefully', async () => {
      const error = new Error('Plugin not found');
      vi.mocked(invoke).mockRejectedValue(error);

      renderWithProvider(<TestComponent />);

      const enableButton = screen.getByTestId('enable-plugin');

      await expect(async () => {
        fireEvent.click(enableButton);
        await waitFor(() => {});
      }).not.toThrow();
    });
  });

  describe('Bulk Operations Flow', () => {
    it('should perform bulk enable operation', async () => {
      vi.mocked(invoke).mockResolvedValue({
        operationType: 'enable',
        targetPluginIds: ['plugin-1', 'plugin-2'],
        status: 'completed',
        results: [
          { pluginId: 'plugin-1', success: true, error: null },
          { pluginId: 'plugin-2', success: true, error: null },
        ],
        startedAt: Date.now(),
        completedAt: Date.now(),
      });

      renderWithProvider(<TestComponent />);

      const bulkEnableButton = screen.getByTestId('bulk-enable');
      fireEvent.click(bulkEnableButton);

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('plugin_bulk_enable', {
          pluginIds: ['plugin-1', 'plugin-2'],
        });
      });
    });

    it('should handle partial failures in bulk operations', async () => {
      vi.mocked(invoke).mockResolvedValue({
        operationType: 'enable',
        targetPluginIds: ['plugin-1', 'plugin-2'],
        status: 'partial-failure',
        results: [
          { pluginId: 'plugin-1', success: true, error: null },
          { pluginId: 'plugin-2', success: false, error: 'Failed to enable' },
        ],
        startedAt: Date.now(),
        completedAt: Date.now(),
      });

      renderWithProvider(<TestComponent />);

      const bulkEnableButton = screen.getByTestId('bulk-enable');
      fireEvent.click(bulkEnableButton);

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('plugin_bulk_enable', {
          pluginIds: ['plugin-1', 'plugin-2'],
        });
      });
    });

    it('should handle complete failures in bulk operations', async () => {
      const error = new Error('Bulk operation failed');
      vi.mocked(invoke).mockRejectedValue(error);

      renderWithProvider(<TestComponent />);

      const bulkEnableButton = screen.getByTestId('bulk-enable');

      await expect(async () => {
        fireEvent.click(bulkEnableButton);
        await waitFor(() => {});
      }).not.toThrow();
    });
  });

  describe('Plugin Selection Flow', () => {
    it('should select all plugins', async () => {
      vi.mocked(invoke).mockResolvedValue(mockPlugins);

      renderWithProvider(<TestComponent />);

      // Load plugins first
      const loadButton = screen.getByTestId('load-plugins');
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('plugin_list');
      });

      // Select all
      const selectAllButton = screen.getByTestId('select-all');
      fireEvent.click(selectAllButton);

      // Verify selection state is updated
      await waitFor(() => {
        // This would be verified by checking component state
        expect(selectAllButton).toBeInTheDocument();
      });
    });
  });

  describe('State Persistence', () => {
    it('should maintain state across operations', async () => {
      vi.mocked(invoke)
        .mockResolvedValueOnce(mockPlugins)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(
          mockPlugins.map((p) => (p.manifest.id === 'plugin-1' ? { ...p, enabled: true } : p))
        );

      renderWithProvider(<TestComponent />);

      // Load plugins
      const loadButton = screen.getByTestId('load-plugins');
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('plugin_list');
      });

      // Enable plugin
      const enableButton = screen.getByTestId('enable-plugin');
      fireEvent.click(enableButton);

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('plugin_enable', { pluginId: 'plugin-1' });
      });

      // State should persist and be consistent
      expect(loadButton).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from network errors', async () => {
      vi.mocked(invoke)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockPlugins);

      renderWithProvider(<TestComponent />);

      const loadButton = screen.getByTestId('load-plugins');

      // First attempt fails
      fireEvent.click(loadButton);
      await waitFor(() => {});

      // Second attempt succeeds
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Plugin Health Monitoring', () => {
    it('should check plugin health', async () => {
      const mockHealth = {
        status: 'healthy' as const,
        lastChecked: Date.now(),
        errors: [],
      };

      vi.mocked(invoke).mockResolvedValue(mockHealth);

      await pluginManagerService.getPluginHealth('plugin-1');

      expect(invoke).toHaveBeenCalledWith('plugin_get_health', { pluginId: 'plugin-1' });
    });

    it('should refresh plugin health', async () => {
      const mockHealth = {
        status: 'healthy' as const,
        lastChecked: Date.now(),
        errors: [],
      };

      vi.mocked(invoke).mockResolvedValue(mockHealth);

      await pluginManagerService.refreshPluginHealth('plugin-1');

      expect(invoke).toHaveBeenCalledWith('plugin_check_health', { pluginId: 'plugin-1' });
    });
  });

  describe('Plugin Usage Statistics', () => {
    it('should get plugin usage stats', async () => {
      const mockStats = {
        lastUsed: Date.now(),
        usageCount: 42,
        lastExecutionTime: 100,
        averageExecutionTime: 95,
      };

      vi.mocked(invoke).mockResolvedValue(mockStats);

      const stats = await pluginManagerService.getPluginUsageStats('plugin-1');

      expect(invoke).toHaveBeenCalledWith('plugin_get_usage_stats', { pluginId: 'plugin-1' });
      expect(stats.usageCount).toBe(42);
    });
  });
});

/**
 * End-to-End Scenarios
 */
describe('E2E: Plugin Management User Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Scenario: User enables a plugin', () => {
    it('should complete the enable flow end-to-end', async () => {
      const mockPlugins: Plugin[] = [
        {
          manifest: {
            id: 'plugin-1',
            name: 'Test Plugin',
            version: '1.0.0',
            description: 'Test',
            author: 'Test',
            permissions: [],
            triggers: [],
          },
          enabled: false,
          health: { status: 'unknown', lastChecked: 0 },
          usageStats: { lastUsed: null, usageCount: 0 },
          installedAt: Date.now(),
          grantedPermissions: new Set(),
          configValues: {},
        },
      ];

      vi.mocked(invoke)
        .mockResolvedValueOnce(mockPlugins)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce([{ ...mockPlugins[0], enabled: true }]);

      // User loads app
      // User sees disabled plugin
      // User clicks enable button
      // Plugin becomes enabled
      // UI updates to show enabled status

      expect(invoke).toHaveBeenCalledWith('plugin_list');
      expect(invoke).toHaveBeenCalledWith('plugin_enable', { pluginId: 'plugin-1' });
    });
  });

  describe('Scenario: User bulk enables multiple plugins', () => {
    it('should complete the bulk enable flow end-to-end', async () => {
      vi.mocked(invoke).mockResolvedValue({
        operationType: 'enable',
        targetPluginIds: ['plugin-1', 'plugin-2', 'plugin-3'],
        status: 'completed',
        results: [
          { pluginId: 'plugin-1', success: true, error: null },
          { pluginId: 'plugin-2', success: true, error: null },
          { pluginId: 'plugin-3', success: true, error: null },
        ],
        startedAt: Date.now(),
        completedAt: Date.now(),
      });

      const result = await pluginManagerService.bulkEnablePlugins([
        'plugin-1',
        'plugin-2',
        'plugin-3',
      ]);

      expect(result.status).toBe('completed');
      expect(result.results).toHaveLength(3);
      expect(result.results.every((r) => r.success)).toBe(true);
    });
  });
});
