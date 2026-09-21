'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState('ar'); // ar | fr

  useEffect(() => {
    try {
      const d = localStorage.getItem('coop_dark') === '1';
      const l = localStorage.getItem('coop_lang') || 'ar';
      setDark(d);
      setLang(l);
      document.documentElement.classList.toggle('dark', d);
      document.documentElement.lang = l === 'fr' ? 'fr' : 'ar';
      document.documentElement.dir = l === 'fr' ? 'ltr' : 'rtl';
    } catch {}
  }, []);

  const toggleDark = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('coop_dark', next ? '1' : '0');
      } catch {}
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === 'ar' ? 'fr' : 'ar';
      try {
        localStorage.setItem('coop_lang', next);
      } catch {}
      document.documentElement.lang = next === 'fr' ? 'fr' : 'ar';
      document.documentElement.dir = next === 'fr' ? 'ltr' : 'rtl';
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ dark, toggleDark, lang, toggleLang, setLang }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
