import type { BudgetHeadTemplate, MonthlyBudgetHeadState } from '@/src/types/models';
import {
  applyManualAllocation,
  autoAllocateIncome,
  initializeMonthState,
  recalculateAfterExpense,
} from '@/src/utils/allocation';

const iso = '2026-01-01T00:00:00.000Z';

const template = (
  p: Partial<BudgetHeadTemplate> & Pick<BudgetHeadTemplate, 'id' | 'priority' | 'type'>
): BudgetHeadTemplate => ({
  name: p.name ?? p.id,
  icon: '',
  monthlyTarget: 100,
  isActive: true,
  createdAt: iso,
  updatedAt: iso,
  ...p,
});

describe('initializeMonthState', () => {
  it('orders heads by priority and includes disposable last', () => {
    const templates: BudgetHeadTemplate[] = [
      template({ id: 'd', priority: 999, type: 'disposable', monthlyTarget: 0 }),
      template({ id: 'a', priority: 2, type: 'essential' }),
      template({ id: 'b', priority: 1, type: 'essential' }),
    ];
    const states = initializeMonthState('2026-01', templates);
    expect(states.map((s) => s.budgetHeadTemplateId)).toEqual(['b', 'a', 'd']);
  });
});

describe('autoAllocateIncome', () => {
  it('fills lower priority targets first then disposable', () => {
    const templates: BudgetHeadTemplate[] = [
      template({ id: 'first', priority: 1, type: 'essential', monthlyTarget: 60 }),
      template({ id: 'second', priority: 2, type: 'essential', monthlyTarget: 40 }),
      template({ id: 'disp', priority: 999, type: 'disposable', monthlyTarget: 0 }),
    ];
    let states = initializeMonthState('2026-01', templates);
    const res = autoAllocateIncome({
      monthKey: '2026-01',
      incomeEntryId: 'inc-1',
      amount: 100,
      monthStates: states,
      templates,
    });
    states = res.updatedStates;
    const byId = Object.fromEntries(states.map((s) => [s.budgetHeadTemplateId, s]));
    expect(byId.first.allocatedAmount).toBe(60);
    expect(byId.second.allocatedAmount).toBe(40);
    expect(byId.disp.allocatedAmount).toBe(0);
    expect(res.unallocatedAmount).toBe(0);
  });

  it('sends overflow to disposable', () => {
    const templates: BudgetHeadTemplate[] = [
      template({ id: 'rent', priority: 1, type: 'essential', monthlyTarget: 50 }),
      template({ id: 'disp', priority: 999, type: 'disposable', monthlyTarget: 0 }),
    ];
    const states = initializeMonthState('2026-01', templates);
    const res = autoAllocateIncome({
      monthKey: '2026-01',
      incomeEntryId: 'inc-2',
      amount: 80,
      monthStates: states,
      templates,
    });
    const disp = res.updatedStates.find((s) => s.budgetHeadTemplateId === 'disp');
    expect(disp?.allocatedAmount).toBe(30);
  });
});

describe('applyManualAllocation', () => {
  it('adds full amount to selected head', () => {
    const templates: BudgetHeadTemplate[] = [
      template({ id: 'x', priority: 1, type: 'essential', monthlyTarget: 200 }),
    ];
    const monthStates = initializeMonthState('2026-01', templates);
    const res = applyManualAllocation({
      monthKey: '2026-01',
      incomeEntryId: 'i1',
      amount: 25,
      selectedHeadId: 'x',
      monthStates,
    });
    expect(res.entries).toHaveLength(1);
    expect(res.entries[0].allocationType).toBe('manual');
    expect(res.updatedStates[0].allocatedAmount).toBe(25);
  });

  it('returns empty entries when head missing', () => {
    const res = applyManualAllocation({
      monthKey: '2026-01',
      incomeEntryId: 'i1',
      amount: 25,
      selectedHeadId: 'missing',
      monthStates: [] as MonthlyBudgetHeadState[],
    });
    expect(res.entries).toHaveLength(0);
  });
});

describe('recalculateAfterExpense', () => {
  it('increases spent and updates derived fields', () => {
    const base: MonthlyBudgetHeadState = {
      id: 'm-x',
      monthKey: '2026-01',
      budgetHeadTemplateId: 'x',
      targetAmount: 100,
      allocatedAmount: 100,
      spentAmount: 10,
      isFullyFunded: true,
      availableBalance: 90,
      unfundedGap: 0,
    };
    const next = recalculateAfterExpense(base, 20);
    expect(next.spentAmount).toBe(30);
    expect(next.availableBalance).toBe(70);
  });
});
