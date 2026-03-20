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
import Svg, { Rect, G, Text as SvgText } from "react-native-svg";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { useFinance } from "@/context/FinanceContext";
import { useProfile } from "@/context/ProfileContext";
import { spacing, radius, fontSize } from "@/constants/theme";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

type MonthSummary = { month: number; year: number; income: number; expense: number; balance: number };
type PeriodOption = 3 | 6 | 12;

function BarChart({ data, width, colors, currency }: { data: MonthSummary[]; width: number; colors: any; currency: string }) {
  const chartH = 170;
  const padBottom = 30;
  const innerH = chartH - padBottom;
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  const groupW = width / data.length;
  const barW = Math.max(7, (groupW - 16) / 2);

  return (
    <Svg width={width} height={chartH}>
      {data.map((d, i) => {
        const x = i * groupW + (groupW - barW * 2 - 5) / 2;
        const incH = Math.max(3, (d.income / maxVal) * innerH);
        const expH = Math.max(3, (d.expense / maxVal) * innerH);
        return (
          <G key={i}>
            <Rect x={x} y={innerH - incH} width={barW} height={incH} rx={5} fill={colors.income} opacity={0.88} />
            <Rect x={x + barW + 5} y={innerH - expH} width={barW} height={expH} rx={5} fill={colors.expense} opacity={0.88} />
            <SvgText x={x + barW + 2.5} y={chartH - 8} textAnchor="middle" fontSize={9.5} fill={colors.textTertiary} fontFamily="System">
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

  useEffect(() => { setLoading(true); loadData().finally(() => setLoading(false)); }, [period]);
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const totalIncome = monthData.reduce((s, d) => s + d.income, 0);
  const totalExpense = monthData.reduce((s, d) => s + d.expense, 0);
  const totalBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  const bestMonth = [...monthData].sort((a, b) => b.balance - a.balance)[0];
  const worstMonth = [...monthData].sort((a, b) => b.expense - a.expense)[0];

  const fmt = (n: number) => `${currency}${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + spacing.md, paddingBottom: bottomPad, paddingHorizontal: spacing.md, gap: spacing.md }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.text }]}>Reports</Text>

      {/* Period Selector */}
      <View style={[styles.periodRow, { backgroundColor: colors.surface }]}>
        {([3, 6, 12] as PeriodOption[]).map(p => (
          <Pressable
            key={p}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPeriod(p); }}
            style={[styles.periodChip, { backgroundColor: period === p ? colors.tint : "transparent" }]}
          >
            <Text style={[styles.periodChipText, { color: period === p ? "#fff" : colors.textSecondary }]}>{p} Months</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.tint} size="large" />
        </View>
      ) : (
        <>
          {/* Summary Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.income + "14" }]}>
              <Ionicons name="arrow-down-circle" size={22} color={colors.income} />
              <Text style={[styles.statAmt, { color: colors.text }]}>{fmt(totalIncome)}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Income</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.expense + "14" }]}>
              <Ionicons name="arrow-up-circle" size={22} color={colors.expense} />
              <Text style={[styles.statAmt, { color: colors.text }]}>{fmt(totalExpense)}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Expenses</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: (totalBalance >= 0 ? colors.income : colors.expense) + "14" }]}>
              <Ionicons name="wallet" size={22} color={totalBalance >= 0 ? colors.income : colors.expense} />
              <Text style={[styles.statAmt, { color: totalBalance >= 0 ? colors.income : colors.expense }]}>
                {totalBalance >= 0 ? "+" : "-"}{fmt(totalBalance)}
              </Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Net</Text>
            </View>
          </View>

          {/* Bar Chart */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Income vs Expenses</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.income }]} /><Text style={[styles.legendLbl, { color: colors.textSecondary }]}>Income</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.expense }]} /><Text style={[styles.legendLbl, { color: colors.textSecondary }]}>Expenses</Text></View>
            </View>
            <View style={styles.chartWrap}>
              <BarChart data={monthData} width={320} colors={colors} currency={currency} />
            </View>
          </View>

          {/* Savings Rate */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.savingsHeader}>
              <View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Savings Rate</Text>
                <Text style={[styles.savingsTip, { color: colors.textSecondary }]}>
                  {savingsRate >= 30 ? "Excellent! Keep it up." : savingsRate >= 20 ? "Good savings habit." : savingsRate >= 0 ? "Try to save at least 20%." : "Spending exceeds income."}
                </Text>
              </View>
              <Text style={[styles.savingsRate, { color: savingsRate >= 0 ? colors.income : colors.expense }]}>
                {savingsRate.toFixed(1)}%
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.borderLight }]}>
              <View style={[styles.progressFill, {
                width: `${Math.min(100, Math.max(0, savingsRate))}%`,
                backgroundColor: savingsRate >= 20 ? colors.income : savingsRate >= 0 ? "#F59E0B" : colors.expense,
              }]} />
            </View>
          </View>

          {/* Highlights */}
          {monthData.length > 0 && bestMonth && worstMonth && (
            <View style={styles.highlightsRow}>
              <View style={[styles.highlightCard, { backgroundColor: colors.income + "14" }]}>
                <Ionicons name="trending-up" size={22} color={colors.income} />
                <Text style={[styles.hlTitle, { color: colors.textSecondary }]}>Best Month</Text>
                <Text style={[styles.hlVal, { color: colors.income }]}>{MONTHS_SHORT[(bestMonth.month || 1) - 1]}</Text>
                <Text style={[styles.hlSub, { color: colors.textSecondary }]}>+{fmt(bestMonth.balance)}</Text>
              </View>
              <View style={[styles.highlightCard, { backgroundColor: colors.expense + "14" }]}>
                <Ionicons name="trending-down" size={22} color={colors.expense} />
                <Text style={[styles.hlTitle, { color: colors.textSecondary }]}>Most Spent</Text>
                <Text style={[styles.hlVal, { color: colors.expense }]}>{MONTHS_SHORT[(worstMonth.month || 1) - 1]}</Text>
                <Text style={[styles.hlSub, { color: colors.textSecondary }]}>{fmt(worstMonth.expense)}</Text>
              </View>
            </View>
          )}

          {/* Monthly Breakdown Table */}
          <View style={[styles.card, { backgroundColor: colors.surface, padding: 0, overflow: "hidden" }]}>
            <View style={[styles.tableHdr, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.tableHdrCell, { color: colors.textTertiary, flex: 2 }]}>Month</Text>
              <Text style={[styles.tableHdrCell, { color: colors.textTertiary }]}>Income</Text>
              <Text style={[styles.tableHdrCell, { color: colors.textTertiary }]}>Expense</Text>
              <Text style={[styles.tableHdrCell, { color: colors.textTertiary }]}>Net</Text>
            </View>
            {[...monthData].reverse().map((d, i) => {
              const net = d.income - d.expense;
              return (
                <View key={i} style={[styles.tableRow, i < monthData.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
                  <Text style={[styles.tableCell, { color: colors.text, flex: 2, fontFamily: "Inter_500Medium" }]}>
                    {MONTHS_SHORT[d.month - 1]} '{String(d.year).slice(2)}
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
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  pageTitle: { fontSize: fontSize.xxl, fontFamily: "Inter_700Bold" },
  periodRow: { flexDirection: "row", borderRadius: radius.xl, padding: 5, gap: 4 },
  periodChip: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: radius.lg },
  periodChipText: { fontSize: fontSize.sm, fontFamily: "Inter_600SemiBold" },
  loadingBox: { height: 200, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  statCard: { flex: 1, borderRadius: radius.xl, padding: spacing.md, alignItems: "center", gap: 5 },
  statAmt: { fontSize: fontSize.sm, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 11, fontFamily: "Inter_400Regular" },
  card: { borderRadius: radius.xl, padding: spacing.md, gap: spacing.sm },
  cardHeader: { marginBottom: 2 },
  cardTitle: { fontSize: fontSize.lg, fontFamily: "Inter_600SemiBold" },
  legendRow: { flexDirection: "row", gap: spacing.md },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLbl: { fontSize: 12, fontFamily: "Inter_400Regular" },
  chartWrap: { alignItems: "center", marginTop: spacing.xs },
  savingsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  savingsRate: { fontSize: 28, fontFamily: "Inter_700Bold" },
  savingsTip: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  highlightsRow: { flexDirection: "row", gap: spacing.sm },
  highlightCard: { flex: 1, borderRadius: radius.xl, padding: spacing.md, alignItems: "center", gap: 4 },
  hlTitle: { fontSize: 11, fontFamily: "Inter_500Medium" },
  hlVal: { fontSize: fontSize.xl, fontFamily: "Inter_700Bold" },
  hlSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  tableHdr: { flexDirection: "row", paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1 },
  tableHdrCell: { flex: 1, fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", paddingHorizontal: spacing.md, paddingVertical: 14 },
  tableCell: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
});
