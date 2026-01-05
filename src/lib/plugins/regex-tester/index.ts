/**
 * Regex Tester Plugin (T159, T163)
 * Tests regular expressions against input strings
 */

import type { Plugin, PluginSearchResult } from '../../plugin-sdk/types';

const manifest = {
  id: 'regex-tester',
  name: '正则测试',
  version: '1.0.0',
  description: 'Test and validate regular expressions',
  author: 'Kaka Team',
  permissions: [],
  triggers: ['regex:', 're:'],
};

// Test regex against input
function testRegex(pattern: string, input: string): { match: boolean; result: string } {
  try {
    const regex = new RegExp(pattern, 'g');
    const matches = input.match(regex);

    if (matches) {
      return {
        match: true,
        result: matches.join(', '),
      };
    }

    return {
      match: false,
      result: 'No matches found',
    };
  } catch (e) {
    return {
      match: false,
      result: `Invalid regex: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

// Extract pattern and test string from query
function parseRegexQuery(query: string): { pattern: string; test: string } | null {
  // Format: "regex:/pattern/ test string" or "re:/pattern/ test"
  const regexMatch = query.match(/^(?:regex|re):\/([^/]+)\/(?:\s+(.+))?$/);
  if (regexMatch) {
    return {
      pattern: regexMatch[1],
      test: regexMatch[2] || '',
    };
  }

  // Try to get pattern from clipboard if no test string provided
  return null;
}

const plugin: Plugin = {
  manifest,
  onSearch: async (query: string): Promise<PluginSearchResult[]> => {
    const results: PluginSearchResult[] = [];

    const parsed = parseRegexQuery(query);
    if (parsed) {
      const { pattern, test } = parsed;

      // If no test string, try to get from clipboard
      let testString = test;
      if (!testString) {
        try {
          testString = await navigator.clipboard.readText();
        } catch {
          testString = '';
        }
      }

      const { match, result } = testRegex(pattern, testString);

      results.push({
        id: 'regex-test',
        title: match ? '✅ 匹配成功' : '❌ 未匹配',
        description: result,
        icon: '🔍',
        action: async () => {
          await navigator.clipboard.writeText(result);
        },
      });
    }

    // Add quick test suggestions
    if (query.toLowerCase().startsWith('regex:') || query.toLowerCase().startsWith('re:')) {
      results.push({
        id: 'regex-email',
        title: '邮箱验证',
        description: '验证邮箱地址格式',
        icon: '📧',
        action: async () => {
          await navigator.clipboard.writeText('regex:/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/');
        },
      });

      results.push({
        id: 'regex-url',
        title: 'URL 验证',
        description: '验证 URL 格式',
        icon: '🔗',
        action: async () => {
          await navigator.clipboard.writeText('regex:/^https?:\\/\\/[^\\s/$.?#].[^\\s]*$/');
        },
      });

      results.push({
        id: 'regex-phone',
        title: '手机号验证',
        description: '验证中国手机号',
        icon: '📱',
        action: async () => {
          await navigator.clipboard.writeText('regex:/^1[3-9]\\d{9}$/');
        },
      });
    }

    return results;
  },
};

export default plugin;
