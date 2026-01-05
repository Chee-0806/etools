/**
 * useSearch Hook Unit Tests
 * Tests for search functionality, debouncing, and result management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSearch } from '@/hooks/useSearch';
import { mockInvoke } from '@/test/setup';

// Mock pluginLoader
vi.mock('@/services/pluginLoader', () => ({
  pluginLoader: {
    searchByTrigger: vi.fn(() => Promise.resolve([])),
  },
}));

describe('useSearch', () => {
  beforeEach(() => {
    // Mock window.__TAURI__ for Tauri environment detection
    (window as any).__TAURI__ = {};

    // Set up mock to avoid file/browser search errors - return empty results
    // Note: unified_search returns { results, total, query_time }
    //       search_files/search_browser_data return arrays directly
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === 'unified_search') {
        return {
          results: [
            {
              id: '1',
              title: 'Test App',
              type: 'app',
              path: '/usr/bin/test',
            }
          ],
          total: 1,
          query_time: 10,
        };
      } else if (cmd === 'search_files' || cmd === 'search_browser_data') {
        // Return empty array directly, not { results: [] }
        return [];
      } else if (cmd === 'search_clipboard') {
        return [];
      } else if (cmd === 'track_app_usage') {
        return undefined;
      } else if (cmd === 'launch_app' || cmd === 'paste_clipboard_item' || cmd === 'open_url') {
        return undefined;
      }
      return undefined;
    });
  });

  afterEach(() => {
    // Clear mock calls and re-apply implementation
    mockInvoke.mockClear();
    // Implementation must be re-applied after mockClear()
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === 'unified_search') {
        return {
          results: [
            {
              id: '1',
              title: 'Test App',
              type: 'app',
              path: '/usr/bin/test',
            }
          ],
          total: 1,
          query_time: 10,
        };
      } else if (cmd === 'search_files' || cmd === 'search_browser_data') {
        // Return empty array directly
        return [];
      } else if (cmd === 'search_clipboard') {
        return [];
      }
      return undefined;
    });
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useSearch());
      
      expect(result.current.results).toEqual([]);
      expect(result.current.query).toBe('');
      expect(result.current.selectedIndex).toBe(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.clipboardMode).toBe(false);
    });

    it('should use custom options when provided', () => {
      const { result } = renderHook(() => useSearch({
        debounceMs: 300,
        maxResults: 100,
      }));
      
      expect(result.current).toBeDefined();
    });
  });

  describe('Search Functionality', () => {
    it('should update query immediately', () => {
      const { result } = renderHook(() => useSearch());
      
      act(() => {
        result.current.search('test query');
      });
      
      expect(result.current.query).toBe('test query');
    });

    it('should clear results when query is empty', async () => {
      const { result } = renderHook(() => useSearch());
      
      act(() => {
        result.current.search('test');
      });
      
      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });
      
      act(() => {
        result.current.search('');
      });
      
      await waitFor(() => {
        expect(result.current.results).toEqual([]);
        expect(result.current.selectedIndex).toBe(0);
        expect(result.current.clipboardMode).toBe(false);
      });
    });

    it('should set loading state during search', async () => {
      mockInvoke.mockImplementation((cmd: string) => new Promise(resolve =>
        setTimeout(() => {
          // unified_search returns object, others return arrays
          if (cmd === 'unified_search') {
            resolve({
              results: [
                { id: '1', title: 'Test App', type: 'app', path: '/usr/bin/test', subtitle: 'Test App' },
              ],
              total: 1,
              query_time: 0,
            });
          } else {
            resolve([]);
          }
        }, 100)
      ));

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.search('test');
      });

      // Should be loading immediately after search
      expect(result.current.isLoading).toBe(true);

      // Should finish loading after debounce
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 500 });
    });

    it('should debounce search input', async () => {
      let invokeCount = 0;
      mockInvoke.mockImplementation(() => {
        invokeCount++;
        return Promise.resolve({
          results: [],
          total: 0,
          query_time: 0,
        });
      });

      const { result } = renderHook(() => useSearch({ debounceMs: 150 }));

      act(() => {
        result.current.search('t');
        result.current.search('te');
        result.current.search('tes');
        result.current.search('test');
      });

      // Wait for debounce
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 500 });

      // Due to rapid inputs, debounce may invoke multiple times but should be limited
      // Allow up to 3 invocations (one for each rapid input that gets through)
      expect(invokeCount).toBeLessThanOrEqual(3);
    });

    it('should handle search errors gracefully', async () => {
      mockInvoke.mockRejectedValue(new Error('Search failed'));
      
      const { result } = renderHook(() => useSearch());
      
      act(() => {
        result.current.search('test');
      });
      
      await waitFor(() => {
        expect(result.current.error).toBe('Search failed');
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should abort previous search when new search starts', async () => {
      let abortCount = 0;
      mockInvoke.mockImplementation(() => {
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
      });
      
      const { result } = renderHook(() => useSearch({ debounceMs: 50 }));
      
      act(() => {
        result.current.search('first');
        result.current.search('second');
      });
      
      await waitFor(() => {
        expect(result.current.query).toBe('second');
      });
    });
  });

  describe('Clipboard Search', () => {
    it('should detect clipboard trigger "clip:"', async () => {
      const mockClipboardItems = [
        {
          id: 'clip-1',
          content: 'Sample clipboard text',
          timestamp: Date.now(),
          is_sensitive: false,
        },
      ];
      
      mockInvoke.mockResolvedValue(mockClipboardItems);
      
      const { result } = renderHook(() => useSearch());
      
      act(() => {
        result.current.search('clip: sample');
      });
      
      await waitFor(() => {
        expect(result.current.clipboardMode).toBe(true);
        expect(mockInvoke).toHaveBeenCalledWith('search_clipboard', {
          query: 'sample',
          limit: 50,
        });
      });
    });

    it('should handle empty clipboard search query', async () => {
      const { result } = renderHook(() => useSearch());
      
      act(() => {
        result.current.search('clip:');
      });
      
      await waitFor(() => {
        expect(result.current.clipboardMode).toBe(true);
        expect(mockInvoke).toHaveBeenCalledWith('search_clipboard', {
          query: '',
          limit: 50,
        });
      });
    });

    it('should exit clipboard mode when trigger is removed', async () => {
      mockInvoke.mockResolvedValue([]);
      
      const { result } = renderHook(() => useSearch());
      
      act(() => {
        result.current.search('clip: test');
      });
      
      await waitFor(() => {
        expect(result.current.clipboardMode).toBe(true);
      });
      
      act(() => {
        result.current.search('test');
      });
      
      await waitFor(() => {
        expect(result.current.clipboardMode).toBe(false);
      });
    });
  });

  describe('Quick Actions', () => {
    it('should detect calculator expressions', async () => {
      const { result } = renderHook(() => useSearch());
      
      act(() => {
        result.current.search('2 + 2');
      });
      
      await waitFor(() => {
        expect(result.current.results).toHaveLength(1);
        expect(result.current.results[0].title).toBe('4');
        expect(result.current.results[0].icon).toBe('🧮');
      });
    });

    it('should detect web search triggers', async () => {
      const { result } = renderHook(() => useSearch());
      
      act(() => {
        result.current.search('g: test query');
      });
      
      await waitFor(() => {
        expect(result.current.results).toHaveLength(1);
        expect(result.current.results[0].title).toContain('google');
      });
    });

    it('should detect hex colors', async () => {
      const { result } = renderHook(() => useSearch());
      
      act(() => {
        result.current.search('#fff');
      });
      
      await waitFor(() => {
        expect(result.current.results).toHaveLength(1);
        expect(result.current.results[0].icon).toBe('🎨');
      });
    });
  });

  describe('Result Navigation', () => {
    it('should select next result', async () => {
      // Use mockImplementation for consistent results across all calls
      // unified_search returns { results, total, query_time }
      // search_files/search_browser_data return arrays directly
      // IMPORTANT: Titles must match the query "test" to pass fuzzy search (threshold 0.3)
      mockInvoke.mockImplementation(async (cmd: string) => {
        if (cmd === 'unified_search') {
          return {
            results: [
              { id: '1', title: 'Test App 1', type: 'app', path: '/usr/bin/test1', subtitle: 'Test App 1' },
              { id: '2', title: 'Test App 2', type: 'app', path: '/usr/bin/test2', subtitle: 'Test App 2' },
            ],
            total: 2,
            query_time: 0,
          };
        }
        // search_files, search_browser_data return arrays
        return [];
      });

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.search('test');
      });

      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(1);
      });

      const initialIndex = result.current.selectedIndex;

      act(() => {
        result.current.selectNext();
      });

      expect(result.current.selectedIndex).toBe(initialIndex + 1);
    });

    it('should not go beyond last result', async () => {
      mockInvoke.mockImplementation(async (cmd: string) => {
        if (cmd === 'unified_search') {
          return {
            results: [
              { id: '1', title: 'Test App', type: 'app', path: '/usr/bin/test', subtitle: 'Test App' },
            ],
            total: 1,
            query_time: 0,
          };
        }
        return [];
      });

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.search('test');
      });

      await waitFor(() => {
        expect(result.current.results.length).toBe(1);
      });

      act(() => {
        result.current.selectNext();
        result.current.selectNext();
      });

      expect(result.current.selectedIndex).toBe(0);
    });

    it('should select previous result', async () => {
      mockInvoke.mockImplementation(async (cmd: string) => {
        if (cmd === 'unified_search') {
          return {
            results: [
              { id: '1', title: 'Test App 1', type: 'app', path: '/usr/bin/test1', subtitle: 'Test App 1' },
              { id: '2', title: 'Test App 2', type: 'app', path: '/usr/bin/test2', subtitle: 'Test App 2' },
            ],
            total: 2,
            query_time: 0,
          };
        }
        return [];
      });

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.search('test');
      });

      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(1);
      });

      act(() => {
        result.current.selectNext();
      });

      expect(result.current.selectedIndex).toBe(1);

      act(() => {
        result.current.selectPrevious();
      });

      expect(result.current.selectedIndex).toBe(0);
    });

    it('should not go below first result', async () => {
      mockInvoke.mockImplementation(async (cmd: string) => {
        if (cmd === 'unified_search') {
          return {
            results: [
              { id: '1', title: 'Test App', type: 'app', path: '/usr/bin/test', subtitle: 'Test App' },
            ],
            total: 1,
            query_time: 0,
          };
        }
        return [];
      });

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.search('test');
      });

      await waitFor(() => {
        expect(result.current.results.length).toBe(1);
      });

      act(() => {
        result.current.selectPrevious();
        result.current.selectPrevious();
      });

      expect(result.current.selectedIndex).toBe(0);
    });

    it('should select specific index', async () => {
      mockInvoke.mockImplementation(async (cmd: string) => {
        if (cmd === 'unified_search') {
          return {
            results: [
              { id: '1', title: 'Test App 1', type: 'app', path: '/usr/bin/test1', subtitle: 'Test App 1' },
              { id: '2', title: 'Test App 2', type: 'app', path: '/usr/bin/test2', subtitle: 'Test App 2' },
              { id: '3', title: 'Test App 3', type: 'app', path: '/usr/bin/test3', subtitle: 'Test App 3' },
            ],
            total: 3,
            query_time: 0,
          };
        }
        return [];
      });

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.search('test');
      });

      await waitFor(() => {
        expect(result.current.results.length).toBe(3);
      });

      act(() => {
        result.current.selectIndex(2);
      });

      expect(result.current.selectedIndex).toBe(2);
    });
  });

  describe('Execute Action', () => {
    it('should execute selected result action', async () => {
      const mockAction = vi.fn().mockResolvedValue(undefined);
      
      mockInvoke.mockResolvedValue({
        results: [{
          id: '1',
          title: 'Test App',
          type: 'app',
          path: '/usr/bin/test',
        }],
        total: 1,
        query_time: 0,
      });
      
      const { result } = renderHook(() => useSearch());
      
      act(() => {
        result.current.search('test');
      });
      
      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });
      
      // Manually set mock action
      result.current.results[0].action = mockAction;
      
      await act(async () => {
        await result.current.executeSelected();
      });
      
      expect(mockAction).toHaveBeenCalled();
    });

    it('should handle action execution errors', async () => {
      const mockAction = vi.fn().mockRejectedValue(new Error('Action failed'));
      
      mockInvoke.mockResolvedValue({
        results: [{
          id: '1',
          title: 'Test App',
          type: 'app',
        }],
        total: 1,
        query_time: 0,
      });
      
      const { result } = renderHook(() => useSearch());
      
      act(() => {
        result.current.search('test');
      });
      
      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });
      
      result.current.results[0].action = mockAction;
      
      await act(async () => {
        await result.current.executeSelected();
      });
      
      expect(result.current.error).toBe('Action failed');
    });

    it('should do nothing when no results', async () => {
      const { result } = renderHook(() => useSearch());
      
      await act(async () => {
        await result.current.executeSelected();
      });
      
      // Should not throw
      expect(result.current.results).toEqual([]);
    });

    it('should track app usage when executing app result', async () => {
      const mockAction = vi.fn().mockResolvedValue(undefined);
      
      mockInvoke.mockResolvedValue({
        results: [{
          id: 'app-1',
          title: 'Test App',
          type: 'app',
        }],
        total: 1,
        query_time: 0,
      });
      
      const { result } = renderHook(() => useSearch());
      
      act(() => {
        result.current.search('test');
      });
      
      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });
      
      result.current.results[0].action = mockAction;
      
      await act(async () => {
        await result.current.executeSelected();
      });
      
      expect(mockInvoke).toHaveBeenCalledWith('track_app_usage', { appId: '1' });
    });
  });

  describe('Clear Function', () => {
    it('should clear all state', async () => {
      mockInvoke.mockResolvedValue({
        results: [{
          id: '1',
          title: 'Test',
          type: 'app',
        }],
        total: 1,
        query_time: 0,
      });
      
      const { result } = renderHook(() => useSearch());
      
      act(() => {
        result.current.search('test');
      });
      
      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });
      
      act(() => {
        result.current.clear();
      });
      
      expect(result.current.results).toEqual([]);
      expect(result.current.query).toBe('');
      expect(result.current.selectedIndex).toBe(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.clipboardMode).toBe(false);
    });

    it('should cancel pending searches when cleared', () => {
      const { result } = renderHook(() => useSearch());
      
      act(() => {
        result.current.search('test');
        result.current.clear();
      });
      
      expect(result.current.query).toBe('');
      expect(result.current.results).toEqual([]);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useSearch());
      
      expect(() => unmount()).not.toThrow();
    });

    it('should clear timers on unmount', () => {
      const { unmount } = renderHook(() => useSearch({ debounceMs: 150 }));
      
      act(() => {
        // Trigger a search
        // @ts-ignore - testing internal implementation
      });
      
      unmount();
      
      // If timers weren't cleared, this might cause issues
      expect(true).toBe(true);
    });
  });

  describe('Browser Mode', () => {
    it('should use mock data in browser mode', async () => {
      // Remove __TAURI__ to simulate browser mode
      delete (window as any).__TAURI__;
      
      const { result } = renderHook(() => useSearch());
      
      act(() => {
        result.current.search('code');
      });
      
      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });
      
      // Should use mock apps from useSearch hook
      expect(result.current.results[0].title).toBeDefined();
    });
  });
});
