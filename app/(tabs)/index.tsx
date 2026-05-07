import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { MonthSelector } from '@/src/components/MonthSelector';
import { SectionTitle } from '@/src/components/SectionTitle';
import { SummaryCard } from '@/src/components/SummaryCard';
import { CurrencyText } from '@/src/components/CurrencyText';
import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';
import { useBudgetStore } from '@/src/store/use-budget-store';

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const selectedMonthKey = useBudgetStore((s) => s.selectedMonthKey);
  const setSelectedMonth = useBudgetStore((s) => s.setSelectedMonth);
  const initMonthIfNeeded = useBudgetStore((s) => s.initMonthIfNeeded);
  const templates = useBudgetStore((s) => s.templates);
  const monthStatesMap = useBudgetStore((s) => s.monthStates);
  const incomes = useBudgetStore((s) => s.incomes);

  const summary = useMemo(() => {
    const monthHeads = monthStatesMap[selectedMonthKey] ?? [];
    const activeTemplates = templates.filter((head) => head.isActive);
    const activeTemplateMap = new Map(activeTemplates.map((head) => [head.id, head]));
    const activeMonthHeads = monthHeads.filter((head) => activeTemplateMap.has(head.budgetHeadTemplateId));
    const nonDisposableHeads = activeMonthHeads.filter((head) => {
      const template = activeTemplateMap.get(head.budgetHeadTemplateId);
      return template?.type !== 'disposable';
    });
    const totalIncome = incomes
      .filter((income) => income.monthKey === selectedMonthKey)
      .reduce((sum, income) => sum + income.amount, 0);
    const totalAllocated = activeMonthHeads.reduce((sum, head) => sum + head.allocatedAmount, 0);
    const totalSpent = activeMonthHeads.reduce((sum, head) => sum + head.spentAmount, 0);
    const totalBudgetTarget = nonDisposableHeads.reduce((sum, head) => sum + head.targetAmount, 0);
    const disposable = templates.find((head) => head.type === 'disposable');
    const disposableState = disposable
      ? activeMonthHeads.find((head) => head.budgetHeadTemplateId === disposable.id)
      : undefined;
    return {
      totalIncome,
      totalAllocated,
      totalSpent,
      totalBudgetTarget,
      disposableBalance: disposableState?.availableBalance ?? 0,
    };
  }, [monthStatesMap, selectedMonthKey, templates, incomes]);

  const totalIncome = summary.totalIncome;
  const disposableBalance = summary.disposableBalance;
  const totalSpent = summary.totalSpent;
  const totalBudgetTarget = summary.totalBudgetTarget;
  const budgetLeft = Math.max(totalBudgetTarget - totalSpent, 0);

  const shiftMonth = (step: number) => {
    const [year, month] = selectedMonthKey.split('-').map(Number);
    const d = new Date(year, month - 1 + step, 1);
    const next = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}`;
    initMonthIfNeeded(next);
    setSelectedMonth(next);
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <AppHeader title="Money Map" />
      <MonthSelector monthKey={selectedMonthKey} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} />

      <View style={styles.summaryGrid}>
        <View style={styles.summaryRow}>
          <View style={styles.gridItem}>
            <SummaryCard label="Total Income" value={`${totalIncome.toLocaleString()}`} tone="income" />
          </View>
          <View style={styles.gridItem}>
            <SummaryCard label="Free Spend Balance" value={`${disposableBalance.toLocaleString()}`} tone="balance" />
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.gridItem}>
            <SummaryCard label="Total Expenses" value={`${totalSpent.toLocaleString()}`} tone="expense" />
          </View>
          <View style={styles.gridItem}>
            <SummaryCard label="Unspent Balance" value={`${budgetLeft.toLocaleString()}`} tone="balance" />
          </View>
        </View>
      </View>

      <SectionTitle>Spending Categories</SectionTitle>
      <Pressable style={styles.action} onPress={() => router.push('/categories')}>
        <Text style={styles.actionLabel}>Total Planned Budget</Text>
        <View style={styles.actionRow}>
          <CurrencyText amount={totalBudgetTarget} style={styles.actionText} />
          <View style={styles.actionPill}>
            <Plus size={14} color={colors.primary} strokeWidth={2.4} />
          </View>
        </View>
        <Text style={styles.actionHint}>View Categories</Text>
      </Pressable>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 32, paddingHorizontal: 16, gap: 12 },
  summaryGrid: { gap: 10 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  gridItem: { flex: 1 },
  action: { padding: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, gap: 10 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionText: { color: colors.text, fontWeight: '800', fontSize: 20 },
  actionLabel: { color: colors.subtext, fontSize: 12, fontWeight: '600' },
  actionHint: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  actionPill: { width: 28, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border },
});
