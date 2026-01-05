/**
 * PluginManagerService Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
  PluginManagerService,
  MarketplaceService,
  pluginManagerService,
  marketplaceService,
} from '../../../src/services/pluginManager';
import type { Plugin, MarketplacePlugin, BulkOperation } from '../../../src/types/plugin';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('PluginManagerService', () => {
  let service: PluginManagerService;

  const mockPlugins: Plugin[] = [
    {
      id: 'plugin-1',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'Test description',
      author: 'Test Author',
      enabled: true,
      permissions: [],
      entryPoint: 'index.js',
      triggers: ['test:'],
      settings: {},
      health: {
        status: 'healthy',
        lastChecked: Date.now(),
      },
      usageStats: {
        lastUsed: Date.now(),
        usageCount: 10,
      },
      installedAt: Date.now(),
    },
  ];

  beforeEach(() => {
    service = new PluginManagerService();
    vi.clearAllMocks();
  });

  describe('getInstalledPlugins', () => {
    it('should return list of installed plugins', async () => {
      vi.mocked(invoke).mockResolvedValue(mockPlugins);

      const result = await service.getInstalledPlugins();

      expect(invoke).toHaveBeenCalledWith('plugin_list');
      expect(result).toEqual(mockPlugins);
    });

    it('should throw error when invoke fails', async () => {
      const error = new Error('Failed to load plugins');
      vi.mocked(invoke).mockRejectedValue(error);

      await expect(service.getInstalledPlugins()).rejects.toThrow('Failed to load plugins');
    });

    it('should handle empty plugin list', async () => {
      vi.mocked(invoke).mockResolvedValue([]);

      const result = await service.getInstalledPlugins();

      expect(result).toEqual([]);
      expect(invoke).toHaveBeenCalledWith('plugin_list');
    });
  });

  describe('enablePlugin', () => {
    it('should enable plugin successfully', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await service.enablePlugin('plugin-1');

      expect(invoke).toHaveBeenCalledWith('plugin_enable', { pluginId: 'plugin-1' });
    });

    it('should throw error when enable fails', async () => {
      const error = new Error('Plugin not found');
      vi.mocked(invoke).mockRejectedValue(error);

      await expect(service.enablePlugin('plugin-1')).rejects.toThrow('Failed to enable plugin');
    });
  });

  describe('disablePlugin', () => {
    it('should disable plugin successfully', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await service.disablePlugin('plugin-1');

      expect(invoke).toHaveBeenCalledWith('plugin_disable', { pluginId: 'plugin-1' });
    });

    it('should throw error when disable fails', async () => {
      const error = new Error('Plugin not found');
      vi.mocked(invoke).mockRejectedValue(error);

      await expect(service.disablePlugin('plugin-1')).rejects.toThrow('Failed to disable plugin');
    });
  });

  describe('bulkEnablePlugins', () => {
    it('should bulk enable plugins successfully', async () => {
      const mockResult: BulkOperation = {
        operationType: 'enable',
        targetPluginIds: ['plugin-1', 'plugin-2'],
        status: 'completed',
        results: [
          { pluginId: 'plugin-1', success: true, error: null },
          { pluginId: 'plugin-2', success: true, error: null },
        ],
        startedAt: Date.now(),
        completedAt: Date.now(),
      };

      vi.mocked(invoke).mockResolvedValue(mockResult);

      const result = await service.bulkEnablePlugins(['plugin-1', 'plugin-2']);

      expect(invoke).toHaveBeenCalledWith('plugin_bulk_enable', {
        pluginIds: ['plugin-1', 'plugin-2'],
      });
      expect(result).toEqual(mockResult);
    });

    it('should throw error when bulk enable fails', async () => {
      const error = new Error('Bulk operation failed');
      vi.mocked(invoke).mockRejectedValue(error);

      await expect(service.bulkEnablePlugins(['plugin-1'])).rejects.toThrow(
        'Failed to enable plugins'
      );
    });
  });

  describe('bulkDisablePlugins', () => {
    it('should bulk disable plugins successfully', async () => {
      const mockResult: BulkOperation = {
        operationType: 'disable',
        targetPluginIds: ['plugin-1', 'plugin-2'],
        status: 'completed',
        results: [
          { pluginId: 'plugin-1', success: true, error: null },
          { pluginId: 'plugin-2', success: true, error: null },
        ],
        startedAt: Date.now(),
        completedAt: Date.now(),
      };

      vi.mocked(invoke).mockResolvedValue(mockResult);

      const result = await service.bulkDisablePlugins(['plugin-1', 'plugin-2']);

      expect(invoke).toHaveBeenCalledWith('plugin_bulk_disable', {
        pluginIds: ['plugin-1', 'plugin-2'],
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('uninstallPlugin', () => {
    it('should uninstall plugin successfully', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await service.uninstallPlugin('plugin-1');

      expect(invoke).toHaveBeenCalledWith('plugin_uninstall', { pluginId: 'plugin-1' });
    });

    it('should throw error when uninstall fails', async () => {
      const error = new Error('Failed to uninstall');
      vi.mocked(invoke).mockRejectedValue(error);

      await expect(service.uninstallPlugin('plugin-1')).rejects.toThrow(
        'Failed to uninstall plugin'
      );
    });
  });

  describe('getPluginHealth', () => {
    it('should return plugin health', async () => {
      const mockHealth = {
        status: 'healthy' as const,
        lastChecked: Date.now(),
        errors: [],
      };

      vi.mocked(invoke).mockResolvedValue(mockHealth);

      const result = await service.getPluginHealth('plugin-1');

      expect(invoke).toHaveBeenCalledWith('plugin_get_health', { pluginId: 'plugin-1' });
      expect(result).toEqual(mockHealth);
    });
  });

  describe('refreshPluginHealth', () => {
    it('should refresh plugin health', async () => {
      const mockHealth = {
        status: 'healthy' as const,
        lastChecked: Date.now(),
        errors: [],
      };

      vi.mocked(invoke).mockResolvedValue(mockHealth);

      const result = await service.refreshPluginHealth('plugin-1');

      expect(invoke).toHaveBeenCalledWith('plugin_check_health', { pluginId: 'plugin-1' });
      expect(result).toEqual(mockHealth);
    });
  });

  describe('getPluginUsageStats', () => {
    it('should return plugin usage stats', async () => {
      const mockStats = {
        lastUsed: Date.now(),
        usageCount: 42,
      };

      vi.mocked(invoke).mockResolvedValue(mockStats);

      const result = await service.getPluginUsageStats('plugin-1');

      expect(invoke).toHaveBeenCalledWith('plugin_get_usage_stats', { pluginId: 'plugin-1' });
      expect(result).toEqual(mockStats);
    });
  });

  describe('updatePluginConfig', () => {
    it('should update plugin config', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      const config = { setting1: 'value1', setting2: 123 };

      await service.updatePluginConfig('plugin-1', config);

      expect(invoke).toHaveBeenCalledWith('plugin_update_config', {
        pluginId: 'plugin-1',
        config,
      });
    });
  });

  describe('grantPermissions', () => {
    it('should grant permissions to plugin', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      const permissions = ['network', 'filesystem'];

      await service.grantPermissions('plugin-1', permissions);

      expect(invoke).toHaveBeenCalledWith('plugin_grant_permissions', {
        pluginId: 'plugin-1',
        permissions,
      });
    });
  });

  describe('revokePermissions', () => {
    it('should revoke permissions from plugin', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      const permissions = ['network'];

      await service.revokePermissions('plugin-1', permissions);

      expect(invoke).toHaveBeenCalledWith('plugin_revoke_permissions', {
        pluginId: 'plugin-1',
        permissions,
      });
    });
  });
});

describe('MarketplaceService', () => {
  let service: MarketplaceService;

  const mockMarketplacePlugins: MarketplacePlugin[] = [
    {
      id: 'marketplace-plugin-1',
      name: 'Marketplace Plugin',
      version: '1.0.0',
      description: 'Test marketplace plugin',
      author: 'Test Author',
      permissions: [],
      triggers: ['test:'],
      icon: null,
      homepage: null,
      repository: null,
      downloadCount: 1000,
      rating: 4.5,
      ratingCount: 100,
      category: 'productivity',
      installed: false,
      installedVersion: null,
      updateAvailable: false,
      latestVersion: '1.0.0',
      screenshots: null,
      tags: ['test'],
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  beforeEach(() => {
    service = new MarketplaceService();
    vi.clearAllMocks();
  });

  describe('getMarketplacePlugins', () => {
    it('should return marketplace plugins with pagination', async () => {
      vi.mocked(invoke).mockResolvedValue({
        plugins: mockMarketplacePlugins,
        total: 1,
        page: 1,
        pageSize: 20,
        hasMore: false,
      });

      const result = await service.getMarketplacePlugins({ page: 1, pageSize: 20 });

      expect(invoke).toHaveBeenCalledWith('marketplace_list', {
        category: undefined,
        page: 1,
        pageSize: 20,
      });
      expect(result.plugins).toEqual(mockMarketplacePlugins);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('should filter by category', async () => {
      vi.mocked(invoke).mockResolvedValue({
        plugins: mockMarketplacePlugins,
        total: 1,
        page: 1,
        pageSize: 20,
        hasMore: false,
      });

      await service.getMarketplacePlugins({ category: 'productivity' });

      expect(invoke).toHaveBeenCalledWith('marketplace_list', {
        category: 'productivity',
        page: 1,
        pageSize: 20,
      });
    });
  });

  describe('searchMarketplace', () => {
    it('should search marketplace plugins', async () => {
      vi.mocked(invoke).mockResolvedValue({
        plugins: mockMarketplacePlugins,
        total: 1,
        page: 1,
        pageSize: 20,
        hasMore: false,
      });

      const result = await service.searchMarketplace('test query');

      expect(invoke).toHaveBeenCalledWith('marketplace_search', {
        query: 'test query',
        category: undefined,
        page: 1,
        pageSize: 20,
      });
      expect(result.plugins).toEqual(mockMarketplacePlugins);
    });
  });

  describe('installPlugin', () => {
    it('should install plugin from marketplace', async () => {
      const mockPlugin: Plugin = {
        id: 'installed-plugin-1',
        name: 'Installed Plugin',
        version: '1.0.0',
        description: 'Installed plugin',
        author: 'Test Author',
        enabled: true,
        permissions: [],
        entryPoint: 'index.js',
        triggers: ['test:'],
        settings: {},
        health: {
          status: 'healthy',
          lastChecked: Date.now(),
        },
        usageStats: {
          lastUsed: null,
          usageCount: 0,
        },
        installedAt: Date.now(),
      };

      vi.mocked(invoke).mockResolvedValue(mockPlugin);

      const result = await service.installPlugin('marketplace-plugin-1');

      expect(invoke).toHaveBeenCalledWith('marketplace_install', {
        pluginId: 'marketplace-plugin-1',
      });
      expect(result).toEqual(mockPlugin);
    });
  });

  describe('checkUpdates', () => {
    it('should return list of plugin IDs with updates', async () => {
      const updateIds = ['plugin-1', 'plugin-2'];
      vi.mocked(invoke).mockResolvedValue(updateIds);

      const result = await service.checkUpdates();

      expect(invoke).toHaveBeenCalledWith('marketplace_check_updates');
      expect(result).toEqual(updateIds);
    });

    it('should return empty array when no updates', async () => {
      vi.mocked(invoke).mockResolvedValue([]);

      const result = await service.checkUpdates();

      expect(result).toEqual([]);
    });
  });

  describe('getCategories', () => {
    it('should return list of plugin categories', () => {
      const categories = service.getCategories();

      expect(categories).toEqual([
        'productivity',
        'developer',
        'utilities',
        'search',
        'media',
        'integration',
      ]);
    });
  });
});

describe('Exported Instances', () => {
  it('should export pluginManagerService singleton', () => {
    expect(pluginManagerService).toBeInstanceOf(PluginManagerService);
  });

  it('should export marketplaceService singleton', () => {
    expect(marketplaceService).toBeInstanceOf(MarketplaceService);
  });
});
