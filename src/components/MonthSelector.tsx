import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';
import { monthLabel } from '@/src/utils/month';

export function MonthSelector({
  monthKey,
  onPrev,
  onNext,
}: {
  monthKey: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.row}>
      <Pressable style={styles.btn} onPress={onPrev} accessibilityRole="button" accessibilityLabel="Previous month">
        <ChevronLeft size={18} color={colors.text} strokeWidth={2.4} />
      </Pressable>
      <Text style={styles.label}>{monthLabel(monthKey)}</Text>
      <Pressable style={styles.btn} onPress={onNext} accessibilityRole="button" accessibilityLabel="Next month">
        <ChevronRight size={18} color={colors.text} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 },
  btn: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, width: 34, height: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  label: { color: colors.text, fontWeight: '700' },
});
