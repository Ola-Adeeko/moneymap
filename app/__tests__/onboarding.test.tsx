import { router } from 'expo-router';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Metrics } from 'react-native-safe-area-context';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import OnboardingScreen from '@/app/onboarding';

const mockCompleteOnboarding = jest.fn();

jest.mock('@/src/store/use-budget-store', () => ({
  useBudgetStore: (selector: (s: { completeOnboarding: () => void }) => unknown) =>
    selector({
      completeOnboarding: mockCompleteOnboarding,
    }),
}));

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <OnboardingScreen />
    </SafeAreaProvider>
  );
}

describe('OnboardingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows first step and advances with dot navigation', () => {
    renderScreen();
    expect(screen.getByText('Welcome to Money Map')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Go to step 2'));
    expect(screen.getByText('Set income and categories')).toBeTruthy();
  });

  it('completes flow on final CTA', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Go to step 4'));
    expect(screen.getByText('Start budget setup')).toBeTruthy();
    fireEvent.press(screen.getByText('Start budget setup'));
    expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/budget-setup');
  });

  it('starts on first step', () => {
    renderScreen();
    expect(screen.getAllByText('Step 1 of 4').length).toBeGreaterThan(0);
  });
});
