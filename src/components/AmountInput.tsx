import { FormInput } from './FormInput';

export function AmountInput(props: {
  value?: string;
  onChangeText?: (value: string) => void;
  error?: string;
  label?: string;
}) {
  return (
    <FormInput
      label={props.label ?? 'Amount'}
      value={props.value}
      onChangeText={props.onChangeText}
      keyboardType="numeric"
      placeholder="0"
      error={props.error}
    />
  );
}
