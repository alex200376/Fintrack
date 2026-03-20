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
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { useFinance, type Budget } from "@/context/FinanceContext";
import { useProfile } from "@/context/ProfileContext";
import { BudgetCard } from "@/components/BudgetCard";
import { spacing, radius, fontSize } from "@/constants/theme";

export default function BudgetsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { fetchBudgets, deleteBudget } = useFinance();
  const { profile, cardTheme } = useProfile();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cur = profile.currency || "$";

  const loadData = useCallback(async () => {
    const data = await fetchBudgets();
    setBudgets(data);
  }, [fetchBudgets]);

  useEffect(() => { setLoading(true); loadData().finally(() => setLoading(false)); }, []);
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, [loadData]);

  const handleDelete = (budget: Budget) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Budget", `Delete the budget for ${budget.categoryName}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteBudget(budget.id); await loadData(); } },
    ]);
  };

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overBudget = budgets.filter(b => b.spent > b.amount);
  const pct = totalBudgeted > 0 ? Math.min(1, totalSpent / totalBudgeted) : 0;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + spacing.md, paddingBottom: bottomPad, paddingHorizontal: spacing.md, gap: spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Budgets</Text>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/add-budget"); }}
          style={[styles.addBtn, { backgroundColor: colors.tint }]}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.tint} size="large" />
        </View>
      ) : budgets.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="wallet-outline" size={56} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No budgets yet</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            Set spending limits to stay on track
          </Text>
          <Pressable onPress={() => router.push("/add-budget")} style={[styles.emptyBtn, { backgroundColor: colors.tint }]}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.emptyBtnText}>Create Budget</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Summary Card */}
          <LinearGradient
            colors={cardTheme.colors as any}
            start={cardTheme.start}
            end={cardTheme.end}
            style={styles.summaryCard}
          >
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLbl}>Budgeted</Text>
                <Text style={styles.summaryAmt}>{cur}{totalBudgeted.toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={styles.summaryDiv} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLbl}>Spent</Text>
                <Text style={styles.summaryAmt}>{cur}{totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={styles.summaryDiv} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLbl}>Remaining</Text>
                <Text style={styles.summaryAmt}>{cur}{Math.max(0, totalBudgeted - totalSpent).toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
              </View>
            </View>
            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {
                width: `${pct * 100}%` as any,
                backgroundColor: pct >= 1 ? "#FF6B6B" : pct >= 0.8 ? "#FFD60A" : "rgba(255,255,255,0.9)",
              }]} />
            </View>
            {overBudget.length > 0 && (
              <View style={styles.warningRow}>
                <Ionicons name="warning-outline" size={14} color="#fff" />
                <Text style={styles.warningText}>
                  {overBudget.length} {overBudget.length === 1 ? "budget" : "budgets"} over limit
                </Text>
              </View>
            )}
          </LinearGradient>

          {/* Budget List */}
          <View style={styles.budgetList}>
            {budgets.map(budget => (
              <BudgetCard key={budget.id} budget={budget} onDelete={() => handleDelete(budget)} />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pageTitle: { fontSize: fontSize.xxl, fontFamily: "Inter_700Bold" },
  addBtn: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  loadingBox: { paddingTop: 80, alignItems: "center" },
  emptyCard: { borderRadius: radius.xl, padding: 48, alignItems: "center", gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.xl, fontFamily: "Inter_600SemiBold", marginTop: spacing.md },
  emptySub: { fontSize: fontSize.md, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: spacing.xl },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.full },
  emptyBtnText: { color: "#fff", fontSize: fontSize.md, fontFamily: "Inter_600SemiBold" },
  summaryCard: { borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryLbl: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Inter_400Regular" },
  summaryAmt: { color: "#fff", fontSize: fontSize.md, fontFamily: "Inter_700Bold", marginTop: 3 },
  summaryDiv: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.25)" },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  warningRow: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.15)", borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 5, alignSelf: "flex-start" },
  warningText: { color: "#fff", fontSize: 12, fontFamily: "Inter_500Medium" },
  budgetList: { gap: spacing.sm },
});
