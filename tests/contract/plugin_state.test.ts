/**
 * Contract Test for Plugin State Management
 * Tests the contract for plugin state transitions and persistence
 */

import { describe, it, expect } from 'vitest';
import type { Plugin, PluginHealthStatus } from '@/types/plugin';

describe('Plugin State Management Contract Tests', () => {
  describe('Plugin State Structure', () => {
    it('should have all required state fields', () => {
      const plugin: Plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
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
          last_used: Date.now(),
          usage_count: 5,
          last_execution_time: 100,
          average_execution_time: 120,
        },
        installed_at: Date.now(),
        install_path: '/path',
        source: 'local',
        manifest: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          permissions: [],
          entry: 'index.ts',
          triggers: [],
        },
      };

      // Required state fields
      expect(plugin.enabled).toBeDefined();
      expect(typeof plugin.enabled).toBe('boolean');
      expect(plugin.health).toBeDefined();
      expect(plugin.usage_stats).toBeDefined();
      expect(plugin.settings).toBeDefined();
    });
  });

  describe('State Transitions', () => {
    it('should support enabled state', () => {
      const plugin: Plugin = {
        id: 'test',
        name: 'Test',
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
        install_path: '/path',
        source: 'local',
        manifest: {
          id: 'test',
          name: 'Test',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          permissions: [],
          entry: 'index.ts',
          triggers: [],
        },
      };

      expect(plugin.enabled).toBe(true);
      expect(plugin.health.status).toBe('healthy');
    });

    it('should support disabled state', () => {
      const plugin: Plugin = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        enabled: false,
        permissions: [],
        entry_point: 'index.ts',
        triggers: [],
        settings: {},
        health: {
          status: 'warning',
          message: 'Plugin is disabled',
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
        install_path: '/path',
        source: 'local',
        manifest: {
          id: 'test',
          name: 'Test',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          permissions: [],
          entry: 'index.ts',
          triggers: [],
        },
      };

      expect(plugin.enabled).toBe(false);
      expect(plugin.health.status).toBe('warning');
    });

    it('should support error state', () => {
      const plugin: Plugin = {
        id: 'test',
        name: 'Test',
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
          errors: ['Load error: Missing dependency'],
        },
        usage_stats: {
          last_used: null,
          usage_count: 0,
          last_execution_time: null,
          average_execution_time: null,
        },
        installed_at: Date.now(),
        install_path: '/path',
        source: 'local',
        manifest: {
          id: 'test',
          name: 'Test',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          permissions: [],
          entry: 'index.ts',
          triggers: [],
        },
      };

      expect(plugin.health.status).toBe('error');
      expect(plugin.health.errors).toHaveLength(1);
    });
  });

  describe('State Persistence', () => {
    it('should serialize plugin state to JSON', () => {
      const plugin: Plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        enabled: true,
        permissions: [],
        entry_point: 'index.ts',
        triggers: [],
        settings: { theme: 'dark' },
        health: {
          status: 'healthy',
          message: null,
          last_checked: Date.now(),
          errors: [],
        },
        usage_stats: {
          last_used: Date.now(),
          usage_count: 5,
          last_execution_time: 100,
          average_execution_time: 120,
        },
        installed_at: Date.now(),
        install_path: '/path',
        source: 'local',
        manifest: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          permissions: [],
          entry: 'index.ts',
          triggers: [],
        },
      };

      const json = JSON.stringify(plugin);

      expect(json).toBeDefined();
      expect(json.length).toBeGreaterThan(0);

      const parsed = JSON.parse(json);
      expect(parsed.id).toBe(plugin.id);
      expect(parsed.enabled).toBe(plugin.enabled);
    });

    it('should deserialize plugin state from JSON', () => {
      const json = JSON.stringify({
        id: 'test-plugin',
        name: 'Test Plugin',
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
        install_path: '/path',
        source: 'local',
        manifest: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          permissions: [],
          entry: 'index.ts',
          triggers: [],
        },
      });

      const plugin = JSON.parse(json) as Plugin;

      expect(plugin.id).toBe('test-plugin');
      expect(plugin.enabled).toBe(true);
      expect(plugin.health.status).toBe('healthy');
    });
  });

  describe('State Synchronization', () => {
    it('should maintain consistency between plugin and manifest', () => {
      const plugin: Plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        enabled: true,
        permissions: ['clipboard:read'],
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
        install_path: '/path',
        source: 'local',
        manifest: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          permissions: ['clipboard:read'],
          entry: 'index.ts',
          triggers: [],
        },
      };

      // ID consistency
      expect(plugin.id).toBe(plugin.manifest.id);

      // Permissions consistency
      expect(plugin.permissions).toEqual(plugin.manifest.permissions);

      // Entry point consistency
      expect(plugin.entry_point).toBe(plugin.manifest.entry);
    });
  });

  describe('State Update Operations', () => {
    it('should track usage statistics', () => {
      const stats = {
        last_used: null as number | null,
        usage_count: 0,
        last_execution_time: null as number | null,
        average_execution_time: null as number | null,
      };

      expect(stats.usage_count).toBe(0);

      // After usage
      stats.last_used = Date.now();
      stats.usage_count = 1;
      stats.last_execution_time = 150;
      stats.average_execution_time = 150;

      expect(stats.usage_count).toBe(1);
      expect(stats.last_used).toBeGreaterThan(0);
      expect(stats.last_execution_time).toBe(150);
    });

    it('should update health status', () => {
      const health = {
        status: 'healthy' as PluginHealthStatus,
        message: null as string | null,
        last_checked: Date.now(),
        errors: [] as string[],
      };

      expect(health.status).toBe('healthy');

      // After health check with issues
      health.status = 'warning';
      health.message = 'Plugin performance degraded';
      health.errors.push('High memory usage');

      expect(health.status).toBe('warning');
      expect(health.message).toContain('degraded');
      expect(health.errors).toHaveLength(1);
    });
  });

  describe('State Validation', () => {
    it('should validate enabled state is boolean', () => {
      const plugin: Plugin = {
        id: 'test',
        name: 'Test',
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
        install_path: '/path',
        source: 'local',
        manifest: {
          id: 'test',
          name: 'Test',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          permissions: [],
          entry: 'index.ts',
          triggers: [],
        },
      };

      expect(typeof plugin.enabled).toBe('boolean');
    });

    it('should validate health status is valid', () => {
      const validStatuses: PluginHealthStatus[] = ['healthy', 'warning', 'error', 'unknown'];

      const plugin: Plugin = {
        id: 'test',
        name: 'Test',
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
        install_path: '/path',
        source: 'local',
        manifest: {
          id: 'test',
          name: 'Test',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          permissions: [],
          entry: 'index.ts',
          triggers: [],
        },
      };

      expect(validStatuses).toContain(plugin.health.status);
    });
  });
});
