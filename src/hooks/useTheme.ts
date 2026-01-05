/**
 * Theme Management Hook
 * Handles theme switching between system, light, and dark themes
 */

import { useState, useEffect } from 'react';

export type Theme = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'app-theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Load from localStorage with error handling
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'system' || stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch {
      // localStorage disabled or inaccessible, use default
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    return getSystemTheme();
  });

  // Update resolved theme when theme preference changes
  useEffect(() => {
    if (theme === 'system') {
      setResolvedTheme(getSystemTheme());
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('theme-light', 'theme-dark');

    // Add current theme class
    root.classList.add(`theme-${resolvedTheme}`);

    // Update data attribute for CSS selectors
    root.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    // Handle localStorage errors gracefully (e.g., when disabled)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Silently fail if localStorage is disabled
    }
  };

  return {
    theme,
    resolvedTheme,
    setTheme,
  };
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
