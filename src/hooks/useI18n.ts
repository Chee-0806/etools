/**
 * useI18n Hook
 * Provides translation functionality for React components using i18next
 */

import { useTranslation } from 'react-i18next';

/**
 * Translation hook
 */
export const useI18n = () => {
  const { t, i18n } = useTranslation();

  /**
   * Get current language
   */
  const language = i18n.language;

  /**
   * Check if language is RTL
   */
  const isRTL = language === 'ar' || language === 'he';

  return {
    t,
    language,
    isRTL,
    changeLanguage: (lng: string) => i18n.changeLanguage(lng),
  };
};

export default useI18n;
