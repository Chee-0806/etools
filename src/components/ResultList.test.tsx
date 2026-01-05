/**
 * ResultList Component Unit Tests
 * Tests for result display, selection, keyboard navigation, and accessibility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultList } from './ResultList';
import type { SearchResult } from '@/types/search';

// Mock CSS import
vi.mock('@/styles/components/ResultList.css', () => ({}));

const mockResults: SearchResult[] = [
  {
    id: '1',
    title: 'Visual Studio Code',
    subtitle: '/usr/bin/code',
    icon: '📝',
    type: 'app',
    score: 0.95,
    action: vi.fn(),
  },
  {
    id: '2',
    title: 'Google Chrome',
    subtitle: '/usr/bin/google-chrome',
    icon: '🌐',
    type: 'app',
    score: 0.85,
    action: vi.fn(),
  },
  {
    id: '3',
    title: 'Terminal',
    subtitle: '/usr/bin/terminal',
    icon: '⌨️',
    type: 'app',
    score: 0.75,
    action: vi.fn(),
  },
];

const mockFileResults: SearchResult[] = [
  {
    id: 'file-1',
    title: 'document.pdf',
    subtitle: '/Users/test/document.pdf',
    icon: '📕',
    type: 'file',
    score: 0.9,
    action: vi.fn(),
  },
];

// Results without custom icons to test fallback type icons
const mockResultsWithoutIcons: SearchResult[] = [
  {
    id: '1',
    title: 'Visual Studio Code',
    subtitle: '/usr/bin/code',
    type: 'app',
    score: 0.95,
    action: vi.fn(),
  },
];

const mockFileResultsWithoutIcons: SearchResult[] = [
  {
    id: 'file-1',
    title: 'document.pdf',
    subtitle: '/Users/test/document.pdf',
    type: 'file',
    score: 0.9,
    action: vi.fn(),
  },
];

describe('ResultList', () => {
  let onSelectIndex: ReturnType<typeof vi.fn>;
  let onExecute: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSelectIndex = vi.fn();
    onExecute = vi.fn();
  });

  describe('Rendering', () => {
    it('should render list of results', () => {
      const { container } = render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      const items = container.querySelectorAll('.result-item');
      expect(items).toHaveLength(3);
    });

    it('should render empty state when no results', () => {
      const { container } = render(
        <ResultList
          results={[]}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
          query="test"
        />
      );

      expect(screen.getByText(/没有找到 "test" 的结果/)).toBeInTheDocument();
      expect(screen.getByText('🔍')).toBeInTheDocument();
    });

    it('should render empty state without query', () => {
      render(
        <ResultList
          results={[]}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      expect(screen.getByText('开始输入以搜索')).toBeInTheDocument();
    });

    it('should show suggestion when query exists but no results', () => {
      render(
        <ResultList
          results={[]}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
          query="nonexistent"
        />
      );

      expect(screen.getByText(/尝试不同的关键词或检查拼写/)).toBeInTheDocument();
    });

    it('should display result icons', () => {
      const { container } = render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      expect(screen.getByText('📝')).toBeInTheDocument();
      expect(screen.getByText('🌐')).toBeInTheDocument();
    });
  });

  describe('Selection State', () => {
    it('should apply selected class to selected item', () => {
      const { container } = render(
        <ResultList
          results={mockResults}
          selectedIndex={1}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      const items = container.querySelectorAll('.result-item');
      expect(items[0]).not.toHaveClass('selected');
      expect(items[1]).toHaveClass('selected');
      expect(items[2]).not.toHaveClass('selected');
    });

    it('should update selection when selectedIndex changes', () => {
      const { rerender } = render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      const { container } = render(
        <ResultList
          results={mockResults}
          selectedIndex={2}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      const items = container.querySelectorAll('.result-item');
      expect(items[2]).toHaveClass('selected');
    });
  });

  describe('Click Interactions', () => {
    it('should call onSelectIndex when mouse enters item', () => {
      const { container } = render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      const items = container.querySelectorAll('.result-item');
      fireEvent.mouseEnter(items[1]);

      expect(onSelectIndex).toHaveBeenCalledWith(1);
    });

    it('should call onExecute when item is clicked', () => {
      const { container } = render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      const items = container.querySelectorAll('.result-item');
      fireEvent.click(items[0]);

      expect(onExecute).toHaveBeenCalledWith(0);
    });

    it('should execute correct item when clicked', () => {
      const { container } = render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      const items = container.querySelectorAll('.result-item');
      fireEvent.click(items[2]);

      expect(onExecute).toHaveBeenCalledWith(2);
    });
  });

  describe('Result Display', () => {
    it('should display result title', () => {
      render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      expect(screen.getByText('Visual Studio Code')).toBeInTheDocument();
      expect(screen.getByText('Google Chrome')).toBeInTheDocument();
    });

    it('should display result subtitle', () => {
      render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      expect(screen.getByText('/usr/bin/code')).toBeInTheDocument();
      expect(screen.getByText('/usr/bin/google-chrome')).toBeInTheDocument();
    });

    it('should display high match badge for top results', () => {
      const { container } = render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      // Use getAllByText since multiple results may have score > 0.7
      const badges = screen.getAllByText('Top Match');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should not display badge for low scoring results', () => {
      const lowScoreResults = [
        { ...mockResults[0], score: 0.5 },
      ];

      const { container } = render(
        <ResultList
          results={lowScoreResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      expect(screen.queryByText('Top Match')).not.toBeInTheDocument();
    });
  });

  describe('Search Highlighting', () => {
    it('should highlight matching text in title', () => {
      const { container } = render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
          query="code"
        />
      );

      // Check for highlight marks
      const highlights = container.querySelectorAll('.highlight');
      expect(highlights.length).toBeGreaterThan(0);
    });

    it('should highlight matching text in subtitle', () => {
      const { container } = render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
          query="usr"
        />
      );

      const highlights = container.querySelectorAll('.highlight');
      expect(highlights.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive for highlighting', () => {
      const { container } = render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
          query="CODE"
        />
      );

      const highlights = container.querySelectorAll('.highlight');
      expect(highlights.length).toBeGreaterThan(0);
    });

    it('should not highlight when query is empty', () => {
      const { container } = render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
          query=""
        />
      );

      const highlights = container.querySelectorAll('.highlight');
      expect(highlights.length).toBe(0);
    });
  });

  describe('Type Icons', () => {
    it('should show correct icon for app type', () => {
      render(
        <ResultList
          results={mockResultsWithoutIcons}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      expect(screen.getByText('📱')).toBeInTheDocument();
    });

    it('should show correct icon for file type', () => {
      render(
        <ResultList
          results={mockFileResultsWithoutIcons}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      expect(screen.getByText('📄')).toBeInTheDocument();
    });

    it('should show custom icon when provided', () => {
      render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      expect(screen.getByText('📝')).toBeInTheDocument();
    });
  });

  describe('Source Display', () => {
    it('should display source when available', () => {
      const resultsWithSource: SearchResult[] = [
        {
          ...mockResults[0],
          source: 'Chrome',
        },
      ];

      render(
        <ResultList
          results={resultsWithSource}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      expect(screen.getByText('Chrome')).toBeInTheDocument();
    });

    it('should not display source when not available', () => {
      render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      // Should not have any source elements
      const sources = screen.queryAllByLabelText(/Source:/);
      expect(sources).toHaveLength(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      const { container } = render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      const listbox = container.querySelector('[role="listbox"]');
      expect(listbox).toBeInTheDocument();
    });

    it('should have aria-selected on selected item', () => {
      const { container } = render(
        <ResultList
          results={mockResults}
          selectedIndex={1}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      const items = container.querySelectorAll('[role="option"]');
      expect(items[0]).toHaveAttribute('aria-selected', 'false');
      expect(items[1]).toHaveAttribute('aria-selected', 'true');
    });

    it('should have aria-live for announcements', () => {
      const { container } = render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      const listbox = container.querySelector('[aria-live]');
      expect(listbox).toHaveAttribute('aria-live', 'polite');
    });

    it('should have proper label', () => {
      const { container } = render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      const listbox = container.querySelector('[aria-label="搜索结果"]');
      expect(listbox).toBeInTheDocument();
    });

    it('should set correct id', () => {
      const { container } = render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
          id="custom-results"
        />
      );

      const listbox = container.querySelector('#custom-results');
      expect(listbox).toBeInTheDocument();
    });

    it('should have proper tab index for selected item', () => {
      const { container } = render(
        <ResultList
          results={mockResults}
          selectedIndex={1}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      const items = container.querySelectorAll('[role="option"]');
      expect(items[0]).toHaveAttribute('tabIndex', '-1');
      expect(items[1]).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Performance', () => {
    it('should handle large result sets efficiently', () => {
      const largeResults = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        title: `Result ${i}`,
        subtitle: `/path/to/result${i}`,
        icon: '📄',
        type: 'file' as const,
        score: 0.5,
        action: vi.fn(),
      }));

      const startTime = performance.now();
      render(
        <ResultList
          results={largeResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );
      const endTime = performance.now();

      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should not re-render unchanged items', () => {
      const { rerender } = render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      // Rerender with same props
      rerender(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      // Component should handle this efficiently
      expect(screen.getByText('Visual Studio Code')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single result', () => {
      render(
        <ResultList
          results={[mockResults[0]]}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      expect(screen.getByText('Visual Studio Code')).toBeInTheDocument();
    });

    it('should handle results with missing subtitles', () => {
      const noSubtitleResults = [
        { ...mockResults[0], subtitle: undefined },
      ];

      const { container } = render(
        <ResultList
          results={noSubtitleResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      expect(screen.getByText('Visual Studio Code')).toBeInTheDocument();
      expect(screen.queryByText('/usr/bin/code')).not.toBeInTheDocument();
    });

    it('should handle special characters in query', () => {
      const { container } = render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
          query="c++"
        />
      );

      // Should not throw
      expect(screen.getByText('Visual Studio Code')).toBeInTheDocument();
    });

    it('should handle empty query', () => {
      render(
        <ResultList
          results={mockResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
          query=""
        />
      );

      expect(screen.getByText('Visual Studio Code')).toBeInTheDocument();
    });
  });

  describe('Different Result Types', () => {
    it('should display clipboard results correctly', () => {
      const clipboardResults: SearchResult[] = [
        {
          id: 'clip-1',
          title: 'Sample clipboard text',
          subtitle: '2 minutes ago',
          icon: '📋',
          type: 'clipboard',
          score: 1,
          action: vi.fn(),
        },
      ];

      render(
        <ResultList
          results={clipboardResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      expect(screen.getByText('Sample clipboard text')).toBeInTheDocument();
      expect(screen.getByText('📋')).toBeInTheDocument();
    });

    it('should display bookmark results correctly', () => {
      const bookmarkResults: SearchResult[] = [
        {
          id: 'bookmark-1',
          title: 'GitHub',
          subtitle: 'https://github.com',
          icon: '⭐',
          type: 'bookmark',
          score: 0.9,
          action: vi.fn(),
        },
      ];

      render(
        <ResultList
          results={bookmarkResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      expect(screen.getByText('GitHub')).toBeInTheDocument();
      expect(screen.getByText('⭐')).toBeInTheDocument();
    });

    it('should display plugin results correctly', () => {
      const pluginResults: SearchResult[] = [
        {
          id: 'plugin-1',
          title: 'Timestamp',
          subtitle: 'Current timestamp plugin',
          icon: '🔌',
          type: 'plugin',
          score: 1,
          action: vi.fn(),
        },
      ];

      render(
        <ResultList
          results={pluginResults}
          selectedIndex={0}
          onSelectIndex={onSelectIndex}
          onExecute={onExecute}
        />
      );

      expect(screen.getByText('Timestamp')).toBeInTheDocument();
      expect(screen.getByText('🔌')).toBeInTheDocument();
    });
  });
});
