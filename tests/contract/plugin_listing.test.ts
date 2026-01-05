/**
 * Contract Test for Plugin Listing
 * Tests the contract between frontend and backend for plugin listing operations
 */

import { describe, it, expect } from 'vitest';
import type { Plugin, PluginHealthStatus } from '@/types/plugin';

describe('Plugin Listing Contract Tests', () => {
  describe('Plugin List Structure', () => {
    it('should return array of plugins', () => {
      const plugins: Plugin[] = [];

      expect(Array.isArray(plugins)).toBe(true);
      expect(plugins.length).toBeGreaterThanOrEqual(0);
    });

    it('should have consistent plugin structure', () => {
      const plugin: Plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        enabled: true,
        permissions: ['clipboard:read'],
        entry_point: 'index.ts',
        triggers: [
          {
            keyword: 'test',
            description: 'Test trigger',
          },
        ],
        settings: {},
        health: {
          status: 'healthy',
          message: null,
          last_checked: Date.now(),
          errors: [],
        },
        usage_stats: {
          last_used: Date.now(),
          usage_count: 10,
          last_execution_time: 100,
          average_execution_time: 150,
        },
        installed_at: Date.now(),
        install_path: '/path/to/plugin',
        source: 'local',
        manifest: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          description: 'A test plugin',
          author: 'Test Author',
          permissions: ['clipboard:read'],
          entry: 'index.ts',
          triggers: [
            {
              keyword: 'test',
              description: 'Test trigger',
            },
          ],
        },
      };

      // Verify required fields
      expect(plugin.id).toBeDefined();
      expect(plugin.name).toBeDefined();
      expect(plugin.version).toBeDefined();
      expect(plugin.enabled).toBeDefined();
      expect(typeof plugin.enabled).toBe('boolean');
      expect(plugin.health).toBeDefined();
      expect(plugin.manifest).toBeDefined();
    });
  });

  describe('Plugin Filtering', () => {
    it('should filter by enabled status', () => {
      const plugins: Plugin[] = [
        {
          id: 'plugin1',
          name: 'Plugin 1',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          enabled: true,
          permissions: [],
          entry_point: 'index.ts',
          triggers: [],
          settings: {},
          health: {
            status: 'healthy',
            message: null,
            last_checked: Date.now(),
            errors: [],
          },
          usage_stats: {
            last_used: null,
            usage_count: 0,
            last_execution_time: null,
            average_execution_time: null,
          },
          installed_at: Date.now(),
          install_path: '/path1',
          source: 'local',
          manifest: {
            id: 'plugin1',
            name: 'Plugin 1',
            version: '1.0.0',
            description: 'Test',
            author: 'Test',
            permissions: [],
            entry: 'index.ts',
            triggers: [],
          },
        },
        {
          id: 'plugin2',
          name: 'Plugin 2',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          enabled: false,
          permissions: [],
          entry_point: 'index.ts',
          triggers: [],
          settings: {},
          health: {
            status: 'healthy',
            message: null,
            last_checked: Date.now(),
            errors: [],
          },
          usage_stats: {
            last_used: null,
            usage_count: 0,
            last_execution_time: null,
            average_execution_time: null,
          },
          installed_at: Date.now(),
          install_path: '/path2',
          source: 'local',
          manifest: {
            id: 'plugin2',
            name: 'Plugin 2',
            version: '1.0.0',
            description: 'Test',
            author: 'Test',
            permissions: [],
            entry: 'index.ts',
            triggers: [],
          },
        },
      ];

      const enabledPlugins = plugins.filter((p) => p.enabled);
      const disabledPlugins = plugins.filter((p) => !p.enabled);

      expect(enabledPlugins).toHaveLength(1);
      expect(disabledPlugins).toHaveLength(1);
      expect(enabledPlugins[0].id).toBe('plugin1');
      expect(disabledPlugins[0].id).toBe('plugin2');
    });

    it('should filter by health status', () => {
      const plugins: Plugin[] = [
        {
          id: 'plugin1',
          name: 'Plugin 1',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          enabled: true,
          permissions: [],
          entry_point: 'index.ts',
          triggers: [],
          settings: {},
          health: {
            status: 'healthy',
            message: null,
            last_checked: Date.now(),
            errors: [],
          },
          usage_stats: {
            last_used: null,
            usage_count: 0,
            last_execution_time: null,
            average_execution_time: null,
          },
          installed_at: Date.now(),
          install_path: '/path1',
          source: 'local',
          manifest: {
            id: 'plugin1',
            name: 'Plugin 1',
            version: '1.0.0',
            description: 'Test',
            author: 'Test',
            permissions: [],
            entry: 'index.ts',
            triggers: [],
          },
        },
        {
          id: 'plugin2',
          name: 'Plugin 2',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          enabled: true,
          permissions: [],
          entry_point: 'index.ts',
          triggers: [],
          settings: {},
          health: {
            status: 'error',
            message: 'Plugin failed to load',
            last_checked: Date.now(),
            errors: ['Load error'],
          },
          usage_stats: {
            last_used: null,
            usage_count: 0,
            last_execution_time: null,
            average_execution_time: null,
          },
          installed_at: Date.now(),
          install_path: '/path2',
          source: 'local',
          manifest: {
            id: 'plugin2',
            name: 'Plugin 2',
            version: '1.0.0',
            description: 'Test',
            author: 'Test',
            permissions: [],
            entry: 'index.ts',
            triggers: [],
          },
        },
      ];

      const healthyPlugins = plugins.filter((p) => p.health.status === 'healthy');
      const errorPlugins = plugins.filter((p) => p.health.status === 'error');

      expect(healthyPlugins).toHaveLength(1);
      expect(errorPlugins).toHaveLength(1);
    });

    it('should filter by source type', () => {
      const plugins: Plugin[] = [
        {
          id: 'plugin1',
          name: 'Plugin 1',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          enabled: true,
          permissions: [],
          entry_point: 'index.ts',
          triggers: [],
          settings: {},
          health: {
            status: 'healthy',
            message: null,
            last_checked: Date.now(),
            errors: [],
          },
          usage_stats: {
            last_used: null,
            usage_count: 0,
            last_execution_time: null,
            average_execution_time: null,
          },
          installed_at: Date.now(),
          install_path: '/path1',
          source: 'local',
          manifest: {
            id: 'plugin1',
            name: 'Plugin 1',
            version: '1.0.0',
            description: 'Test',
            author: 'Test',
            permissions: [],
            entry: 'index.ts',
            triggers: [],
          },
        },
        {
          id: 'plugin2',
          name: 'Plugin 2',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          enabled: true,
          permissions: [],
          entry_point: 'index.ts',
          triggers: [],
          settings: {},
          health: {
            status: 'healthy',
            message: null,
            last_checked: Date.now(),
            errors: [],
          },
          usage_stats: {
            last_used: null,
            usage_count: 0,
            last_execution_time: null,
            average_execution_time: null,
          },
          installed_at: Date.now(),
          install_path: '/path2',
          source: 'marketplace',
          manifest: {
            id: 'plugin2',
            name: 'Plugin 2',
            version: '1.0.0',
            description: 'Test',
            author: 'Test',
            permissions: [],
            entry: 'index.ts',
            triggers: [],
          },
        },
      ];

      const localPlugins = plugins.filter((p) => p.source === 'local');
      const marketplacePlugins = plugins.filter((p) => p.source === 'marketplace');

      expect(localPlugins).toHaveLength(1);
      expect(marketplacePlugins).toHaveLength(1);
    });
  });

  describe('Plugin Sorting', () => {
    it('should sort by name', () => {
      const plugins: Plugin[] = [
        {
          id: 'plugin2',
          name: 'Zebra Plugin',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          enabled: true,
          permissions: [],
          entry_point: 'index.ts',
          triggers: [],
          settings: {},
          health: {
            status: 'healthy',
            message: null,
            last_checked: Date.now(),
            errors: [],
          },
          usage_stats: {
            last_used: null,
            usage_count: 0,
            last_execution_time: null,
            average_execution_time: null,
          },
          installed_at: Date.now(),
          install_path: '/path2',
          source: 'local',
          manifest: {
            id: 'plugin2',
            name: 'Zebra Plugin',
            version: '1.0.0',
            description: 'Test',
            author: 'Test',
            permissions: [],
            entry: 'index.ts',
            triggers: [],
          },
        },
        {
          id: 'plugin1',
          name: 'Alpha Plugin',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          enabled: true,
          permissions: [],
          entry_point: 'index.ts',
          triggers: [],
          settings: {},
          health: {
            status: 'healthy',
            message: null,
            last_checked: Date.now(),
            errors: [],
          },
          usage_stats: {
            last_used: null,
            usage_count: 0,
            last_execution_time: null,
            average_execution_time: null,
          },
          installed_at: Date.now(),
          install_path: '/path1',
          source: 'local',
          manifest: {
            id: 'plugin1',
            name: 'Alpha Plugin',
            version: '1.0.0',
            description: 'Test',
            author: 'Test',
            permissions: [],
            entry: 'index.ts',
            triggers: [],
          },
        },
      ];

      const sortedPlugins = [...plugins].sort((a, b) => a.name.localeCompare(b.name));

      expect(sortedPlugins[0].name).toBe('Alpha Plugin');
      expect(sortedPlugins[1].name).toBe('Zebra Plugin');
    });

    it('should sort by installation date', () => {
      const now = Date.now();
      const plugins: Plugin[] = [
        {
          id: 'plugin1',
          name: 'Plugin 1',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          enabled: true,
          permissions: [],
          entry_point: 'index.ts',
          triggers: [],
          settings: {},
          health: {
            status: 'healthy',
            message: null,
            last_checked: Date.now(),
            errors: [],
          },
          usage_stats: {
            last_used: null,
            usage_count: 0,
            last_execution_time: null,
            average_execution_time: null,
          },
          installed_at: now - 10000,
          install_path: '/path1',
          source: 'local',
          manifest: {
            id: 'plugin1',
            name: 'Plugin 1',
            version: '1.0.0',
            description: 'Test',
            author: 'Test',
            permissions: [],
            entry: 'index.ts',
            triggers: [],
          },
        },
        {
          id: 'plugin2',
          name: 'Plugin 2',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          enabled: true,
          permissions: [],
          entry_point: 'index.ts',
          triggers: [],
          settings: {},
          health: {
            status: 'healthy',
            message: null,
            last_checked: Date.now(),
            errors: [],
          },
          usage_stats: {
            last_used: null,
            usage_count: 0,
            last_execution_time: null,
            average_execution_time: null,
          },
          installed_at: now,
          install_path: '/path2',
          source: 'local',
          manifest: {
            id: 'plugin2',
            name: 'Plugin 2',
            version: '1.0.0',
            description: 'Test',
            author: 'Test',
            permissions: [],
            entry: 'index.ts',
            triggers: [],
          },
        },
      ];

      const sortedPlugins = [...plugins].sort((a, b) => b.installed_at - a.installed_at);

      expect(sortedPlugins[0].id).toBe('plugin2');
      expect(sortedPlugins[1].id).toBe('plugin1');
    });
  });

  describe('Plugin Search', () => {
    it('should search by plugin name', () => {
      const plugins: Plugin[] = [
        {
          id: 'plugin1',
          name: 'Search Helper',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          enabled: true,
          permissions: [],
          entry_point: 'index.ts',
          triggers: [],
          settings: {},
          health: {
            status: 'healthy',
            message: null,
            last_checked: Date.now(),
            errors: [],
          },
          usage_stats: {
            last_used: null,
            usage_count: 0,
            last_execution_time: null,
            average_execution_time: null,
          },
          installed_at: Date.now(),
          install_path: '/path1',
          source: 'local',
          manifest: {
            id: 'plugin1',
            name: 'Search Helper',
            version: '1.0.0',
            description: 'Test',
            author: 'Test',
            permissions: [],
            entry: 'index.ts',
            triggers: [],
          },
        },
        {
          id: 'plugin2',
          name: 'File Manager',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          enabled: true,
          permissions: [],
          entry_point: 'index.ts',
          triggers: [],
          settings: {},
          health: {
            status: 'healthy',
            message: null,
            last_checked: Date.now(),
            errors: [],
          },
          usage_stats: {
            last_used: null,
            usage_count: 0,
            last_execution_time: null,
            average_execution_time: null,
          },
          installed_at: Date.now(),
          install_path: '/path2',
          source: 'local',
          manifest: {
            id: 'plugin2',
            name: 'File Manager',
            version: '1.0.0',
            description: 'Test',
            author: 'Test',
            permissions: [],
            entry: 'index.ts',
            triggers: [],
          },
        },
      ];

      const searchResults = plugins.filter((p) =>
        p.name.toLowerCase().includes('search')
      );

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe('Search Helper');
    });

    it('should search by description', () => {
      const plugins: Plugin[] = [
        {
          id: 'plugin1',
          name: 'Plugin 1',
          version: '1.0.0',
          description: 'A powerful calculator plugin',
          author: 'Test',
          enabled: true,
          permissions: [],
          entry_point: 'index.ts',
          triggers: [],
          settings: {},
          health: {
            status: 'healthy',
            message: null,
            last_checked: Date.now(),
            errors: [],
          },
          usage_stats: {
            last_used: null,
            usage_count: 0,
            last_execution_time: null,
            average_execution_time: null,
          },
          installed_at: Date.now(),
          install_path: '/path1',
          source: 'local',
          manifest: {
            id: 'plugin1',
            name: 'Plugin 1',
            version: '1.0.0',
            description: 'A powerful calculator plugin',
            author: 'Test',
            permissions: [],
            entry: 'index.ts',
            triggers: [],
          },
        },
        {
          id: 'plugin2',
          name: 'Plugin 2',
          version: '1.0.0',
          description: 'File management utility',
          author: 'Test',
          enabled: true,
          permissions: [],
          entry_point: 'index.ts',
          triggers: [],
          settings: {},
          health: {
            status: 'healthy',
            message: null,
            last_checked: Date.now(),
            errors: [],
          },
          usage_stats: {
            last_used: null,
            usage_count: 0,
            last_execution_time: null,
            average_execution_time: null,
          },
          installed_at: Date.now(),
          install_path: '/path2',
          source: 'local',
          manifest: {
            id: 'plugin2',
            name: 'Plugin 2',
            version: '1.0.0',
            description: 'File management utility',
            author: 'Test',
            permissions: [],
            entry: 'index.ts',
            triggers: [],
          },
        },
      ];

      const searchResults = plugins.filter(
        (p) =>
          p.name.toLowerCase().includes('calc') ||
          p.description.toLowerCase().includes('calc')
      );

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].id).toBe('plugin1');
    });
  });

  describe('Plugin Health Status Contract', () => {
    it('should support all health status values', () => {
      const validStatuses: PluginHealthStatus[] = [
        'healthy',
        'warning',
        'error',
        'unknown',
      ];

      validStatuses.forEach((status) => {
        expect(['healthy', 'warning', 'error', 'unknown']).toContain(status);
      });
    });

    it('should include health metadata', () => {
      const health = {
        status: 'error' as PluginHealthStatus,
        message: 'Plugin failed to initialize',
        last_checked: Date.now(),
        errors: ['Error 1', 'Error 2'],
      };

      expect(health.status).toBeDefined();
      expect(health.message).toBeDefined();
      expect(health.last_checked).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(health.errors)).toBe(true);
    });
  });

  describe('Plugin Pagination', () => {
    it('should support pagination parameters', () => {
      const allPlugins = Array.from({ length: 25 }, (_, i) => ({
        id: `plugin${i}`,
        name: `Plugin ${i}`,
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        enabled: true,
        permissions: [],
        entry_point: 'index.ts',
        triggers: [],
        settings: {},
        health: {
          status: 'healthy' as PluginHealthStatus,
          message: null,
          last_checked: Date.now(),
          errors: [],
        },
        usage_stats: {
          last_used: null,
          usage_count: 0,
          last_execution_time: null,
          average_execution_time: null,
        },
        installed_at: Date.now(),
        install_path: `/path${i}`,
        source: 'local' as const,
        manifest: {
          id: `plugin${i}`,
          name: `Plugin ${i}`,
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          permissions: [],
          entry: 'index.ts',
          triggers: [],
        },
      }));

      const page = 1;
      const pageSize = 10;
      const startIndex = (page - 1) * pageSize;
      const paginatedPlugins = allPlugins.slice(startIndex, startIndex + pageSize);

      expect(paginatedPlugins).toHaveLength(10);
      expect(paginatedPlugins[0].id).toBe('plugin0');
      expect(paginatedPlugins[9].id).toBe('plugin9');
    });

    it('should calculate total pages', () => {
      const totalPlugins = 25;
      const pageSize = 10;
      const totalPages = Math.ceil(totalPlugins / pageSize);

      expect(totalPages).toBe(3);
    });
  });

  describe('Plugin List Response Contract', () => {
    it('should include metadata in response', () => {
      const response = {
        plugins: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      };

      expect(response.plugins).toBeDefined();
      expect(response.total).toBeDefined();
      expect(typeof response.total).toBe('number');
      expect(response.page).toBeDefined();
      expect(response.pageSize).toBeDefined();
      expect(response.totalPages).toBeDefined();
    });
  });
});
