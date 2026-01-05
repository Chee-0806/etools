/**
 * Quick Action Result Component (T127-T130)
 * Displays results from quick actions (calculator, color conversion, web search)
 */

import { Kbd } from './ui/Kbd';
import './QuickActionResult.css';

export interface QuickActionResult {
  id: string;
  type: 'calculator' | 'color' | 'websearch';
  title: string;
  description?: string;
  result?: string;
  url?: string;
  icon?: string;
  action?: () => void | Promise<void>;
}

interface QuickActionResultProps {
  result: QuickActionResult;
  isActive?: boolean;
  onClick?: () => void;
}

export function QuickActionResult({ result, isActive = false, onClick }: QuickActionResultProps) {
  const getIcon = () => {
    if (result.icon) return result.icon;

    switch (result.type) {
      case 'calculator':
        return '🧮';
      case 'color':
        return '🎨';
      case 'websearch':
        return '🔍';
      default:
        return '⚡';
    }
  };

  const handleClick = () => {
    if (result.action) {
      result.action();
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`quick-action-result ${isActive ? 'active' : ''}`}
      onClick={handleClick}
    >
      <div className="quick-action-result__icon">{getIcon()}</div>

      <div className="quick-action-result__content">
        <div className="quick-action-result__title">{result.title}</div>
        {result.description && (
          <div className="quick-action-result__description">{result.description}</div>
        )}
      </div>

      {result.result && (
        <div className="quick-action-result__result">
          <Kbd>{result.result}</Kbd>
        </div>
      )}

      {result.url && (
        <div className="quick-action-result__url">
          <span className="quick-action-result__url-text">
            {result.url.length > 50 ? result.url.slice(0, 50) + '...' : result.url}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Calculator result display
 */
export function CalculatorResult({
  expression,
  value,
  isActive,
  onClick,
}: {
  expression: string;
  value: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <QuickActionResult
      result={{
        id: 'calc',
        type: 'calculator',
        title: `计算: ${expression}`,
        description: '按 Enter 复制结果',
        result: value,
      }}
      isActive={isActive}
      onClick={onClick}
    />
  );
}

/**
 * Color conversion result display
 */
export function ColorResult({
  color,
  conversions,
  isActive,
  onClick,
}: {
  color: string;
  conversions: { hex: string; rgb: string; hsl: string };
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className={`color-result ${isActive ? 'active' : ''}`} onClick={onClick}>
      <div className="color-result__preview">
        <div
          className="color-result__swatch"
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="color-result__values">
        <div className="color-result__value">
          <span className="color-result__label">HEX</span>
          <Kbd>{conversions.hex}</Kbd>
        </div>
        <div className="color-result__value">
          <span className="color-result__label">RGB</span>
          <Kbd>{conversions.rgb}</Kbd>
        </div>
        <div className="color-result__value">
          <span className="color-result__label">HSL</span>
          <Kbd>{conversions.hsl}</Kbd>
        </div>
      </div>
    </div>
  );
}

/**
 * Web search result display
 */
export function WebSearchResult({
  engine,
  query,
  url,
  isActive,
  onClick,
}: {
  engine: string;
  query: string;
  url: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <QuickActionResult
      result={{
        id: `search-${engine}`,
        type: 'websearch',
        title: `Search ${engine} for "${query}"`,
        description: '按 Enter 打开浏览器',
        url,
        action: onClick,
      }}
      isActive={isActive}
    />
  );
}
