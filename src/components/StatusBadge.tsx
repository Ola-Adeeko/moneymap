import { StyleSheet, Text, View } from 'react-native';

import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';

export function StatusBadge({ text, tone }: { text: string; tone: 'good' | 'warn' | 'bad' | 'info' }) {
  const { colors, effectiveScheme } = useAppTheme();
  const styles = createStyles(colors);
  const bg =
    tone === 'good'
      ? effectiveScheme === 'dark' ? '#133A2A' : '#DCFCE7'
      : tone === 'warn'
        ? effectiveScheme === 'dark' ? '#4A3510' : '#FEF3C7'
        : tone === 'bad'
          ? effectiveScheme === 'dark' ? '#4B1F23' : '#FEE2E2'
          : effectiveScheme === 'dark' ? '#1D2E66' : '#DBEAFE';
  const color =
    tone === 'good'
      ? colors.success
      : tone === 'warn'
        ? colors.warning
        : tone === 'bad'
          ? colors.danger
          : colors.primary;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  );
}

const createStyles = (_colors: ThemeColors) => StyleSheet.create({
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  text: { fontSize: 11, fontWeight: '700' },
});
