import { router } from 'expo-router';
import {
  Banknote,
  ChartLine,
  Compass,
  HandCoins,
  LayoutList,
  Settings,
  Wallet,
} from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';
import { useBudgetStore } from '@/src/store/use-budget-store';

type StepIconProps = { size?: number; color?: string; strokeWidth?: number };

type Step = {
  key: string;
  title: string;
  body: string;
  bullets?: string[];
  Icon: ComponentType<StepIconProps>;
};

const STEPS: Step[] = [
  {
    key: 'welcome',
    title: 'Welcome to Money Map',
    Icon: Compass,
    body: 'Plan income into budget heads before you spend. You always see what is funded, what is left, and where money went.',
  },
  {
    key: 'heads',
    title: 'Budget heads & order',
    Icon: LayoutList,
    body: 'Each head is a category with a monthly target. On Budget Setup you can add heads, set targets, and use Up to set funding priority (lower number = funded first in auto mode).',
    bullets: ['Disposable is always last in the list—it catches leftover income after other heads are funded.'],
  },
  {
    key: 'home',
    title: 'Home dashboard',
    Icon: Wallet,
    body: 'The Home tab shows the selected month, totals, and each head’s progress. Tap a head for detail. Use the month arrows to review past or future months.',
  },
  {
    key: 'income',
    title: 'Income & allocation',
    Icon: Banknote,
    body: 'Add income from the Incomes tab or quick actions. Auto allocate fills heads in priority order until targets are met, then sends the rest to Disposable.',
    bullets: ['Manual mode sends the full amount to one head you pick—useful for side income or topping up a single category.'],
  },
  {
    key: 'expenses',
    title: 'Expenses',
    Icon: HandCoins,
    body: 'Log spending under the right head on the Expenses tab so balances and “available” stay accurate.',
  },
  {
    key: 'rest',
    title: 'Insights & settings',
    Icon: ChartLine,
    body: 'Insights summarizes the month and year. Settings holds currency, theme, and data tools.',
    bullets: ['Bottom tabs: Home, Incomes, Expenses, Insights, Settings.'],
  },
];

export default function OnboardingScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const completeOnboarding = useBudgetStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const StepIcon = current.Icon;

  const goNext = useCallback(() => {
    if (isLast) {
      completeOnboarding();
      router.replace('/budget-setup');
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }, [completeOnboarding, isLast]);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  return (
    <View style={[styles.page, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
      <Text style={styles.brand}>Money Map</Text>
      <Text style={styles.stepMeta}>
        Step {step + 1} of {STEPS.length}
      </Text>

      <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainScrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <StepIcon size={28} color={colors.primary} strokeWidth={2.2} />
          </View>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.body}>{current.body}</Text>
          {current.bullets?.map((line) => (
            <View key={line} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{line}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.dots}>
        {STEPS.map((s, i) => (
          <Pressable key={s.key} onPress={() => setStep(i)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Go to step ${i + 1}`}>
            <View style={[styles.dot, i === step && styles.dotActive]} />
          </Pressable>
        ))}
      </View>

      <View style={styles.navRow}>
        <Pressable
          onPress={goBack}
          disabled={step === 0}
          style={[styles.secondaryBtn, step === 0 && styles.secondaryBtnDisabled]}
          accessibilityRole="button">
          <Text style={[styles.secondaryText, step === 0 && styles.secondaryTextDisabled]}>Back</Text>
        </Pressable>
        <Pressable style={styles.primaryBtn} onPress={goNext} accessibilityRole="button">
          <Text style={styles.primaryText}>{isLast ? 'Start budget setup' : 'Next'}</Text>
        </Pressable>
      </View>

      <View style={styles.hintRow}>
        <Settings size={14} color={colors.subtext} strokeWidth={2} />
        <Text style={styles.hint}>Use Next and Back to move through this guide. You can jump with the dots above.</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
    brand: { fontSize: 26, fontWeight: '800', color: colors.text },
    stepMeta: { marginTop: 4, marginBottom: 12, color: colors.subtext, fontWeight: '600', fontSize: 13 },
    mainScroll: { flexGrow: 0 },
    mainScrollContent: { flexGrow: 1 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
      minHeight: 260,
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: 14,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: { fontSize: 20, fontWeight: '800', color: colors.text },
    body: { color: colors.subtext, lineHeight: 22, fontSize: 15 },
    bulletRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
    bulletDot: { color: colors.primary, fontWeight: '800', marginTop: 2 },
    bulletText: { flex: 1, color: colors.subtext, lineHeight: 20, fontSize: 14 },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 14 },
    dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: colors.border },
    dotActive: { backgroundColor: colors.primary, width: 22 },
    navRow: { flexDirection: 'row', gap: 12 },
    secondaryBtn: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    secondaryBtnDisabled: { opacity: 0.45 },
    secondaryText: { color: colors.text, fontWeight: '700' },
    secondaryTextDisabled: { color: colors.subtext },
    primaryBtn: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: colors.primary,
    },
    primaryText: { color: '#fff', fontWeight: '800' },
    hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingHorizontal: 4 },
    hint: { flex: 1, color: colors.subtext, fontSize: 12, lineHeight: 18 },
  });
