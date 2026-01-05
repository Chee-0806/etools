/**
 * JSON Formatter Plugin (T160, T164)
 * Formats, validates, and minifies JSON data
 */

import type { Plugin, PluginSearchResult, PluginPermission } from '../../plugin-sdk/types';

const manifest = {
  id: 'json-formatter',
  name: 'JSON 格式化',
  version: '1.0.0',
  description: 'Format, validate, and minify JSON',
  author: 'Kaka Team',
  permissions: ['read_clipboard'] as PluginPermission[],
  triggers: ['json:', 'format:'],
};

// Try to parse JSON from clipboard
async function getClipboardJson(): Promise<any> {
  try {
    const text = await navigator.clipboard.readText();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Format JSON with indentation
function formatJson(obj: any, indent: number = 2): string {
  return JSON.stringify(obj, null, indent);
}

// Minify JSON
function minifyJson(obj: any): string {
  return JSON.stringify(obj);
}

const plugin: Plugin = {
  manifest,
  onSearch: async (query: string): Promise<PluginSearchResult[]> => {
    const results: PluginSearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Check for "json:format" trigger
    if (lowerQuery === 'json:format' || lowerQuery === 'format:json') {
      const jsonObj = await getClipboardJson();
      if (jsonObj) {
        const formatted = formatJson(jsonObj);
        results.push({
          id: 'json-format',
          title: '格式化 JSON',
          description: '将剪贴板中的 JSON 格式化',
          icon: '📋',
          action: async () => {
            await navigator.clipboard.writeText(formatted);
          },
        });
      }
    }

    // Check for "json:minify" trigger
    if (lowerQuery === 'json:minify' || lowerQuery === 'minify:json') {
      const jsonObj = await getClipboardJson();
      if (jsonObj) {
        const minified = minifyJson(jsonObj);
        results.push({
          id: 'json-minify',
          title: '压缩 JSON',
          description: '将剪贴板中的 JSON 压缩',
          icon: '🗜️',
          action: async () => {
            await navigator.clipboard.writeText(minified);
          },
        });
      }
    }

    // Check for "json:validate" trigger
    if (lowerQuery === 'json:validate' || lowerQuery === 'validate:json') {
      const jsonObj = await getClipboardJson();
      results.push({
        id: 'json-validate',
        title: jsonObj ? '✅ JSON 有效' : '❌ JSON 无效',
        description: jsonObj ? '剪贴板中的 JSON 格式正确' : '剪贴板中的不是有效的 JSON',
        icon: '✅',
        action: async () => {
          // No action needed, just validation
        },
      });
    }

    return results;
  },
};

export default plugin;
