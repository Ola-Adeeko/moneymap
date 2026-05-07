import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { BudgetHeadCard } from '@/src/components/BudgetHeadCard';
import { EmptyState } from '@/src/components/EmptyState';
import { MonthSelector } from '@/src/components/MonthSelector';
import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';
import { useBudgetStore } from '@/src/store/use-budget-store';
import { sortMonthStatesBySetupOrder } from '@/src/utils/budgetHeadOrder';

export default function CategoriesScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const templates = useBudgetStore((s) => s.templates);
  const selectedMonthKey = useBudgetStore((s) => s.selectedMonthKey);
  const monthStatesMap = useBudgetStore((s) => s.monthStates);
  const setSelectedMonth = useBudgetStore((s) => s.setSelectedMonth);
  const initMonthIfNeeded = useBudgetStore((s) => s.initMonthIfNeeded);

  const activeTemplateMap = useMemo(
    () => new Map(templates.filter((template) => template.isActive).map((template) => [template.id, template])),
    [templates]
  );
  const monthStates = useMemo(() => {
    const raw = monthStatesMap[selectedMonthKey] ?? [];
    const filtered = raw.filter((state) => activeTemplateMap.has(state.budgetHeadTemplateId));
    return sortMonthStatesBySetupOrder(filtered, templates);
  }, [monthStatesMap, selectedMonthKey, activeTemplateMap, templates]);

  const shiftMonth = (step: number) => {
    const [year, month] = selectedMonthKey.split('-').map(Number);
    const d = new Date(year, month - 1 + step, 1);
    const next = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}`;
    initMonthIfNeeded(next);
    setSelectedMonth(next);
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <AppHeader title="Spending Categories" />
      <MonthSelector monthKey={selectedMonthKey} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} />

      <Pressable style={styles.manageBtn} onPress={() => router.push('/budget-setup')}>
        <Text style={styles.manageText}>Edit Categories</Text>
      </Pressable>

      {monthStates.length === 0 ? (
        <EmptyState title="No categories yet" subtitle="Create monthly categories to start tracking status." />
      ) : (
        monthStates.map((state) => {
          const template = templates.find((t) => t.id === state.budgetHeadTemplateId);
          if (!template) return null;
          const displayName = template.type === 'disposable' ? 'Free Spend' : template.name;
          return (
            <BudgetHeadCard
              key={state.id}
              name={displayName}
              state={state}
              onPress={() => router.push(`/budget-head/${template.id}`)}
            />
          );
        })
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 16, paddingBottom: 28, gap: 10 },
    manageBtn: {
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 2,
    },
    manageText: { color: colors.primary, fontWeight: '700' },
  });
