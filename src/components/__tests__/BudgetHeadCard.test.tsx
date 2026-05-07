import { fireEvent, render, screen } from '@testing-library/react-native';

import { BudgetHeadCard } from '@/src/components/BudgetHeadCard';
import type { MonthlyBudgetHeadState } from '@/src/types/models';

jest.mock('@/src/store/use-budget-store', () => ({
  useBudgetStore: (fn: (s: { settings: { currency: string } }) => unknown) =>
    fn({ settings: { currency: 'NGN' } }),
}));

const baseState: MonthlyBudgetHeadState = {
  id: 'm-1',
  monthKey: '2026-01',
  budgetHeadTemplateId: 'h1',
  targetAmount: 100,
  allocatedAmount: 80,
  spentAmount: 20,
  isFullyFunded: false,
  availableBalance: 60,
  unfundedGap: 20,
};

describe('BudgetHeadCard', () => {
  it('renders name and status', () => {
    render(<BudgetHeadCard name="Rent" state={baseState} />);
    expect(screen.getByText('Rent')).toBeTruthy();
    expect(screen.getByText('Partially Funded')).toBeTruthy();
  });

  it('invokes onPress when pressed', () => {
    const onPress = jest.fn();
    render(<BudgetHeadCard name="Food" state={baseState} onPress={onPress} />);
    fireEvent.press(screen.getByText('Food'));
    expect(onPress).toHaveBeenCalled();
  });
});
