/**
 * Integration Test for Plugin Interface
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePluginManager } from '@/hooks/usePluginManager';

vi.mock('@/services/pluginManager');
vi.mock('@/services/pluginStateStore', () => ({
  usePluginState: () => ({ plugins: [], loading: false, error: null }),
  usePluginDispatch: () => vi.fn(),
}));

describe('Plugin Interface Integration', () => {
  it('should provide plugin manager methods', () => {
    const { result } = renderHook(() => usePluginManager());
    
    expect(result.current.plugins).toBeDefined();
    expect(result.current.loading).toBeDefined();
    expect(result.current.enablePlugin).toBeDefined();
    expect(result.current.disablePlugin).toBeDefined();
  });
});
