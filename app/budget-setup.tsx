import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { AmountInput } from '@/src/components/AmountInput';
import { FormInput } from '@/src/components/FormInput';
import { ThemeColors } from '@/src/constants/colors';
import { useAppTheme } from '@/src/hooks/use-app-theme';
import { useBudgetStore } from '@/src/store/use-budget-store';
import { sortTemplatesBySetupOrder } from '@/src/utils/budgetHeadOrder';

const schema = z.object({
  name: z.string().min(2, 'Kindly enter budget head name'),
  monthlyTarget: z
    .string()
    .trim()
    .min(1, 'Kindly enter monthly target')
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
      message: 'Monthly target must be 0 or more',
    }),
});

type FormValue = z.infer<typeof schema>;

export default function BudgetSetupScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const allTemplates = useBudgetStore((s) => s.templates);
  const templates = useMemo(() => sortTemplatesBySetupOrder(allTemplates), [allTemplates]);
  const addBudgetHead = useBudgetStore((s) => s.addBudgetHead);
  const deleteBudgetHead = useBudgetStore((s) => s.deleteBudgetHead);
  const reorderHeads = useBudgetStore((s) => s.reorderHeads);
  const updateBudgetHead = useBudgetStore((s) => s.updateBudgetHead);
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormValue>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', monthlyTarget: '' },
  });

  const onSubmit = (values: FormValue) => {
    const nextPriority =
      templates
        .filter((head) => head.type !== 'disposable')
        .reduce((max, head) => Math.max(max, head.priority), 0) + 1;

    addBudgetHead({
      name: values.name,
      icon: '',
      monthlyTarget: Number(values.monthlyTarget),
      priority: nextPriority,
      type: 'essential',
      isActive: true,
    });
    reset();
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Budget Heads</Text>
      <View style={styles.form}>
        <FormInput label="Name" value={watch('name')} onChangeText={(v) => setValue('name', v)} error={errors.name?.message} />
        <AmountInput label="Monthly Target" value={watch('monthlyTarget')} onChangeText={(v) => setValue('monthlyTarget', v)} error={errors.monthlyTarget?.message} />
        <Pressable style={styles.addBtn} onPress={handleSubmit(onSubmit)}>
          <Text style={styles.addText}>Add Budget Head</Text>
        </Pressable>
      </View>

      {templates.map((head, idx) => (
        <View key={head.id} style={styles.row}>
          <Text style={styles.rowText}>
            {head.name} ({head.type === 'disposable' ? 'Auto (last)' : head.priority})
          </Text>
          <View style={styles.actions}>
            <Pressable
              onPress={() => updateBudgetHead(head.id, { isActive: !head.isActive })}
              style={styles.smallBtn}>
              <Text style={styles.smallBtnText}>{head.isActive ? 'Deactivate' : 'Activate'}</Text>
            </Pressable>
            {head.type !== 'disposable' && (
              <Pressable onPress={() => deleteBudgetHead(head.id)} style={styles.smallBtn}>
                <Text style={styles.smallBtnText}>Delete</Text>
              </Pressable>
            )}
            {idx > 0 && head.type !== 'disposable' && (
              <Pressable
                onPress={() => {
                  const ordered = templates.map((item) => item.id);
                  [ordered[idx - 1], ordered[idx]] = [ordered[idx], ordered[idx - 1]];
                  reorderHeads(ordered);
                }}
                style={styles.smallBtn}>
                <Text style={styles.smallBtnText}>Up</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  form: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 10 },
  addBtn: { backgroundColor: colors.primary, borderRadius: 10, padding: 12, alignItems: 'center' },
  addText: { color: '#fff', fontWeight: '700' },
  row: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, gap: 10 },
  rowText: { color: colors.text, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  smallBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.surfaceAlt },
  smallBtnText: { color: colors.text },
});
