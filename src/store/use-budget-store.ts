import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_HEADS } from '@/src/data/seed';
import {
  AllocationEntry,
  AppSettings,
  BudgetHeadTemplate,
  ExpenseEntry,
  IncomeEntry,
  MonthlyBudgetHeadState,
  MonthlySummary,
} from '@/src/types/models';
import {
  applyManualAllocation,
  autoAllocateIncome,
  initializeMonthState,
  recalculateAfterExpense,
} from '@/src/utils/allocation';
import { sortTemplatesBySetupOrder } from '@/src/utils/budgetHeadOrder';
import { currentMonthKey } from '@/src/utils/month';

const defaultSettings: AppSettings = {
  currency: 'NGN',
  defaultMonthBehavior: 'current',
  notificationsEnabled: false,
  themeMode: 'dark',
  setupComplete: false,
};

interface StoreState {
  templates: BudgetHeadTemplate[];
  monthStates: Record<string, MonthlyBudgetHeadState[]>;
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  allocations: AllocationEntry[];
  settings: AppSettings;
  selectedMonthKey: string;

  completeOnboarding: () => void;
  setSelectedMonth: (monthKey: string) => void;
  initMonthIfNeeded: (monthKey: string) => void;
  addBudgetHead: (head: Omit<BudgetHeadTemplate, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateBudgetHead: (headId: string, updates: Partial<BudgetHeadTemplate>) => void;
  deleteBudgetHead: (headId: string) => void;
  reorderHeads: (orderedIds: string[]) => void;
  fundCategoryFromFreeSpend: (headId: string, monthKey: string) => number;
  addIncome: (payload: {
    monthKey: string;
    amount: number;
    date: string;
    source: string;
    note?: string;
    allocationMode: 'auto' | 'manual';
    selectedHeadId?: string;
  }) => void;
  addExpense: (payload: Omit<ExpenseEntry, 'id' | 'createdAt'>) => void;
  updateIncome: (
    incomeId: string,
    payload: {
      amount: number;
      date: string;
      source: string;
      note?: string;
      allocationMode: 'auto' | 'manual';
      selectedHeadId?: string;
    }
  ) => void;
  updateExpense: (
    expenseId: string,
    payload: {
      amount: number;
      date: string;
      budgetHeadId: string;
      description: string;
      paymentMethod: string;
      note?: string;
    }
  ) => void;
  setCurrency: (currency: string) => void;
  setThemeMode: (mode: AppSettings['themeMode']) => void;
  resetData: () => void;
  exportData: () => string;
  getMonthSummary: (monthKey: string) => MonthlySummary;
}

const ensureDisposable = (templates: BudgetHeadTemplate[]): BudgetHeadTemplate[] => {
  if (templates.some((head) => head.type === 'disposable')) return templates;
  const now = new Date().toISOString();
  const disposable: BudgetHeadTemplate = {
    id: `h-disposable-${Date.now()}`,
    name: 'Free Spend',
    icon: '🧃',
    monthlyTarget: 0,
    priority: 999,
    type: 'disposable',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  return [...templates, disposable];
};

const bootMonth = currentMonthKey();
const baseTemplates = ensureDisposable(DEFAULT_HEADS.filter((head) => head.type === 'disposable'));
const initialMonthState = initializeMonthState(bootMonth, baseTemplates);

const syncMonthStateWithTemplates = ({
  monthKey,
  monthStates,
  templates,
}: {
  monthKey: string;
  monthStates: MonthlyBudgetHeadState[];
  templates: BudgetHeadTemplate[];
}) => {
  const byTemplateId = new Map(monthStates.map((state) => [state.budgetHeadTemplateId, state]));
  return sortTemplatesBySetupOrder(templates.filter((head) => head.isActive)).map(
      (template) => {
        const existing = byTemplateId.get(template.id);
        if (existing) {
          const targetAmount = template.monthlyTarget;
          const isFullyFunded = existing.allocatedAmount >= targetAmount;
          const unfundedGap = Math.max(0, targetAmount - existing.allocatedAmount);
          return {
            ...existing,
            targetAmount,
            isFullyFunded,
            unfundedGap,
          };
        }
        return {
          id: `${monthKey}-${template.id}`,
          monthKey,
          budgetHeadTemplateId: template.id,
          targetAmount: template.monthlyTarget,
          allocatedAmount: 0,
          spentAmount: 0,
          isFullyFunded: template.monthlyTarget === 0,
          availableBalance: 0,
          unfundedGap: template.monthlyTarget,
        };
      }
    );
};

const syncAllMonthStatesWithTemplates = ({
  monthStatesMap,
  templates,
}: {
  monthStatesMap: Record<string, MonthlyBudgetHeadState[]>;
  templates: BudgetHeadTemplate[];
}) => {
  const next: Record<string, MonthlyBudgetHeadState[]> = {};
  for (const [monthKey, monthStates] of Object.entries(monthStatesMap)) {
    next[monthKey] = syncMonthStateWithTemplates({ monthKey, monthStates, templates });
  }
  return next;
};

const updateDerivedState = (state: MonthlyBudgetHeadState): MonthlyBudgetHeadState => {
  const availableBalance = state.allocatedAmount - state.spentAmount;
  const unfundedGap = Math.max(0, state.targetAmount - state.allocatedAmount);
  return {
    ...state,
    availableBalance,
    unfundedGap,
    isFullyFunded: unfundedGap === 0,
  };
};

const moveDeletedCategoryBalancesToFreeSpend = ({
  monthStatesMap,
  deletedHeadId,
  disposableId,
}: {
  monthStatesMap: Record<string, MonthlyBudgetHeadState[]>;
  deletedHeadId: string;
  disposableId: string;
}) => {
  const next: Record<string, MonthlyBudgetHeadState[]> = {};
  for (const [monthKey, monthStates] of Object.entries(monthStatesMap)) {
    const deletedIdx = monthStates.findIndex((entry) => entry.budgetHeadTemplateId === deletedHeadId);
    const disposableIdx = monthStates.findIndex((entry) => entry.budgetHeadTemplateId === disposableId);
    if (deletedIdx < 0 || disposableIdx < 0) {
      next[monthKey] = monthStates;
      continue;
    }

    const deletedState = monthStates[deletedIdx];
    const disposableState = monthStates[disposableIdx];
    const updatedDisposable = updateDerivedState({
      ...disposableState,
      allocatedAmount: disposableState.allocatedAmount + deletedState.allocatedAmount,
      spentAmount: disposableState.spentAmount + deletedState.spentAmount,
    });

    const updatedMonth = [...monthStates];
    updatedMonth[disposableIdx] = updatedDisposable;
    next[monthKey] = updatedMonth;
  }
  return next;
};

const recalculateMonthFromEntries = ({
  monthKey,
  templates,
  incomes,
  expenses,
}: {
  monthKey: string;
  templates: BudgetHeadTemplate[];
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
}) => {
  let monthStates = initializeMonthState(monthKey, templates);
  const allocations: AllocationEntry[] = [];

  const orderedIncomes = [...incomes]
    .filter((entry) => entry.monthKey === monthKey)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const income of orderedIncomes) {
    const result =
      income.allocationMode === 'manual' && income.selectedHeadId
        ? applyManualAllocation({
            monthKey,
            incomeEntryId: income.id,
            amount: income.amount,
            selectedHeadId: income.selectedHeadId,
            monthStates,
          })
        : autoAllocateIncome({
            monthKey,
            incomeEntryId: income.id,
            amount: income.amount,
            monthStates,
            templates,
          });
    monthStates = result.updatedStates;
    allocations.push(...result.entries);
  }

  const monthExpenses = expenses.filter((entry) => entry.monthKey === monthKey);
  for (const expense of monthExpenses) {
    monthStates = monthStates.map((head) =>
      head.budgetHeadTemplateId === expense.budgetHeadId
        ? recalculateAfterExpense(head, expense.amount)
        : head
    );
  }

  return { monthStates, allocations };
};

export const useBudgetStore = create<StoreState>()(
  persist(
    (set, get) => ({
      templates: baseTemplates,
      monthStates: { [bootMonth]: initialMonthState },
      incomes: [],
      expenses: [],
      allocations: [],
      settings: defaultSettings,
      selectedMonthKey: bootMonth,

      completeOnboarding: () =>
        set((state) => ({ settings: { ...state.settings, setupComplete: true } })),
      setSelectedMonth: (monthKey) => {
        get().initMonthIfNeeded(monthKey);
        set({ selectedMonthKey: monthKey });
      },
      initMonthIfNeeded: (monthKey) =>
        set((state) => {
          if (state.monthStates[monthKey]) return state;
          return {
            monthStates: {
              ...state.monthStates,
              [monthKey]: initializeMonthState(monthKey, ensureDisposable(state.templates)),
            },
          };
        }),
      addBudgetHead: (head) =>
        (() => {
          let createdId = '';
          set((state) => {
          const now = new Date().toISOString();
          const newHeadId = `h-${Date.now()}`;
          createdId = newHeadId;
          const selectedMonthKey = state.selectedMonthKey;
          const templates = ensureDisposable([
            ...state.templates,
            { ...head, id: newHeadId, createdAt: now, updatedAt: now },
          ]);
          const existingMonth = state.monthStates[selectedMonthKey] ?? [];
          const nextMonthStates = syncMonthStateWithTemplates({
            monthKey: selectedMonthKey,
            monthStates: existingMonth,
            templates,
          });
          return {
            templates,
            monthStates: {
              ...state.monthStates,
              [selectedMonthKey]: nextMonthStates,
            },
          };
          });
          return createdId;
        })(),
      updateBudgetHead: (headId, updates) =>
        set((state) => {
          const templates = ensureDisposable(
            state.templates.map((head) =>
              head.id === headId ? { ...head, ...updates, updatedAt: new Date().toISOString() } : head
            )
          );
          return {
            templates,
            monthStates: syncAllMonthStatesWithTemplates({
              monthStatesMap: state.monthStates,
              templates,
            }),
          };
        }),
      deleteBudgetHead: (headId) =>
        set((state) => {
          const templates = ensureDisposable(state.templates.filter((head) => head.id !== headId));
          const disposableId = templates.find((head) => head.type === 'disposable')?.id;
          const monthStatesMap =
            disposableId && headId !== disposableId
              ? moveDeletedCategoryBalancesToFreeSpend({
                  monthStatesMap: state.monthStates,
                  deletedHeadId: headId,
                  disposableId,
                })
              : state.monthStates;
          return {
            templates,
            monthStates: syncAllMonthStatesWithTemplates({
              monthStatesMap,
              templates,
            }),
          };
        }),
      reorderHeads: (orderedIds) =>
        set((state) => {
          const templates = ensureDisposable(
            state.templates.map((head) => {
              if (head.type === 'disposable') {
                return { ...head, priority: 999 };
              }
              const idx = orderedIds.indexOf(head.id);
              return idx >= 0 ? { ...head, priority: idx + 1 } : head;
            })
          );
          return {
            templates,
            monthStates: syncAllMonthStatesWithTemplates({
              monthStatesMap: state.monthStates,
              templates,
            }),
          };
        }),
      fundCategoryFromFreeSpend: (headId, monthKey) => {
        let fundedAmount = 0;
        set((state) => {
          const monthStates = state.monthStates[monthKey] ?? [];
          if (monthStates.length === 0) return state;
          const disposableTemplate = state.templates.find((head) => head.type === 'disposable');
          if (!disposableTemplate) return state;

          const disposableIdx = monthStates.findIndex(
            (entry) => entry.budgetHeadTemplateId === disposableTemplate.id
          );
          const targetIdx = monthStates.findIndex(
            (entry) => entry.budgetHeadTemplateId === headId
          );
          if (disposableIdx < 0 || targetIdx < 0) return state;

          const disposable = monthStates[disposableIdx];
          const target = monthStates[targetIdx];
          const needed = Math.max(0, target.targetAmount - target.allocatedAmount);
          const movable = Math.max(0, disposable.availableBalance);
          const amount = Math.min(needed, movable);
          if (amount <= 0) return state;

          fundedAmount = amount;
          const next = [...monthStates];
          next[disposableIdx] = updateDerivedState({
            ...disposable,
            allocatedAmount: Math.max(0, disposable.allocatedAmount - amount),
          });
          next[targetIdx] = updateDerivedState({
            ...target,
            allocatedAmount: target.allocatedAmount + amount,
          });

          return {
            monthStates: {
              ...state.monthStates,
              [monthKey]: next,
            },
          };
        });
        return fundedAmount;
      },
      addIncome: (payload) =>
        set((state) => {
          const now = new Date().toISOString();
          const incomeId = `i-${Date.now()}`;
          const templates = ensureDisposable(state.templates);
          const income: IncomeEntry = {
            id: incomeId,
            monthKey: payload.monthKey,
            amount: payload.amount,
            date: payload.date,
            source: payload.source,
            note: payload.note,
            allocationMode: payload.allocationMode,
            selectedHeadId: payload.selectedHeadId,
            createdAt: now,
          };
          const monthStates = syncMonthStateWithTemplates({
            monthKey: payload.monthKey,
            monthStates:
              state.monthStates[payload.monthKey] ??
              initializeMonthState(payload.monthKey, templates),
            templates,
          });
          const allocationResult =
            payload.allocationMode === 'manual' && payload.selectedHeadId
              ? applyManualAllocation({
                  monthKey: payload.monthKey,
                  incomeEntryId: incomeId,
                  amount: payload.amount,
                  selectedHeadId: payload.selectedHeadId,
                  monthStates,
                })
              : autoAllocateIncome({
                  monthKey: payload.monthKey,
                  incomeEntryId: incomeId,
                  amount: payload.amount,
                  monthStates,
                  templates,
                });

          return {
            templates,
            incomes: [income, ...state.incomes],
            allocations: [...allocationResult.entries, ...state.allocations],
            monthStates: {
              ...state.monthStates,
              [payload.monthKey]: allocationResult.updatedStates,
            },
          };
        }),
      addExpense: (payload) =>
        set((state) => {
          const id = `e-${Date.now()}`;
          const entry: ExpenseEntry = { ...payload, id, createdAt: new Date().toISOString() };
          const monthStates = syncMonthStateWithTemplates({
            monthKey: payload.monthKey,
            monthStates:
              state.monthStates[payload.monthKey] ??
              initializeMonthState(payload.monthKey, state.templates),
            templates: state.templates,
          });
          const nextStates = monthStates.map((head) =>
            head.budgetHeadTemplateId === payload.budgetHeadId
              ? recalculateAfterExpense(head, payload.amount)
              : head
          );
          return {
            expenses: [entry, ...state.expenses],
            monthStates: { ...state.monthStates, [payload.monthKey]: nextStates },
          };
        }),
      updateIncome: (incomeId, payload) =>
        set((state) => {
          const existing = state.incomes.find((income) => income.id === incomeId);
          if (!existing) return state;
          const updatedIncomes = state.incomes.map((income) =>
            income.id === incomeId
              ? {
                  ...income,
                  amount: payload.amount,
                  date: payload.date,
                  source: payload.source,
                  note: payload.note,
                  allocationMode: payload.allocationMode,
                  selectedHeadId: payload.selectedHeadId,
                }
              : income
          );
          const monthKey = existing.monthKey;
          const recalculated = recalculateMonthFromEntries({
            monthKey,
            templates: state.templates,
            incomes: updatedIncomes,
            expenses: state.expenses,
          });

          return {
            incomes: updatedIncomes,
            allocations: [
              ...state.allocations.filter((entry) => entry.monthKey !== monthKey),
              ...recalculated.allocations,
            ],
            monthStates: {
              ...state.monthStates,
              [monthKey]: recalculated.monthStates,
            },
          };
        }),
      updateExpense: (expenseId, payload) =>
        set((state) => {
          const existing = state.expenses.find((expense) => expense.id === expenseId);
          if (!existing) return state;
          const updatedExpenses = state.expenses.map((expense) =>
            expense.id === expenseId
              ? {
                  ...expense,
                  amount: payload.amount,
                  date: payload.date,
                  budgetHeadId: payload.budgetHeadId,
                  description: payload.description,
                  paymentMethod: payload.paymentMethod,
                  note: payload.note,
                }
              : expense
          );
          const monthKey = existing.monthKey;
          const recalculated = recalculateMonthFromEntries({
            monthKey,
            templates: state.templates,
            incomes: state.incomes,
            expenses: updatedExpenses,
          });

          return {
            expenses: updatedExpenses,
            allocations: [
              ...state.allocations.filter((entry) => entry.monthKey !== monthKey),
              ...recalculated.allocations,
            ],
            monthStates: {
              ...state.monthStates,
              [monthKey]: recalculated.monthStates,
            },
          };
        }),
      setCurrency: (currency) => set((state) => ({ settings: { ...state.settings, currency } })),
      setThemeMode: (mode) => set((state) => ({ settings: { ...state.settings, themeMode: mode } })),
      resetData: () =>
        set((state) => ({
          templates: ensureDisposable(DEFAULT_HEADS.filter((head) => head.type === 'disposable')),
          monthStates: { [bootMonth]: initializeMonthState(bootMonth, ensureDisposable(DEFAULT_HEADS.filter((head) => head.type === 'disposable'))) },
          incomes: [],
          expenses: [],
          allocations: [],
          selectedMonthKey: bootMonth,
          settings: state.settings,
        })),
      exportData: () =>
        JSON.stringify(
          {
            templates: get().templates,
            monthStates: get().monthStates,
            incomes: get().incomes,
            expenses: get().expenses,
            allocations: get().allocations,
            settings: get().settings,
          },
          null,
          2
        ),
      getMonthSummary: (monthKey) => {
        const state = get();
        const monthHeads = state.monthStates[monthKey] ?? [];
        const activeTemplates = state.templates.filter((head) => head.isActive);
        const activeTemplateMap = new Map(activeTemplates.map((head) => [head.id, head]));
        const activeMonthHeads = monthHeads.filter((head) =>
          activeTemplateMap.has(head.budgetHeadTemplateId)
        );
        const nonDisposableHeads = activeMonthHeads.filter((head) => {
          const template = activeTemplateMap.get(head.budgetHeadTemplateId);
          return template?.type !== 'disposable';
        });
        const totalIncome = state.incomes
          .filter((income) => income.monthKey === monthKey)
          .reduce((sum, income) => sum + income.amount, 0);
        const totalAllocated = activeMonthHeads.reduce(
          (sum, head) => sum + head.allocatedAmount,
          0
        );
        const totalSpent = activeMonthHeads.reduce((sum, head) => sum + head.spentAmount, 0);
        const totalBudgetTarget = nonDisposableHeads.reduce(
          (sum, head) => sum + head.targetAmount,
          0
        );
        const totalUnfundedGap = nonDisposableHeads.reduce(
          (sum, head) => sum + head.unfundedGap,
          0
        );
        const disposable = state.templates.find((head) => head.type === 'disposable');
        const disposableState = disposable
          ? activeMonthHeads.find((head) => head.budgetHeadTemplateId === disposable.id)
          : undefined;
        return {
          monthKey,
          totalIncome,
          totalAllocated,
          totalSpent,
          totalBudgetTarget,
          totalUnfundedGap,
          disposableBalance: disposableState?.availableBalance ?? 0,
        };
      },
    }),
    {
      name: 'money-map-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
