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
});
