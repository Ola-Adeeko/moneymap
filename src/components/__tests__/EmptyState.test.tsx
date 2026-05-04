import { render, screen } from '@testing-library/react-native';

import { EmptyState } from '@/src/components/EmptyState';

describe('EmptyState', () => {
  it('renders title and subtitle', () => {
    render(<EmptyState title="Nothing here" subtitle="Add something to begin." />);
    expect(screen.getByText('Nothing here')).toBeTruthy();
    expect(screen.getByText('Add something to begin.')).toBeTruthy();
  });
});
