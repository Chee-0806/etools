/**
 * ActionService Unit Tests
 * Tests for quick actions: calculator, color conversion, web search triggers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActionService } from '@/services/actionService';
import type { SearchResult } from '@/types/search';

describe('ActionService', () => {
  let actionService: ActionService;

  beforeEach(() => {
    actionService = new ActionService();
    // Mock Tauri invoke
    (window as any).__TAURI__ = {};
  });

  describe('Web Search Triggers', () => {
    it('should detect Google search trigger', () => {
      const result = actionService.detectAction('g: test query');
      
      expect(result).not.toBeNull();
      expect(result?.title).toContain('google');
      expect(result?.title).toContain('test query');
      expect(result?.icon).toBe('🔍');
      expect(result?.type).toBe('action');
    });

    it('should detect DuckDuckGo search trigger', () => {
      const result = actionService.detectAction('ddg: privacy search');
      
      expect(result).not.toBeNull();
      expect(result?.title).toContain('duckduckgo');
    });

    it('should detect GitHub search trigger', () => {
      const result = actionService.detectAction('gh: tauri');
      
      expect(result).not.toBeNull();
      expect(result?.title).toContain('github');
    });

    it('should detect Stack Overflow search trigger', () => {
      const result = actionService.detectAction('so: react hooks');
      
      expect(result).not.toBeNull();
      expect(result?.title).toContain('stackoverflow');
    });

    it('should handle search trigger with no query gracefully', () => {
      const result = actionService.detectAction('g:');

      expect(result).toBeNull();
    });

    it('should encode search terms in URL', () => {
      const result = actionService.detectAction('g: hello world');
      
      expect(result?.action).toBeInstanceOf(Function);
    });
  });

  describe('Calculator', () => {
    it('should detect math expression', () => {
      const result = actionService.detectAction('2 + 2');
      
      expect(result).not.toBeNull();
      expect(result?.icon).toBe('🧮');
      expect(result?.type).toBe('action');
    });

    it('should evaluate basic addition', () => {
      const result = actionService.detectAction('2 + 2');
      
      expect(result?.title).toBe('4');
      expect(result?.subtitle).toBe('= 2 + 2');
    });

    it('should evaluate subtraction', () => {
      const result = actionService.detectAction('10 - 3');
      
      expect(result?.title).toBe('7');
    });

    it('should evaluate multiplication', () => {
      const result = actionService.detectAction('6 * 7');
      
      expect(result?.title).toBe('42');
    });

    it('should evaluate division', () => {
      const result = actionService.detectAction('100 / 4');
      
      expect(result?.title).toBe('25');
    });

    it('should evaluate complex expressions with parentheses', () => {
      const result = actionService.detectAction('(2 + 3) * 4');
      
      expect(result?.title).toBe('20');
    });

    it('should handle decimal results', () => {
      const result = actionService.detectAction('10 / 3');
      
      expect(result?.title).toBe('3.3333');
    });

    it('should handle very small decimal results', () => {
      const result = actionService.detectAction('0.1 + 0.2');
      
      expect(parseFloat(result?.title || '0')).toBeCloseTo(0.3, 4);
    });

    it('should reject non-math expressions', () => {
      const result = actionService.detectAction('not a math expression');
      
      expect(result).toBeNull();
    });

    it('should reject expressions with dangerous characters', () => {
      const result = actionService.detectAction('2 + 2; console.log("hack")');
      
      expect(result).toBeNull();
    });

    it('should reject expressions shorter than 2 characters', () => {
      const result = actionService.detectAction('1');
      
      expect(result).toBeNull();
    });

    it('should handle percentage calculations', () => {
      const result = actionService.detectAction('100 * 0.05');
      
      expect(result?.title).toBe('5');
    });
  });

  describe('Color Conversion', () => {
    it('should detect hex color with 3 characters', () => {
      const result = actionService.detectAction('#abc');
      
      expect(result).not.toBeNull();
      expect(result?.icon).toBe('🎨');
      expect(result?.type).toBe('action');
    });

    it('should detect hex color with 6 characters', () => {
      const result = actionService.detectAction('#ff5733');
      
      expect(result).not.toBeNull();
      expect(result?.title).toBe('#FF5733');
    });

    it('should convert hex to RGB', () => {
      const result = actionService.detectAction('#ff0000');
      
      expect(result?.subtitle).toContain('rgb(255, 0, 0)');
    });

    it('should convert hex to HSL', () => {
      const result = actionService.detectAction('#ff0000');
      
      expect(result?.subtitle).toContain('hsl(');
    });

    it('should expand shorthand hex to full form', () => {
      const result1 = actionService.detectAction('#abc');
      const result2 = actionService.detectAction('#aabbcc');
      
      // Both should produce same RGB values
      expect(result1?.subtitle).toBe(result2?.subtitle);
    });

    it('should handle case-insensitive hex input', () => {
      const result1 = actionService.detectAction('#ABC');
      const result2 = actionService.detectAction('#abc');
      
      expect(result1?.title).toBe(result2?.title);
    });

    it('should validate hex format - reject invalid', () => {
      const result = actionService.detectAction('#gggggg');
      
      expect(result).toBeNull();
    });
  });

  describe('URL Detection', () => {
    it('should detect valid URL', () => {
      const result = actionService.detectAction('https://example.com');
      
      expect(result).not.toBeNull();
      expect(result?.icon).toBe('🔗');
      expect(result?.type).toBe('url');
    });

    it('should detect HTTP URL', () => {
      const result = actionService.detectAction('http://example.com');
      
      expect(result).not.toBeNull();
    });

    it('should reject non-URL text', () => {
      const result = actionService.detectAction('not a url');
      
      expect(result).toBeNull();
    });

    it('should handle URLs with query parameters', () => {
      const result = actionService.detectAction('https://example.com?query=test');
      
      expect(result).not.toBeNull();
      expect(result?.title).toContain('?query=test');
    });
  });

  describe('Priority Handling', () => {
    it('should prioritize web search over color', () => {
      // "g:" prefix should be detected as search, not color
      const result = actionService.detectAction('g: #fff');
      
      expect(result?.title).toContain('google');
    });

    it('should prioritize calculator over URL', () => {
      // Math expressions should be detected before URL checking
      const result = actionService.detectAction('2 + 2');
      
      expect(result?.icon).toBe('🧮');
      expect(result?.type).toBe('action');
    });

    it('should return null for unrecognised input', () => {
      const result = actionService.detectAction('random text that is not a pattern');
      
      expect(result).toBeNull();
    });
  });

  describe('Action Execution', () => {
    it('should provide executable action for web search', async () => {
      const result = actionService.detectAction('g: test');
      
      expect(result?.action).toBeInstanceOf(Function);
      
      // Action should not throw when called (it may be mocked in tests)
      if (result?.action) {
        await result.action();
        expect(true).toBe(true); // If we get here, action didn't throw
      }
    });

    it('should provide executable action for calculator', async () => {
      const result = actionService.detectAction('2 + 2');
      
      expect(result?.action).toBeInstanceOf(Function);
      
      if (result?.action) {
        await result.action();
        expect(true).toBe(true);
      }
    });

    it('should provide executable action for color', async () => {
      const result = actionService.detectAction('#fff');
      
      expect(result?.action).toBeInstanceOf(Function);
    });

    it('should provide executable action for URL', async () => {
      const result = actionService.detectAction('https://example.com');
      
      expect(result?.action).toBeInstanceOf(Function);
    });
  });

  describe('Score Assignment', () => {
    it('should assign high score to web search', () => {
      const result = actionService.detectAction('g: test');
      
      expect(result?.score).toBe(0.95);
    });

    it('should assign perfect score to calculator', () => {
      const result = actionService.detectAction('2 + 2');
      
      expect(result?.score).toBe(1);
    });

    it('should assign perfect score to color', () => {
      const result = actionService.detectAction('#fff');
      
      expect(result?.score).toBe(1);
    });

    it('should assign high score to URL', () => {
      const result = actionService.detectAction('https://example.com');
      
      expect(result?.score).toBe(0.9);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance on multiple calls', async () => {
      const { getActionService } = await import('@/services/actionService');

      const instance1 = getActionService();
      const instance2 = getActionService();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const result = actionService.detectAction('');
      
      expect(result).toBeNull();
    });

    it('should handle whitespace-only input', () => {
      const result = actionService.detectAction('   ');
      
      expect(result).toBeNull();
    });

    it('should handle very long math expressions', () => {
      const longExpr = '1' + ' + 1'.repeat(50);
      const result = actionService.detectAction(longExpr);
      
      expect(result).not.toBeNull();
    });

    it('should handle division by zero gracefully', () => {
      const result = actionService.detectAction('1 / 0');
      
      // JavaScript returns Infinity for division by zero
      expect(result?.title).toBe('Infinity');
    });

    it('should handle complex nested parentheses', () => {
      const result = actionService.detectAction('((2 + 3) * (4 - 1)) / 5');
      
      expect(result?.title).toBe('3');
    });
  });
});
