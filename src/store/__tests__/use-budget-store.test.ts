import { useBudgetStore } from '@/src/store/use-budget-store';
import { currentMonthKey } from '@/src/utils/month';

const monthKey = currentMonthKey();

const baseHeadPayload = {
  icon: '',
  priority: 1,
  type: 'essential' as const,
  isActive: true,
};

describe('useBudgetStore sync flows', () => {
  beforeEach(() => {
    const state = useBudgetStore.getState();
    state.resetData();
    state.setSelectedMonth(monthKey);
  });

  it('syncs summary when categories are added and removed', () => {
    const state = useBudgetStore.getState();

    state.addBudgetHead({
      ...baseHeadPayload,
      name: 'Rent',
      monthlyTarget: 100000,
    });

    let summary = useBudgetStore.getState().getMonthSummary(monthKey);
    expect(summary.totalBudgetTarget).toBe(100000);

    const rent = useBudgetStore.getState().templates.find((head) => head.name === 'Rent');
    expect(rent).toBeTruthy();

    useBudgetStore.getState().deleteBudgetHead(rent!.id);
    summary = useBudgetStore.getState().getMonthSummary(monthKey);
    expect(summary.totalBudgetTarget).toBe(0);
  });

  it('syncs totals and allocations when income is added and edited', () => {
    const state = useBudgetStore.getState();
    state.addBudgetHead({
      ...baseHeadPayload,
      name: 'Food',
      monthlyTarget: 50000,
    });

    state.addIncome({
      monthKey,
      amount: 50000,
      date: new Date().toISOString(),
      source: 'Salary',
      allocationMode: 'auto',
    });

    let summary = useBudgetStore.getState().getMonthSummary(monthKey);
    expect(summary.totalIncome).toBe(50000);

    const income = useBudgetStore.getState().incomes[0];
    expect(income).toBeTruthy();

    useBudgetStore.getState().updateIncome(income.id, {
      amount: 30000,
      date: income.date,
      source: 'Salary',
      allocationMode: 'auto',
    });

    summary = useBudgetStore.getState().getMonthSummary(monthKey);
    expect(summary.totalIncome).toBe(30000);

    const allocSum = useBudgetStore
      .getState()
      .allocations.filter((entry) => entry.incomeEntryId === income.id)
      .reduce((sum, entry) => sum + entry.allocatedAmount, 0);
    expect(allocSum).toBe(30000);
  });

  it('syncs totals when expense is added and edited', () => {
    const state = useBudgetStore.getState();
    state.addBudgetHead({
      ...baseHeadPayload,
      name: 'Transport',
      monthlyTarget: 40000,
    });
    const transport = useBudgetStore.getState().templates.find((head) => head.name === 'Transport');
    expect(transport).toBeTruthy();

    state.addIncome({
      monthKey,
      amount: 40000,
      date: new Date().toISOString(),
      source: 'Salary',
      allocationMode: 'auto',
    });

    state.addExpense({
      monthKey,
      amount: 5000,
      date: new Date().toISOString(),
      budgetHeadId: transport!.id,
      description: 'Taxi',
      paymentMethod: 'Card',
    });

    let summary = useBudgetStore.getState().getMonthSummary(monthKey);
    expect(summary.totalSpent).toBe(5000);

    const expense = useBudgetStore.getState().expenses[0];
    useBudgetStore.getState().updateExpense(expense.id, {
      amount: 12000,
      date: expense.date,
      budgetHeadId: transport!.id,
      description: expense.description,
      paymentMethod: expense.paymentMethod,
    });

    summary = useBudgetStore.getState().getMonthSummary(monthKey);
    expect(summary.totalSpent).toBe(12000);
  });
});
