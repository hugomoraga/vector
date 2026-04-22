'use client';

import { createContext, useContext } from 'react';

interface ThemeContextType {
  theme: 'light';
  setTheme: (theme: 'light') => void;
  resolvedTheme: 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ theme: 'light', setTheme: () => {}, resolvedTheme: 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}