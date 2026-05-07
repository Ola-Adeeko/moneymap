import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';
import { MonthlyBudgetHeadState } from '@/src/types/models';

import { CurrencyText } from './CurrencyText';
import { ProgressBar } from './ProgressBar';
import { StatusBadge } from './StatusBadge';

export function BudgetHeadCard({
  name,
  state,
  onPress,
}: {
  name: string;
  state: MonthlyBudgetHeadState;
  onPress?: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const status =
    state.spentAmount > state.allocatedAmount
      ? { text: 'Overspent', tone: 'bad' as const }
      : state.allocatedAmount === 0
        ? { text: 'Not Funded', tone: 'warn' as const }
        : state.allocatedAmount < state.targetAmount
          ? { text: 'Partially Funded', tone: 'warn' as const }
          : { text: 'Funded', tone: 'good' as const };

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.name}>{name}</Text>
        <StatusBadge text={status.text} tone={status.tone} />
      </View>
      <View style={styles.metricRow}>
        <Text style={styles.meta}>
          Budget <CurrencyText amount={state.targetAmount} />
        </Text>
        <Text style={styles.meta}>
          Funded <CurrencyText amount={state.allocatedAmount} />
        </Text>
      </View>
      <ProgressBar value={state.allocatedAmount} max={Math.max(1, state.targetAmount)} />
      <View style={styles.metricRow}>
        <Text style={styles.meta}>
          Spent <CurrencyText amount={state.spentAmount} />
        </Text>
        <Text style={styles.meta}>
          Available <CurrencyText amount={state.availableBalance} />
        </Text>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  meta: { color: colors.subtext, fontSize: 12 },
});
