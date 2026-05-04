import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { EmptyState } from '@/src/components/EmptyState';
import { TransactionListItem } from '@/src/components/TransactionListItem';
import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';
import { useBudgetStore } from '@/src/store/use-budget-store';

export default function ExpensesScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const monthKey = useBudgetStore((s) => s.selectedMonthKey);
  const allExpenses = useBudgetStore((s) => s.expenses);
  const templates = useBudgetStore((s) => s.templates);
  const expenses = useMemo(
    () => allExpenses.filter((entry) => entry.monthKey === monthKey),
    [allExpenses, monthKey]
  );
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <AppHeader
        title="Expense History"
        right={
          <Pressable style={styles.button} onPress={() => router.push('/add-expense')}>
            <Text style={styles.buttonText}>+ Add</Text>
          </Pressable>
        }
      />
      {expenses.length === 0 ? (
        <EmptyState title="No expenses yet" subtitle="Every expense belongs to a budget head." />
      ) : (
        expenses.map((expense) => {
          const head = templates.find((t) => t.id === expense.budgetHeadId);
          return (
            <Pressable key={expense.id} onPress={() => router.push({ pathname: '/add-expense', params: { id: expense.id } })}>
              <TransactionListItem
                title={expense.description}
                subtitle={`${head?.name ?? 'Unknown'} • ${expense.paymentMethod} • Tap to edit`}
                amount={expense.amount}
                isNegative
              />
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 10 },
  button: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
