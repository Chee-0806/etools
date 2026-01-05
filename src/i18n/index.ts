/**
 * Internationalization (i18n) Configuration
 * Provides translation support for the Kaka application using i18next
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  'zh-CN': '简体中文',
  'en-US': 'English',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Default language
export const DEFAULT_LANGUAGE: SupportedLanguage = 'zh-CN';

// Get language from localStorage or use default
export const getStoredLanguage = (): SupportedLanguage => {
  try {
    const stored = localStorage.getItem('kaka-language') as SupportedLanguage;
    if (stored && SUPPORTED_LANGUAGES[stored]) {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to get stored language:', error);
  }
  return DEFAULT_LANGUAGE;
};

// Store language preference
export const storeLanguage = (language: SupportedLanguage) => {
  try {
    localStorage.setItem('kaka-language', language);
  } catch (error) {
    console.warn('Failed to store language:', error);
  }
};

// Get browser language
export const getBrowserLanguage = (): SupportedLanguage => {
  const browserLang = navigator.language;

  // Check for Chinese variants
  if (browserLang.startsWith('zh')) {
    return 'zh-CN';
  }

  // Default to English for other languages
  return 'en-US';
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      'en-US': { translation: enUS },
    },
    lng: getStoredLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
