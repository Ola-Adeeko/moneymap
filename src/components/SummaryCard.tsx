import { StyleSheet, Text, View } from 'react-native';

import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';

export function SummaryCard({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flex: 1,
    gap: 4,
  },
  label: { color: colors.subtext, fontSize: 12 },
  value: { color: colors.text, fontSize: 18, fontWeight: '700' },
});
