import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { useFinance, type Budget } from "@/context/FinanceContext";
import { BudgetCard } from "@/components/BudgetCard";
import { spacing, radius, fontSize } from "@/constants/theme";

export default function BudgetsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { fetchBudgets, deleteBudget } = useFinance();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const data = await fetchBudgets();
    setBudgets(data);
  }, [fetchBudgets]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleDelete = (budget: Budget) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete Budget",
      `Delete the budget for ${budget.categoryName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteBudget(budget.id);
            await loadData();
          },
        },
      ]
    );
  };

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overBudget = budgets.filter(b => b.spent > b.amount);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPadding + spacing.md,
          paddingBottom: Platform.OS === "web" ? 34 + 84 : 100,
        },
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Budgets</Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/add-budget");
          }}
          style={[styles.addButton, { backgroundColor: colors.tint }]}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : budgets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={56} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No budgets yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Create budgets to track your spending limits
          </Text>
          <Pressable
            onPress={() => router.push("/add-budget")}
            style={[styles.createButton, { backgroundColor: colors.tint }]}
          >
            <Text style={styles.createButtonText}>Create Budget</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Summary Card */}
          <View style={[styles.summaryCard, { backgroundColor: colors.tint }]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>Budgeted</Text>
                <Text style={styles.summaryItemAmount}>
                  ${totalBudgeted.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>Spent</Text>
                <Text style={styles.summaryItemAmount}>
                  ${totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>Remaining</Text>
                <Text style={styles.summaryItemAmount}>
                  ${Math.max(0, totalBudgeted - totalSpent).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
            {overBudget.length > 0 && (
              <View style={styles.warningBanner}>
                <Ionicons name="warning" size={14} color="#fff" />
                <Text style={styles.warningText}>
                  {overBudget.length} {overBudget.length === 1 ? "budget" : "budgets"} over limit
                </Text>
              </View>
            )}
          </View>

          {/* Budget List */}
          <View style={styles.budgetList}>
            {budgets.map(budget => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onDelete={() => handleDelete(budget)}
              />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.md, gap: spacing.md },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: fontSize.xxl,
    fontFamily: "Inter_700Bold",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    paddingTop: 80,
    alignItems: "center",
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontFamily: "Inter_600SemiBold",
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  createButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  createButtonText: {
    color: "#fff",
    fontSize: fontSize.md,
    fontFamily: "Inter_600SemiBold",
  },
  summaryCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryItemLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
  summaryItemAmount: {
    color: "#fff",
    fontSize: fontSize.md,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: "flex-start",
  },
  warningText: {
    color: "#fff",
    fontSize: fontSize.xs,
    fontFamily: "Inter_500Medium",
  },
  budgetList: {
    gap: spacing.sm,
  },
});
