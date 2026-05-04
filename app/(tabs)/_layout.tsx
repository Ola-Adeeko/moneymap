import { Tabs } from 'expo-router';
import React from 'react';
import {
  Banknote,
  ChartLine,
  HandCoins,
  House,
  Settings,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { useAppTheme } from '@/src/hooks/use-app-theme';

export default function TabLayout() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtext,
        sceneStyle: {
          paddingTop: insets.top,
          backgroundColor: colors.background,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 58 + Math.max(insets.bottom, 8),
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <House size={20} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="incomes"
        options={{
          title: 'Incomes',
          tabBarIcon: ({ color }) => (
            <Banknote size={20} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color }) => (
            <HandCoins size={20} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => (
            <ChartLine size={20} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Settings size={20} color={color} strokeWidth={2.2} />
          ),
        }}
      />
    </Tabs>
  );
}
