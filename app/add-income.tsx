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
    .min(1, 'Kindly enter income amount')
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
      message: 'Income amount must be greater than 0',
    }),
  source: z.string().min(2, 'Kindly add income source'),
  note: z.string().optional(),
  mode: z.enum(['auto', 'manual']),
  selectedHeadId: z.string().optional(),
});

type FormValue = z.infer<typeof schema>;

export default function AddIncomeScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const monthKey = useBudgetStore((s) => s.selectedMonthKey);
  const addIncome = useBudgetStore((s) => s.addIncome);
  const updateIncome = useBudgetStore((s) => s.updateIncome);
  const allIncomes = useBudgetStore((s) => s.incomes);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = Boolean(id);
  const allTemplates = useBudgetStore((s) => s.templates);
  const templates = useMemo(
    () => sortTemplatesBySetupOrder(allTemplates.filter((h) => h.isActive)),
    [allTemplates]
  );
  const hasUserBudgetHeads = useMemo(
    () => templates.some((head) => head.type !== 'disposable'),
    [templates]
  );
  const { setValue, watch, handleSubmit, clearErrors, formState: { errors } } = useForm<FormValue>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', source: '', note: '', mode: 'auto', selectedHeadId: '' },
  });
  const selectedMode = watch('mode');
  const existingEntry = useMemo(
    () => allIncomes.find((entry) => entry.id === id),
    [allIncomes, id]
  );

  useEffect(() => {
    if (!existingEntry) return;
    setValue('amount', String(existingEntry.amount));
    setValue('source', existingEntry.source);
    setValue('note', existingEntry.note ?? '');
    setValue('mode', existingEntry.allocationMode);
    setValue('selectedHeadId', existingEntry.selectedHeadId ?? '');
  }, [existingEntry, setValue]);

  useEffect(() => {
    if (!hasUserBudgetHeads && selectedMode === 'manual') {
      setValue('mode', 'auto');
    }
  }, [hasUserBudgetHeads, selectedMode, setValue]);

  const onSubmit = (values: FormValue) => {
    if (editing && existingEntry) {
      updateIncome(existingEntry.id, {
        amount: Number(values.amount),
        date: existingEntry.date,
        source: values.source,
        note: values.note,
        allocationMode: values.mode,
        selectedHeadId: values.mode === 'manual' ? values.selectedHeadId : undefined,
      });
    } else {
      addIncome({
        monthKey,
        amount: Number(values.amount),
        date: new Date().toISOString(),
        source: values.source,
        note: values.note,
        allocationMode: values.mode,
        selectedHeadId: values.mode === 'manual' ? values.selectedHeadId : undefined,
      });
    }
    router.back();
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: editing ? 'Edit Income' : 'Add Income' }} />
      <AmountInput value={watch('amount')} onChangeText={(v) => setValue('amount', v)} error={errors.amount?.message} />
      <FormInput
        label="Income Source"
        value={watch('source')}
        onChangeText={(v) => {
          setValue('source', v, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
          if (v.trim().length > 0) clearErrors('source');
        }}
        error={errors.source?.message}
      />
      <FormInput label="Note" value={watch('note')} onChangeText={(v) => setValue('note', v)} />
      <View style={styles.row}>
        {(['auto', ...(hasUserBudgetHeads ? (['manual'] as const) : [])] as const).map((mode) => (
          <Pressable key={mode} onPress={() => setValue('mode', mode)} style={[styles.pill, selectedMode === mode && styles.pillActive]}>
            <Text style={selectedMode === mode ? styles.pillTextActive : styles.pillText}>{mode === 'auto' ? 'Auto Allocate' : 'Manual Select Head'}</Text>
          </Pressable>
        ))}
      </View>
      {selectedMode === 'manual' && (
        <View style={styles.row}>
          {templates.map((head) => (
            <Pressable key={head.id} onPress={() => setValue('selectedHeadId', head.id)} style={[styles.pill, watch('selectedHeadId') === head.id && styles.pillActive]}>
              <Text style={watch('selectedHeadId') === head.id ? styles.pillTextActive : styles.pillText}>{head.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <Pressable style={styles.submit} onPress={handleSubmit(onSubmit)}>
        <Text style={styles.submitText}>{editing ? 'Update Income' : 'Save Income'}</Text>
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
  submit: { marginTop: 4, backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700' },
});
