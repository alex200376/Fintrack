import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import Svg, { Rect, Line, Text as SvgText, G } from "react-native-svg";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { useFinance } from "@/context/FinanceContext";
import { useProfile } from "@/context/ProfileContext";
import { spacing, radius, fontSize } from "@/constants/theme";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type MonthSummary = {
  month: number;
  year: number;
  income: number;
  expense: number;
  balance: number;
};

type PeriodOption = 3 | 6 | 12;

function BarChart({
  data,
  width,
  colors,
  currency,
}: {
  data: MonthSummary[];
  width: number;
  colors: any;
  currency: string;
}) {
  const chartHeight = 160;
  const padLeft = 0;
  const padBottom = 28;
  const innerW = width - padLeft;
  const innerH = chartHeight - padBottom;
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  const groupW = innerW / data.length;
  const barW = Math.max(8, (groupW - 12) / 2);

  return (
    <Svg width={width} height={chartHeight}>
      {data.map((d, i) => {
        const x = padLeft + i * groupW + (groupW - barW * 2 - 4) / 2;
        const incH = Math.max(2, (d.income / maxVal) * innerH);
        const expH = Math.max(2, (d.expense / maxVal) * innerH);
        return (
          <G key={i}>
            <Rect
              x={x}
              y={innerH - incH}
              width={barW}
              height={incH}
              rx={4}
              fill={colors.income}
              opacity={0.85}
            />
            <Rect
              x={x + barW + 4}
              y={innerH - expH}
              width={barW}
              height={expH}
              rx={4}
              fill={colors.expense}
              opacity={0.85}
            />
            <SvgText
              x={x + barW + 2}
              y={chartHeight - 6}
              textAnchor="middle"
              fontSize={9}
              fill={colors.textTertiary}
              fontFamily="System"
            >
              {MONTHS_SHORT[d.month - 1]}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

export default function ReportsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { fetchSummary } = useFinance();
  const { profile } = useProfile();
  const currency = profile.currency || "$";

  const [period, setPeriod] = useState<PeriodOption>(6);
  const [monthData, setMonthData] = useState<MonthSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const now = new Date();
    const results: MonthSummary[] = [];
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      try {
        const s = await fetchSummary(m, y);
        results.push({ month: m, year: y, income: s.totalIncome, expense: s.totalExpense, balance: s.balance });
      } catch {
        results.push({ month: m, year: y, income: 0, expense: 0, balance: 0 });
      }
    }
    setMonthData(results);
  }, [fetchSummary, period]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [period]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const totalIncome = monthData.reduce((s, d) => s + d.income, 0);
  const totalExpense = monthData.reduce((s, d) => s + d.expense, 0);
  const totalBalance = monthData.reduce((s, d) => s + d.balance, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  const bestMonth = monthData.reduce((best, d) => d.balance > best.balance ? d : best, monthData[0] ?? { balance: 0, month: 0, year: 0 });
  const worstMonth = monthData.reduce((worst, d) => d.expense > worst.expense ? d : worst, monthData[0] ?? { expense: 0, month: 0, year: 0 });

  const fmt = (n: number) =>
    `${currency}${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const CHART_WIDTH = 320;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPadding + spacing.md, paddingBottom: Platform.OS === "web" ? 34 + 84 : 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>Reports</Text>

      {/* Period Selector */}
      <View style={[styles.periodRow, { backgroundColor: colors.surface }]}>
        {([3, 6, 12] as PeriodOption[]).map(p => (
          <Pressable
            key={p}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPeriod(p);
            }}
            style={[
              styles.periodChip,
              { backgroundColor: period === p ? colors.tint : "transparent" },
            ]}
          >
            <Text style={[styles.periodChipText, { color: period === p ? "#fff" : colors.textSecondary }]}>
              {p}M
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : (
        <>
          {/* Summary Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.income + "15" }]}>
              <Ionicons name="arrow-down-circle" size={20} color={colors.income} />
              <Text style={[styles.statAmount, { color: colors.text }]}>{fmt(totalIncome)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Income</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.expense + "15" }]}>
              <Ionicons name="arrow-up-circle" size={20} color={colors.expense} />
              <Text style={[styles.statAmount, { color: colors.text }]}>{fmt(totalExpense)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Expenses</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: (totalBalance >= 0 ? colors.income : colors.expense) + "15" }]}>
              <Ionicons
                name="wallet"
                size={20}
                color={totalBalance >= 0 ? colors.income : colors.expense}
              />
              <Text style={[
                styles.statAmount,
                { color: totalBalance >= 0 ? colors.income : colors.expense },
              ]}>
                {totalBalance >= 0 ? "+" : "-"}{fmt(totalBalance)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Net</Text>
            </View>
          </View>

          {/* Bar Chart */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Income vs Expenses</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
                <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
                <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Expenses</Text>
              </View>
            </View>
            <View style={styles.chartWrapper}>
              <BarChart data={monthData} width={CHART_WIDTH} colors={colors} currency={currency} />
            </View>
          </View>

          {/* Savings Rate */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.savingsHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Savings Rate</Text>
              <Text style={[
                styles.savingsRate,
                { color: savingsRate >= 0 ? colors.income : colors.expense },
              ]}>
                {savingsRate.toFixed(1)}%
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.borderLight }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, Math.max(0, savingsRate))}%`,
                    backgroundColor: savingsRate >= 20 ? colors.income : savingsRate >= 0 ? "#F59E0B" : colors.expense,
                  },
                ]}
              />
            </View>
            <Text style={[styles.savingsTip, { color: colors.textSecondary }]}>
              {savingsRate >= 30
                ? "Excellent! You're saving well."
                : savingsRate >= 20
                ? "Good savings habit. Keep it up!"
                : savingsRate >= 10
                ? "Try to save at least 20% of income."
                : savingsRate >= 0
                ? "Consider reducing expenses to save more."
                : "Spending exceeds income this period."}
            </Text>
          </View>

          {/* Monthly Breakdown Table */}
          <View style={[styles.card, { backgroundColor: colors.surface, padding: 0 }]}>
            <Text style={[styles.cardTitle, { color: colors.text, padding: spacing.md, paddingBottom: spacing.sm }]}>
              Monthly Breakdown
            </Text>
            <View style={[styles.tableHeader, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.tableHeaderText, { color: colors.textTertiary, flex: 2 }]}>Month</Text>
              <Text style={[styles.tableHeaderText, { color: colors.textTertiary }]}>Income</Text>
              <Text style={[styles.tableHeaderText, { color: colors.textTertiary }]}>Expense</Text>
              <Text style={[styles.tableHeaderText, { color: colors.textTertiary }]}>Net</Text>
            </View>
            {[...monthData].reverse().map((d, i) => {
              const net = d.income - d.expense;
              return (
                <View key={i} style={[
                  styles.tableRow,
                  i < monthData.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
                ]}>
                  <Text style={[styles.tableCell, { color: colors.text, flex: 2, fontFamily: "Inter_500Medium" }]}>
                    {MONTHS_SHORT[d.month - 1]} {d.year}
                  </Text>
                  <Text style={[styles.tableCell, { color: colors.income }]}>{fmt(d.income)}</Text>
                  <Text style={[styles.tableCell, { color: colors.expense }]}>{fmt(d.expense)}</Text>
                  <Text style={[styles.tableCell, { color: net >= 0 ? colors.income : colors.expense, fontFamily: "Inter_600SemiBold" }]}>
                    {net >= 0 ? "+" : "-"}{fmt(net)}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Highlights */}
          {monthData.length > 0 && (
            <View style={styles.highlightsRow}>
              <View style={[styles.highlightCard, { backgroundColor: colors.income + "15" }]}>
                <Ionicons name="trending-up" size={20} color={colors.income} />
                <Text style={[styles.highlightTitle, { color: colors.text }]}>Best Month</Text>
                <Text style={[styles.highlightVal, { color: colors.income }]}>
                  {MONTHS_SHORT[(bestMonth.month || 1) - 1]}
                </Text>
                <Text style={[styles.highlightSub, { color: colors.textSecondary }]}>
                  +{fmt(bestMonth.balance)}
                </Text>
              </View>
              <View style={[styles.highlightCard, { backgroundColor: colors.expense + "15" }]}>
                <Ionicons name="trending-down" size={20} color={colors.expense} />
                <Text style={[styles.highlightTitle, { color: colors.text }]}>Most Spent</Text>
                <Text style={[styles.highlightVal, { color: colors.expense }]}>
                  {MONTHS_SHORT[(worstMonth.month || 1) - 1]}
                </Text>
                <Text style={[styles.highlightSub, { color: colors.textSecondary }]}>
                  {fmt(worstMonth.expense)}
                </Text>
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.md, gap: spacing.md },
  title: { fontSize: fontSize.xxl, fontFamily: "Inter_700Bold" },
  periodRow: {
    flexDirection: "row",
    borderRadius: radius.lg,
    padding: 4,
    gap: 4,
  },
  periodChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.md,
  },
  periodChipText: { fontSize: fontSize.sm, fontFamily: "Inter_600SemiBold" },
  loadingBox: { height: 200, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    gap: 4,
  },
  statAmount: { fontSize: fontSize.sm, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: fontSize.xs, fontFamily: "Inter_400Regular" },
  card: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  cardTitle: { fontSize: fontSize.lg, fontFamily: "Inter_600SemiBold" },
  legendRow: { flexDirection: "row", gap: spacing.md },
  legendItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: fontSize.xs, fontFamily: "Inter_400Regular" },
  chartWrapper: { alignItems: "center", marginTop: spacing.sm },
  savingsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  savingsRate: { fontSize: fontSize.xl, fontFamily: "Inter_700Bold" },
  progressTrack: { height: 10, borderRadius: 5, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 5 },
  savingsTip: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular" },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  tableHeaderText: { flex: 1, fontSize: fontSize.xs, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  tableCell: { flex: 1, fontSize: fontSize.sm, fontFamily: "Inter_400Regular" },
  highlightsRow: { flexDirection: "row", gap: spacing.sm },
  highlightCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    gap: 4,
  },
  highlightTitle: { fontSize: fontSize.xs, fontFamily: "Inter_500Medium" },
  highlightVal: { fontSize: fontSize.xl, fontFamily: "Inter_700Bold" },
  highlightSub: { fontSize: fontSize.xs, fontFamily: "Inter_400Regular" },
});
