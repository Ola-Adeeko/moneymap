import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { AmountInput } from "@/src/components/AmountInput";
import { EmptyState } from "@/src/components/EmptyState";
import { FormInput } from "@/src/components/FormInput";
import { ThemeColors } from "@/src/constants/colors";
import { useAppTheme } from "@/src/hooks/use-app-theme";
import { useBudgetStore } from "@/src/store/use-budget-store";
import { sortTemplatesBySetupOrder } from "@/src/utils/budgetHeadOrder";
import { formatCurrency } from "@/src/utils/currency";

const schema = z.object({
  name: z.string().min(2, "Kindly enter category name"),
  monthlyTarget: z
    .string()
    .trim()
    .min(1, "Kindly enter monthly target")
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
      message: "Monthly target must be 0 or more",
    }),
});

type FormValue = z.infer<typeof schema>;

export default function BudgetSetupScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const allTemplates = useBudgetStore((s) => s.templates);
  const templates = useMemo(
    () => sortTemplatesBySetupOrder(allTemplates),
    [allTemplates],
  );
  const addBudgetHead = useBudgetStore((s) => s.addBudgetHead);
  const deleteBudgetHead = useBudgetStore((s) => s.deleteBudgetHead);
  const reorderHeads = useBudgetStore((s) => s.reorderHeads);
  const completeOnboarding = useBudgetStore((s) => s.completeOnboarding);
  const setupComplete = useBudgetStore((s) => s.settings.setupComplete);
  const currency = useBudgetStore((s) => s.settings.currency);
  const selectedMonthKey = useBudgetStore((s) => s.selectedMonthKey);
  const getMonthSummary = useBudgetStore((s) => s.getMonthSummary);
  const fundCategoryFromFreeSpend = useBudgetStore((s) => s.fundCategoryFromFreeSpend);
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormValue>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", monthlyTarget: "" },
  });

  const onSubmit = (values: FormValue) => {
    const nextPriority =
      templates
        .filter((head) => head.type !== "disposable")
        .reduce((max, head) => Math.max(max, head.priority), 0) + 1;

    const newHeadId = addBudgetHead({
      name: values.name,
      icon: "",
      monthlyTarget: Number(values.monthlyTarget),
      priority: nextPriority,
      type: "essential",
      isActive: true,
    });

    const freeSpendBalance = getMonthSummary(selectedMonthKey).disposableBalance;
    const newCategoryAmount = Number(values.monthlyTarget);
    const formattedFreeSpend = formatCurrency(freeSpendBalance, currency);
    const formattedCategoryAmount = formatCurrency(newCategoryAmount, currency);

    if (freeSpendBalance > 0 && newCategoryAmount > 0) {
      Alert.alert(
        "Fund new category?",
        `You have Free Spend balance of ${formattedFreeSpend}. Fund this new category (${formattedCategoryAmount}) from Free Spend?`,
        [
          { text: "Keep Unfunded", style: "cancel" },
          {
            text: "Fund Now",
            onPress: () => {
              fundCategoryFromFreeSpend(newHeadId, selectedMonthKey);
            },
          },
        ]
      );
    }
    reset();
  };

  const hasNonDisposableHead = templates.some(
    (head) => head.type !== "disposable",
  );
  const totalCategoryTarget = templates
    .filter((head) => head.type !== "disposable")
    .reduce((sum, head) => sum + head.monthlyTarget, 0);

  const finishSetup = () => {
    completeOnboarding();
    router.replace("/(tabs)");
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Spending Categories</Text>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Category Target</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalCategoryTarget, currency)}</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Create Categories</Text>
        <FormInput
          label="Name"
          value={watch("name")}
          onChangeText={(v) => setValue("name", v)}
          error={errors.name?.message}
        />
        <AmountInput
          label="Monthly Target"
          value={watch("monthlyTarget")}
          onChangeText={(v) => setValue("monthlyTarget", v)}
          error={errors.monthlyTarget?.message}
        />
        <Pressable style={styles.addBtn} onPress={handleSubmit(onSubmit)}>
          <Text style={styles.addText}>Add Category</Text>
        </Pressable>
      </View>

      {!hasNonDisposableHead && (
        <EmptyState
          title="No categories yet"
          subtitle="Add 1-3 categories to keep setup simple. You can add more later."
        />
      )}

      {templates.map((head, idx) => (
        <View key={head.id} style={styles.row}>
          <View style={styles.rowHeader}>
            <Text style={styles.rowText}>{head.type === "disposable" ? "Free Spend" : head.name}</Text>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>
                Rank ({head.type === "disposable" ? "Auto" : head.priority})
              </Text>
            </View>
          </View>
          <Text style={styles.targetText}>
            Monthly target: {formatCurrency(head.monthlyTarget, currency)}
          </Text>
          <View style={styles.actions}>
            {head.type !== "disposable" && (
              <Pressable
                onPress={() => deleteBudgetHead(head.id)}
                style={styles.smallBtn}
              >
                <Text style={styles.smallBtnText}>Remove</Text>
              </Pressable>
            )}
            {idx > 0 && head.type !== "disposable" && (
              <Pressable
                onPress={() => {
                  const ordered = templates.map((item) => item.id);
                  [ordered[idx - 1], ordered[idx]] = [
                    ordered[idx],
                    ordered[idx - 1],
                  ];
                  reorderHeads(ordered);
                }}
                style={styles.smallBtn}
              >
                <Text style={styles.smallBtnText}>Move Up</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}

      {!setupComplete && (
        <Pressable
          style={[styles.addBtn, styles.finishBtn]}
          onPress={finishSetup}
        >
          <Text style={styles.addText}>Continue to Dashboard</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, gap: 12 },
    title: { fontSize: 22, fontWeight: "700", color: colors.text },
    totalCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      gap: 4,
    },
    totalLabel: { color: colors.subtext, fontWeight: "600", fontSize: 12 },
    totalValue: { color: colors.text, fontWeight: "800", fontSize: 20 },
    sectionTitle: { color: colors.text, fontWeight: "700", fontSize: 15 },
    form: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      gap: 10,
    },
    addBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      padding: 12,
      alignItems: "center",
    },
    addText: { color: "#fff", fontWeight: "700" },
    row: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      gap: 10,
    },
    rowHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    rowText: { color: colors.text, fontWeight: "600" },
    targetText: { color: colors.subtext, fontWeight: "600", fontSize: 13 },
    rankBadge: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: colors.surfaceAlt,
    },
    rankText: { color: colors.subtext, fontWeight: "700", fontSize: 12 },
    actions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    smallBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: colors.surfaceAlt,
    },
    smallBtnText: { color: colors.text },
    finishBtn: { marginTop: 8, marginBottom: 24 },
  });
