/**
 * Plugin Marketplace Component (T171, T174, T176)
 * Displays available plugins from marketplace with install, update, and rating functionality
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { PluginManifest } from '../types/plugin';
import { pluginManagerService } from '../services/pluginManager';
import { MarketplacePluginCard } from './MarketplacePluginCard';
import { PluginInstaller } from './PluginInstaller';
import './PluginMarketplace.css';

export interface MarketplacePlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: string;
  icon?: string;
  downloadCount: number;
  rating: number;
  userRating?: number;
  installed: boolean;
  installedVersion?: string;
  updateAvailable?: boolean;
  manifest: PluginManifest;
}

interface PluginMarketplaceProps {
  onClose?: () => void;
}

export const PluginMarketplace: React.FC<PluginMarketplaceProps> = ({ onClose }) => {
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([]);
  const [filteredPlugins, setFilteredPlugins] = useState<MarketplacePlugin[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<MarketplacePlugin | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [installProgress, setInstallProgress] = useState<Record<string, number>>({});
  const [updatesAvailable, setUpdatesAvailable] = useState<Set<string>>(new Set());

  const categories = [
    { id: 'all', name: '全部' },
    { id: 'productivity', name: '生产力' },
    { id: 'developer', name: '开发工具' },
    { id: 'utilities', name: '实用工具' },
    { id: 'search', name: '搜索增强' },
    { id: 'media', name: '媒体处理' },
  ];

  useEffect(() => {
    loadMarketplacePlugins();
    checkForUpdates();
  }, []);

  useEffect(() => {
    filterPlugins();
  }, [plugins, searchQuery, selectedCategory]);

  const loadMarketplacePlugins = async () => {
    try {
      setLoading(true);
      // 使用后端命令获取插件市场列表，遵循架构原则
      const result = await invoke('marketplace_list', {
        category: null,
        page: 1,
        pageSize: 50
      });
      const data: MarketplacePlugin[] = result.plugins || [];

      // Check which plugins are installed
      const installedPlugins = await pluginManagerService.getInstalledPlugins();

      const pluginsWithStatus = data.map(plugin => ({
        ...plugin,
        installed: installedPlugins.some(p => p.manifest.id === plugin.id),
      }));

      setPlugins(pluginsWithStatus);
    } catch (error) {
      console.error('Failed to load marketplace plugins:', error);
      // For demo, show sample plugins
      setPlugins(getSamplePlugins());
    } finally {
      setLoading(false);
    }
  };

  const checkForUpdates = async () => {
    try {
      const updates = await invoke<string[]>('check_plugin_updates');
      setUpdatesAvailable(new Set(updates));
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  };

  const filterPlugins = () => {
    let filtered = [...plugins];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.author.toLowerCase().includes(query)
      );
    }

    // Sort: installed first, then by rating
    filtered.sort((a, b) => {
      if (a.installed !== b.installed) {
        return a.installed ? -1 : 1;
      }
      return b.rating - a.rating;
    });

    setFilteredPlugins(filtered);
  };

  const handleInstall = async (plugin: MarketplacePlugin) => {
    setSelectedPlugin(plugin);
    setInstallProgress({ ...installProgress, [plugin.id]: 0 });

    try {
      await invoke('install_plugin', {
        pluginId: plugin.id,
        manifest: plugin.manifest,
      });

      // Simulate progress for demo
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setInstallProgress(prev => ({ ...prev, [plugin.id]: progress }));

        if (progress >= 100) {
          clearInterval(interval);
          // Update plugin status
          setPlugins(prev => prev.map(p =>
            p.id === plugin.id ? { ...p, installed: true } : p
          ));
          setSelectedPlugin(null);
        }
      }, 200);
    } catch (error) {
      console.error('Installation failed:', error);
      setSelectedPlugin(null);
    }
  };

  const handleUninstall = async (pluginId: string) => {
    try {
      await invoke('uninstall_plugin', { pluginId });
      setPlugins(prev => prev.map(p =>
        p.id === pluginId ? { ...p, installed: false, installedVersion: undefined } : p
      ));
    } catch (error) {
      console.error('Uninstall failed:', error);
    }
  };

  const handleUpdate = async (plugin: MarketplacePlugin) => {
    setSelectedPlugin(plugin);
    setInstallProgress({ ...installProgress, [plugin.id]: 0 });

    try {
      // Update is essentially re-installing the plugin
      await invoke('install_plugin', { pluginId: plugin.id });

      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setInstallProgress(prev => ({ ...prev, [plugin.id]: progress }));

        if (progress >= 100) {
          clearInterval(interval);
          setPlugins(prev => prev.map(p =>
            p.id === plugin.id ? { ...p, updateAvailable: false } : p
          ));
          setUpdatesAvailable(prev => {
            const next = new Set(prev);
            next.delete(plugin.id);
            return next;
          });
          setSelectedPlugin(null);
        }
      }, 200);
    } catch (error) {
      console.error('Update failed:', error);
      setSelectedPlugin(null);
    }
  };

  const handleRate = async (pluginId: string, rating: number) => {
    try {
      await invoke('rate_plugin', { pluginId, rating });
      setPlugins(prev => prev.map(p =>
        p.id === pluginId ? { ...p, userRating: rating } : p
      ));
    } catch (error) {
      console.error('Rating failed:', error);
    }
  };

  return (
    <div className="plugin-marketplace">
      <div className="marketplace-header">
        <h2>插件市场</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      {/* Update notification (T176) */}
      {updatesAvailable.size > 0 && (
        <div className="update-notification">
          <span>有 {updatesAvailable.size} 个插件可用更新</span>
          <button
            className="update-all-button"
            onClick={() => {
              plugins.filter(p => updatesAvailable.has(p.id)).forEach(p => handleUpdate(p));
            }}
          >
            全部更新
          </button>
        </div>
      )}

      {/* Search and filter */}
      <div className="marketplace-controls">
        <input
          type="text"
          placeholder="搜索插件..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />

        <div className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Plugin list (T174) */}
      <div className="plugin-list">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : filteredPlugins.length === 0 ? (
          <div className="empty-state">没有找到匹配的插件</div>
        ) : (
          filteredPlugins.map(plugin => (
            <MarketplacePluginCard
              key={plugin.id}
              plugin={plugin}
              onInstall={() => handleInstall(plugin)}
              onUninstall={() => handleUninstall(plugin.id)}
              onUpdate={() => handleUpdate(plugin)}
              onRate={(rating) => handleRate(plugin.id, rating)}
              installProgress={installProgress[plugin.id]}
              updateAvailable={updatesAvailable.has(plugin.id)}
            />
          ))
        )}
      </div>

      {/* Plugin installer modal */}
      {selectedPlugin && (
        <PluginInstaller
          plugin={selectedPlugin}
          progress={installProgress[selectedPlugin.id] || 0}
          onClose={() => setSelectedPlugin(null)}
        />
      )}
    </div>
  );
};

