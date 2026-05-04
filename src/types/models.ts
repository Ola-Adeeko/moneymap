export type BudgetHeadType = 'essential' | 'lifestyle' | 'savings' | 'investment' | 'disposable';
export type AllocationMode = 'auto' | 'manual';
export type AllocationType = 'auto' | 'manual' | 'disposable';

export interface BudgetHeadTemplate {
  id: string;
  name: string;
  icon: string;
  monthlyTarget: number;
  priority: number;
  type: BudgetHeadType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyBudgetHeadState {
  id: string;
  monthKey: string;
  budgetHeadTemplateId: string;
  targetAmount: number;
  allocatedAmount: number;
  spentAmount: number;
  carryOverAmount?: number;
  isFullyFunded: boolean;
  availableBalance: number;
  unfundedGap: number;
}

export interface IncomeEntry {
  id: string;
  monthKey: string;
  amount: number;
  date: string;
  source: string;
  note?: string;
  allocationMode: AllocationMode;
  selectedHeadId?: string;
  createdAt: string;
}

export interface ExpenseEntry {
  id: string;
  monthKey: string;
  amount: number;
  date: string;
  budgetHeadId: string;
  description: string;
  paymentMethod: string;
  note?: string;
  createdAt: string;
}

export interface AllocationEntry {
  id: string;
  incomeEntryId: string;
  monthKey: string;
  budgetHeadId: string;
  allocatedAmount: number;
  allocationType: AllocationType;
  createdAt: string;
}

export interface MonthlySummary {
  monthKey: string;
  totalIncome: number;
  totalAllocated: number;
  totalSpent: number;
  totalBudgetTarget: number;
  totalUnfundedGap: number;
  disposableBalance: number;
}

export interface AppSettings {
  currency: string;
  defaultMonthBehavior: 'current' | 'remember-last';
  notificationsEnabled: boolean;
  themeMode: 'system' | 'light' | 'dark';
  setupComplete: boolean;
}
