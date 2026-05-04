import { ThemePalette } from '@/src/constants/colors';
import { useBudgetStore } from '@/src/store/use-budget-store';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useAppTheme() {
  const systemScheme = useColorScheme();
  const themeMode = useBudgetStore((state) => state.settings.themeMode);
  const effectiveScheme = themeMode === 'system' ? (systemScheme ?? 'light') : themeMode;
  const colors = ThemePalette[effectiveScheme];
  return { themeMode, effectiveScheme, colors };
}
