/**
 * Plugin Abbreviation Service
 * Manages user-defined shortcuts/abbreviations for quick plugin access
 */

import { invoke } from '@tauri-apps/api/core';
import type { Plugin, PluginAbbreviation } from '@/types/plugin';

interface PluginAbbreviationConfig {
  [pluginId: string]: PluginAbbreviation[];
}

class PluginAbbreviationService {
  private config: PluginAbbreviationConfig = {};
  private loaded = false;

  /**
   * Load abbreviation configuration from backend
   */
  async loadConfig(): Promise<void> {
    if (this.loaded) return;

    try {
      const config = await invoke<PluginAbbreviationConfig>('get_plugin_abbreviations');
      this.config = config;
      this.loaded = true;
    } catch (error) {
      console.error('[PluginAbbreviationService] Failed to load config:', error);
      // Initialize with empty config if file doesn't exist
      this.config = {};
      this.loaded = true;
    }
  }

  /**
   * Get all abbreviations for a specific plugin
   */
  getAbbreviations(pluginId: string): PluginAbbreviation[] {
    return this.config[pluginId] || [];
  }

  /**
   * Get abbreviation configuration for all plugins
   */
  getAllAbbreviations(): PluginAbbreviationConfig {
    return { ...this.config };
  }

  /**
   * Search plugins by user-defined abbreviations
   * Returns matching plugins with their abbreviations
   */
  searchPluginsByAbbreviation(
    query: string,
    plugins: Plugin[]
  ): Array<{ plugin: Plugin; abbreviation: PluginAbbreviation; matchType: 'exact' | 'prefix' | 'contains' }> {
    if (!query.trim()) return [];

    const queryLower = query.toLowerCase();
    const results: Array<{ plugin: Plugin; abbreviation: PluginAbbreviation; matchType: 'exact' | 'prefix' | 'contains' }> = [];

    for (const plugin of plugins) {
      // Skip disabled plugins
      if (plugin.enabled === false) continue;

      const abbreviations = this.getAbbreviations(plugin.manifest.id);

      for (const abbr of abbreviations) {
        // Skip disabled abbreviations
        if (!abbr.enabled) continue;

        const keywordLower = abbr.keyword.toLowerCase();

        // Exact match (highest priority)
        if (keywordLower === queryLower) {
          results.push({ plugin, abbreviation: abbr, matchType: 'exact' });
          continue;
        }

        // Prefix match (e.g., "hw" matches "helloworld")
        if (keywordLower.startsWith(queryLower)) {
          results.push({ plugin, abbreviation: abbr, matchType: 'prefix' });
          continue;
        }

        // Contains match (lowest priority)
        if (keywordLower.includes(queryLower)) {
          results.push({ plugin, abbreviation: abbr, matchType: 'contains' });
        }
      }
    }

    // Sort results by match type priority
    const matchTypePriority = { exact: 0, prefix: 1, contains: 2 };
    results.sort((a, b) => matchTypePriority[a.matchType] - matchTypePriority[b.matchType]);

    return results;
  }

  /**
   * Add or update an abbreviation for a plugin
   */
  async setAbbreviation(pluginId: string, abbreviation: PluginAbbreviation): Promise<void> {
    await this.loadConfig();

    if (!this.config[pluginId]) {
      this.config[pluginId] = [];
    }

    const existingIndex = this.config[pluginId].findIndex(a => a.keyword === abbreviation.keyword);

    if (existingIndex >= 0) {
      // Update existing abbreviation
      this.config[pluginId][existingIndex] = abbreviation;
    } else {
      // Add new abbreviation
      this.config[pluginId].push(abbreviation);
    }

    await this.saveConfig();
  }

  /**
   * Remove an abbreviation from a plugin
   */
  async removeAbbreviation(pluginId: string, keyword: string): Promise<void> {
    await this.loadConfig();

    if (!this.config[pluginId]) return;

    this.config[pluginId] = this.config[pluginId].filter(a => a.keyword !== keyword);

    await this.saveConfig();
  }

  /**
   * Save abbreviation configuration to backend
   */
  private async saveConfig(): Promise<void> {
    try {
      await invoke('save_plugin_abbreviations', { config: this.config });
    } catch (error) {
      console.error('[PluginAbbreviationService] Failed to save config:', error);
      throw new Error('Failed to save abbreviation configuration');
    }
  }

  /**
   * Clear all abbreviations for a plugin
   */
  async clearPluginAbbreviations(pluginId: string): Promise<void> {
    await this.loadConfig();

    delete this.config[pluginId];

    await this.saveConfig();
  }

  /**
   * Validate if a keyword is valid for use as an abbreviation
   */
  static isValidKeyword(keyword: string): { valid: boolean; error?: string } {
    if (!keyword || keyword.trim().length === 0) {
      return { valid: false, error: '关键词不能为空' };
    }

    const trimmed = keyword.trim();

    if (trimmed.length < 2) {
      return { valid: false, error: '关键词至少需要2个字符' };
    }

    if (trimmed.length > 20) {
      return { valid: false, error: '关键词不能超过20个字符' };
    }

    // Check for valid characters (alphanumeric, dash, underscore)
    if (!/^[a-zA-Z0-9\-_]+$/.test(trimmed)) {
      return { valid: false, error: '关键词只能包含字母、数字、连字符和下划线' };
    }

    // Check for reserved keywords
    const reservedKeywords = ['clip', 'calc', 'help', 'settings', 'plugin'];
    if (reservedKeywords.includes(trimmed.toLowerCase())) {
      return { valid: false, error: `'${trimmed}' 是保留关键词，请使用其他名称` };
    }

    return { valid: true };
  }

  /**
   * Generate suggested abbreviations for a plugin based on its name
   */
  static generateSuggestions(pluginName: string): string[] {
    const suggestions: string[] = [];
    const nameLower = pluginName.toLowerCase();

    // 1. First letters of each word (e.g., "Hello World" -> "hw")
    const words = nameLower.split(/\s+/);
    if (words.length > 1) {
      const initials = words.map(w => w[0]).join('');
      suggestions.push(initials);
    }

    // 2. First 2-3 letters
    if (nameLower.length >= 2) {
      suggestions.push(nameLower.substring(0, 2));
    }
    if (nameLower.length >= 3) {
      suggestions.push(nameLower.substring(0, 3));
    }

    // 3. First letter + last letter
    if (nameLower.length >= 2) {
      suggestions.push(nameLower[0] + nameLower[nameLower.length - 1]);
    }

    // 4. Remove vowels (e.g., "hello" -> "hll")
    const withoutVowels = nameLower.replace(/[aeiou]/g, '').substring(0, 4);
    if (withoutVowels.length >= 2) {
      suggestions.push(withoutVowels);
    }

    // Remove duplicates and limit to 5 suggestions
    return [...new Set(suggestions)].slice(0, 5);
  }
}

// Export both the class and the singleton instance
export { PluginAbbreviationService };
export const pluginAbbreviationService = new PluginAbbreviationService();
