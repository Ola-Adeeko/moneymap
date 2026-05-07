import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { CurrencyText } from '@/src/components/CurrencyText';
import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';
import { useBudgetStore } from '@/src/store/use-budget-store';
import { sortMonthStatesBySetupOrder } from '@/src/utils/budgetHeadOrder';
import { monthLabel } from '@/src/utils/month';

export default function InsightsScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const monthKey = useBudgetStore((s) => s.selectedMonthKey);
  const monthStatesMap = useBudgetStore((s) => s.monthStates);
  const templates = useBudgetStore((s) => s.templates);
  const allIncomes = useBudgetStore((s) => s.incomes);
  const allExpenses = useBudgetStore((s) => s.expenses);
  const allAllocations = useBudgetStore((s) => s.allocations);
  const monthHeads = useMemo(() => {
    const raw = monthStatesMap[monthKey] ?? [];
    return sortMonthStatesBySetupOrder(raw, templates);
  }, [monthStatesMap, monthKey, templates]);
  const monthIncomes = useMemo(
    () => allIncomes.filter((entry) => entry.monthKey === monthKey),
    [allIncomes, monthKey]
  );
  const monthExpenses = useMemo(
    () => allExpenses.filter((entry) => entry.monthKey === monthKey),
    [allExpenses, monthKey]
  );
  const monthAllocations = useMemo(
    () => allAllocations.filter((entry) => entry.monthKey === monthKey),
    [allAllocations, monthKey]
  );

  const incomeTotal = useMemo(
    () => monthIncomes.reduce((sum, entry) => sum + entry.amount, 0),
    [monthIncomes]
  );
  const expenseTotal = useMemo(
    () => monthExpenses.reduce((sum, entry) => sum + entry.amount, 0),
    [monthExpenses]
  );
  const allocatedTotal = useMemo(
    () => monthHeads.reduce((sum, head) => sum + head.allocatedAmount, 0),
    [monthHeads]
  );
  const selectedYear = useMemo(() => monthKey.split('-')[0], [monthKey]);
  const yearPrefix = `${selectedYear}-`;
  const yearlyIncomes = useMemo(
    () => allIncomes.filter((entry) => entry.monthKey.startsWith(yearPrefix)),
    [allIncomes, yearPrefix]
  );
  const yearlyExpenses = useMemo(
    () => allExpenses.filter((entry) => entry.monthKey.startsWith(yearPrefix)),
    [allExpenses, yearPrefix]
  );
  const yearlyAllocations = useMemo(
    () => allAllocations.filter((entry) => entry.monthKey.startsWith(yearPrefix)),
    [allAllocations, yearPrefix]
  );
  const yearlyIncomeTotal = useMemo(
    () => yearlyIncomes.reduce((sum, entry) => sum + entry.amount, 0),
    [yearlyIncomes]
  );
  const yearlyExpenseTotal = useMemo(
    () => yearlyExpenses.reduce((sum, entry) => sum + entry.amount, 0),
    [yearlyExpenses]
  );
  const yearlyAllocatedTotal = useMemo(
    () => yearlyAllocations.reduce((sum, entry) => sum + entry.allocatedAmount, 0),
    [yearlyAllocations]
  );
  const activeYearlyMonths = useMemo(
    () => new Set([...yearlyIncomes, ...yearlyExpenses, ...yearlyAllocations].map((entry) => entry.monthKey)).size,
    [yearlyIncomes, yearlyExpenses, yearlyAllocations]
  );
  const allocationByHead = useMemo(() => {
    const map: Record<string, number> = {};
    for (const alloc of monthAllocations) {
      map[alloc.budgetHeadId] = (map[alloc.budgetHeadId] ?? 0) + alloc.allocatedAmount;
    }
    return Object.entries(map)
      .map(([headId, amount]) => ({
        headId,
        amount,
        name: templates.find((t) => t.id === headId)?.name ?? 'Unknown',
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthAllocations, templates]);

  const fundedCount = monthHeads.filter((h) => h.isFullyFunded).length;
  const overspent = monthHeads.filter((h) => h.spentAmount > h.allocatedAmount);
  const notFunded = monthHeads.filter((h) => h.allocatedAmount === 0 && h.targetAmount > 0);
  const disposableId = templates.find((t) => t.type === 'disposable')?.id;
  const disposable = monthHeads.find((h) => h.budgetHeadTemplateId === disposableId);

  const messages = [
    `You have funded ${fundedCount} of ${monthHeads.length} categories.`,
    ...overspent.map((head) => {
      const name = templates.find((t) => t.id === head.budgetHeadTemplateId)?.name ?? 'A head';
      return `${name} is overspent by ${(head.spentAmount - head.allocatedAmount).toLocaleString()}.`;
    }),
    ...notFunded.map((head) => {
      const name = templates.find((t) => t.id === head.budgetHeadTemplateId)?.name ?? 'A head';
      return `${name} is not yet funded this month.`;
    }),
    `Your free spend balance is ${(disposable?.availableBalance ?? 0).toLocaleString()}.`,
  ];

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <AppHeader title="Insights" />
      <Text style={styles.month}>{monthLabel(monthKey)}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Income Summary</Text>
        <Text style={styles.text}>
          Total income this month: <CurrencyText amount={incomeTotal} />
        </Text>
        <Text style={styles.text}>Income entries: {monthIncomes.length}</Text>
        <Pressable style={styles.linkBtn} onPress={() => router.push('/(tabs)/incomes')}>
          <Text style={styles.linkText}>View full income list</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Expense Summary</Text>
        <Text style={styles.text}>
          Total expenses this month: <CurrencyText amount={expenseTotal} />
        </Text>
        <Text style={styles.text}>Expense entries: {monthExpenses.length}</Text>
        <Pressable style={styles.linkBtn} onPress={() => router.push('/(tabs)/expenses')}>
          <Text style={styles.linkText}>View full expense list</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Allocation Summary</Text>
        <Text style={styles.text}>
          Total allocated this month: <CurrencyText amount={allocatedTotal} />
        </Text>
        <Text style={styles.text}>Allocation events: {monthAllocations.length}</Text>
        {allocationByHead.length === 0 ? (
          <Text style={styles.subtle}>No allocations yet this month.</Text>
        ) : (
          allocationByHead.slice(0, 5).map((item) => (
            <Text key={item.headId} style={styles.text}>
              {item.name}: <CurrencyText amount={item.amount} />
            </Text>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Yearly Summary ({selectedYear})</Text>
        <Text style={styles.text}>
          Total income: <CurrencyText amount={yearlyIncomeTotal} />
        </Text>
        <Text style={styles.text}>
          Total expenses: <CurrencyText amount={yearlyExpenseTotal} />
        </Text>
        <Text style={styles.text}>
          Total allocations: <CurrencyText amount={yearlyAllocatedTotal} />
        </Text>
        <Text style={styles.text}>
          Net cashflow: <CurrencyText amount={yearlyIncomeTotal - yearlyExpenseTotal} />
        </Text>
        <Text style={styles.text}>Months with activity: {activeYearlyMonths}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Funding Insights</Text>
        {messages.map((message, idx) => (
          <Text key={`insight-${idx}`} style={styles.text}>
            - {message}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 10 },
  month: { color: colors.subtext, fontWeight: '600', marginBottom: 2 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, gap: 4 },
  cardTitle: { color: colors.primary, fontWeight: '800', marginBottom: 2 },
  text: { color: colors.text },
  subtle: { color: colors.subtext },
  linkBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  linkText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
});
