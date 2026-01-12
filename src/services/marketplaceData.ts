/**
 * Marketplace Data Service
 * 插件市场数据
 *
 * 说明：从 npm @etools-plugin 组织加载插件
 */

import type { MarketplacePlugin, PluginCategory } from '../types/plugin';
import { marketplaceService } from './pluginManager';

// ============================================================================
// 插件数据
// ============================================================================

const plugins: MarketplacePlugin[] = [
  {
    name: '@etools-plugin/devtools',
    pluginName: '开发者工具',
    description: 'JSON 格式化、Base64 编解码、URL 编码等开发工具',
    logo: 'https://raw.githubusercontent.com/etools-team/devtools-plugin/main/icon.png',
    author: 'ETools Team',
    homepage: 'https://github.com/etools-team/devtools-plugin',
    version: '1.0.0',
    downloads: 0,
    features: ['JSON 格式化', 'Base64 编解码', 'URL 编解码'],
    keywords: ['json', 'base64', 'url', 'developer', 'tools'],
    category: 'developer',
    tags: ['developer', 'tools'],
  },
];

// ============================================================================
// 导出的服务方法
// ============================================================================

/**
 * Marketplace Data Service
 */
export const marketplaceDataService = {
  /**
   * 获取所有分类的插件
   */
  async getAllCategories(): Promise<Record<PluginCategory, MarketplacePlugin[]>> {
    const categorized: Record<string, MarketplacePlugin[]> = {
      all: plugins,
      productivity: [],
      developer: [],
      utilities: [],
      entertainment: [],
    };

    // 按分类分组
    for (const plugin of plugins) {
      const category = plugin.category || 'utilities';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(plugin);
    }

    return categorized as Record<PluginCategory, MarketplacePlugin[]>;
  },

  /**
   * 获取指定分类的插件
   */
  async getCategoryPlugins(category: PluginCategory): Promise<MarketplacePlugin[]> {
    if (category === 'all') {
      return plugins;
    }
    return plugins.filter(p => p.category === category);
  },

  /**
   * 获取所有插件（扁平化）
   */
  async getAllPlugins(): Promise<MarketplacePlugin[]> {
    return plugins;
  },

  /**
   * 搜索插件
   */
  async searchPlugins(query: string): Promise<MarketplacePlugin[]> {
    const lowerQuery = query.toLowerCase();
    return plugins.filter(
      p =>
        p.pluginName.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.name.toLowerCase().includes(lowerQuery) ||
        p.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
    );
  },

  /**
   * 获取分类元数据（名称、图标等）
   */
  getCategoryInfo(category: PluginCategory): {
    categoryName: string;
    categoryIcon: string;
  } {
    const categoryMetadata: Record<
      PluginCategory,
      { categoryName: string; categoryIcon: string }
    > = {
      all: { categoryName: '全部插件', categoryIcon: '📦' },
      productivity: { categoryName: '生产力', categoryIcon: '⚡' },
      developer: { categoryName: '开发工具', categoryIcon: '👨‍💻' },
      utilities: { categoryName: '实用工具', categoryIcon: '🔧' },
      entertainment: { categoryName: '娱乐', categoryIcon: '🎮' },
    };

    return categoryMetadata[category] || { categoryName: category, categoryIcon: '📦' };
  },

  /**
   * 安装插件
   */
  async installPlugin(plugin: MarketplacePlugin): Promise<void> {
    // 使用 plugin.name (npm 包名) 作为 pluginId
    await marketplaceService.installPlugin(plugin.name);
  },

  /**
   * 检查插件是否已安装
   */
  async isInstalled(pluginName: string): Promise<boolean> {
    // 实际检查逻辑在 pluginManager.ts 中处理
    return false;
  },
};

/**
 * 默认导出
 */
export default marketplaceDataService;
