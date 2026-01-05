/**
 * Marketplace Service
 * Frontend service for plugin marketplace operations
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  MarketplacePlugin,
  MarketplacePluginPage,
  MarketplaceQueryOptions,
  MarketplaceSearchOptions,
  InstallProgress,
  InstallResult,
  UpdateResult,
  Plugin,
} from '../types/plugin';

/**
 * Marketplace Service
 * Handles plugin marketplace operations
 */
export class MarketplaceService {
  /**
   * Get marketplace plugins with pagination and filters
   */
  async getMarketplacePlugins(
    options: MarketplaceQueryOptions = {}
  ): Promise<MarketplacePluginPage> {
    try {
      const result = await invoke<MarketplacePluginPage>('marketplace_list', {
        category: options.category || 'all',
        page: options.page || 1,
        pageSize: options.pageSize || 20,
      });
      return result;
    } catch (error) {
      console.error('Failed to get marketplace plugins:', error);
      throw new Error(
        `Failed to get marketplace plugins: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Search marketplace plugins
   */
  async searchMarketplace(
    query: string,
    options: MarketplaceSearchOptions = {}
  ): Promise<MarketplacePluginPage> {
    try {
      const result = await invoke<MarketplacePluginPage>('marketplace_search', {
        query,
        category: options.category,
        page: options.page || 1,
        pageSize: options.pageSize || 20,
      });
      return result;
    } catch (error) {
      console.error('Failed to search marketplace:', error);
      throw new Error(
        `Failed to search marketplace: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Install a plugin from marketplace
   */
  async installPlugin(
    pluginId: string,
    onProgress?: (progress: InstallProgress) => void
  ): Promise<InstallResult> {
    try {
      const result = await invoke<Plugin>('marketplace_install', {
        pluginId,
      });

      return {
        success: true,
        plugin: result,
      };
    } catch (error) {
      console.error('Failed to install plugin:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check for plugin updates
   */
  async checkUpdates(): Promise<string[]> {
    try {
      const pluginIds = await invoke<string[]>('marketplace_check_updates');
      return pluginIds;
    } catch (error) {
      console.error('Failed to check updates:', error);
      throw new Error(
        `Failed to check updates: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get available categories
   */
  getCategories(): string[] {
    return ['productivity', 'developer', 'utilities', 'search', 'media', 'integration'];
  }

  /**
   * Get category display name
   */
  getCategoryDisplayName(category: string): string {
    const names: Record<string, string> = {
      productivity: '生产力',
      developer: '开发者工具',
      utilities: '实用工具',
      search: '搜索增强',
      media: '媒体处理',
      integration: '集成服务',
      all: '全部',
    };
    return names[category] || category;
  }

  /**
   * Format download count for display
   */
  formatDownloadCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }

  /**
   * Get rating stars array
   */
  getRatingStars(rating: number): boolean[] {
    const stars: boolean[] = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= Math.round(rating));
    }
    return stars;
  }
}

// Export singleton instance
export const marketplaceService = new MarketplaceService();
