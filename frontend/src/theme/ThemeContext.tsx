import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { ThemeId, Theme, CustomThemeColors } from './types';
import { presetThemes, getThemeById, generateCustomTheme, getSystemTheme, defaultCustomColors } from './themes';

interface ThemeContextType {
  currentTheme: Theme;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  customColors: CustomThemeColors;
  setCustomColors: (colors: CustomThemeColors) => void;
  isCustomizing: boolean;
  setIsCustomizing: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'todo-app-theme';
const CUSTOM_COLORS_KEY = 'todo-app-custom-colors';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ['system', 'day', 'night', 'tiled', 'dark', 'arctic', 'sunset', 'ocean', 'custom'].includes(stored)) {
        return stored as ThemeId;
      }
    }
    return 'system';
  });

  const [customColors, setCustomColorsState] = useState<CustomThemeColors>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(CUSTOM_COLORS_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return defaultCustomColors;
        }
      }
    }
    return defaultCustomColors;
  });

  const [isCustomizing, setIsCustomizing] = useState(false);

  // Determine actual theme based on id
  const getCurrentTheme = useCallback((): Theme => {
    if (themeId === 'system') {
      const systemTheme = getSystemTheme();
      return getThemeById(systemTheme) || presetThemes[0];
    }
    
    if (themeId === 'custom') {
      return generateCustomTheme(customColors);
    }
    
    return getThemeById(themeId) || presetThemes[0];
  }, [themeId, customColors]);

  const currentTheme = getCurrentTheme();

  // Persist theme choice
  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  // Persist custom colors
  const setCustomColors = useCallback((colors: CustomThemeColors) => {
    setCustomColorsState(colors);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(colors));
    }
  }, []);

  // Apply CSS variables to root
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const colors = currentTheme.colors;
      
      // Apply all theme colors as CSS variables
      root.style.setProperty('--bg-primary', colors.bgPrimary);
      root.style.setProperty('--bg-secondary', colors.bgSecondary);
      root.style.setProperty('--bg-tertiary', colors.bgTertiary);
      root.style.setProperty('--bg-gradient', colors.bgGradient);
      
      root.style.setProperty('--text-primary', colors.textPrimary);
      root.style.setProperty('--text-secondary', colors.textSecondary);
      root.style.setProperty('--text-muted', colors.textMuted);
      
      root.style.setProperty('--border-primary', colors.borderPrimary);
      root.style.setProperty('--border-secondary', colors.borderSecondary);
      root.style.setProperty('--border-accent', colors.borderAccent);
      
      root.style.setProperty('--accent-primary', colors.accentPrimary);
      root.style.setProperty('--accent-secondary', colors.accentSecondary);
      root.style.setProperty('--accent-gradient', colors.accentGradient);
      
      root.style.setProperty('--success', colors.success);
      root.style.setProperty('--warning', colors.warning);
      root.style.setProperty('--error', colors.error);
      root.style.setProperty('--info', colors.info);
      
      root.style.setProperty('--hover-bg', colors.hoverBg);
      root.style.setProperty('--active-bg', colors.activeBg);
      
      root.style.setProperty('--shadow', colors.shadow);
      root.style.setProperty('--glow', colors.glow);
      root.style.setProperty('--input-bg', colors.inputBg);
      root.style.setProperty('--card-bg', colors.cardBg);
      
      // Set color-scheme for native elements
      root.style.colorScheme = currentTheme.isDark ? 'dark' : 'light';
    }
  }, [currentTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (themeId !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // Force re-render when system theme changes
      setThemeIdState(prev => {
        const newId = prev;
        return newId;
      });
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeId]);

  const value: ThemeContextType = {
    currentTheme,
    themeId,
    setThemeId,
    customColors,
    setCustomColors,
    isCustomizing,
    setIsCustomizing,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export all preset themes for use in UI
export { presetThemes };