// Sample plugins for demo
function getSamplePlugins(): MarketplacePlugin[] {
  return [
    {
      id: 'qrcode-generator',
      name: 'QR 码生成器',
      description: '快速生成二维码，支持文本、URL等多种内容',
      version: '1.0.0',
      author: 'Kaka Team',
      category: 'utilities',
      downloadCount: 12345,
      rating: 4.8,
      installed: true,
      installedVersion: '1.0.0',
      manifest: {
        id: 'qrcode-generator',
        name: 'QR 码生成器',
        version: '1.0.0',
        description: '快速生成二维码，支持文本、URL等多种内容',
        author: 'Kaka Team',
        triggers: ['qr:', 'qrcode:'],
        permissions: [],
      },
    },
    {
      id: 'color-converter',
      name: '颜色转换器',
      description: '支持 HEX、RGB、HSL 等多种颜色格式转换',
      version: '1.2.0',
      author: 'Kaka Team',
      category: 'developer',
      downloadCount: 8765,
      rating: 4.6,
      installed: false,
      manifest: {
        id: 'color-converter',
        name: '颜色转换器',
        version: '1.2.0',
        description: '支持 HEX、RGB、HSL 等多种颜色格式转换',
        author: 'Kaka Team',
        triggers: ['#', 'rgb:', 'hsl:'],
        permissions: [],
      },
    },
    {
      id: 'weather-search',
      name: '天气查询',
      description: '快速查询世界各地天气情况',
      version: '2.0.0',
      author: 'Third Party',
      category: 'search',
      downloadCount: 5432,
      rating: 4.5,
      installed: false,
      manifest: {
        id: 'weather-search',
        name: '天气查询',
        version: '2.0.0',
        description: '快速查询世界各地天气情况',
        author: 'Third Party',
        triggers: ['weather:', 'w:'],
        permissions: ['network'],
      },
    },
  ];
}
