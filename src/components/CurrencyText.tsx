import { Text, TextProps } from 'react-native';

import { useBudgetStore } from '@/src/store/use-budget-store';
import { formatCurrency } from '@/src/utils/currency';

export function CurrencyText({ amount, ...props }: TextProps & { amount: number }) {
  const currency = useBudgetStore((state) => state.settings.currency);
  return <Text {...props}>{formatCurrency(amount, currency)}</Text>;
}
