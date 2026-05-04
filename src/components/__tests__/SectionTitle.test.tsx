import { render, screen } from '@testing-library/react-native';

import { SectionTitle } from '@/src/components/SectionTitle';

describe('SectionTitle', () => {
  it('renders children', () => {
    render(<SectionTitle>Budget Heads</SectionTitle>);
    expect(screen.getByText('Budget Heads')).toBeTruthy();
  });
});
