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
      : state.unfundedGap > 0
        ? { text: 'Underfunded', tone: 'warn' as const }
        : { text: 'Safe', tone: 'good' as const };

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.name}>{name}</Text>
        <StatusBadge text={status.text} tone={status.tone} />
      </View>
      <View style={styles.metrics}>
        <Text style={styles.meta}>
          Target <CurrencyText amount={state.targetAmount} />
        </Text>
        <Text style={styles.meta}>
          Allocated <CurrencyText amount={state.allocatedAmount} />
        </Text>
        <Text style={styles.meta}>
          Spent <CurrencyText amount={state.spentAmount} />
        </Text>
      </View>
      <ProgressBar value={state.allocatedAmount} max={Math.max(1, state.targetAmount)} />
      <View style={styles.footer}>
        <Text style={styles.meta}>
          Available <CurrencyText amount={state.availableBalance} />
        </Text>
        <Text style={styles.meta}>
          Gap <CurrencyText amount={state.unfundedGap} />
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
  metrics: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  meta: { color: colors.subtext, fontSize: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
});
