import { StyleSheet, Text, View } from 'react-native';

import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';
import { CurrencyText } from '@/src/components/CurrencyText';

export function TransactionListItem({
  title,
  subtitle,
  amount,
  isNegative,
}: {
  title: string;
  subtitle: string;
  amount: number;
  isNegative?: boolean;
}) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <CurrencyText amount={amount} style={[styles.amount, isNegative && styles.negative]} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: colors.text, fontWeight: '600' },
  subtitle: { color: colors.subtext, fontSize: 12 },
  amount: { color: colors.success, fontWeight: '700' },
  negative: { color: colors.danger },
});
