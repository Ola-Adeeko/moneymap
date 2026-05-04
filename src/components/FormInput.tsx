import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';

export function FormInput({
  label,
  error,
  ...props
}: {
  label: string;
  error?: string;
  value?: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
}) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, props.multiline && styles.multiline]}
        placeholderTextColor={colors.subtext}
        {...props}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: colors.subtext, fontWeight: '600', fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  multiline: { minHeight: 86, textAlignVertical: 'top' },
  error: { color: colors.danger, fontSize: 12 },
});
