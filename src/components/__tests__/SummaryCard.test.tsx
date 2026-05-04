import { render, screen } from '@testing-library/react-native';

import { SummaryCard } from '@/src/components/SummaryCard';

describe('SummaryCard', () => {
  it('renders label and value', () => {
    render(<SummaryCard label="Total" value="1,000" />);
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText('1,000')).toBeTruthy();
  });
});
