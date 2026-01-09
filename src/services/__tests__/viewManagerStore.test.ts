/**
 * Unit Tests: View Manager Store
 * Tests for navigation state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewManagerStore } from '@/stores/viewManagerStore';

describe('ViewManagerStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { reset } = useViewManagerStore.getState();
    if (reset) reset();
  });

  describe('Navigation', () => {
    it('should navigate to a new view', async () => {
      const { result } = renderHook(() => useViewManagerStore());

      expect(result.current.currentView).toBe('search');

      await act(async () => {
        await result.current.navigateToView('settings');
      });

      expect(result.current.currentView).toBe('settings');
    });

    it('should push to history on navigation', async () => {
      const { result } = renderHook(() => useViewManagerStore());

      await act(async () => {
        await result.current.navigateToView('settings');
      });

      await act(async () => {
        await result.current.navigateToView('plugins');
      });

      expect(result.current.history.length).toBe(2);
      expect(result.current.history[0].viewId).toBe('search');
      expect(result.current.history[1].viewId).toBe('settings');
    });

    it('should limit history to 50 entries (FR-019)', async () => {
      const { result } = renderHook(() => useViewManagerStore());

      // Navigate 60 times
      for (let i = 0; i < 60; i++) {
        await act(async () => {
          await result.current.navigateToView(i % 2 === 0 ? 'settings' : 'plugins');
        });
      }

      // History should be capped at 50
      expect(result.current.history.length).toBeLessThanOrEqual(50);
    });

    it('should set direction to forward on navigate', async () => {
      const { result } = renderHook(() => useViewManagerStore());

      await act(async () => {
        await result.current.navigateToView('settings');
      });

      expect(result.current.direction).toBe('forward');
    });
  });

  describe('Back navigation', () => {
    it('should go back to previous view', async () => {
      const { result } = renderHook(() => useViewManagerStore());

      await act(async () => {
        await result.current.navigateToView('settings');
      });

      await act(async () => {
        await result.current.navigateToView('plugins');
      });

      await act(async () => {
        await result.current.goBack();
      });

      expect(result.current.currentView).toBe('settings');
      expect(result.current.history.length).toBe(1);
    });

    it('should set direction to backward on goBack', async () => {
      const { result } = renderHook(() => useViewManagerStore());

      await act(async () => {
        await result.current.navigateToView('settings');
      });

      await act(async () => {
        await result.current.goBack();
      });

      expect(result.current.direction).toBe('backward');
    });

    it('should not go back when history is empty', async () => {
      const { result } = renderHook(() => useViewManagerStore());

      const canGoBackBefore = result.current.canGoBack();
      expect(canGoBackBefore).toBe(false);

      await act(async () => {
        await result.current.goBack();
      });

      expect(result.current.currentView).toBe('search');
    });

    it('should update canGoBack correctly', async () => {
      const { result } = renderHook(() => useViewManagerStore());

      expect(result.current.canGoBack()).toBe(false);

      await act(async () => {
        await result.current.navigateToView('settings');
      });

      expect(result.current.canGoBack()).toBe(true);

      await act(async () => {
        await result.current.goBack();
      });

      expect(result.current.canGoBack()).toBe(false);
    });
  });

  describe('Transition state', () => {
    it('should set isTransitioning during navigation', async () => {
      const { result } = renderHook(() => useViewManagerStore());

      await act(async () => {
        // Start navigation (will be async)
        const promise = result.current.navigateToView('settings');
        expect(result.current.isTransitioning).toBe(true);
        await promise;
      });
    });

    it('should queue navigation when transitioning (FR-020)', async () => {
      const { result } = renderHook(() => useViewManagerStore());

      // Mock a long transition
      const originalTransition = result.current.navigateToView;
      let resolveTransition: any;
      result.current.navigateToView = async () => {
        return new Promise((resolve) => {
          resolveTransition = resolve;
        });
      };

      act(() => {
        result.current.navigateToView('settings');
      });

      // Queue second navigation
      await act(async () => {
        await result.current.navigateToView('plugins');
      });

      // Should be queued
      expect(result.current.pendingNavigation.length).toBe(1);
    });
  });

  describe('History management', () => {
    it('should clear history', async () => {
      const { result } = renderHook(() => useViewManagerStore());

      await act(async () => {
        await result.current.navigateToView('settings');
      });

      await act(async () => {
        await result.current.navigateToView('plugins');
      });

      expect(result.current.history.length).toBeGreaterThan(0);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.history.length).toBe(0);
    });
  });

  describe('State preservation', () => {
    it('should preserve scroll position in history', async () => {
      const { result } = renderHook(() => useViewManagerStore());

      // Mock scroll position
      global.scrollY = 100;

      await act(async () => {
        await result.current.navigateToView('settings');
      });

      expect(result.current.history[0].stateData?.scrollPosition).toBeDefined();
    });
  });
});
