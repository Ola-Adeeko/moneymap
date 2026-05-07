import { StyleSheet, Text, View } from 'react-native';

import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';

type SummaryTone = 'neutral' | 'income' | 'expense' | 'balance';

const TONE_META: Record<SummaryTone, { bar: keyof ThemeColors; value: keyof ThemeColors }> = {
  neutral: { bar: 'primary', value: 'text' },
  income: { bar: 'success', value: 'text' },
  expense: { bar: 'danger', value: 'text' },
  balance: { bar: 'primary', value: 'primary' },
};

export function SummaryCard({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: SummaryTone }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const toneMeta = TONE_META[tone];
  return (
    <View style={styles.card}>
      <View style={[styles.topBar, { backgroundColor: colors[toneMeta.bar] }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: colors[toneMeta.value] }]}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flex: 1,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  topBar: { width: 40, height: 4, borderRadius: 999 },
  label: { color: colors.subtext, fontSize: 12, fontWeight: '600' },
  value: { fontSize: 20, fontWeight: '800' },
});
