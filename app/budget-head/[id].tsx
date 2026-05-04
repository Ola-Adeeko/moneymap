import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';
import { useBudgetStore } from '@/src/store/use-budget-store';

export default function BudgetHeadDetailScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const params = useLocalSearchParams<{ id: string }>();
  const monthKey = useBudgetStore((s) => s.selectedMonthKey);
  const template = useBudgetStore((s) => s.templates.find((head) => head.id === params.id));
  const state = useBudgetStore((s) => (s.monthStates[monthKey] ?? []).find((head) => head.budgetHeadTemplateId === params.id));
  const allAllocations = useBudgetStore((s) => s.allocations);
  const allExpenses = useBudgetStore((s) => s.expenses);
  const allocations = useMemo(
    () => allAllocations.filter((entry) => entry.monthKey === monthKey && entry.budgetHeadId === params.id),
    [allAllocations, monthKey, params.id]
  );
  const expenses = useMemo(
    () => allExpenses.filter((entry) => entry.monthKey === monthKey && entry.budgetHeadId === params.id),
    [allExpenses, monthKey, params.id]
  );

  if (!template || !state) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Budget head not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{template.name}</Text>
      <View style={styles.card}>
        <Text style={styles.text}>Target: {state.targetAmount.toLocaleString()}</Text>
        <Text style={styles.text}>Allocated: {state.allocatedAmount.toLocaleString()}</Text>
        <Text style={styles.text}>Spent: {state.spentAmount.toLocaleString()}</Text>
        <Text style={styles.text}>Remaining: {state.availableBalance.toLocaleString()}</Text>
        <Text style={styles.text}>Gap: {state.unfundedGap.toLocaleString()}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.subtitle}>Income allocations</Text>
        {allocations.map((entry) => (
          <Text style={styles.text} key={entry.id}>
            {entry.allocationType.toUpperCase()} +{entry.allocatedAmount.toLocaleString()}
          </Text>
        ))}
      </View>
      <View style={styles.card}>
        <Text style={styles.subtitle}>Expenses</Text>
        {expenses.map((entry) => (
          <Text style={styles.text} key={entry.id}>
            {entry.description} -{entry.amount.toLocaleString()}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, gap: 4 },
  subtitle: { fontWeight: '700', color: colors.text },
  text: { color: colors.text },
});
