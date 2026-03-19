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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { useFinance, type FinancialSummary } from "@/context/FinanceContext";
import { TransactionItem } from "@/components/TransactionItem";
import { DonutChart } from "@/components/DonutChart";
import { spacing, radius, fontSize } from "@/constants/theme";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { fetchSummary } = useFinance();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const loadData = useCallback(async (month?: number, year?: number) => {
    try {
      const data = await fetchSummary(month ?? currentMonth, year ?? currentYear);
      setSummary(data);
    } catch {
      setSummary(null);
    }
  }, [fetchSummary, currentMonth, currentYear]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [currentMonth, currentYear]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const goToPrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const now = new Date();
    if (currentYear === now.getFullYear() && currentMonth === now.getMonth() + 1) return;
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return currentYear === now.getFullYear() && currentMonth === now.getMonth() + 1;
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background, paddingTop: topPadding }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  const bal = summary?.balance ?? 0;
  const segments = (summary?.expenseByCategory ?? []).slice(0, 6).map(c => ({
    color: c.categoryColor,
    percentage: c.percentage,
    label: c.categoryName,
  }));

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
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.tint}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            Personal Finance
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/add-transaction");
          }}
          style={[styles.addButton, { backgroundColor: colors.tint }]}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Month Selector */}
      <View style={[styles.monthSelector, { backgroundColor: colors.surface }]}>
        <Pressable onPress={goToPrevMonth} hitSlop={12}>
          <Ionicons name="chevron-back" size={20} color={colors.tint} />
        </Pressable>
        <Text style={[styles.monthLabel, { color: colors.text }]}>
          {MONTHS[currentMonth - 1]} {currentYear}
        </Text>
        <Pressable onPress={goToNextMonth} hitSlop={12} style={{ opacity: isCurrentMonth() ? 0.3 : 1 }}>
          <Ionicons name="chevron-forward" size={20} color={colors.tint} />
        </Pressable>
      </View>

      {/* Balance Card */}
      <View style={[styles.balanceCard, { backgroundColor: colors.tint }]}>
        <Text style={styles.balanceLabel}>Net Balance</Text>
        <Text style={styles.balanceAmount}>
          {bal >= 0 ? "+" : ""}${Math.abs(bal).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </Text>
        <View style={styles.incomeExpenseRow}>
          <View style={styles.incomeExpenseItem}>
            <View style={styles.incomeExpenseIcon}>
              <Ionicons name="arrow-down-circle" size={18} color="#fff" />
            </View>
            <View>
              <Text style={styles.incomeExpenseItemLabel}>Income</Text>
              <Text style={styles.incomeExpenseItemAmount}>
                ${(summary?.totalIncome ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.incomeExpenseItem}>
            <View style={styles.incomeExpenseIcon}>
              <Ionicons name="arrow-up-circle" size={18} color="#fff" />
            </View>
            <View>
              <Text style={styles.incomeExpenseItemLabel}>Expense</Text>
              <Text style={styles.incomeExpenseItemAmount}>
                ${(summary?.totalExpense ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Spending Breakdown */}
      {(summary?.expenseByCategory?.length ?? 0) > 0 && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Spending Breakdown</Text>
          <View style={styles.chartRow}>
            <DonutChart
              segments={segments}
              size={140}
              strokeWidth={22}
              centerLabel={`$${(summary?.totalExpense ?? 0).toFixed(0)}`}
              centerSubLabel="Spent"
            />
            <View style={styles.legendContainer}>
              {(summary?.expenseByCategory ?? []).slice(0, 5).map(cat => (
                <View key={cat.categoryId} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: cat.categoryColor }]} />
                  <Text style={[styles.legendLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                    {cat.categoryName}
                  </Text>
                  <Text style={[styles.legendPct, { color: colors.text }]}>
                    {cat.percentage.toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Recent Transactions */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
        <Pressable onPress={() => router.push("/transactions")}>
          <Text style={[styles.seeAll, { color: colors.tint }]}>See All</Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, padding: 0, overflow: "hidden" }]}>
        {(summary?.recentTransactions?.length ?? 0) === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No transactions yet</Text>
            <Text style={[styles.emptySubText, { color: colors.textTertiary }]}>
              Tap + to add your first transaction
            </Text>
          </View>
        ) : (
          (summary?.recentTransactions ?? []).map((t, i) => (
            <View key={t.id}>
              <TransactionItem
                transaction={t}
                onPress={() => router.push({ pathname: "/transaction-detail", params: { id: t.id } })}
              />
              {i < (summary?.recentTransactions?.length ?? 0) - 1 && (
                <View style={[styles.separator, { backgroundColor: colors.borderLight }]} />
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.md, gap: spacing.md },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_400Regular",
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
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  monthLabel: {
    fontSize: fontSize.md,
    fontFamily: "Inter_600SemiBold",
  },
  balanceCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: fontSize.sm,
    fontFamily: "Inter_500Medium",
  },
  balanceAmount: {
    color: "#fff",
    fontSize: fontSize.display,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
  },
  incomeExpenseRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  incomeExpenseItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  incomeExpenseIcon: {
    opacity: 0.8,
  },
  incomeExpenseItemLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
  incomeExpenseItemAmount: {
    color: "#fff",
    fontSize: fontSize.sm,
    fontFamily: "Inter_600SemiBold",
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontFamily: "Inter_600SemiBold",
  },
  seeAll: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_500Medium",
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  legendContainer: {
    flex: 1,
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    flex: 1,
    fontSize: fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
  legendPct: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_600SemiBold",
  },
  emptyState: {
    padding: spacing.xxl,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    fontFamily: "Inter_500Medium",
  },
  emptySubText: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  separator: {
    height: 1,
    marginHorizontal: spacing.md,
  },
});
