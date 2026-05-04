import { render, screen } from '@testing-library/react-native';

import { StatusBadge } from '@/src/components/StatusBadge';

describe('StatusBadge', () => {
  it.each(['good', 'warn', 'bad', 'info'] as const)('renders tone %s', (tone) => {
    render(<StatusBadge text="Label" tone={tone} />);
    expect(screen.getByText('Label')).toBeTruthy();
  });
});
