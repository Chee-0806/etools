/**
 * useTheme Hook Unit Tests
 * Tests for theme management and system theme detection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '@/hooks/useTheme';

// Mock matchMedia
const mockMatchMedia = vi.fn().mockImplementation((query) => ({
  matches: query === '(prefers-color-scheme: dark)' ? false : true,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

describe('useTheme', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Reset document classes
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.removeAttribute('data-theme');

    // Reset mockMatchMedia to return light theme by default
    mockMatchMedia.mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)' ? false : true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    // Don't restore all mocks as it will break matchMedia
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should default to system theme when no preference stored', () => {
      const { result } = renderHook(() => useTheme());
      
      expect(result.current.theme).toBe('system');
      expect(result.current.resolvedTheme).toMatch(/^(light|dark)$/);
    });

    it('should load theme from localStorage', () => {
      localStorage.setItem('app-theme', 'dark');
      
      const { result } = renderHook(() => useTheme());
      
      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('should reject invalid theme values in localStorage', () => {
      localStorage.setItem('app-theme', 'invalid');
      
      const { result } = renderHook(() => useTheme());
      
      expect(result.current.theme).toBe('system');
    });
  });

  describe('Theme Resolution', () => {
    it('should resolve to light when theme is light', () => {
      localStorage.setItem('app-theme', 'light');
      
      const { result } = renderHook(() => useTheme());
      
      expect(result.current.resolvedTheme).toBe('light');
    });

    it('should resolve to dark when theme is dark', () => {
      localStorage.setItem('app-theme', 'dark');
      
      const { result } = renderHook(() => useTheme());
      
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('should resolve system theme based on media query', () => {
      localStorage.setItem('app-theme', 'system');
      
      const { result } = renderHook(() => useTheme());
      
      // Should match the mocked matchMedia result
      expect(result.current.resolvedTheme).toBeDefined();
    });
  });

  describe('Theme Switching', () => {
    it('should switch to light theme', () => {
      const { result } = renderHook(() => useTheme());
      
      act(() => {
        result.current.setTheme('light');
      });
      
      expect(result.current.theme).toBe('light');
      expect(result.current.resolvedTheme).toBe('light');
      expect(localStorage.getItem('app-theme')).toBe('light');
    });

    it('should switch to dark theme', () => {
      const { result } = renderHook(() => useTheme());
      
      act(() => {
        result.current.setTheme('dark');
      });
      
      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
      expect(localStorage.getItem('app-theme')).toBe('dark');
    });

    it('should switch to system theme', () => {
      const { result } = renderHook(() => useTheme());
      
      act(() => {
        result.current.setTheme('system');
      });
      
      expect(result.current.theme).toBe('system');
      expect(result.current.resolvedTheme).toMatch(/^(light|dark)$/);
      expect(localStorage.getItem('app-theme')).toBe('system');
    });
  });

  describe('DOM Updates', () => {
    it('should add theme class to document element', () => {
      const { result } = renderHook(() => useTheme());
      
      act(() => {
        result.current.setTheme('dark');
      });
      
      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
      expect(document.documentElement.classList.contains('theme-light')).toBe(false);
    });

    it('should remove previous theme class when switching', () => {
      const { result } = renderHook(() => useTheme());
      
      act(() => {
        result.current.setTheme('light');
      });
      
      expect(document.documentElement.classList.contains('theme-light')).toBe(true);
      
      act(() => {
        result.current.setTheme('dark');
      });
      
      expect(document.documentElement.classList.contains('theme-light')).toBe(false);
      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    });

    it('should update data-theme attribute', () => {
      const { result } = renderHook(() => useTheme());
      
      act(() => {
        result.current.setTheme('light');
      });
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      
      act(() => {
        result.current.setTheme('dark');
      });
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('System Theme Changes', () => {
    it('should listen for system theme changes when in system mode', () => {
      const mockMatchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      
      window.matchMedia = mockMatchMedia;
      localStorage.setItem('app-theme', 'system');
      
      renderHook(() => useTheme());
      
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('should not listen for system theme changes when not in system mode', () => {
      const mockMatchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));
      
      window.matchMedia = mockMatchMedia;
      localStorage.setItem('app-theme', 'light');
      
      const { result } = renderHook(() => useTheme());
      
      // Should not call matchMedia for system theme listener
      // (only called once in getSystemTheme)
      expect(mockMatchMedia).toHaveBeenCalledTimes(1);
    });
  });

  describe('Persistence', () => {
    it('should persist theme to localStorage', () => {
      const { result } = renderHook(() => useTheme());
      
      act(() => {
        result.current.setTheme('dark');
      });
      
      expect(localStorage.getItem('app-theme')).toBe('dark');
      
      // Re-render hook should load from localStorage
      const { result: result2 } = renderHook(() => useTheme());
      expect(result2.current.theme).toBe('dark');
    });

    it('should update storage on each theme change', () => {
      const { result } = renderHook(() => useTheme());
      
      act(() => {
        result.current.setTheme('light');
      });
      expect(localStorage.getItem('app-theme')).toBe('light');
      
      act(() => {
        result.current.setTheme('dark');
      });
      expect(localStorage.getItem('app-theme')).toBe('dark');
      
      act(() => {
        result.current.setTheme('system');
      });
      expect(localStorage.getItem('app-theme')).toBe('system');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid theme changes', () => {
      const { result } = renderHook(() => useTheme());
      
      act(() => {
        result.current.setTheme('light');
        result.current.setTheme('dark');
        result.current.setTheme('system');
      });
      
      expect(result.current.theme).toBe('system');
      expect(document.documentElement.classList.contains('theme-system')).toBe(false);
    });

    it('should handle setting same theme multiple times', () => {
      const { result } = renderHook(() => useTheme());
      
      act(() => {
        result.current.setTheme('dark');
        result.current.setTheme('dark');
        result.current.setTheme('dark');
      });
      
      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('should handle localStorage being disabled', () => {
      // Mock localStorage to throw errors
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('localStorage disabled');
      });
      
      const { result } = renderHook(() => useTheme());
      
      // Should not throw when setting theme
      expect(() => {
        act(() => {
          result.current.setTheme('dark');
        });
      }).not.toThrow();
      
      // Restore original
      localStorage.setItem = originalSetItem;
    });
  });

  describe('Integration', () => {
    it('should work correctly with CSS selectors', () => {
      const { result } = renderHook(() => useTheme());
      
      act(() => {
        result.current.setTheme('dark');
      });
      
      const root = document.documentElement;
      expect(root.getAttribute('data-theme')).toBe('dark');
      expect(root.classList.contains('theme-dark')).toBe(true);
      
      // CSS could use [data-theme="dark"] or .theme-dark selectors
      const darkThemeElements = document.querySelectorAll('[data-theme="dark"]');
      expect(darkThemeElements.length).toBeGreaterThan(0);
    });
  });
});
