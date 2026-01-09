/**
 * Unit Tests: useViewNavigation Hook
 * Tests for view navigation hook functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useViewNavigation } from '@/hooks/useViewNavigation';

// Mock the view manager store
vi.mock('@/stores/viewManagerStore', () => ({
  useViewManagerStore: vi.fn(),
}));

describe('useViewNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('navigateToView', () => {
    it('should call navigateToView from store', async () => {
      const mockNavigate = vi.fn().mockResolvedValue(undefined);
      const { useViewManagerStore } = require('@/stores/viewManagerStore');

      useViewManagerStore.mockReturnValue({
        navigateToView: mockNavigate,
        goBack: vi.fn(),
        canGoBack: vi.fn(() => false),
        currentView: 'search',
        isTransitioning: false,
      });

      const { result } = renderHook(() => useViewNavigation());

      await act(async () => {
        await result.current.navigateToView('settings');
      });

      expect(mockNavigate).toHaveBeenCalledWith('settings');
    });

    it('should handle navigation errors gracefully', async () => {
      const mockNavigate = vi.fn().mockRejectedValue(new Error('Navigation failed'));
      const { useViewManagerStore } = require('@/stores/viewManagerStore');

      useViewManagerStore.mockReturnValue({
        navigateToView: mockNavigate,
        goBack: vi.fn(),
        canGoBack: vi.fn(() => false),
        currentView: 'search',
        isTransitioning: false,
      });

      const { result } = renderHook(() => useViewNavigation());

      await expect(
        act(async () => {
          await result.current.navigateToView('settings');
        })
      ).rejects.toThrow('Navigation failed');
    });
  });

  describe('goBack', () => {
    it('should call goBack from store when history exists', async () => {
      const mockGoBack = vi.fn().mockResolvedValue(undefined);
      const mockCanGoBack = vi.fn(() => true);
      const { useViewManagerStore } = require('@/stores/viewManagerStore');

      useViewManagerStore.mockReturnValue({
        navigateToView: vi.fn(),
        goBack: mockGoBack,
        canGoBack: mockCanGoBack,
        currentView: 'settings',
        isTransitioning: false,
      });

      const { result } = renderHook(() => useViewNavigation());

      await act(async () => {
        await result.current.goBack();
      });

      expect(mockGoBack).toHaveBeenCalled();
    });

    it('should not call goBack when no history exists', async () => {
      const mockGoBack = vi.fn().mockResolvedValue(undefined);
      const mockCanGoBack = vi.fn(() => false);
      const { useViewManagerStore } = require('@/stores/viewManagerStore');

      useViewManagerStore.mockReturnValue({
        navigateToView: vi.fn(),
        goBack: mockGoBack,
        canGoBack: mockCanGoBack,
        currentView: 'search',
        isTransitioning: false,
      });

      const { result } = renderHook(() => useViewNavigation());

      await act(async () => {
        await result.current.goBack();
      });

      expect(mockGoBack).not.toHaveBeenCalled();
    });
  });

  describe('canGoBack', () => {
    it('should return true when history exists', () => {
      const mockCanGoBack = vi.fn(() => true);
      const { useViewManagerStore } = require('@/stores/viewManagerStore');

      useViewManagerStore.mockReturnValue({
        navigateToView: vi.fn(),
        goBack: vi.fn(),
        canGoBack: mockCanGoBack,
        currentView: 'settings',
        isTransitioning: false,
      });

      const { result } = renderHook(() => useViewNavigation());

      expect(result.current.canGoBack()).toBe(true);
    });

    it('should return false when no history exists', () => {
      const mockCanGoBack = vi.fn(() => false);
      const { useViewManagerStore } = require('@/stores/viewManagerStore');

      useViewManagerStore.mockReturnValue({
        navigateToView: vi.fn(),
        goBack: vi.fn(),
        canGoBack: mockCanGoBack,
        currentView: 'search',
        isTransitioning: false,
      });

      const { result } = renderHook(() => useViewNavigation());

      expect(result.current.canGoBack()).toBe(false);
    });
  });

  describe('isTransitioning', () => {
    it('should reflect transitioning state from store', () => {
      const { useViewManagerStore } = require('@/stores/viewManagerStore');

      useViewManagerStore.mockReturnValue({
        navigateToView: vi.fn(),
        goBack: vi.fn(),
        canGoBack: vi.fn(() => false),
        currentView: 'search',
        isTransitioning: true,
      });

      const { result } = renderHook(() => useViewNavigation());

      expect(result.current.isTransitioning).toBe(true);
    });
  });
});
