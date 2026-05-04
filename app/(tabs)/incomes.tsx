import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { EmptyState } from '@/src/components/EmptyState';
import { TransactionListItem } from '@/src/components/TransactionListItem';
import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';
import { useBudgetStore } from '@/src/store/use-budget-store';
import { monthLabel } from '@/src/utils/month';

export default function IncomesScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const monthKey = useBudgetStore((s) => s.selectedMonthKey);
  const allIncomes = useBudgetStore((s) => s.incomes);
  const allocations = useBudgetStore((s) => s.allocations);
  const templates = useBudgetStore((s) => s.templates);
  const incomes = useMemo(
    () => allIncomes.filter((entry) => entry.monthKey === monthKey),
    [allIncomes, monthKey]
  );

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <AppHeader
        title="Income History"
        right={
          <Pressable style={styles.button} onPress={() => router.push('/add-income')}>
            <Text style={styles.buttonText}>+ Add</Text>
          </Pressable>
        }
      />
      <Text style={styles.month}>{monthLabel(monthKey)}</Text>
      {incomes.length === 0 ? (
        <EmptyState title="No incomes this month" subtitle="Add income to trigger allocation into your budget heads." />
      ) : (
        incomes.map((income) => (
          <Pressable
            key={income.id}
            style={styles.card}
            onPress={() => router.push({ pathname: '/add-income', params: { id: income.id } })}>
            <TransactionListItem title={income.source} subtitle={new Date(income.date).toDateString()} amount={income.amount} />
            <Text style={styles.breakdown}>Tap this card to edit this income</Text>
            {allocations
              .filter((a) => a.incomeEntryId === income.id)
              .map((alloc) => {
                const head = templates.find((t) => t.id === alloc.budgetHeadId);
                return (
                  <Text style={styles.breakdown} key={alloc.id}>
                    {head?.name ?? 'Unknown'}: {alloc.allocatedAmount.toLocaleString()}
                  </Text>
                );
              })}
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 12 },
  month: { color: colors.subtext },
  button: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12 },
  breakdown: { color: colors.subtext, fontSize: 12, marginBottom: 6 },
});
