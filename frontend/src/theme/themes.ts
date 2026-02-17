import type { Theme, CustomThemeColors } from './types';
import { defaultCustomColors } from './types';

// Preset Theme Configurations - Inspired by Telegram's wide variety
export const presetThemes: Theme[] = [
  {
    id: 'day',
    name: 'Day',
    icon: '☀️',
    isDark: false,
    colors: {
      bgPrimary: '#ffffff',
      bgSecondary: '#f9fafb',
      bgTertiary: '#f3f4f6',
      bgGradient: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
      textPrimary: '#1f2937',
      textSecondary: '#6b7280',
      textMuted: '#9ca3af',
      borderPrimary: '#e5e7eb',
      borderSecondary: '#f3f4f6',
      borderAccent: '#d1d5db',
      accentPrimary: '#4f46e5',
      accentSecondary: '#6366f1',
      accentGradient: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444',
      info: '#3b82f6',
      hoverBg: '#f3f4f6',
      activeBg: '#e5e7eb',
      shadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      glow: 'rgba(79, 70, 229, 0.2)',
      inputBg: '#ffffff',
      cardBg: '#f9fafb',
    },
  },
  {
    id: 'night',
    name: 'Night',
    icon: '🌙',
    isDark: true,
    colors: {
      bgPrimary: '#1f2937',
      bgSecondary: '#111827',
      bgTertiary: '#0f172a',
      bgGradient: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      textPrimary: '#f9fafb',
      textSecondary: '#d1d5db',
      textMuted: '#9ca3af',
      borderPrimary: '#374151',
      borderSecondary: '#1f2937',
      borderAccent: '#4b5563',
      accentPrimary: '#818cf8',
      accentSecondary: '#a5b4fc',
      accentGradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa',
      hoverBg: '#374151',
      activeBg: '#4b5563',
      shadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      glow: 'rgba(129, 140, 248, 0.3)',
      inputBg: '#1f2937',
      cardBg: '#374151',
    },
  },
  {
    id: 'tiled',
    name: 'Tiled',
    icon: '🏠',
    isDark: false,
    colors: {
      bgPrimary: '#fafbfc',
      bgSecondary: '#f3f4f6',
      bgTertiary: '#e5e7eb',
      bgGradient: 'linear-gradient(135deg, #fafbfc 0%, #f0f1f3 100%)',
      textPrimary: '#1a1a2e',
      textSecondary: '#4a4a68',
      textMuted: '#8b8b9e',
      borderPrimary: '#e0e0e5',
      borderSecondary: '#f0f0f5',
      borderAccent: '#c8c8d0',
      accentPrimary: '#6c5ce7',
      accentSecondary: '#a29bfe',
      accentGradient: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
      success: '#00b894',
      warning: '#fdcb6e',
      error: '#e17055',
      info: '#74b9ff',
      hoverBg: '#f0f0f5',
      activeBg: '#e5e5ea',
      shadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
      glow: 'rgba(108, 92, 231, 0.15)',
      inputBg: '#ffffff',
      cardBg: '#fafbfc',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    icon: '⚫',
    isDark: true,
    colors: {
      bgPrimary: '#000000',
      bgSecondary: '#0a0a0a',
      bgTertiary: '#141414',
      bgGradient: 'linear-gradient(135deg, #0a0a0a 0%, #000000 100%)',
      textPrimary: '#ffffff',
      textSecondary: '#a0a0a0',
      textMuted: '#606060',
      borderPrimary: '#1a1a1a',
      borderSecondary: '#0d0d0d',
      borderAccent: '#2a2a2a',
      accentPrimary: '#bb86fc',
      accentSecondary: '#9d4edd',
      accentGradient: 'linear-gradient(135deg, #bb86fc 0%, #9d4edd 100%)',
      success: '#03dac6',
      warning: '#cf6679',
      error: '#cf6679',
      info: '#64b5f6',
      hoverBg: '#121212',
      activeBg: '#1e1e1e',
      shadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      glow: 'rgba(187, 134, 252, 0.25)',
      inputBg: '#0a0a0a',
      cardBg: '#0d0d0d',
    },
  },
  {
    id: 'arctic',
    name: 'Arctic',
    icon: '🧊',
    isDark: false,
    colors: {
      bgPrimary: '#f8fcff',
      bgSecondary: '#e8f4fc',
      bgTertiary: '#d4ebf7',
      bgGradient: 'linear-gradient(135deg, #f8fcff 0%, #e8f4fc 100%)',
      textPrimary: '#0c1929',
      textSecondary: '#3d5a73',
      textMuted: '#7a9bb8',
      borderPrimary: '#cce5f0',
      borderSecondary: '#e0eff9',
      borderAccent: '#a3d0e8',
      accentPrimary: '#0ea5e9',
      accentSecondary: '#38bdf8',
      accentGradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',
      hoverBg: '#e8f4fc',
      activeBg: '#d4ebf7',
      shadow: '0 4px 20px rgba(14, 165, 233, 0.1)',
      glow: 'rgba(14, 165, 233, 0.15)',
      inputBg: '#ffffff',
      cardBg: '#f8fcff',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    icon: '🌅',
    isDark: false,
    colors: {
      bgPrimary: '#fff5f0',
      bgSecondary: '#ffe8dc',
      bgTertiary: '#ffd9c4',
      bgGradient: 'linear-gradient(135deg, #fff5f0 0%, #ffe8dc 100%)',
      textPrimary: '#2d1810',
      textSecondary: '#6b4a3a',
      textMuted: '#a88070',
      borderPrimary: '#f0d8c8',
      borderSecondary: '#faefe6',
      borderAccent: '#e8c4ac',
      accentPrimary: '#f97316',
      accentSecondary: '#fb923c',
      accentGradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
      success: '#84cc16',
      warning: '#f59e0b',
      error: '#dc2626',
      info: '#f472b6',
      hoverBg: '#faefe6',
      activeBg: '#f5e0d0',
      shadow: '0 4px 20px rgba(249, 115, 22, 0.1)',
      glow: 'rgba(249, 115, 22, 0.15)',
      inputBg: '#ffffff',
      cardBg: '#fff5f0',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    icon: '🌊',
    isDark: false,
    colors: {
      bgPrimary: '#f0f9ff',
      bgSecondary: '#e0f2fe',
      bgTertiary: '#bae6fd',
      bgGradient: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      textPrimary: '#0c4a6e',
      textSecondary: '#0369a1',
      textMuted: '#7dd3fc',
      borderPrimary: '#ccefff',
      borderSecondary: '#e0f2fe',
      borderAccent: '#7dd3fc',
      accentPrimary: '#0284c7',
      accentSecondary: '#0ea5e9',
      accentGradient: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
      success: '#14b8a6',
      warning: '#f59e0b',
      error: '#f43f5e',
      info: '#6366f1',
      hoverBg: '#e0f2fe',
      activeBg: '#bae6fd',
      shadow: '0 4px 20px rgba(2, 132, 199, 0.1)',
      glow: 'rgba(2, 132, 199, 0.15)',
      inputBg: '#ffffff',
      cardBg: '#f0f9ff',
    },
  },
];

// Get theme by ID
export const getThemeById = (id: string): Theme | undefined => {
  return presetThemes.find(theme => theme.id === id);
};

// Generate custom theme from user colors
export const generateCustomTheme = (colors: CustomThemeColors): Theme => {
  const isDark = isColorDark(colors.bgPrimary);
  
  return {
    id: 'custom',
    name: 'Custom',
    icon: '🎨',
    isDark,
    colors: {
      bgPrimary: colors.bgPrimary,
      bgSecondary: adjustColorBrightness(colors.bgPrimary, isDark ? 10 : -5),
      bgTertiary: adjustColorBrightness(colors.bgPrimary, isDark ? 20 : -10),
      bgGradient: `linear-gradient(135deg, ${colors.bgPrimary} 0%, ${adjustColorBrightness(colors.bgPrimary, isDark ? 10 : -5)} 100%)`,
      textPrimary: colors.textPrimary,
      textSecondary: colors.textSecondary,
      textMuted: adjustColorBrightness(colors.textSecondary, 30),
      borderPrimary: adjustColorBrightness(colors.bgPrimary, isDark ? 15 : -15),
      borderSecondary: adjustColorBrightness(colors.bgPrimary, isDark ? 8 : -8),
      borderAccent: adjustColorBrightness(colors.bgPrimary, isDark ? 25 : -25),
      accentPrimary: colors.accentPrimary,
      accentSecondary: colors.accentSecondary,
      accentGradient: `linear-gradient(135deg, ${colors.accentPrimary} 0%, ${colors.accentSecondary} 100%)`,
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444',
      info: '#3b82f6',
      hoverBg: adjustColorBrightness(colors.bgPrimary, isDark ? 8 : -5),
      activeBg: adjustColorBrightness(colors.bgPrimary, isDark ? 15 : -10),
      shadow: `0 4px 20px ${isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)'}`,
      glow: `${colors.accentPrimary}20`,
      inputBg: colors.bgPrimary,
      cardBg: adjustColorBrightness(colors.bgPrimary, isDark ? 5 : -3),
    },
  };
};

// Helper: Check if a color is dark
const isColorDark = (hexColor: string): boolean => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};

// Helper: Adjust color brightness
const adjustColorBrightness = (hexColor: string, percent: number): string => {
  const hex = hexColor.replace('#', '');
  const num = parseInt(hex, 16);
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00ff) + percent;
  let b = (num & 0x0000ff) + percent;
  
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

// Detect system theme preference
export const getSystemTheme = (): 'day' | 'night' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
  }
  return 'day';
};

// Export default custom colors for reference
export { defaultCustomColors };

