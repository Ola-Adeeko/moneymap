import { StyleSheet, View } from 'react-native';

import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';

export function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const pct = max <= 0 ? 0 : Math.min(1, Math.max(0, value / max));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color ?? colors.primary }]} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  track: { height: 8, borderRadius: 999, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: '100%' },
});
