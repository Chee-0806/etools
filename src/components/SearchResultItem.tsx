/**
 * SearchResultItem Component
 * Individual search result item with icon, title, and subtitle
 */

import { SearchResult } from '@/types/search';

interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

export function SearchResultItem({
  result,
  isSelected,
  onClick,
  onMouseEnter,
}: SearchResultItemProps) {
  return (
    <div
      className={`search-result-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      role="option"
      aria-selected={isSelected}
    >
      <div className="search-result-item__icon">
        {result.icon ? (
          <img src={result.icon} alt="" className="search-result-item__icon-img" />
        ) : (
          <div className="search-result-item__icon-placeholder">
            {getTypeIcon(result.type)}
          </div>
        )}
      </div>

      <div className="search-result-item__content">
        <div className="search-result-item__title">{result.title}</div>
        {result.subtitle && (
          <div className="search-result-item__subtitle">{result.subtitle}</div>
        )}
        {result.source && (
          <div className="search-result-item__source">{result.source}</div>
        )}
      </div>

      {result.score !== undefined && (
        <div className="search-result-item__score" aria-hidden="true">
          {getScoreDisplay(result.score)}
        </div>
      )}
    </div>
  );
}

/**
 * Get icon for search result type
 */
function getTypeIcon(type: SearchResult['type']): string {
  const icons: Record<SearchResult['type'], string> = {
    app: '📱',
    file: '📄',
    clipboard: '📋',
    bookmark: '⭐',
    history: '🕐',
    plugin: '🔌',
    action: '⚡',
    url: '🔗',
    color: '🎨',
  };
  return icons[type] || '•';
}

/**
 * Get score display as percentage
 */
function getScoreDisplay(score: number): string {
  const percentage = Math.round(score * 100);
  if (percentage >= 90) return '★★★★★';
  if (percentage >= 70) return '★★★★';
  if (percentage >= 50) return '★★★';
  if (percentage >= 30) return '★★';
  return '★';
}
