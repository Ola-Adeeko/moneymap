import { render, screen } from '@testing-library/react-native';

import { TransactionListItem } from '@/src/components/TransactionListItem';

jest.mock('@/src/store/use-budget-store', () => ({
  useBudgetStore: (fn: (s: { settings: { currency: string } }) => unknown) =>
    fn({ settings: { currency: 'NGN' } }),
}));

describe('TransactionListItem', () => {
  it('renders title and subtitle', () => {
    render(
      <TransactionListItem title="Coffee" subtitle="Food • Card" amount={500} isNegative />
    );
    expect(screen.getByText('Coffee')).toBeTruthy();
    expect(screen.getByText('Food • Card')).toBeTruthy();
  });
});
