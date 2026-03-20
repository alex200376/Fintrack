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
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/hooks/useTheme";
import { useFinance, type FinancialSummary } from "@/context/FinanceContext";
import { useProfile } from "@/context/ProfileContext";
import { TransactionItem } from "@/components/TransactionItem";
import { DonutChart } from "@/components/DonutChart";
import { spacing, radius, fontSize } from "@/constants/theme";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function DashboardScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { fetchSummary } = useFinance();
  const { profile, cardTheme } = useProfile();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const cur = profile.currency || "$";

  const loadData = useCallback(async (month?: number, year?: number) => {
    try {
      const data = await fetchSummary(month ?? currentMonth, year ?? currentYear);
      setSummary(data);
    } catch { setSummary(null); }
  }, [fetchSummary, currentMonth, currentYear]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [currentMonth, currentYear]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const goToPrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const goToNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const now = new Date();
    if (currentYear === now.getFullYear() && currentMonth === now.getMonth() + 1) return;
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return currentYear === now.getFullYear() && currentMonth === now.getMonth() + 1;
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  if (loading) {
    return (
      <View style={[styles.loadingWrap, { backgroundColor: colors.background, paddingTop: topPad }]}>
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
  const hasCardPhoto = !!profile.cardImageUri;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + spacing.md, paddingBottom: bottomPad, paddingHorizontal: spacing.md, gap: spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {profile.name ? `Hello, ${profile.name} ${profile.avatar}` : "Welcome back"}
          </Text>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Dashboard</Text>
        </View>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/add-transaction"); }}
          style={[styles.addBtn, { backgroundColor: colors.tint }]}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
      </View>

      {/* Month Selector */}
      <View style={[styles.monthCard, { backgroundColor: colors.surface }]}>
        <Pressable onPress={goToPrevMonth} hitSlop={16} style={styles.monthChevron}>
          <Ionicons name="chevron-back" size={22} color={colors.tint} />
        </Pressable>
        <Text style={[styles.monthLabel, { color: colors.text }]}>
          {MONTHS[currentMonth - 1]} {currentYear}
        </Text>
        <Pressable onPress={goToNextMonth} hitSlop={16} style={[styles.monthChevron, { opacity: isCurrentMonth() ? 0.25 : 1 }]}>
          <Ionicons name="chevron-forward" size={22} color={colors.tint} />
        </Pressable>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        {hasCardPhoto ? (
          <Image source={{ uri: profile.cardImageUri }} style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]} resizeMode="cover" />
        ) : (
          <LinearGradient colors={cardTheme.colors as any} start={cardTheme.start} end={cardTheme.end} style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]} />
        )}
        <View style={[StyleSheet.absoluteFill, styles.cardOverlay, { borderRadius: radius.xl }]} />
        <View style={styles.cardContent}>
          <Text style={styles.balLabel}>Net Balance</Text>
          <Text style={styles.balAmount}>
            {bal >= 0 ? "+" : ""}{cur}{Math.abs(bal).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View style={styles.balRow}>
            <View style={styles.balItem}>
              <View style={styles.balIcon}>
                <Ionicons name="arrow-down-circle" size={18} color="rgba(255,255,255,0.9)" />
              </View>
              <View>
                <Text style={styles.balItemLabel}>Income</Text>
                <Text style={styles.balItemAmt}>{cur}{(summary?.totalIncome ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
              </View>
            </View>
            <View style={styles.balDivider} />
            <View style={styles.balItem}>
              <View style={styles.balIcon}>
                <Ionicons name="arrow-up-circle" size={18} color="rgba(255,255,255,0.9)" />
              </View>
              <View>
                <Text style={styles.balItemLabel}>Expenses</Text>
                <Text style={styles.balItemAmt}>{cur}{(summary?.totalExpense ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Spending Breakdown */}
      {(summary?.expenseByCategory?.length ?? 0) > 0 && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Spending Breakdown</Text>
          <View style={styles.chartRow}>
            <DonutChart
              segments={segments}
              size={140}
              strokeWidth={22}
              centerLabel={`${cur}${(summary?.totalExpense ?? 0).toFixed(0)}`}
              centerSubLabel="Spent"
            />
            <View style={styles.legend}>
              {(summary?.expenseByCategory ?? []).slice(0, 5).map(cat => (
                <View key={cat.categoryId} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: cat.categoryColor }]} />
                  <Text style={[styles.legendLabel, { color: colors.textSecondary }]} numberOfLines={1}>{cat.categoryName}</Text>
                  <Text style={[styles.legendPct, { color: colors.text }]}>{cat.percentage.toFixed(0)}%</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Recent Transactions */}
      <View style={styles.sectionRow}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Recent</Text>
        <Pressable onPress={() => router.push("/(tabs)/transactions")}>
          <Text style={[styles.seeAll, { color: colors.tint }]}>See All</Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, padding: 0, overflow: "hidden" }]}>
        {(summary?.recentTransactions?.length ?? 0) === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={44} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No transactions yet</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Tap + to add your first transaction</Text>
          </View>
        ) : (
          (summary?.recentTransactions ?? []).map((t, i) => (
            <View key={t.id}>
              <TransactionItem
                transaction={t}
                onPress={() => router.push({ pathname: "/transaction-detail", params: { id: t.id } })}
              />
              {i < (summary?.recentTransactions?.length ?? 0) - 1 && (
                <View style={[styles.sep, { backgroundColor: colors.borderLight }]} />
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
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  pageTitle: { fontSize: fontSize.xxl, fontFamily: "Inter_700Bold" },
  addBtn: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  monthCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  monthChevron: { padding: 4 },
  monthLabel: { fontSize: fontSize.md, fontFamily: "Inter_600SemiBold" },
  balanceCard: { height: 176, borderRadius: radius.xl, overflow: "hidden" },
  cardOverlay: { backgroundColor: "rgba(0,0,0,0.22)" },
  cardContent: { flex: 1, padding: spacing.lg, justifyContent: "space-between" },
  balLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "Inter_500Medium" },
  balAmount: { color: "#fff", fontSize: 38, fontFamily: "Inter_700Bold", letterSpacing: -1.5, marginTop: 2 },
  balRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  balItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  balIcon: { opacity: 0.85 },
  balItemLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Inter_400Regular" },
  balItemAmt: { color: "#fff", fontSize: fontSize.sm, fontFamily: "Inter_600SemiBold", marginTop: 1 },
  balDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.25)" },
  card: { borderRadius: radius.xl, padding: spacing.md },
  cardTitle: { fontSize: fontSize.lg, fontFamily: "Inter_600SemiBold", marginBottom: spacing.sm },
  chartRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  legend: { flex: 1, gap: spacing.sm },
  legendItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flex: 1, fontSize: fontSize.xs, fontFamily: "Inter_400Regular" },
  legendPct: { fontSize: fontSize.xs, fontFamily: "Inter_600SemiBold" },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 2 },
  seeAll: { fontSize: fontSize.sm, fontFamily: "Inter_500Medium" },
  emptyState: { padding: spacing.xxl, alignItems: "center", gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.md, fontFamily: "Inter_500Medium" },
  emptySub: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular", textAlign: "center" },
  sep: { height: 1, marginHorizontal: spacing.md },
});
