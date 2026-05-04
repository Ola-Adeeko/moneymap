import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { AppHeader } from '@/src/components/AppHeader';

describe('AppHeader', () => {
  it('renders title', () => {
    render(<AppHeader title="Money Map" />);
    expect(screen.getByText('Money Map')).toBeTruthy();
  });

  it('renders optional right slot', () => {
    render(
      <AppHeader
        title="Home"
        right={<Text testID="right-slot">Extra</Text>}
      />
    );
    expect(screen.getByTestId('right-slot')).toBeTruthy();
  });
});
