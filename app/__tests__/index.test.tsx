import { render, screen } from '@testing-library/react-native';
import Index from '@/app/index';

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  return {
    Redirect: ({ href }: { href: string }) => <Text testID="redirect-href">{href}</Text>,
  };
});

const mockSetupComplete = { value: false };

jest.mock('@/src/store/use-budget-store', () => ({
  useBudgetStore: (fn: (s: { settings: { setupComplete: boolean } }) => unknown) =>
    fn({ settings: { setupComplete: mockSetupComplete.value } }),
}));

describe('app/index', () => {
  it('redirects to onboarding when setup is incomplete', () => {
    mockSetupComplete.value = false;
    render(<Index />);
    expect(screen.getByTestId('redirect-href').props.children).toBe('/onboarding');
  });

  it('redirects to tabs when setup is complete', () => {
    mockSetupComplete.value = true;
    render(<Index />);
    expect(screen.getByTestId('redirect-href').props.children).toBe('/(tabs)');
  });
});
