import { StyleSheet, Text } from 'react-native';
import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';

export function SectionTitle({ children }: { children: string }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  return <Text style={styles.title}>{children}</Text>;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  });
