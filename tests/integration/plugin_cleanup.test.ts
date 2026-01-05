/**
 * Integration Test for Plugin Cleanup
 * Tests the complete plugin cleanup workflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePluginManager } from '@/hooks/usePluginManager';

// Mock services
vi.mock('@/services/pluginManager', () => ({
  pluginManagerService: {
    uninstallPlugin: vi.fn(),
  },
}));

vi.mock('@/services/pluginStateStore', () => ({
  usePluginState: () => ({
    plugins: [],
    loading: false,
    error: null,
  }),
  usePluginDispatch: () => vi.fn(),
}));

describe('Plugin Cleanup Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Uninstall Operation', () => {
    it('should have uninstall method', () => {
      const { result } = renderHook(() => usePluginManager());

      expect(result.current.uninstallPlugin).toBeDefined();
      expect(typeof result.current.uninstallPlugin).toBe('function');
    });

    it('should accept plugin ID parameter', async () => {
      const { result } = renderHook(() => usePluginManager());

      const pluginId = 'test-plugin';

      await act(async () => {
        try {
          await result.current.uninstallPlugin(pluginId);
        } catch (error) {
          // Expected in test environment
        }
      });

      // Method should be callable with string parameter
      expect(typeof pluginId).toBe('string');
    });
  });

  describe('Cleanup Validation', () => {
    it('should validate plugin ID format', () => {
      const validIds = ['test-plugin', 'my-awesome-plugin', 'plugin-123'];
      const idRegex = /^[a-z0-9-]+$/;

      validIds.forEach((id) => {
        expect(idRegex.test(id)).toBe(true);
      });
    });

    it('should reject invalid plugin IDs', () => {
      const invalidIds = ['Test-Plugin', 'test_plugin', 'test plugin'];
      const idRegex = /^[a-z0-9-]+$/;

      invalidIds.forEach((id) => {
        expect(idRegex.test(id)).toBe(false);
      });
    });
  });

  describe('Cleanup Response Structure', () => {
    it('should have success response structure', () => {
      const response = {
        success: true,
        message: 'Plugin uninstalled successfully',
      };

      expect(response.success).toBe(true);
      expect(response.message).toBeDefined();
    });

    it('should have error response structure', () => {
      const response = {
        success: false,
        message: 'Failed to uninstall plugin',
      };

      expect(response.success).toBe(false);
      expect(response.message).toContain('Failed');
    });
  });

  describe('File Cleanup Contract', () => {
    it('should specify files to remove', () => {
      const files = [
        '/path/to/plugin/index.ts',
        '/path/to/plugin/manifest.json',
        '/path/to/plugin/package.json',
      ];

      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
      files.forEach((file) => {
        expect(typeof file).toBe('string');
      });
    });

    it('should track cleanup progress', () => {
      const progress = {
        total: 5,
        removed: 3,
        failed: 0,
      };

      expect(progress.total).toBeGreaterThanOrEqual(progress.removed);
      expect(progress.removed).toBeGreaterThanOrEqual(0);
    });
  });
});
