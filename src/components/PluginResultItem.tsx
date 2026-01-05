/**
 * Plugin Result Item Component
 * Displays plugin search results with icon and metadata
 */

import { memo } from 'react';
import type { SearchResult } from '@/types/search';
import './PluginResultItem.css';

interface PluginResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onSelect: () => void;
}

function PluginResultItem({ result, isSelected, onSelect }: PluginResultItemProps) {
  const pluginId = result.metadata?.pluginId as string | undefined;

  return (
    <div
      className={`plugin-result-item ${isSelected ? 'plugin-result-item--selected' : ''}`}
      onClick={onSelect}
      onMouseEnter={onSelect}
    >
      <div className="plugin-result-item__icon">
        {result.icon || '🔌'}
      </div>

      <div className="plugin-result-item__content">
        <div className="plugin-result-item__header">
          <span className="plugin-result-item__title">{result.title}</span>
          <span className="plugin-result-item__badge">插件</span>
        </div>

        {result.subtitle && (
          <div className="plugin-result-item__subtitle">
            {result.subtitle}
          </div>
        )}

        {pluginId && (
          <div className="plugin-result-item__meta">
            来自: {pluginId}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(PluginResultItem);
