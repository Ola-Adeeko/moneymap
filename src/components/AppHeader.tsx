import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';

export function AppHeader({ title, right }: { title: string; right?: ReactNode }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {right}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  row: {
    marginHorizontal: 16,
    marginVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
});
