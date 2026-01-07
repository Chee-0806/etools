/**
 * NPM-based Marketplace Service
 * Frontend service for npm-based plugin marketplace operations
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
 * NPM-based Marketplace Service
 * Handles plugin marketplace operations using npm registry
 */
export class MarketplaceService {
  /**
   * Get marketplace plugins with pagination and filters
   * Searches npm registry for @etools-plugin packages
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
   * Search marketplace plugins on npm
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
   * Install a plugin from npm
   * @param packageName - npm package name (e.g., "@etools-plugin/hello")
   */
  async installPlugin(
    packageName: string,
    onProgress?: (progress: InstallProgress) => void
  ): Promise<InstallResult> {
    try {
      // Report progress
      onProgress?.({
        installId: packageName,
        stage: 'downloading',
        progress: 30,
        message: `正在从 npm 下载 ${packageName}...`,
      });

      const result = await invoke<Plugin>('marketplace_install', {
        packageName,
      });

      onProgress?.({
        installId: packageName,
        stage: 'complete',
        progress: 100,
        message: '安装完成',
      });

      return {
        success: true,
        plugin: result,
      };
    } catch (error) {
      onProgress?.({
        installId: packageName,
        stage: 'error',
        progress: 0,
        message: '安装失败',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Uninstall a plugin using npm
   * @param packageName - npm package name to uninstall
   */
  async uninstallPlugin(packageName: string): Promise<{ success: boolean; error?: string }> {
    try {
      await invoke('marketplace_uninstall', {
        packageName,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to uninstall plugin:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update a plugin using npm
   * @param packageName - npm package name to update
   */
  async updatePlugin(packageName: string): Promise<UpdateResult> {
    try {
      const result = await invoke<Plugin>('marketplace_update', {
        packageName,
      });

      return {
        success: true,
        plugin: result,
      };
    } catch (error) {
      console.error('Failed to update plugin:', error);
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
   * Get plugin details from npm registry
   * @param packageName - npm package name
   */
  async getPluginDetails(packageName: string): Promise<MarketplacePlugin> {
    try {
      const result = await invoke<MarketplacePlugin>('marketplace_get_plugin', {
        packageName,
      });
      return result;
    } catch (error) {
      console.error('Failed to get plugin details:', error);
      throw new Error(
        `Failed to get plugin details: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get available categories
   */
  getCategories(): string[] {
    return ['all', 'productivity', 'developer', 'utilities', 'search', 'media', 'integration'];
  }

  /**
   * Get category display name
   */
  getCategoryDisplayName(category: string): string {
    const names: Record<string, string> = {
      all: '全部',
      productivity: '生产力',
      developer: '开发者工具',
      utilities: '实用工具',
      search: '搜索增强',
      media: '媒体处理',
      integration: '集成服务',
    };
    return names[category] || category;
  }

  /**
   * Format download count for display
   * Note: npm search API doesn't provide download counts
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
   * Note: npm search doesn't provide ratings, so we use the final score as a proxy
   */
  getRatingStars(rating: number): boolean[] {
    const stars: boolean[] = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= Math.round(rating));
    }
    return stars;
  }

  /**
   * Extract npm package name from plugin ID
   * Converts "hello-world" to "@etools-plugin/hello"
   */
  idToPackageName(id: string): string {
    return `@etools-plugin/${id}`;
  }

  /**
   * Extract plugin ID from npm package name
   * Converts "@etools-plugin/hello" to "hello"
   */
  packageNameToId(packageName: string): string {
    return packageName.replace('@etools-plugin/', '');
  }
}

// Export singleton instance
export const marketplaceService = new MarketplaceService();
