import type { Theme, ThemeId, ThemeColors, CustomThemeColors } from './types';
import { perfectedPresetThemes } from './perfectedThemes';

export const presetThemes: Theme[] = perfectedPresetThemes;

export function getThemeById(id: string): Theme | undefined {
  return presetThemes.find(t => t.id === id);
}

export function generateCustomTheme(colors: CustomThemeColors): Theme {
  return {
    id: 'custom' as ThemeId,
    name: 'Custom',
    icon: '🎨',
    isDark: colors.bgPrimary === '#0f172a', // heuristic
    colors: {
      bgPrimary: colors.bgPrimary,
      bgSecondary: colors.bgSecondary,
      textPrimary: colors.textPrimary,
      textSecondary: colors.textSecondary,
      accentPrimary: colors.accentPrimary,
      accentSecondary: colors.accentSecondary,
      // Fill defaults for missing
      bgTertiary: colors.bgSecondary || '#f1f5f9',
      bgGradient: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
      textMuted: '#94a3b8',
      borderPrimary: '#e2e8f0',
      borderSecondary: '#cbd5e1',
      borderAccent: colors.accentPrimary || '#3b82f6',
      accentGradient: `linear-gradient(135deg, ${colors.accentPrimary} 0%, ${colors.accentSecondary} 100%)`,
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      hoverBg: colors.bgSecondary || '#f8fafc',
      activeBg: '#e2e8f0',
      shadow: '0 10px 25px rgba(0,0,0,0.1)',
      glow: `0 0 20px ${(colors.accentPrimary || '#3b82f6').replace('#','') + '33'}`,
      inputBg: colors.bgPrimary,
      cardBg: colors.bgPrimary,
    } as ThemeColors,
  };
}

export function getSystemTheme(): ThemeId {
  if (typeof window === 'undefined') return 'system';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'day';
}

export const defaultCustomColors: CustomThemeColors = {
  bgPrimary: '#ffffff',
  bgSecondary: '#f8fafc',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  accentPrimary: '#3b82f6',
  accentSecondary: '#1e40af',
};

