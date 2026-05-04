export type AppThemeMode = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  subtext: string;
  primary: string;
  primarySoft: string;
  success: string;
  warning: string;
  danger: string;
  border: string;
};

export const ThemePalette: Record<AppThemeMode, ThemeColors> = {
  light: {
    background: '#F3F5FF',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF2FF',
    text: '#171F3A',
    subtext: '#6E7794',
    primary: '#5B5FEF',
    primarySoft: '#E0E4FF',
    success: '#16A34A',
    warning: '#F59E0B',
    danger: '#EF4444',
    border: '#E7EAF7',
  },
  dark: {
    background: '#090D1A',
    surface: '#12182B',
    surfaceAlt: '#1A2240',
    text: '#E8ECFF',
    subtext: '#A3ADD2',
    primary: '#7B84FF',
    primarySoft: '#273066',
    success: '#22C55E',
    warning: '#FBBF24',
    danger: '#F87171',
    border: '#243057',
  },
};

// Backward compatibility for static usages while screens are migrated.
export const AppColors = ThemePalette.light;
