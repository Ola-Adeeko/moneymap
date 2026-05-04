import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_HEADS, MOCK_EXPENSES, MOCK_INCOMES } from '@/src/data/seed';
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
  addBudgetHead: (head: Omit<BudgetHeadTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBudgetHead: (headId: string, updates: Partial<BudgetHeadTemplate>) => void;
  deleteBudgetHead: (headId: string) => void;
  reorderHeads: (orderedIds: string[]) => void;
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
    name: 'Disposable',
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
const baseTemplates = ensureDisposable(DEFAULT_HEADS);
const initialMonthState = initializeMonthState(bootMonth, baseTemplates);
const initialAllocations = autoAllocateIncome({
  monthKey: bootMonth,
  incomeEntryId: MOCK_INCOMES[0].id,
  amount: MOCK_INCOMES[0].amount,
  monthStates: initialMonthState,
  templates: baseTemplates,
});
const monthAfterExpense = initialAllocations.updatedStates.map((head) => {
  const matching = MOCK_EXPENSES.filter((expense) => expense.budgetHeadId === head.budgetHeadTemplateId);
  return matching.reduce((acc, expense) => recalculateAfterExpense(acc, expense.amount), head);
});

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
      (template) =>
        byTemplateId.get(template.id) ?? {
          id: `${monthKey}-${template.id}`,
          monthKey,
          budgetHeadTemplateId: template.id,
          targetAmount: template.monthlyTarget,
          allocatedAmount: 0,
          spentAmount: 0,
          isFullyFunded: template.monthlyTarget === 0,
          availableBalance: 0,
          unfundedGap: template.monthlyTarget,
        }
    );
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
      monthStates: { [bootMonth]: monthAfterExpense },
      incomes: MOCK_INCOMES,
      expenses: MOCK_EXPENSES,
      allocations: initialAllocations.entries,
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
        set((state) => {
          const now = new Date().toISOString();
          const newHeadId = `h-${Date.now()}`;
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
        }),
      updateBudgetHead: (headId, updates) =>
        set((state) => ({
          templates: ensureDisposable(
            state.templates.map((head) =>
              head.id === headId ? { ...head, ...updates, updatedAt: new Date().toISOString() } : head
            )
          ),
        })),
      deleteBudgetHead: (headId) =>
        set((state) => ({
          templates: ensureDisposable(state.templates.filter((head) => head.id !== headId)),
        })),
      reorderHeads: (orderedIds) =>
        set((state) => ({
          templates: ensureDisposable(
            state.templates.map((head) => {
              if (head.type === 'disposable') {
                return { ...head, priority: 999 };
              }
              const idx = orderedIds.indexOf(head.id);
              return idx >= 0 ? { ...head, priority: idx + 1 } : head;
            })
          ),
        })),
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
          templates: [],
          monthStates: {},
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
