import type { BudgetHeadTemplate, MonthlyBudgetHeadState } from '@/src/types/models';
import {
  compareBudgetHeadPriority,
  sortMonthStatesBySetupOrder,
  sortTemplatesBySetupOrder,
} from '@/src/utils/budgetHeadOrder';

const head = (overrides: Partial<BudgetHeadTemplate> & Pick<BudgetHeadTemplate, 'id' | 'priority'>): BudgetHeadTemplate => ({
  name: 'H',
  icon: '',
  monthlyTarget: 0,
  type: 'essential',
  isActive: true,
  createdAt: 'c',
  updatedAt: 'u',
  ...overrides,
});

describe('compareBudgetHeadPriority', () => {
  it('orders lower priority number first', () => {
    expect(compareBudgetHeadPriority({ priority: 1 }, { priority: 3 })).toBeLessThan(0);
    expect(compareBudgetHeadPriority({ priority: 9 }, { priority: 2 })).toBeGreaterThan(0);
  });
});

describe('sortTemplatesBySetupOrder', () => {
  it('sorts by ascending priority', () => {
    const sorted = sortTemplatesBySetupOrder([
      head({ id: 'b', priority: 2 }),
      head({ id: 'a', priority: 1 }),
      head({ id: 'c', priority: 999, type: 'disposable' }),
    ]);
    expect(sorted.map((h) => h.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('sortMonthStatesBySetupOrder', () => {
  it('orders states by template priority', () => {
    const templates: BudgetHeadTemplate[] = [
      head({ id: 'food', priority: 2 }),
      head({ id: 'rent', priority: 1 }),
      head({ id: 'disp', priority: 999, type: 'disposable' }),
    ];
    const states: MonthlyBudgetHeadState[] = [
      mockState('food'),
      mockState('disp'),
      mockState('rent'),
    ];
    const ordered = sortMonthStatesBySetupOrder(states, templates);
    expect(ordered.map((s) => s.budgetHeadTemplateId)).toEqual(['rent', 'food', 'disp']);
  });

  it('sends unknown template ids to the end', () => {
    const templates = [head({ id: 'a', priority: 1 })];
    const states = [mockState('ghost'), mockState('a')];
    const ordered = sortMonthStatesBySetupOrder(states, templates);
    expect(ordered.map((s) => s.budgetHeadTemplateId)).toEqual(['a', 'ghost']);
  });
});

function mockState(templateId: string): MonthlyBudgetHeadState {
  return {
    id: `m-${templateId}`,
    monthKey: '2026-01',
    budgetHeadTemplateId: templateId,
    targetAmount: 100,
    allocatedAmount: 0,
    spentAmount: 0,
    isFullyFunded: false,
    availableBalance: 0,
    unfundedGap: 100,
  };
}
