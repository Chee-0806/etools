/**
 * Color Result Item Component (T040, T041)
 * Displays color conversion results with swatch preview and copy buttons
 */

import type { SearchResult } from '../types/search';
import { invoke } from '@tauri-apps/api/core';
import './ColorResultItem.css';

interface ColorResultItemProps {
  result: SearchResult;
  onSelect: () => void;
}

export function ColorResultItem({ result, onSelect }: ColorResultItemProps) {
  if (!result.colorData) return null;

  const { hex, rgb, hsl } = result.colorData;

  const copyToClipboard = async (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await invoke('paste_clipboard_item', { id: 'clipboard-temp' });
      // Actually write the text to clipboard
      await navigator.clipboard.writeText(text);
      console.log(`Copied: ${text}`);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div
      className="search-result-item search-result-item--color"
      onClick={onSelect}
      role="option"
      aria-selected="false"
    >
      <div className="color-result-item__swatch" style={{ backgroundColor: hex }} aria-hidden="true" />
      <div className="color-result-item__content">
        <div className="color-result-item__formats">
          <div className="color-format">
            <span className="color-format__label">HEX</span>
            <span className="color-format__value">{hex}</span>
            <button
              className="color-format__copy"
              onClick={(e) => copyToClipboard(hex, e)}
              aria-label={`Copy ${hex}`}
              title="Copy to clipboard"
            >
              📋
            </button>
          </div>
          <div className="color-format">
            <span className="color-format__label">RGB</span>
            <span className="color-format__value">{rgb}</span>
            <button
              className="color-format__copy"
              onClick={(e) => copyToClipboard(rgb, e)}
              aria-label={`Copy ${rgb}`}
              title="Copy to clipboard"
            >
              📋
            </button>
          </div>
          <div className="color-format">
            <span className="color-format__label">HSL</span>
            <span className="color-format__value">{hsl}</span>
            <button
              className="color-format__copy"
              onClick={(e) => copyToClipboard(hsl, e)}
              aria-label={`Copy ${hsl}`}
              title="Copy to clipboard"
            >
              📋
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
