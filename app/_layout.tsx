import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Compass } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAppTheme } from '@/src/hooks/use-app-theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { effectiveScheme, colors } = useAppTheme();
  const [showLaunchSplash, setShowLaunchSplash] = useState(true);
  const pulse = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.3)).current;
  const navTheme = useMemo(
    () =>
      effectiveScheme === 'dark'
        ? {
            ...DarkTheme,
            colors: {
              ...DarkTheme.colors,
              background: colors.background,
              card: colors.surface,
              text: colors.text,
              border: colors.border,
              primary: colors.primary,
            },
          }
        : {
            ...DefaultTheme,
            colors: {
              ...DefaultTheme.colors,
              background: colors.background,
              card: colors.surface,
              text: colors.text,
              border: colors.border,
              primary: colors.primary,
            },
          },
    [
      effectiveScheme,
      colors.background,
      colors.surface,
      colors.text,
      colors.border,
      colors.primary,
    ]
  );

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -6,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 0.7,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.3,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const timeout = setTimeout(() => setShowLaunchSplash(false), 3500);
    return () => clearTimeout(timeout);
  }, [floatY, glow, pulse]);

  if (showLaunchSplash) {
    return (
      <SafeAreaProvider>
        <View style={[styles.splashPage, { backgroundColor: colors.background }]}>
          <Animated.View
            style={[
              styles.ring,
              {
                borderColor: colors.primary,
                opacity: glow,
                transform: [
                  {
                    scale: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.14],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.logoWrap,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.primary,
                transform: [{ translateY: floatY }],
              },
            ]}>
            <Compass size={40} color={colors.primary} strokeWidth={2.4} />
          </Animated.View>
          <Text style={[styles.title, { color: colors.text }]}>Money Map</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            Plan smarter. Spend intentionally.
          </Text>
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="budget-setup" options={{ title: 'Budget Setup' }} />
          <Stack.Screen name="add-income" options={{ title: 'Add Income' }} />
          <Stack.Screen name="add-expense" options={{ title: 'Add Expense' }} />
          <Stack.Screen name="budget-head/[id]" options={{ title: 'Budget Head Detail' }} />
        </Stack>
        <StatusBar style={effectiveScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashPage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 16,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  ring: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 999,
    borderWidth: 1.4,
  },
  title: { fontSize: 30, fontWeight: '800' },
  subtitle: { marginTop: 8, fontWeight: '600' },
  loader: { marginTop: 22 },
});
