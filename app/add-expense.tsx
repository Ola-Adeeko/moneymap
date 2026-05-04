import { zodResolver } from '@hookform/resolvers/zod';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { AmountInput } from '@/src/components/AmountInput';
import { FormInput } from '@/src/components/FormInput';
import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';
import { useBudgetStore } from '@/src/store/use-budget-store';
import { sortTemplatesBySetupOrder } from '@/src/utils/budgetHeadOrder';

const schema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, 'Kindly enter expense amount')
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
      message: 'Expense amount must be greater than 0',
    }),
  budgetHeadId: z.string().min(1, 'Kindly select a budget head'),
  description: z.string().min(2, 'Kindly enter expense description'),
  paymentMethod: z.string().min(2, 'Kindly enter payment method'),
  note: z.string().optional(),
});
type FormValue = z.infer<typeof schema>;

export default function AddExpenseScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const monthKey = useBudgetStore((s) => s.selectedMonthKey);
  const addExpense = useBudgetStore((s) => s.addExpense);
  const updateExpense = useBudgetStore((s) => s.updateExpense);
  const monthStatesMap = useBudgetStore((s) => s.monthStates);
  const allExpenses = useBudgetStore((s) => s.expenses);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = Boolean(id);
  const allTemplates = useBudgetStore((s) => s.templates);
  const templates = useMemo(
    () => sortTemplatesBySetupOrder(allTemplates.filter((h) => h.isActive)),
    [allTemplates]
  );
  const monthStates = useMemo(() => monthStatesMap[monthKey] ?? [], [monthStatesMap, monthKey]);
  const { setValue, watch, handleSubmit, formState: { errors } } = useForm<FormValue>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', budgetHeadId: '', description: '', paymentMethod: 'Card', note: '' },
  });

  const selectedHead = monthStates.find((h) => h.budgetHeadTemplateId === watch('budgetHeadId'));
  const existingEntry = useMemo(
    () => allExpenses.find((entry) => entry.id === id),
    [allExpenses, id]
  );

  useEffect(() => {
    if (!existingEntry) return;
    setValue('amount', String(existingEntry.amount));
    setValue('budgetHeadId', existingEntry.budgetHeadId);
    setValue('description', existingEntry.description);
    setValue('paymentMethod', existingEntry.paymentMethod);
    setValue('note', existingEntry.note ?? '');
  }, [existingEntry, setValue]);

  const onSubmit = (values: FormValue) => {
    if (editing && existingEntry) {
      updateExpense(existingEntry.id, {
        amount: Number(values.amount),
        date: existingEntry.date,
        budgetHeadId: values.budgetHeadId,
        description: values.description,
        paymentMethod: values.paymentMethod,
        note: values.note,
      });
    } else {
      addExpense({
        monthKey,
        amount: Number(values.amount),
        date: new Date().toISOString(),
        budgetHeadId: values.budgetHeadId,
        description: values.description,
        paymentMethod: values.paymentMethod,
        note: values.note,
      });
    }
    router.back();
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: editing ? 'Edit Expense' : 'Add Expense' }} />
      <AmountInput value={watch('amount')} onChangeText={(v) => setValue('amount', v)} error={errors.amount?.message} />
      <FormInput label="Description" value={watch('description')} onChangeText={(v) => setValue('description', v)} error={errors.description?.message} />
      <FormInput label="Payment Method" value={watch('paymentMethod')} onChangeText={(v) => setValue('paymentMethod', v)} error={errors.paymentMethod?.message} />
      <FormInput label="Note" value={watch('note')} onChangeText={(v) => setValue('note', v)} />
      <View style={styles.row}>
        {templates.map((head) => (
          <Pressable key={head.id} onPress={() => setValue('budgetHeadId', head.id)} style={[styles.pill, watch('budgetHeadId') === head.id && styles.pillActive]}>
            <Text style={watch('budgetHeadId') === head.id ? styles.pillTextActive : styles.pillText}>{head.name}</Text>
          </Pressable>
        ))}
      </View>
      {selectedHead && selectedHead.spentAmount + Number(watch('amount') || 0) > selectedHead.allocatedAmount && (
        <Text style={styles.warn}>Overspend warning: this expense exceeds allocated balance.</Text>
      )}
      <Pressable style={styles.submit} onPress={handleSubmit(onSubmit)}>
        <Text style={styles.submitText}>{editing ? 'Update Expense' : 'Save Expense'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.surfaceAlt },
  pillActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  pillText: { color: colors.subtext, fontSize: 12 },
  pillTextActive: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  warn: { color: colors.warning, fontWeight: '600' },
  submit: { marginTop: 4, backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700' },
});
