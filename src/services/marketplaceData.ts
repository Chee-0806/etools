/**
 * Marketplace Data Service
 * ✅ 空市场（暂无插件）
 *
 * 说明：npm 上还没有 @etools-plugin 组织的包
 * 插件市场暂时为空，等待真实插件发布
 */

import type { MarketplacePlugin, PluginCategory } from '../types/plugin';

// ============================================================================
// 导出的服务方法
// ============================================================================

/**
 * Marketplace Data Service
 * 空市场 - 返回空列表
 */
export const marketplaceDataService = {
  /**
   * 获取所有分类的插件
   */
  async getAllCategories(): Promise<Record<PluginCategory, MarketplacePlugin[]>> {
    // 返回空的分类列表
    return {
      all: [],
      productivity: [],
      developer: [],
      utilities: [],
      entertainment: [],
    };
  },

  /**
   * 获取指定分类的插件
   */
  async getCategoryPlugins(category: PluginCategory): Promise<MarketplacePlugin[]> {
    return [];
  },

  /**
   * 获取所有插件（扁平化）
   */
  async getAllPlugins(): Promise<MarketplacePlugin[]> {
    return [];
  },

  /**
   * 搜索插件
   */
  async searchPlugins(query: string): Promise<MarketplacePlugin[]> {
    return [];
  },

  /**
   * 获取分类元数据（名称、图标等）
   */
  getCategoryInfo(category: PluginCategory): {
    categoryName: string;
    categoryIcon: string;
  } {
    const categoryMetadata: Record<PluginCategory, { categoryName: string; categoryIcon: string }> = {
      all: { categoryName: '全部插件', categoryIcon: '📦' },
      productivity: { categoryName: '生产力', categoryIcon: '⚡' },
      developer: { categoryName: '开发工具', categoryIcon: '👨‍💻' },
      utilities: { categoryName: '实用工具', categoryIcon: '🔧' },
      entertainment: { categoryName: '娱乐', categoryIcon: '🎮' },
    };

    return categoryMetadata[category] || { categoryName: category, categoryIcon: '📦' };
  },

  /**
   * 安装插件（暂时不支持，因为没有可安装的插件）
   */
  async installPlugin(plugin: MarketplacePlugin): Promise<void> {
    throw new Error('插件市场暂时为空，无法安装插件');
  },

  /**
   * 检查插件是否已安装
   */
  async isInstalled(pluginName: string): Promise<boolean> {
    return false;
  },
};

/**
 * 默认导出
 */
export default marketplaceDataService;
