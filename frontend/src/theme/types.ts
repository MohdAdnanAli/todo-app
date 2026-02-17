// Theme type definitions
export type ThemeId = 'system' | 'day' | 'night' | 'tiled' | 'dark' | 'arctic' | 'sunset' | 'ocean' | 'custom';

export interface ThemeColors {
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgGradient: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Border colors
  borderPrimary: string;
  borderSecondary: string;
  borderAccent: string;
  
  // Accent colors
  accentPrimary: string;
  accentSecondary: string;
  accentGradient: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Interactive states
  hoverBg: string;
  activeBg: string;
  
  // Special
  shadow: string;
  glow: string;
  inputBg: string;
  cardBg: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  icon: string;
  isDark: boolean;
  colors: ThemeColors;
}

export interface CustomThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  textPrimary: string;
  textSecondary: string;
  accentPrimary: string;
  accentSecondary: string;
}

export const defaultCustomColors: CustomThemeColors = {
  bgPrimary: '#ffffff',
  bgSecondary: '#f9fafb',
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  accentPrimary: '#6366f1',
  accentSecondary: '#8b5cf6',
};

