import { render, screen } from '@testing-library/react-native';

import { CurrencyText } from '@/src/components/CurrencyText';

jest.mock('@/src/store/use-budget-store', () => ({
  useBudgetStore: (fn: (s: { settings: { currency: string } }) => unknown) =>
    fn({ settings: { currency: 'NGN' } }),
}));

describe('CurrencyText', () => {
  it('renders formatted currency', () => {
    render(<CurrencyText amount={5000} />);
    expect(screen.getByText(/5/)).toBeTruthy();
  });
});
