import { StyleSheet, Text, View } from 'react-native';

import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';

export function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.surfaceAlt,
    gap: 4,
  },
  title: { color: colors.text, fontWeight: '600' },
  subtitle: { color: colors.subtext },
});
