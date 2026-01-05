/**
 * MarketplaceView Component
 * Browse and install plugins from marketplace
 */

import React, { useState, useEffect, useCallback } from 'react';
import { usePluginState, usePluginDispatch } from '../../services/pluginStateStore';
import { marketplaceService } from '../../services/marketplaceService';
import { pluginManagerService } from '../../services/pluginManager';
import type { MarketplacePlugin, MarketplaceQueryOptions, PluginCategory } from '../../types/plugin';
import './MarketplaceView.css';

/**
 * MarketplaceView - Plugin marketplace interface
 */
const MarketplaceView: React.FC = () => {
  const dispatch = usePluginDispatch();
  const state = usePluginState();

  // Local state
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [installingPluginId, setInstallingPluginId] = useState<string | null>(null);

  /**
   * Load marketplace plugins
   */
  const loadPlugins = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError(null);

    try {
      const options: MarketplaceQueryOptions = {
        category: (selectedCategory === 'all' ? undefined : selectedCategory as PluginCategory),
        page: pageNum,
        pageSize: 20,
      };

      const result = searchQuery
        ? await marketplaceService.searchMarketplace(searchQuery, options)
        : await marketplaceService.getMarketplacePlugins(options);

      if (pageNum === 1) {
        setPlugins(result.plugins);
      } else {
        setPlugins((prev) => [...prev, ...result.plugins]);
      }

      setHasMore(result.hasMore);
      setTotal(result.total);
      setPage(pageNum);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'error',
          title: '加载失败',
          message: `无法加载插件市场: ${errorMessage}`,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, dispatch]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadPlugins(1);
  }, [selectedCategory, searchQuery]);

  /**
   * Handle search
   */
  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  /**
   * Handle category change
   */
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  /**
   * Load more plugins
   */
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadPlugins(page + 1);
    }
  };

  /**
   * Install plugin
   */
  const handleInstallPlugin = async (plugin: MarketplacePlugin) => {
    setInstallingPluginId(plugin.id);

    try {
      const result = await marketplaceService.installPlugin(plugin.id);

      if (result.success && result.plugin) {
        dispatch({
          type: 'SHOW_NOTIFICATION',
          payload: {
            type: 'success',
            title: '安装成功',
            message: `${plugin.name} 已成功安装`,
          },
        });

        // Reload installed plugins
        const installedPlugins = await pluginManagerService.getInstalledPlugins();
        dispatch({
          type: 'LOAD_PLUGINS_SUCCESS',
          payload: installedPlugins,
        });

        // Update marketplace plugin installed status
        setPlugins((prev) =>
          prev.map((p) =>
            p.id === plugin.id
              ? { ...p, installed: true, installedVersion: plugin.version }
              : p
          )
        );
      } else {
        dispatch({
          type: 'SHOW_NOTIFICATION',
          payload: {
            type: 'error',
            title: '安装失败',
            message: result.error || '未知错误',
          },
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      dispatch({
        type: 'SHOW_NOTIFICATION',
        payload: {
          type: 'error',
          title: '安装失败',
          message: errorMessage,
        },
      });
    } finally {
      setInstallingPluginId(null);
    }
  };

  const categories = marketplaceService.getCategories();

  return (
    <div className="marketplace-view">
      {/* Search and Filter Bar */}
      <div className="marketplace-header">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="搜索插件..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
            aria-label="搜索插件"
          />
        </div>

        <div className="category-filters">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-filter ${
                selectedCategory === category ? 'active' : ''
              }`}
              onClick={() => handleCategoryChange(category)}
            >
              {marketplaceService.getCategoryDisplayName(category)}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      {!loading && plugins.length > 0 && (
        <div className="results-count">
          {searchQuery ? `搜索结果: ${total} 个` : `共 ${total} 个插件`}
        </div>
      )}

      {/* Loading State */}
      {loading && plugins.length === 0 && (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>正在加载插件...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-state">
          <p>加载失败: {error}</p>
          <button
            className="btn-secondary"
            onClick={() => loadPlugins(1)}
          >
            重试
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && plugins.length === 0 && (
        <div className="empty-state">
          <p>{searchQuery ? '未找到匹配的插件' : '暂无插件'}</p>
        </div>
      )}

      {/* Plugin Grid */}
      {plugins.length > 0 && (
        <div className="marketplace-plugins">
          {plugins.map((plugin) => (
            <MemoizedPluginCard
              key={plugin.id}
              plugin={plugin}
              installing={installingPluginId === plugin.id}
              onInstall={handleInstallPlugin}
            />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !loading && (
        <div className="load-more-container">
          <button
            className="btn-secondary"
            onClick={handleLoadMore}
          >
            加载更多
          </button>
        </div>
      )}

      {/* Loading More Indicator */}
      {loading && plugins.length > 0 && (
        <div className="loading-more">
          <div className="loading-spinner small" />
        </div>
      )}
    </div>
  );
};

/**
 * PluginCard Component
 */
interface PluginCardProps {
  plugin: MarketplacePlugin;
  installing: boolean;
  onInstall: (plugin: MarketplacePlugin) => void;
}

const PluginCard: React.FC<PluginCardProps> = ({ plugin, installing, onInstall }) => {
  const stars = marketplaceService.getRatingStars(plugin.rating);

  return (
    <div className={`plugin-card ${plugin.installed ? 'installed' : ''}`}>
      {/* Plugin Header */}
      <div className="plugin-header">
        <div className="plugin-icon">
          {plugin.icon ? (
            <img src={plugin.icon} alt={plugin.name} />
          ) : (
            <div className="plugin-icon-placeholder">
              {plugin.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="plugin-info">
          <h3 className="plugin-name">{plugin.name}</h3>
          <p className="plugin-author">by {plugin.author}</p>
        </div>
      </div>

      {/* Plugin Stats */}
      <div className="plugin-stats">
        <div className="plugin-rating">
          {stars.map((filled, i) => (
            <span
              key={i}
              className={`star ${filled ? 'filled' : 'empty'}`}
            >
              ★
            </span>
          ))}
          <span className="rating-count">({plugin.ratingCount})</span>
        </div>
        <div className="plugin-downloads">
          ↓ {marketplaceService.formatDownloadCount(plugin.downloadCount)}
        </div>
      </div>

      {/* Plugin Description */}
      <p className="plugin-description">{plugin.description}</p>

      {/* Plugin Tags */}
      {plugin.tags.length > 0 && (
        <div className="plugin-tags">
          {plugin.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Plugin Footer */}
      <div className="plugin-footer">
        <div className="plugin-version">v{plugin.version}</div>
        {plugin.installed ? (
          <div className="installed-badge">已安装</div>
        ) : (
          <button
            className="btn-primary install-btn"
            onClick={() => onInstall(plugin)}
            disabled={installing}
          >
            {installing ? '安装中...' : '安装'}
          </button>
        )}
        {plugin.homepage && (
          <a
            href={plugin.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-link"
            title="查看主页"
          >
            🔗
          </a>
        )}
      </div>
    </div>
  );
};

const MemoizedPluginCard = React.memo(PluginCard, (prevProps, nextProps) => {
  return (
    prevProps.plugin.id === nextProps.plugin.id &&
    prevProps.plugin.installed === nextProps.plugin.installed &&
    prevProps.installing === nextProps.installing
  );
});

export default MarketplaceView;
