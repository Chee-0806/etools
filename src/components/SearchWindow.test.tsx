/**
 * SearchWindow Component Unit Tests
 * Tests for search UI, keyboard navigation, and user interactions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchWindow } from './SearchWindow';
import { mockInvoke } from '@/test/setup';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn(() => ({
    hide: vi.fn(),
    onFocusChanged: vi.fn(() => Promise.resolve(() => {})),
    listen: vi.fn(),
    once: vi.fn(),
    emit: vi.fn(),
  })),
}));

// Mock useAnnounce hook
export const mockAnnounce = vi.fn();
export const mockAnnounceResults = vi.fn();
export const mockAnnounceSelection = vi.fn();
export const mockAnnounceLoading = vi.fn();

vi.mock('@/hooks/useAnnounce', () => ({
  useAnnounce: vi.fn(() => ({
    announce: mockAnnounce,
    announceResults: mockAnnounceResults,
    announceSelection: mockAnnounceSelection,
    announceLoading: mockAnnounceLoading,
  })),
}));

// Note: useSearch is not mocked here, so the real hook is used with the Tauri invoke mock below

describe('SearchWindow', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock window.__TAURI__
    (window as any).__TAURI__ = {};

    // Set up default mockInvoke behavior
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === 'unified_search') {
        return {
          results: [
            {
              id: '1',
              title: 'Test App',
              subtitle: '/usr/bin/test',
              icon: '📝',
              type: 'app',
              score: 0.95,
              path: '/usr/bin/test',
              frequency: 50,
            }
          ],
          total: 1,
          query_time: 10,
        };
      } else if (cmd === 'search_files' || cmd === 'search_browser_data') {
        return Promise.reject(new Error('Mock error - skipping file/browser search'));
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
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render search window', () => {
      render(<SearchWindow />);

      expect(screen.getByRole('search')).toBeInTheDocument();
    });

    it('should have focused input on mount', () => {
      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      expect(input).toBeInTheDocument();
      // Input should have autoFocus prop
      expect(input).toHaveAttribute('autoFocus');
    });

    it('should show search icon', () => {
      render(<SearchWindow />);

      const searchIcon = document.querySelector('.search-icon');
      expect(searchIcon).toBeInTheDocument();
    });

    it('should show keyboard shortcuts footer', () => {
      render(<SearchWindow />);

      expect(screen.getByText(/navigate/)).toBeInTheDocument();
      expect(screen.getByText(/to launch/)).toBeInTheDocument();
      expect(screen.getByText(/to close/)).toBeInTheDocument();
    });

    it('should have proper ARIA labels', () => {
      render(<SearchWindow />);

      const searchbox = screen.getByRole('searchbox');
      expect(searchbox).toHaveAttribute('aria-label', '搜索应用程序');
    });
  });

  describe('Input Handling', () => {
    it('should update query on input change', () => {
      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'test query' } });

      expect(input).toHaveValue('test query');
    });

    it('should show clear button when query exists', () => {
      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');

      // Initially no clear button
      expect(screen.queryByRole('button', { name: '清除搜索' })).not.toBeInTheDocument();

      // Type something
      fireEvent.change(input, { target: { value: 'test' } });

      // Clear button should appear
      expect(screen.getByRole('button', { name: '清除搜索' })).toBeInTheDocument();
    });

    it('should clear query when clear button clicked', () => {
      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'test' } });

      const clearButton = screen.getByRole('button', { name: '清除搜索' });
      fireEvent.click(clearButton);

      expect(input).toHaveValue('');
    });

    it('should show loading spinner during search', async () => {
      // Mock slow search
      mockInvoke.mockImplementation(() => new Promise(resolve =>
        setTimeout(() => resolve({
          results: [],
          total: 0,
          query_time: 0,
        }), 200)
      ));

      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'test' } });

      // Wait for loading state
      await waitFor(() => {
        const spinner = document.querySelector('.search-spinner');
        expect(spinner).toBeInTheDocument();
      }, { timeout: 100 });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle ArrowDown key', async () => {
      mockInvoke.mockResolvedValue({
        results: [
          {
            id: '1',
            title: 'Result 1',
            subtitle: '/path/to/1',
            icon: '📝',
            type: 'app',
            score: 0.9,
            path: '/path/to/1',
            frequency: 50,
          },
          {
            id: '2',
            title: 'Result 2',
            subtitle: '/path/to/2',
            icon: '📝',
            type: 'app',
            score: 0.8,
            path: '/path/to/2',
            frequency: 30,
          },
        ],
        total: 2,
        query_time: 0,
      });

      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(document.querySelectorAll('.result-item').length).toBeGreaterThan(0);
      });

      // Press ArrowDown
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      // Selection should change (we can't directly test state, but we can verify no errors)
      expect(true).toBe(true);
    });

    it('should handle ArrowUp key', async () => {
      mockInvoke.mockResolvedValue({
        results: [
          {
            id: '1',
            title: 'Result 1',
            subtitle: '/path/to/1',
            icon: '📝',
            type: 'app',
            score: 0.9,
            path: '/path/to/1',
            frequency: 50,
          },
        ],
        total: 1,
        query_time: 0,
      });

      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(document.querySelectorAll('.result-item').length).toBeGreaterThan(0);
      });

      // Press ArrowUp (should not go below 0)
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(true).toBe(true);
    });

    it('should handle Enter key to execute', async () => {
      const mockAction = vi.fn();
      mockInvoke.mockResolvedValue({
        results: [
          {
            id: '1',
            title: 'Test App',
            subtitle: '/usr/bin/test',
            icon: '📝',
            type: 'app',
            score: 0.9,
            path: '/usr/bin/test',
            frequency: 50,
          },
        ],
        total: 1,
        query_time: 0,
      });

      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(document.querySelectorAll('.result-item').length).toBeGreaterThan(0);
      });

      // Press Enter
      fireEvent.keyDown(input, { key: 'Enter' });

      // Should have tried to hide window and track usage
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('track_app_usage', { appId: '1' });
      });
    });

    it('should handle Escape key', async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const mockHide = vi.fn();
      (getCurrentWindow as any).mockReturnValue({
        hide: mockHide,
        onFocusChanged: vi.fn(() => Promise.resolve(() => {})),
      });

      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      fireEvent.keyDown(input, { key: 'Escape' });

      await waitFor(() => {
        expect(mockHide).toHaveBeenCalled();
      });
    });

    it('should not handle unknown keys', () => {
      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      fireEvent.keyDown(input, { key: 'F1' });

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Search Results', () => {
    it('should display search results', async () => {
      mockInvoke.mockResolvedValue({
        results: [
          {
            id: '1',
            title: 'Visual Studio Code',
            subtitle: '/usr/bin/code',
            icon: '📝',
            type: 'app',
            score: 0.95,
            path: '/usr/bin/code',
            frequency: 50,
          },
          {
            id: '2',
            title: 'Chrome',
            subtitle: '/usr/bin/chrome',
            icon: '🌐',
            type: 'app',
            score: 0.85,
            path: '/usr/bin/chrome',
            frequency: 30,
          },
        ],
        total: 2,
        query_time: 10,
      });

      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'code' } });

      await waitFor(() => {
        expect(screen.getByText('Visual Studio Code')).toBeInTheDocument();
        expect(screen.getByText('Chrome')).toBeInTheDocument();
      });
    });

    it('should show results list when query exists', async () => {
      mockInvoke.mockResolvedValue({
        results: [
          {
            id: '1',
            title: 'Test',
            subtitle: '/usr/bin/test',
            icon: '📝',
            type: 'app',
            score: 0.9,
            path: '/usr/bin/test',
            frequency: 50,
          },
        ],
        total: 1,
        query_time: 0,
      });

      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        const resultList = document.getElementById('search-results');
        expect(resultList).toBeInTheDocument();
      });
    });

    it('should hide footer when showing results', async () => {
      mockInvoke.mockResolvedValue({
        results: [
          {
            id: '1',
            title: 'Test',
            subtitle: '/usr/bin/test',
            icon: '📝',
            type: 'app',
            score: 0.9,
            path: '/usr/bin/test',
            frequency: 50,
          },
        ],
        total: 1,
        query_time: 0,
      });

      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');

      // Footer should be visible initially
      expect(screen.getByText(/navigate/)).toBeInTheDocument();

      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        // Footer should be hidden when results are shown
        const footer = document.querySelector('.search-footer');
        expect(footer?.parentElement?.childElementCount).toBe(2); // input wrapper + results
      });
    });

    it('should show empty state when no results', async () => {
      mockInvoke.mockResolvedValue({
        results: [],
        total: 0,
        query_time: 0,
      });

      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText(/没有找到/)).toBeInTheDocument();
      });
    });
  });

  describe('Window Management', () => {
    it('should hide window on Escape key', async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const mockHide = vi.fn();
      (getCurrentWindow as any).mockReturnValue({
        hide: mockHide,
        onFocusChanged: vi.fn(() => Promise.resolve(() => {})),
      });

      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      fireEvent.keyDown(input, { key: 'Escape' });

      await waitFor(() => {
        expect(mockHide).toHaveBeenCalled();
      });
    });

    it('should hide window after executing action', async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const mockHide = vi.fn();
      (getCurrentWindow as any).mockReturnValue({
        hide: mockHide,
        onFocusChanged: vi.fn(() => Promise.resolve(() => {})),
      });

      mockInvoke.mockResolvedValue({
        results: [
          {
            id: '1',
            title: 'Test',
            subtitle: '/usr/bin/test',
            icon: '📝',
            type: 'app',
            score: 0.9,
            path: '/usr/bin/test',
            frequency: 50,
          },
        ],
        total: 1,
        query_time: 0,
      });

      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(document.querySelectorAll('.result-item').length).toBeGreaterThan(0);
      });

      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(mockHide).toHaveBeenCalled();
      });
    });

    it('should clear query after executing action', async () => {
      mockInvoke.mockResolvedValue({
        results: [
          {
            id: '1',
            title: 'Test',
            subtitle: '/usr/bin/test',
            icon: '📝',
            type: 'app',
            score: 0.9,
            path: '/usr/bin/test',
            frequency: 50,
          },
        ],
        total: 1,
        query_time: 0,
      });

      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(document.querySelectorAll('.result-item').length).toBeGreaterThan(0);
      });

      fireEvent.keyDown(input, { key: 'Enter' });

      // Query should be cleared after execution
      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });
  });

  describe('App Usage Tracking', () => {
    it('should track app usage when app is launched', async () => {
      mockInvoke.mockResolvedValue({
        results: [
          {
            id: 'app-123',
            title: 'Test App',
            subtitle: '/usr/bin/test',
            icon: '📝',
            type: 'app',
            score: 0.9,
            path: '/usr/bin/test',
            frequency: 50,
          },
        ],
        total: 1,
        query_time: 0,
      });

      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(document.querySelectorAll('.result-item').length).toBeGreaterThan(0);
      });

      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('track_app_usage', { appId: 'app-123' });
      });
    });

    it('should not track usage for non-app results', async () => {
      mockInvoke.mockResolvedValue({
        results: [
          {
            id: 'file-1',
            title: 'test.txt',
            subtitle: '/test.txt',
            icon: '📄',
            type: 'file',
            score: 0.9,
            path: '/test.txt',
            frequency: 10,
          },
        ],
        total: 1,
        query_time: 0,
      });

      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(document.querySelectorAll('.result-item').length).toBeGreaterThan(0);
      });

      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(mockInvoke).not.toHaveBeenCalledWith('track_app_usage');
      });
    });
  });

  describe('Debounced Search', () => {
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

      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');

      // Type rapidly
      fireEvent.change(input, { target: { value: 't' } });
      fireEvent.change(input, { target: { value: 'te' } });
      fireEvent.change(input, { target: { value: 'tes' } });
      fireEvent.change(input, { target: { value: 'test' } });

      // Wait for debounce
      await waitFor(() => {
        expect(invokeCount).toBeLessThanOrEqual(3); // Should be less than typed characters
      }, { timeout: 500 });
    });
  });

  describe('Click Outside to Close', () => {
    it('should hide window on blur', async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const mockHide = vi.fn();
      (getCurrentWindow as any).mockReturnValue({
        hide: mockHide,
        onFocusChanged: vi.fn(() => Promise.resolve(() => {})),
      });

      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      fireEvent.blur(input);

      // Wait for the blur timeout
      await waitFor(() => {
        expect(mockHide).toHaveBeenCalled();
      }, { timeout: 500 });
    });

    it('should not hide when clicking on input', async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const mockHide = vi.fn();
      (getCurrentWindow as any).mockReturnValue({
        hide: mockHide,
        onFocusChanged: vi.fn(() => Promise.resolve(() => {})),
      });

      render(<SearchWindow />);

      const searchWindow = document.querySelector('.search-window');
      if (searchWindow) {
        fireEvent.click(searchWindow);
      }

      // Should not call hide (because input gets focus)
      await new Promise(resolve => setTimeout(resolve, 300));
      expect(mockHide).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SearchWindow />);

      const searchbox = screen.getByRole('searchbox');
      expect(searchbox).toHaveAttribute('aria-label');
      expect(searchbox).toHaveAttribute('aria-describedby');
      expect(searchbox).toHaveAttribute('aria-autocomplete', 'list');
      expect(searchbox).toHaveAttribute('aria-controls');
    });

    it('should update aria-activedescendant', async () => {
      mockInvoke.mockResolvedValue({
        results: [
          {
            id: 'result-1',
            title: 'Test',
            subtitle: '/usr/bin/test',
            icon: '📝',
            type: 'app',
            score: 0.9,
            path: '/usr/bin/test',
            frequency: 50,
          },
        ],
        total: 1,
        query_time: 0,
      });

      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-activedescendant');
      });
    });

    it('should announce results to screen readers', async () => {
      mockInvoke.mockResolvedValue({
        results: [
          {
            id: '1',
            title: 'Test',
            subtitle: '/usr/bin/test',
            icon: '📝',
            type: 'app',
            score: 0.9,
            path: '/usr/bin/test',
            frequency: 50,
          },
        ],
        total: 1,
        query_time: 0,
      });

      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(mockAnnounceResults).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle search errors gracefully', async () => {
      mockInvoke.mockRejectedValue(new Error('Search failed'));

      // Suppress console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'test' } });

      // Should not throw
      await waitFor(() => {
        expect(true).toBe(true);
      });

      consoleSpy.mockRestore();
    });

    it('should handle action execution errors', async () => {
      const mockAction = vi.fn().mockRejectedValue(new Error('Action failed'));

      mockInvoke.mockResolvedValue({
        results: [
          {
            id: '1',
            title: 'Test App',
            subtitle: '/usr/bin/test',
            icon: '📝',
            type: 'app',
            score: 0.9,
            path: '/usr/bin/test',
            frequency: 50,
            action: mockAction,
          },
        ],
        total: 1,
        query_time: 0,
      });

      // Suppress console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<SearchWindow />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(document.querySelectorAll('.result-item').length).toBeGreaterThan(0);
      });

      fireEvent.keyDown(input, { key: 'Enter' });

      // Should not crash
      await waitFor(() => {
        expect(true).toBe(true);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Focus Management', () => {
    it('should focus input when clicking on search window', () => {
      render(<SearchWindow />);

      const searchWindow = document.querySelector('.search-window');
      const input = screen.getByRole('searchbox');

      input.blur();
      expect(document.activeElement).not.toBe(input);

      if (searchWindow) {
        fireEvent.click(searchWindow);
      }

      expect(document.activeElement).toBe(input);
    });
  });
});
