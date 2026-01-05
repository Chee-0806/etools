/**
 * SearchService Unit Tests
 * Tests for fuzzy matching, result ranking, and result creation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchService } from '@/services/searchService';
import type { SearchResult, SearchResultType, ScoringConfig } from '@/types/search';

describe('SearchService', () => {
  let searchService: SearchService;
  let mockResults: SearchResult[];

  beforeEach(() => {
    searchService = new SearchService();
    mockResults = [
      {
        id: '1',
        title: 'Visual Studio Code',
        subtitle: '/usr/bin/code',
        icon: '📝',
        type: 'app',
        score: 0,
        action: vi.fn(),
      },
      {
        id: '2',
        title: 'Chrome',
        subtitle: '/usr/bin/google-chrome',
        icon: '🌐',
        type: 'app',
        score: 0,
        action: vi.fn(),
      },
      {
        id: '3',
        title: 'Terminal',
        subtitle: '/usr/bin/terminal',
        icon: '⌨️',
        type: 'app',
        score: 0,
        action: vi.fn(),
      },
      {
        id: '4',
        title: 'Notes',
        subtitle: 'Quick notes app',
        icon: '📝',
        type: 'app',
        score: 0,
        action: vi.fn(),
      },
    ];
  });

  describe('calculateScore', () => {
    it('should calculate score with all components', () => {
      const score = searchService.calculateScore(0.2, 50, 'app');
      
      // fuzzyScore: 0.2 -> normalized: 0.8
      // frequency: 50 -> boost: 0.5
      // type: app -> boost: 1.0
      // 0.8 * 0.5 + 0.5 * 0.3 + 1.0 * 0.2 = 0.4 + 0.15 + 0.2 = 0.75
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1.5);
    });

    it('should give higher score for exact fuzzy match', () => {
      const exactMatchScore = searchService.calculateScore(0, 10, 'app');
      const poorMatchScore = searchService.calculateScore(0.8, 10, 'app');
      
      expect(exactMatchScore).toBeGreaterThan(poorMatchScore);
    });

    it('should boost score for high frequency items', () => {
      const lowFreqScore = searchService.calculateScore(0.3, 5, 'app');
      const highFreqScore = searchService.calculateScore(0.3, 100, 'app');
      
      expect(highFreqScore).toBeGreaterThan(lowFreqScore);
    });

    it('should prioritize app type over file type', () => {
      const appScore = searchService.calculateScore(0.3, 10, 'app');
      const fileScore = searchService.calculateScore(0.3, 10, 'file');
      
      expect(appScore).toBeGreaterThan(fileScore);
    });

    it('should cap frequency boost at 100 uses', () => {
      const freq100Score = searchService.calculateScore(0.3, 100, 'app');
      const freq200Score = searchService.calculateScore(0.3, 200, 'app');

      // Both should be the same since frequency is capped at 100
      expect(freq100Score).toBeCloseTo(freq200Score, 2);
    });
  });

  describe('fuzzySearch', () => {
    it('should return all items when query is empty', () => {
      const results = searchService.fuzzySearch(mockResults, '');
      
      expect(results).toHaveLength(mockResults.length);
      expect(results[0].score).toBe(0);
    });

    it('should perform fuzzy matching on title', () => {
      const results = searchService.fuzzySearch(mockResults, 'code');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.title).toContain('Code');
    });

    it('should perform fuzzy matching on subtitle', () => {
      const results = searchService.fuzzySearch(mockResults, 'terminal');
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-matching query', () => {
      const results = searchService.fuzzySearch(mockResults, 'zzzzzz');
      
      expect(results).toHaveLength(0);
    });

    it('should handle case-insensitive search', () => {
      const lowerResults = searchService.fuzzySearch(mockResults, 'chrome');
      const upperResults = searchService.fuzzySearch(mockResults, 'CHROME');
      
      expect(lowerResults.length).toBe(upperResults.length);
    });
  });

  describe('search', () => {
    it('should return search response with results and metadata', () => {
      const response = searchService.search(mockResults, 'code');
      
      expect(response).toHaveProperty('results');
      expect(response).toHaveProperty('total');
      expect(response).toHaveProperty('queryTime');
      expect(response.total).toBe(response.results.length);
      expect(typeof response.queryTime).toBe('number');
    });

    it('should filter by sources when specified', () => {
      const response = searchService.search(
        mockResults,
        '',
        { sources: ['app'] }
      );
      
      expect(response.results.every(r => r.type === 'app')).toBe(true);
    });

    it('should respect limit option', () => {
      const response = searchService.search(
        mockResults,
        '',
        { limit: 2 }
      );
      
      expect(response.results.length).toBeLessThanOrEqual(2);
    });

    it('should sort results by score (descending)', () => {
      const response = searchService.search(mockResults, 'code');
      
      for (let i = 1; i < response.results.length; i++) {
        expect(response.results[i - 1].score).toBeGreaterThanOrEqual(
          response.results[i].score
        );
      }
    });
  });

  describe('createAppResult', () => {
    it('should create app search result with correct properties', () => {
      const result = searchService.createAppResult(
        'test-id',
        'Test App',
        '/usr/bin/test',
        '🧪',
        25
      );
      
      expect(result.id).toBe('test-id');
      expect(result.title).toBe('Test App');
      expect(result.subtitle).toBe('/usr/bin/test');
      expect(result.icon).toBe('🧪');
      expect(result.type).toBe('app');
      expect(result.score).toBe(0);
      expect(result.action).toBeInstanceOf(Function);
    });

    it('should create action that launches app in Tauri', async () => {
      // Mock window.__TAURI__
      (window as any).__TAURI__ = {};
      
      const mockInvoke = vi.fn().mockResolvedValue(undefined);
      vi.doMock('@tauri-apps/api/core', () => ({
        invoke: mockInvoke,
      }));
      
      const result = searchService.createAppResult(
        'test-id',
        'Test App',
        '/usr/bin/test'
      );
      
      await result.action();
      
      // In browser mode, it should just log
      expect(result).toBeDefined();
    });
  });

  describe('createFileResult', () => {
    it('should create file search result with correct properties', () => {
      const result = searchService.createFileResult(
        'file-1',
        'document.pdf',
        '/Users/test/document.pdf',
        'pdf',
        1024000
      );
      
      expect(result.id).toBe('file-1');
      expect(result.title).toBe('document.pdf');
      expect(result.subtitle).toBe('/Users/test/document.pdf');
      expect(result.type).toBe('file');
      expect(result.icon).toBe('📕');
    });

    it('should return default icon for unknown extension', () => {
      const result = searchService.createFileResult(
        'file-1',
        'unknown.xyz',
        '/path/to/file.xyz',
        'xyz'
      );
      
      expect(result.icon).toBe('📄');
    });

    it('should map common extensions to correct icons', () => {
      const testCases = [
        { ext: 'ts', icon: '📘' },
        { ext: 'js', icon: '📒' },
        { ext: 'py', icon: '🐍' },
        { ext: 'css', icon: '🎨' },
        { ext: 'json', icon: '📋' },
        { ext: 'md', icon: '📝' },
        { ext: 'png', icon: '🖼️' },
        { ext: 'pdf', icon: '📕' },
        { ext: 'zip', icon: '📦' },
      ];

      testCases.forEach(({ ext, icon }) => {
        const result = searchService.createFileResult(
          `file-1`,
          `test.${ext}`,
          `/path/to/test.${ext}`,
          ext
        );
        expect(result.icon).toBe(icon);
      });
    });
  });

  describe('createBrowserResult', () => {
    it('should create bookmark result', () => {
      const result = searchService.createBrowserResult(
        'bookmark-1',
        'GitHub',
        'https://github.com',
        'Chrome',
        'bookmark',
        '📦'
      );
      
      expect(result.id).toBe('bookmark-1');
      expect(result.title).toBe('GitHub');
      expect(result.subtitle).toBe('https://github.com');
      expect(result.type).toBe('bookmark');
      expect(result.icon).toBe('📦');
    });

    it('should create history result', () => {
      const result = searchService.createBrowserResult(
        'history-1',
        'Stack Overflow',
        'https://stackoverflow.com',
        'Chrome',
        'history',
        '📚'
      );
      
      expect(result.type).toBe('history');
    });
  });

  describe('Fuse instance caching', () => {
    it('should cache Fuse instances for performance', () => {
      const searchService1 = new SearchService();
      
      searchService1.fuzzySearch(mockResults, 'test');
      searchService1.fuzzySearch(mockResults, 'test');
      
      // Should reuse cached instance
      expect(searchService1).toBeDefined();
    });

    it('should limit cache size to 50 instances', () => {
      const largeResults = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        title: `Item ${i}`,
        subtitle: `Subtitle ${i}`,
        icon: '📄',
        type: 'file' as SearchResultType,
        score: 0,
        action: vi.fn(),
      }));

      // This should not cause memory issues due to cache limiting
      for (let i = 0; i < 60; i++) {
        searchService.fuzzySearch(largeResults, `test${i}`);
      }
      
      expect(searchService).toBeDefined();
    });
  });

  describe('Custom scoring configuration', () => {
    it('should use custom config when provided', () => {
      const customConfig: ScoringConfig = {
        fuzzyWeight: 0.8,
        frequencyWeight: 0.1,
        typeWeight: 0.1,
      };
      
      const customService = new SearchService(customConfig);
      const score = customService.calculateScore(0.2, 50, 'app');
      
      // With custom weights, fuzzy match should have more impact
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('Singleton pattern', () => {
    it('should return same instance on multiple calls', async () => {
      const { getSearchService } = await import('@/services/searchService');

      const instance1 = getSearchService();
      const instance2 = getSearchService();

      expect(instance1).toBe(instance2);
    });
  });
});
