/**
 * LanguageSelector Component
 * Allows users to switch between supported languages
 */

import React, { useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n';
import './LanguageSelector.css';

export const LanguageSelector: React.FC = () => {
  const { language, changeLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (newLanguage: SupportedLanguage) => {
    changeLanguage(newLanguage);
    setIsOpen(false);
  };

  return (
    <div className="language-selector">
      <button
        className="language-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change language"
        title="Change language"
      >
        🌐 {SUPPORTED_LANGUAGES[language as SupportedLanguage]}
      </button>

      {isOpen && (
        <div className="language-dropdown">
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
            <button
              key={code}
              className={`language-option ${language === code ? 'active' : ''}`}
              onClick={() => handleLanguageChange(code as SupportedLanguage)}
            >
              {name}
              {language === code && ' ✓'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
