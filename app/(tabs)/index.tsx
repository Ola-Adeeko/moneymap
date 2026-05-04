import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Plus, Wallet } from 'lucide-react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { BudgetHeadCard } from '@/src/components/BudgetHeadCard';
import { EmptyState } from '@/src/components/EmptyState';
import { MonthSelector } from '@/src/components/MonthSelector';
import { SectionTitle } from '@/src/components/SectionTitle';
import { SummaryCard } from '@/src/components/SummaryCard';
import { CurrencyText } from '@/src/components/CurrencyText';
import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';
import { useBudgetStore } from '@/src/store/use-budget-store';
import { sortMonthStatesBySetupOrder } from '@/src/utils/budgetHeadOrder';
import { formatCurrency } from '@/src/utils/currency';

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [showDisposableModal, setShowDisposableModal] = useState(false);
  const templates = useBudgetStore((s) => s.templates);
  const activeTemplateMap = useMemo(
    () => new Map(templates.filter((template) => template.isActive).map((template) => [template.id, template])),
    [templates]
  );
  const selectedMonthKey = useBudgetStore((s) => s.selectedMonthKey);
  const monthStatesMap = useBudgetStore((s) => s.monthStates);
  const monthStates = useMemo(() => {
    const raw = monthStatesMap[selectedMonthKey] ?? [];
    const filtered = raw.filter((state) => activeTemplateMap.has(state.budgetHeadTemplateId));
    return sortMonthStatesBySetupOrder(filtered, templates);
  }, [monthStatesMap, selectedMonthKey, activeTemplateMap, templates]);
  const currency = useBudgetStore((s) => s.settings.currency);
  const setSelectedMonth = useBudgetStore((s) => s.setSelectedMonth);
  const initMonthIfNeeded = useBudgetStore((s) => s.initMonthIfNeeded);
  const getMonthSummary = useBudgetStore((s) => s.getMonthSummary);
  const summary = getMonthSummary(selectedMonthKey);

  const shiftMonth = (step: number) => {
    const [year, month] = selectedMonthKey.split('-').map(Number);
    const d = new Date(year, month - 1 + step, 1);
    const next = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}`;
    initMonthIfNeeded(next);
    setSelectedMonth(next);
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <AppHeader
        title="Money Map"
        right={
          <Pressable
            style={styles.quickBtn}
            onPress={() => setShowDisposableModal(true)}>
            <View style={styles.quickTopRow}>
              <Wallet size={12} color={colors.primary} strokeWidth={2.2} />
              <Text style={styles.quickLabel}>Disposable</Text>
            </View>
            <CurrencyText amount={summary.disposableBalance} style={styles.quickText} />
          </Pressable>
        }
      />
      <MonthSelector monthKey={selectedMonthKey} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} />

      <View style={styles.summaryGrid}>
        <View style={styles.summaryRow}>
          <View style={styles.gridItem}>
            <SummaryCard label="Total Income" value={`${summary.totalIncome.toLocaleString()}`} />
          </View>
          <View style={styles.gridItem}>
            <SummaryCard label="Total Allocated" value={`${summary.totalAllocated.toLocaleString()}`} />
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.gridItem}>
            <SummaryCard label="Total Spent" value={`${summary.totalSpent.toLocaleString()}`} />
          </View>
          <View style={styles.gridItem}>
            <SummaryCard label="Unfunded Gap" value={`${summary.totalUnfundedGap.toLocaleString()}`} />
          </View>
        </View>
      </View>

      <SectionTitle>Budget Heads</SectionTitle>
      <Pressable style={styles.action} onPress={() => router.push('/budget-setup')}>
        <Text style={styles.actionLabel}>Total Planned Budget</Text>
        <View style={styles.actionRow}>
          <CurrencyText amount={summary.totalBudgetTarget} style={styles.actionText} />
          <View style={styles.actionPill}>
            <Plus size={14} color={colors.primary} strokeWidth={2.4} />
          </View>
        </View>
        <Text style={styles.actionHint}>Manage Budget Heads</Text>
      </Pressable>
      {monthStates.length === 0 ? (
        <EmptyState title="No budget heads yet" subtitle="Create monthly heads to start allocating income." />
      ) : (
        monthStates.map((state) => {
          const template = templates.find((t) => t.id === state.budgetHeadTemplateId);
          if (!template) return null;
          return (
            <BudgetHeadCard
              key={state.id}
              name={template.name}
              state={state}
              onPress={() => router.push(`/budget-head/${template.id}`)}
            />
          );
        })
      )}

      <Modal
        visible={showDisposableModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDisposableModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalTitleRow}>
              <Wallet size={16} color={colors.primary} strokeWidth={2.3} />
              <Text style={styles.modalTitle}>Disposable Balance</Text>
            </View>
            <Text style={styles.modalAmount}>
              {formatCurrency(summary.disposableBalance, currency)}
            </Text>
            <Text style={styles.modalBody}>
              This is your flexible spend amount for the selected month. You can use it for any unplanned or lifestyle spending.
            </Text>
            <Pressable style={styles.modalBtn} onPress={() => setShowDisposableModal(false)}>
              <Text style={styles.modalBtnText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  quickBtn: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, gap: 2 },
  quickTopRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  quickLabel: { color: colors.subtext, fontWeight: '700', fontSize: 10 },
  quickText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 6, 14, 0.78)',
    justifyContent: 'center',
    padding: 22,
  },
  modalCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  modalAmount: { color: colors.primary, fontWeight: '800', fontSize: 26 },
  modalBody: { color: colors.subtext, lineHeight: 20 },
  modalBtn: {
    marginTop: 4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalBtnText: { color: '#fff', fontWeight: '700' },
});
