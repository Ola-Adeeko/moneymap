import { Redirect } from 'expo-router';
import { useBudgetStore } from '@/src/store/use-budget-store';

export default function Index() {
  const setupComplete = useBudgetStore((state) => state.settings.setupComplete);
  return <Redirect href={setupComplete ? '/(tabs)' : '/onboarding'} />;
}
