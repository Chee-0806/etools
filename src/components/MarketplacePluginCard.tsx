/**
 * Marketplace Plugin Card Component (T172, T177)
 * Displays individual plugin information with install, update, and rating actions
 */

import { useState } from 'react';
import type { MarketplacePlugin } from './PluginMarketplace';
import './MarketplacePluginCard.css';

interface MarketplacePluginCardProps {
  plugin: MarketplacePlugin;
  onInstall: () => void;
  onUninstall: () => void;
  onUpdate: () => void;
  onRate: (rating: number) => void;
  installProgress?: number;
  updateAvailable?: boolean;
}

export const MarketplacePluginCard: React.FC<MarketplacePluginCardProps> = ({
  plugin,
  onInstall,
  onUninstall,
  onUpdate,
  onRate,
  installProgress = 0,
  updateAvailable = false,
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [showRating, setShowRating] = useState(false);

  const renderStars = (interactive: boolean = false) => {
    const stars = [1, 2, 3, 4, 5];
    const currentRating = interactive ? hoveredRating : (plugin.userRating || plugin.rating);

    return (
      <div
        className={`stars ${interactive ? 'interactive' : ''}`}
        onMouseLeave={() => interactive && setHoveredRating(0)}
      >
        {stars.map(star => (
          <span
            key={star}
            className={`star ${star <= Math.ceil(currentRating) ? 'filled' : ''}`}
            onClick={() => interactive && onRate(star)}
            onMouseEnter={() => interactive && setHoveredRating(star)}
          >
            ★
          </span>
        ))}
        {!interactive && (
          <span className="rating-value">{plugin.rating.toFixed(1)}</span>
        )}
      </div>
    );
  };

  return (
    <div className={`plugin-card ${plugin.installed ? 'installed' : ''}`}>
      <div className="plugin-icon">
        {plugin.icon ? (
          <img src={plugin.icon} alt={plugin.name} />
        ) : (
          <div className="icon-placeholder">
            {plugin.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="plugin-info">
        <div className="plugin-header">
          <h3 className="plugin-name">
            {plugin.name}
            {plugin.installed && (
              <span className="installed-badge">已安装</span>
            )}
          </h3>
          <span className="plugin-version">v{plugin.version}</span>
        </div>

        <p className="plugin-description">{plugin.description}</p>

        <div className="plugin-meta">
          <span className="plugin-author">by {plugin.author}</span>
          <span className="plugin-category">
            {getCategoryName(plugin.category)}
          </span>
          <span className="plugin-downloads">
            {plugin.downloadCount.toLocaleString()} 次下载
          </span>
        </div>

        <div className="plugin-rating">
          {renderStars(false)}
          {plugin.userRating && (
            <span className="user-rating">你的评分: {plugin.userRating}★</span>
          )}
        </div>

        {/* Rating UI (T177) */}
        {showRating && (
          <div className="rating-prompt">
            <span>评分:</span>
            {renderStars(true)}
            <button
              className="cancel-rating"
              onClick={() => setShowRating(false)}
            >
              取消
            </button>
          </div>
        )}
      </div>

      <div className="plugin-actions">
        {installProgress > 0 && installProgress < 100 ? (
          <div className="install-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${installProgress}%` }} />
            </div>
            <span className="progress-text">{installProgress}%</span>
          </div>
        ) : plugin.installed ? (
          updateAvailable ? (
            <>
              <button className="update-button" onClick={onUpdate}>
                更新
              </button>
              <button className="uninstall-button" onClick={onUninstall}>
                卸载
              </button>
            </>
          ) : (
            <>
              <button className="rate-button" onClick={() => setShowRating(!showRating)}>
                {plugin.userRating ? '修改评分' : '评分'}
              </button>
              <button className="uninstall-button" onClick={onUninstall}>
                卸载
              </button>
            </>
          )
        ) : (
          <button className="install-button" onClick={onInstall}>
            安装
          </button>
        )}
      </div>
    </div>
  );
};

function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    productivity: '生产力',
    developer: '开发工具',
    utilities: '实用工具',
    search: '搜索增强',
    media: '媒体处理',
  };
  return names[category] || category;
}
