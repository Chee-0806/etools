/**
 * Regex Tester Plugin (T159, T163) - v2 API
 * Tests regular expressions against input strings
 */

import type {
  PluginV2,
  PluginManifest,
  PluginSearchResultV2,
} from '../../plugin-sdk/v2-types';

export const manifest: PluginManifest = {
  id: 'regex-tester',
  name: '正则测试',
  version: '2.0.0',
  description: 'Test and validate regular expressions (v2 API)',
  author: 'Kaka Team',
  permissions: [],
  triggers: ['regex:', 're:'],
  icon: '🔍',
};

/**
 * Test regex against input
 */
function testRegex(pattern: string, flags: string, input: string): {
  match: boolean;
  result: string;
  matches: string[];
  error?: string;
} {
  try {
    const regex = new RegExp(pattern, flags);
    const matches = input.match(regex);

    if (matches) {
      return {
        match: true,
        result: matches.join(', '),
        matches: matches,
      };
    }

    return {
      match: false,
      result: 'No matches found',
      matches: [],
    };
  } catch (e) {
    return {
      match: false,
      result: `Invalid regex: ${e instanceof Error ? e.message : String(e)}`,
      matches: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Parse regex query: "regex:/pattern/flags test string" or "re:/pattern/flags test"
 */
function parseRegexQuery(query: string): { pattern: string; flags: string; test: string } | null {
  // Format: "regex:/pattern/g test string" or "re:/pattern/i test"
  const regexMatch = query.match(/^(?:regex|re):\/(.+?)\/([gimsuvy]*)\s*(.*)$/s);
  if (regexMatch) {
    return {
      pattern: regexMatch[1],
      flags: regexMatch[2] || 'g',
      test: regexMatch[3] || '',
    };
  }

  return null;
}

/**
 * onSearch - Executes in Worker
 * Returns PluginSearchResultV2[] with actionData (serializable, no functions)
 */
export async function onSearch(query: string): Promise<PluginSearchResultV2[]> {
  const results: PluginSearchResultV2[] = [];

  const parsed = parseRegexQuery(query);
  if (parsed) {
    const { pattern, flags, test } = parsed;

    const { match, result, matches, error } = testRegex(pattern, flags, test);

    if (error) {
      results.push({
        id: 'regex-error',
        title: '❌ 正则表达式错误',
        description: error,
        icon: '❌',
        score: 0.5,
        actionData: {
          type: 'none',
        },
      });
    } else if (test) {
      // Has test string - show result
      results.push({
        id: 'regex-test-result',
        title: match ? `✅ 匹配成功 (${matches.length} 个)` : '❌ 未匹配',
        description: result.substring(0, 100) + (result.length > 100 ? '...' : ''),
        icon: '🔍',
        score: 0.95,
        actionData: {
          type: 'clipboard',
          description: `Copy matches: ${result}`,
          data: {
            clipboard: {
              text: result,
              type: 'text',
            },
          },
          metadata: {
            pattern,
            flags,
            testString: test,
            matchCount: matches.length,
          },
        },
      });
    } else {
      // No test string - show help
      results.push({
        id: 'regex-test-help',
        title: '正则表达式测试',
        description: `在表达式后输入测试文本，例如: regex:/${pattern}/ 测试文本`,
        icon: '🔍',
        score: 0.8,
        actionData: {
          type: 'none',
        },
      });
    }
  }

  // Add quick test suggestions when typing "regex:" or "re:"
  const lowerQuery = query.toLowerCase();
  if (lowerQuery === 'regex:' || lowerQuery === 're:') {
    results.push(
      {
        id: 'regex-email',
        title: '邮箱验证',
        description: 'regex:/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/ 测试文本',
        icon: '📧',
        score: 0.85,
        actionData: {
          type: 'none',
        },
      },
      {
        id: 'regex-url',
        title: 'URL 验证',
        description: 'regex:/^https?:\\/\\/[^\\s/$.?#].[^\\s]*$/ 测试文本',
        icon: '🔗',
        score: 0.85,
        actionData: {
          type: 'none',
        },
      },
      {
        id: 'regex-phone',
        title: '手机号验证',
        description: 'regex:/^1[3-9]\\d{9}$/ 13800138000',
        icon: '📱',
        score: 0.85,
        actionData: {
          type: 'none',
        },
      },
      {
        id: 'regex-date',
        title: '日期验证',
        description: 'regex:/^\\d{4}-\\d{2}-\\d{2}$/ 2024-01-15',
        icon: '📅',
        score: 0.85,
        actionData: {
          type: 'none',
        },
      }
    );
  }

  return results;
}

/**
 * Plugin export
 */
const plugin: PluginV2 = {
  manifest,
  onSearch,
};

export default plugin;
