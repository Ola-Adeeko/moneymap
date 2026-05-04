import type { BudgetHeadTemplate, MonthlyBudgetHeadState } from '@/src/types/models';

export const compareBudgetHeadPriority = (
  a: Pick<BudgetHeadTemplate, 'priority'>,
  b: Pick<BudgetHeadTemplate, 'priority'>
) => a.priority - b.priority;

/** Same order as Budget Setup (priority ascending; disposable last at 999). */
export const sortTemplatesBySetupOrder = (templates: BudgetHeadTemplate[]) =>
  [...templates].sort(compareBudgetHeadPriority);

export const sortMonthStatesBySetupOrder = (
  states: MonthlyBudgetHeadState[],
  templates: BudgetHeadTemplate[]
) => {
  const priorityById = new Map(templates.map((t) => [t.id, t.priority]));
  return [...states].sort((a, b) => {
    const pa = priorityById.get(a.budgetHeadTemplateId);
    const pb = priorityById.get(b.budgetHeadTemplateId);
    return (pa ?? 9999) - (pb ?? 9999);
  });
};
