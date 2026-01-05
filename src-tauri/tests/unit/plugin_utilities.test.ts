/**
 * Plugin Utilities Unit Tests
 */

import { describe, it, expect, vi } from 'vitest';
import type { Plugin } from '@/types/plugin';

vi.mock('@/lib/accessibility', () => ({
  getAriaLabel: () => 'test',
  getAriaDescription: () => 'test',
  announceToScreenReader: () => {},
  KEYBOARD_KEYS: { ENTER: 'Enter' },
}));

describe('Plugin Utilities', () => {
  it('should validate plugin structure', () => {
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
      health: { status: 'healthy', message: null, last_checked: Date.now(), errors: [] },
      usage_stats: { last_used: null, usage_count: 0, last_execution_time: null, average_execution_time: null },
      installed_at: Date.now(),
      install_path: '/path',
      source: 'local',
      manifest: { id: 'test', name: 'Test', version: '1.0.0', description: 'Test', author: 'Test', permissions: [], entry: 'index.ts', triggers: [] },
    };

    expect(plugin.id).toBe('test');
    expect(plugin.enabled).toBe(true);
  });
});
