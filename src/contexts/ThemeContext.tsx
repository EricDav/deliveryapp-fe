import React, { createContext, useContext, ReactNode } from 'react';
import { ThemeConfig, defaultTheme } from '@/config/theme';

interface ThemeContextType {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, initialTheme = defaultTheme }: { children: ReactNode; initialTheme?: ThemeConfig }) {
  const [theme, setTheme] = React.useState<ThemeConfig>(initialTheme);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 