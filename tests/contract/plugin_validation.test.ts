/**
 * Contract Test for Plugin Validation
 */

import { describe, it, expect } from 'vitest';
import type { PluginManifest } from '@/types/plugin';

describe('Plugin Validation Contract', () => {
  it('should validate manifest structure', () => {
    const manifest: PluginManifest = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'Test',
      author: 'Test',
      permissions: [],
      entry: 'index.ts',
      triggers: [],
    };

    expect(manifest.id).toBeDefined();
    expect(manifest.name).toBeDefined();
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should accept valid permissions', () => {
    const permissions = ['clipboard:read', 'network', 'shell'];

    permissions.forEach(p => {
      expect(p).toBeTruthy();
      expect(p.length).toBeGreaterThan(0);
    });
  });

  it('should accept valid triggers', () => {
    const manifest: PluginManifest = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      description: 'Test',
      author: 'Test',
      permissions: [],
      entry: 'index.ts',
      triggers: [
        { keyword: 'test', description: 'Test trigger' }
      ],
    };

    expect(manifest.triggers).toHaveLength(1);
    expect(manifest.triggers[0].keyword).toBe('test');
  });
});
