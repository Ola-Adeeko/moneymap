import { render, screen } from '@testing-library/react-native';

import { SectionTitle } from '@/src/components/SectionTitle';

describe('SectionTitle', () => {
  it('renders children', () => {
    render(<SectionTitle>Spending Categories</SectionTitle>);
    expect(screen.getByText('Spending Categories')).toBeTruthy();
  });
});
