import { router } from 'expo-router';
import {
  ChartLine,
  Compass,
  LayoutList,
  Settings,
  Wallet
} from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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
    body: 'See where your money goes each month in a simple plan.',
  },
  {
    key: 'heads-and-income',
    title: 'Set income and categories',
    Icon: LayoutList,
    body: 'Add your monthly income, then create spending categories like Rent, Food, and Transport.',
    bullets: ['Keep it short: start with 1-3 categories and add more later.'],
  },
  {
    key: 'track',
    title: 'Track money in real time',
    Icon: Wallet,
    body: 'When you add income and expenses, balances update instantly so you always know what is left.',
  },
  {
    key: 'tabs',
    title: 'Use the main tabs',
    Icon: ChartLine,
    body: 'Home, Incomes, Expenses, Insights, and Settings help you manage your full budget flow.',
  },
];

export default function OnboardingScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const completeOnboarding = useBudgetStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const isLast = step === STEPS.length - 1;

  const completeFlow = useCallback(() => {
    completeOnboarding();
    router.replace('/budget-setup');
  }, [completeOnboarding]);

  const jumpToStep = (idx: number) => {
    setStep(idx);
    scrollRef.current?.scrollTo({ x: idx * width, animated: true });
  };

  return (
    <View style={[styles.page, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
      <Text style={styles.brand}>Money Map</Text>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const next = Math.round(event.nativeEvent.contentOffset.x / width);
          setStep(next);
        }}
        style={styles.mainScroll}
        contentContainerStyle={styles.mainScrollContent}>
        {STEPS.map((item) => {
          const ItemIcon = item.Icon;
          return (
            <View key={item.key} style={[styles.slide, { width: width - 32 }]}>
              <Text style={styles.stepMeta}>
                Step {step + 1} of {STEPS.length}
              </Text>
              <View style={styles.card}>
                <View style={styles.iconWrap}>
                  <ItemIcon size={28} color={colors.primary} strokeWidth={2.2} />
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
                {item.bullets?.map((line) => (
                  <View key={line} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{line}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.dots}>
        {STEPS.map((s, i) => (
          <Pressable key={s.key} onPress={() => jumpToStep(i)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Go to step ${i + 1}`}>
            <View style={[styles.dot, i === step && styles.dotActive]} />
          </Pressable>
        ))}
      </View>

      {isLast && (
        <Pressable style={styles.primaryBtn} onPress={completeFlow} accessibilityRole="button">
          <Text style={styles.primaryText}>Start budget setup</Text>
        </Pressable>
      )}

      <View style={styles.hintRow}>
        <Settings size={14} color={colors.subtext} strokeWidth={2} />
        <Text style={styles.hint}>Swipe through slides. You can also jump using the dots.</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
    brand: { fontSize: 26, fontWeight: '800', color: colors.text },
    stepMeta: { marginBottom: 12, color: colors.subtext, fontWeight: '600', fontSize: 13, textAlign: 'center' },
    mainScroll: { flex: 1 },
    mainScrollContent: { alignItems: 'stretch', flexGrow: 1 },
    slide: { paddingRight: 12, justifyContent: 'center' },
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
    primaryBtn: {
      width: '100%',
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: colors.primary,
    },
    primaryText: { color: '#fff', fontWeight: '800' },
    hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingHorizontal: 4 },
    hint: { flex: 1, color: colors.subtext, fontSize: 12, lineHeight: 18 },
  });
