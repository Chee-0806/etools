/**
 * JSON Formatter Plugin (T160, T164) - v2 API
 * Formats, validates, and minifies JSON data
 *
 * v2 Architecture Note:
 * - This plugin provides JSON formatting tools
 * - Since reading clipboard requires main thread access,
 *   this plugin offers formatting/validation results without direct clipboard access
 * - Users can paste their JSON after selecting the desired operation
 */

import type {
  PluginV2,
  PluginManifest,
  PluginSearchResultV2,
} from '../../plugin-sdk/v2-types';

export const manifest: PluginManifest = {
  id: 'json-formatter',
  name: 'JSON 格式化',
  version: '2.0.0',
  description: 'Format, validate, and minify JSON (v2 API)',
  author: 'Kaka Team',
  permissions: [],  // No clipboard permissions needed in v2
  triggers: ['json:'],
  icon: '📋',
};

/**
 * Validate JSON string
 */
function validateJson(jsonStr: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(jsonStr);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format JSON with indentation
 */
function formatJson(jsonStr: string, indent: number = 2): { success: boolean; result?: string; error?: string } {
  const validation = validateJson(jsonStr);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const obj = JSON.parse(jsonStr);
    const formatted = JSON.stringify(obj, null, indent);
    return { success: true, result: formatted };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Minify JSON
 */
function minifyJson(jsonStr: string): { success: boolean; result?: string; error?: string } {
  const validation = validateJson(jsonStr);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const obj = JSON.parse(jsonStr);
    const minified = JSON.stringify(obj);
    return { success: true, result: minified };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * onSearch - Executes in Worker
 * Returns PluginSearchResultV2[] with actionData (serializable, no functions)
 */
export async function onSearch(query: string): Promise<PluginSearchResultV2[]> {
  const results: PluginSearchResultV2[] = [];
  const lowerQuery = query.toLowerCase();

  // Extract JSON from query if present (e.g., "json:format <json>")
  const jsonMatch = query.match(/json:\w+\s+(.+)/s);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : '';

  // Check for "json:format" trigger
  if (lowerQuery.startsWith('json:format')) {
    if (jsonStr) {
      const { success, result, error } = formatJson(jsonStr);

      if (success && result) {
        results.push({
          id: 'json-format-result',
          title: '✅ JSON 已格式化',
          description: '点击复制格式化后的 JSON',
          icon: '✨',
          score: 0.95,
          actionData: {
            type: 'clipboard',
            description: 'Copy formatted JSON to clipboard',
            data: {
              clipboard: {
                text: result,
                type: 'text',
              },
            },
          },
        });
      } else {
        results.push({
          id: 'json-format-error',
          title: '❌ JSON 格式错误',
          description: error || '无法解析 JSON',
          icon: '❌',
          score: 0.5,
          actionData: {
            type: 'none',
          },
        });
      }
    } else {
      // Show help if no JSON provided
      results.push({
        id: 'json-format-help',
        title: 'JSON 格式化工具',
        description: '在 "json:format" 后粘贴 JSON 内容',
        icon: '📋',
        score: 0.8,
        actionData: {
          type: 'none',
        },
      });
    }
  }

  // Check for "json:minify" trigger
  if (lowerQuery.startsWith('json:minify')) {
    if (jsonStr) {
      const { success, result, error } = minifyJson(jsonStr);

      if (success && result) {
        results.push({
          id: 'json-minify-result',
          title: '✅ JSON 已压缩',
          description: '点击复制压缩后的 JSON',
          icon: '🗜️',
          score: 0.95,
          actionData: {
            type: 'clipboard',
            description: 'Copy minified JSON to clipboard',
            data: {
              clipboard: {
                text: result,
                type: 'text',
              },
            },
          },
        });
      } else {
        results.push({
          id: 'json-minify-error',
          title: '❌ JSON 格式错误',
          description: error || '无法解析 JSON',
          icon: '❌',
          score: 0.5,
          actionData: {
            type: 'none',
          },
        });
      }
    } else {
      results.push({
        id: 'json-minify-help',
        title: 'JSON 压缩工具',
        description: '在 "json:minify" 后粘贴 JSON 内容',
        icon: '🗜️',
        score: 0.8,
        actionData: {
          type: 'none',
        },
      });
    }
  }

  // Check for "json:validate" trigger
  if (lowerQuery.startsWith('json:validate')) {
    if (jsonStr) {
      const { valid, error } = validateJson(jsonStr);

      results.push({
        id: 'json-validate-result',
        title: valid ? '✅ JSON 有效' : '❌ JSON 无效',
        description: valid ? '格式正确，可以解析' : error || '无法解析 JSON',
        icon: valid ? '✅' : '❌',
        score: 0.9,
        actionData: {
          type: 'popup',
          description: 'Show validation result',
          data: {
            popup: {
              title: valid ? 'JSON 验证成功' : 'JSON 验证失败',
              message: valid ? 'JSON 格式正确！' : `错误: ${error || '无法解析 JSON'}`,
              icon: valid ? '✅' : '❌',
              style: valid ? 'success' : 'error',
            },
          },
        },
      });
    } else {
      results.push({
        id: 'json-validate-help',
        title: 'JSON 验证工具',
        description: '在 "json:validate" 后粘贴 JSON 内容',
        icon: '🔍',
        score: 0.8,
        actionData: {
          type: 'none',
        },
      });
    }
  }

  // Show all tools if just "json:" is typed
  if (lowerQuery === 'json:') {
    results.push(
      {
        id: 'json-format-tool',
        title: '格式化 JSON',
        description: 'json:format <JSON>',
        icon: '✨',
        score: 0.85,
        actionData: {
          type: 'none',
        },
      },
      {
        id: 'json-minify-tool',
        title: '压缩 JSON',
        description: 'json:minify <JSON>',
        icon: '🗜️',
        score: 0.85,
        actionData: {
          type: 'none',
        },
      },
      {
        id: 'json-validate-tool',
        title: '验证 JSON',
        description: 'json:validate <JSON>',
        icon: '🔍',
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
