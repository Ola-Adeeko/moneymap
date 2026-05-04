import { render, screen } from '@testing-library/react-native';

import { AmountInput } from '@/src/components/AmountInput';

describe('AmountInput', () => {
  it('defaults label to Amount', () => {
    render(<AmountInput value="" onChangeText={() => {}} />);
    expect(screen.getByText('Amount')).toBeTruthy();
  });

  it('accepts custom label', () => {
    render(<AmountInput label="Target" value="" onChangeText={() => {}} />);
    expect(screen.getByText('Target')).toBeTruthy();
  });
});
