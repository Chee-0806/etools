/**
 * Theme Selector Component
 * Allows users to choose between light, dark, and system themes
 */

import { useState } from 'react';
import './ThemeSelector.css';

export type Theme = 'system' | 'light' | 'dark';

interface ThemeSelectorProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'system', label: '跟随系统', icon: '💻' },
    { value: 'light', label: '浅色', icon: '☀️' },
    { value: 'dark', label: '深色', icon: '🌙' },
  ];

  const currentThemeInfo = themes.find(t => t.value === currentTheme) || themes[0];

  return (
    <div className="theme-selector">
      <button
        className="theme-selector__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="选择主题"
        aria-expanded={isOpen}
      >
        <span className="theme-selector__icon">{currentThemeInfo.icon}</span>
        <span className="theme-selector__label">{currentThemeInfo.label}</span>
        <svg
          className={`theme-selector__arrow ${isOpen ? 'open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M3 5L6 8L9 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="theme-selector__dropdown">
          {themes.map(theme => (
            <button
              key={theme.value}
              className={`theme-option ${theme.value === currentTheme ? 'active' : ''}`}
              onClick={() => {
                onThemeChange(theme.value);
                setIsOpen(false);
              }}
            >
              <span className="theme-option__icon">{theme.icon}</span>
              <span className="theme-option__label">{theme.label}</span>
              {theme.value === currentTheme && (
                <span className="theme-option__check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
