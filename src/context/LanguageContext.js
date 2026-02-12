'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import it from '../lib/i18n/it.json';
import en from '../lib/i18n/en.json';
import fr from '../lib/i18n/fr.json';
import de from '../lib/i18n/de.json';

const translations = { it, en, fr, de };
const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState('it');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale');
    if (savedLocale && translations[savedLocale]) {
      setLocale(savedLocale);
      document.documentElement.lang = savedLocale;
    }
    setIsLoaded(true);
  }, []);

  const changeLanguage = useCallback((newLocale) => {
    if (translations[newLocale]) {
      setLocale(newLocale);
      localStorage.setItem('locale', newLocale);
      document.documentElement.lang = newLocale;
    }
  }, []);

  const t = useCallback((path) => {
    const keys = path.split('.');
    let value = translations[locale];
    for (const key of keys) {
      if (value && value[key]) {
        value = value[key];
      } else {
        return path;
      }
    }
    return value;
  }, [locale]);

  const contextValue = useMemo(() => ({
    locale,
    t,
    changeLanguage,
    isLoaded
  }), [locale, t, changeLanguage, isLoaded]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
