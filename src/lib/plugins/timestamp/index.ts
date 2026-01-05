/**
 * Timestamp Converter Plugin (T161, T165)
 * Converts between Unix timestamps and human-readable dates
 */

import type { Plugin, PluginSearchResult } from '../../plugin-sdk/types';

const manifest = {
  id: 'timestamp-converter',
  name: '时间戳转换',
  version: '1.0.0',
  description: 'Convert Unix timestamps to dates and vice versa',
  author: 'Kaka Team',
  permissions: [],
  triggers: ['ts:', 'timestamp:'],
};

// Convert Unix timestamp to date string
function timestampToDate(ts: number): string {
  const date = new Date(ts * 1000);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Convert date string to Unix timestamp
function dateToTimestamp(dateStr: string): number | null {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return null;
  }
  return Math.floor(date.getTime() / 1000);
}

// Get current timestamp
function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

const plugin: Plugin = {
  manifest,
  onSearch: (query: string): PluginSearchResult[] => {
    const results: PluginSearchResult[] = [];

    // Check for "ts:now" or "timestamp:now" trigger
    if (query.toLowerCase() === 'ts:now' || query.toLowerCase() === 'timestamp:now') {
      const now = getCurrentTimestamp();
      const nowStr = timestampToDate(now);

      results.push({
        id: 'ts-now',
        title: nowStr,
        description: `当前时间戳: ${now}`,
        icon: '🕐',
        action: async () => {
          // Copy timestamp to clipboard
          await navigator.clipboard.writeText(now.toString());
        },
      });

      return results;
    }

    // Check for timestamp pattern (10 or 13 digits)
    const tsMatch = query.match(/\b(\d{10}|\d{13})\b/);
    if (tsMatch) {
      const ts = parseInt(tsMatch[1], 10);
      // If 13 digits, it's milliseconds; convert to seconds
      const adjustedTs = tsMatch[1].length === 13 ? ts / 1000 : ts;

      const dateStr = timestampToDate(adjustedTs);

      results.push({
        id: `ts-${ts}`,
        title: dateStr,
        description: `时间戳: ${ts}`,
        icon: '🕐',
        action: async () => {
          await navigator.clipboard.writeText(dateStr);
        },
      });
    }

    // Check for date patterns (YYYY-MM-DD, MM/DD/YYYY, etc.)
    const dateMatch = query.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})|(\d{1,2}[-/]\d{1,2}[-/]\d{4})/);
    if (dateMatch) {
      const dateStr = dateMatch[0];
      const ts = dateToTimestamp(dateStr);

      if (ts !== null) {
        results.push({
          id: `date-${dateStr}`,
          title: ts.toString(),
          description: `日期: ${dateStr}`,
          icon: '📅',
          action: async () => {
            await navigator.clipboard.writeText(ts.toString());
          },
        });
      }
    }

    return results;
  },
};

export default plugin;
