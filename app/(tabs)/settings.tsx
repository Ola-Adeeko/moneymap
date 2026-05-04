import * as Clipboard from 'expo-clipboard';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';
import { useBudgetStore } from '@/src/store/use-budget-store';

export default function SettingsScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const settings = useBudgetStore((s) => s.settings);
  const setCurrency = useBudgetStore((s) => s.setCurrency);
  const setThemeMode = useBudgetStore((s) => s.setThemeMode);
  const resetData = useBudgetStore((s) => s.resetData);
  const exportData = useBudgetStore((s) => s.exportData);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <AppHeader title="Settings" />
      <View style={styles.card}>
        <Text style={styles.label}>Currency</Text>
        <View style={styles.row}>
          {['NGN', 'USD', 'EUR'].map((currency) => (
            <Pressable key={currency} style={[styles.pill, settings.currency === currency && styles.pillActive]} onPress={() => setCurrency(currency)}>
              <Text style={settings.currency === currency ? styles.pillTextActive : styles.pillText}>{currency}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Theme</Text>
        <View style={styles.row}>
          {(['system', 'dark', 'light'] as const).map((mode) => (
            <Pressable key={mode} style={[styles.pill, settings.themeMode === mode && styles.pillActive]} onPress={() => setThemeMode(mode)}>
              <Text style={settings.themeMode === mode ? styles.pillTextActive : styles.pillText}>{mode}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Pressable
        style={styles.card}
        onPress={async () => {
          await Clipboard.setStringAsync(exportData());
          Alert.alert('Export Ready', 'Your JSON data has been copied to clipboard.');
        }}>
        <Text style={styles.label}>Export local data JSON</Text>
      </Pressable>
      <Pressable
        style={styles.card}
        onPress={() =>
          Alert.alert(
            'Reset all data?',
            'This will permanently remove all budget heads, incomes, expenses, allocations, and monthly states on this device.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Reset Data',
                style: 'destructive',
                onPress: () => resetData(),
              },
            ]
          )
        }>
        <Text style={[styles.label, { color: colors.danger }]}>Reset data</Text>
      </Pressable>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 12 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, gap: 8 },
  label: { color: colors.text, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8 },
  pill: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.surfaceAlt },
  pillActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  pillText: { color: colors.subtext },
  pillTextActive: { color: colors.primary, fontWeight: '700' },
});
