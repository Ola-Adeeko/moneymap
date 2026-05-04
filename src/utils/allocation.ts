import { AllocationEntry, BudgetHeadTemplate, MonthlyBudgetHeadState } from '@/src/types/models';
import { sortTemplatesBySetupOrder } from '@/src/utils/budgetHeadOrder';

const updateDerived = (head: MonthlyBudgetHeadState): MonthlyBudgetHeadState => {
  const available = head.allocatedAmount - head.spentAmount;
  const gap = Math.max(0, head.targetAmount - head.allocatedAmount);
  return {
    ...head,
    availableBalance: available,
    unfundedGap: gap,
    isFullyFunded: gap === 0,
  };
};

export const initializeMonthState = (
  monthKey: string,
  templates: BudgetHeadTemplate[]
): MonthlyBudgetHeadState[] => {
  const active = templates.filter((head) => head.isActive);
  const hasDisposable = active.some((head) => head.type === 'disposable');
  const safeHeads = hasDisposable
    ? active
    : [
        ...active,
        {
          id: 'h-disposable',
          name: 'Disposable',
          icon: '🧃',
          monthlyTarget: 0,
          priority: 999,
          type: 'disposable' as const,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

  const ordered = sortTemplatesBySetupOrder(safeHeads);

  return ordered.map((template) =>
    updateDerived({
      id: `${monthKey}-${template.id}`,
      monthKey,
      budgetHeadTemplateId: template.id,
      targetAmount: template.monthlyTarget,
      allocatedAmount: 0,
      spentAmount: 0,
      isFullyFunded: template.monthlyTarget === 0,
      availableBalance: 0,
      unfundedGap: template.monthlyTarget,
    })
  );
};

export const autoAllocateIncome = ({
  monthKey,
  incomeEntryId,
  amount,
  monthStates,
  templates,
}: {
  monthKey: string;
  incomeEntryId: string;
  amount: number;
  monthStates: MonthlyBudgetHeadState[];
  templates: BudgetHeadTemplate[];
}) => {
  let remaining = amount;
  const updatedStates = [...monthStates];
  const entries: AllocationEntry[] = [];

  const activeTemplates = templates.filter((t) => t.isActive);
  const sorted = activeTemplates.sort((a, b) => a.priority - b.priority);
  const standardHeads = sorted.filter((h) => h.type !== 'disposable');
  const disposable = sorted.find((h) => h.type === 'disposable');

  for (const template of standardHeads) {
    if (remaining <= 0) break;
    const idx = updatedStates.findIndex((s) => s.budgetHeadTemplateId === template.id);
    if (idx < 0) continue;
    const current = updatedStates[idx];
    const needed = Math.max(0, current.targetAmount - current.allocatedAmount);
    if (needed <= 0) continue;
    const allocation = Math.min(remaining, needed);
    const next = updateDerived({ ...current, allocatedAmount: current.allocatedAmount + allocation });
    updatedStates[idx] = next;
    remaining -= allocation;
    entries.push({
      id: `${incomeEntryId}-${template.id}-${entries.length + 1}`,
      incomeEntryId,
      monthKey,
      budgetHeadId: template.id,
      allocatedAmount: allocation,
      allocationType: 'auto',
      createdAt: new Date().toISOString(),
    });
  }

  if (remaining > 0 && disposable) {
    const idx = updatedStates.findIndex((s) => s.budgetHeadTemplateId === disposable.id);
    if (idx >= 0) {
      const current = updatedStates[idx];
      updatedStates[idx] = updateDerived({
        ...current,
        allocatedAmount: current.allocatedAmount + remaining,
      });
      entries.push({
        id: `${incomeEntryId}-${disposable.id}-${entries.length + 1}`,
        incomeEntryId,
        monthKey,
        budgetHeadId: disposable.id,
        allocatedAmount: remaining,
        allocationType: 'disposable',
        createdAt: new Date().toISOString(),
      });
      remaining = 0;
    }
  }

  return { updatedStates, entries, unallocatedAmount: remaining };
};

export const applyManualAllocation = ({
  monthKey,
  incomeEntryId,
  amount,
  selectedHeadId,
  monthStates,
}: {
  monthKey: string;
  incomeEntryId: string;
  amount: number;
  selectedHeadId: string;
  monthStates: MonthlyBudgetHeadState[];
}) => {
  const updatedStates = [...monthStates];
  const idx = updatedStates.findIndex((s) => s.budgetHeadTemplateId === selectedHeadId);
  if (idx < 0) return { updatedStates, entries: [] as AllocationEntry[] };
  updatedStates[idx] = updateDerived({
    ...updatedStates[idx],
    allocatedAmount: updatedStates[idx].allocatedAmount + amount,
  });
  return {
    updatedStates,
    entries: [
      {
        id: `${incomeEntryId}-${selectedHeadId}-manual`,
        incomeEntryId,
        monthKey,
        budgetHeadId: selectedHeadId,
        allocatedAmount: amount,
        allocationType: 'manual',
        createdAt: new Date().toISOString(),
      },
    ] as AllocationEntry[],
  };
};

export const recalculateAfterExpense = (state: MonthlyBudgetHeadState, amount: number) =>
  updateDerived({ ...state, spentAmount: state.spentAmount + amount });
