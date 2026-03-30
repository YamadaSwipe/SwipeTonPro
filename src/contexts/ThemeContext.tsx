'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
    input: string;
    ring: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const lightColors = {
  primary: 'hsl(25, 95%, 53%)',
  secondary: 'hsl(220, 14%, 96%)',
  accent: 'hsl(25, 95%, 53%)',
  background: 'hsl(0, 0%, 100%)',
  foreground: 'hsl(222.2, 84%, 4.9%)',
  muted: 'hsl(210, 40%, 98%)',
  border: 'hsl(214.3, 31.8%, 91.4%)',
  input: 'hsl(214.3, 31.8%, 91.4%)',
  ring: 'hsl(25, 95%, 53%)',
  success: 'hsl(142, 76%, 36%)',
  warning: 'hsl(38, 92%, 50%)',
  error: 'hsl(0, 84%, 60%)',
  info: 'hsl(207, 90%, 54%)'
};

const darkColors = {
  primary: 'hsl(25, 95%, 60%)',
  secondary: 'hsl(217.2, 32.6%, 17.5%)',
  accent: 'hsl(25, 95%, 60%)',
  background: 'hsl(222.2, 84%, 4.9%)',
  foreground: 'hsl(210, 40%, 98%)',
  muted: 'hsl(217.2, 32.6%, 17.5%)',
  border: 'hsl(217.2, 32.6%, 17.5%)',
  input: 'hsl(217.2, 32.6%, 17.5%)',
  ring: 'hsl(25, 95%, 60%)',
  success: 'hsl(142, 76%, 46%)',
  warning: 'hsl(38, 92%, 60%)',
  error: 'hsl(0, 84%, 70%)',
  info: 'hsl(207, 90%, 64%)'
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Apply theme to DOM
    const applyTheme = (theme: 'light' | 'dark') => {
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      setResolvedTheme(theme);
      
      // Update CSS variables
      const colors = theme === 'dark' ? darkColors : lightColors;
      Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value);
      });
    };

    // Determine initial theme
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      applyTheme(systemTheme);
    } else {
      applyTheme(theme);
    }

    // Listen for system theme changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyTheme(mediaQuery.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const colors = resolvedTheme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, colors }}>
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

// Custom hook for theme-aware styling
export function useThemeAwareStyles() {
  const { resolvedTheme, colors } = useTheme();
  
  return {
    theme: resolvedTheme,
    colors,
    getGradient: (type: 'primary' | 'secondary' | 'accent') => {
      switch (type) {
        case 'primary':
          return resolvedTheme === 'dark' 
            ? 'linear-gradient(135deg, hsl(25, 95%, 60%), hsl(25, 95%, 45%))'
            : 'linear-gradient(135deg, hsl(25, 95%, 53%), hsl(25, 95%, 43%))';
        case 'secondary':
          return resolvedTheme === 'dark'
            ? 'linear-gradient(135deg, hsl(217.2, 32.6%, 25.5%), hsl(217.2, 32.6%, 17.5%))'
            : 'linear-gradient(135deg, hsl(220, 14%, 96%), hsl(220, 14%, 91%))';
        case 'accent':
          return resolvedTheme === 'dark'
            ? 'linear-gradient(135deg, hsl(25, 95%, 60%), hsl(25, 95%, 50%))'
            : 'linear-gradient(135deg, hsl(25, 95%, 53%), hsl(25, 95%, 43%))';
        default:
          return colors.primary;
      }
    },
    getShadow: (size: 'sm' | 'md' | 'lg' | 'xl') => {
      const opacity = resolvedTheme === 'dark' ? 0.3 : 0.1;
      switch (size) {
        case 'sm':
          return `0 1px 2px 0 rgba(0, 0, 0, ${opacity})`;
        case 'md':
          return `0 4px 6px -1px rgba(0, 0, 0, ${opacity}), 0 2px 4px -1px rgba(0, 0, 0, ${opacity})`;
        case 'lg':
          return `0 10px 15px -3px rgba(0, 0, 0, ${opacity}), 0 4px 6px -2px rgba(0, 0, 0, ${opacity})`;
        case 'xl':
          return `0 20px 25px -5px rgba(0, 0, 0, ${opacity}), 0 10px 10px -5px rgba(0, 0, 0, ${opacity})`;
        default:
          return '';
      }
    }
  };
}

// Theme toggle component
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg border hover:bg-muted transition-colors"
      title={`Theme actuel: ${theme === 'system' ? `Système (${resolvedTheme})` : theme}`}
    >
      {resolvedTheme === 'dark' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )}
    </button>
  );
}
