import { BudgetHeadTemplate, ExpenseEntry, IncomeEntry } from '@/src/types/models';
import { currentMonthKey } from '@/src/utils/month';

const now = new Date().toISOString();
const monthKey = currentMonthKey();

export const DEFAULT_HEADS: BudgetHeadTemplate[] = [
  { id: 'h-rent', name: 'Rent', icon: '🏠', monthlyTarget: 100000, priority: 1, type: 'essential', isActive: true, createdAt: now, updatedAt: now },
  { id: 'h-data', name: 'Data', icon: '📶', monthlyTarget: 40000, priority: 2, type: 'essential', isActive: true, createdAt: now, updatedAt: now },
  { id: 'h-subs', name: 'Subscriptions', icon: '🎬', monthlyTarget: 30000, priority: 3, type: 'lifestyle', isActive: true, createdAt: now, updatedAt: now },
  { id: 'h-prov', name: 'Provisions', icon: '🛒', monthlyTarget: 50000, priority: 4, type: 'essential', isActive: true, createdAt: now, updatedAt: now },
  { id: 'h-transport', name: 'Transport', icon: '🚌', monthlyTarget: 50000, priority: 5, type: 'essential', isActive: true, createdAt: now, updatedAt: now },
  { id: 'h-savings', name: 'Savings', icon: '💰', monthlyTarget: 50000, priority: 6, type: 'savings', isActive: true, createdAt: now, updatedAt: now },
  { id: 'h-invest', name: 'Investment', icon: '📈', monthlyTarget: 50000, priority: 7, type: 'investment', isActive: true, createdAt: now, updatedAt: now },
  { id: 'h-disposable', name: 'Disposable', icon: '🧃', monthlyTarget: 0, priority: 999, type: 'disposable', isActive: true, createdAt: now, updatedAt: now },
];

export const MOCK_INCOMES: IncomeEntry[] = [
  { id: 'i-seed-1', monthKey, amount: 200000, date: now, source: 'Salary', note: 'Monthly salary', allocationMode: 'auto', createdAt: now },
];

export const MOCK_EXPENSES: ExpenseEntry[] = [
  { id: 'e-seed-1', monthKey, amount: 15000, date: now, budgetHeadId: 'h-data', description: 'Data subscription', paymentMethod: 'Card', note: '', createdAt: now },
];
