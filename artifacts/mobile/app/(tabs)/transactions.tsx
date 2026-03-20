import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Platform,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { useFinance, type Transaction } from "@/context/FinanceContext";
import { useProfile } from "@/context/ProfileContext";
import { TransactionItem } from "@/components/TransactionItem";
import { spacing, radius, fontSize } from "@/constants/theme";

const FILTERS = ["All", "Income", "Expense"] as const;
type Filter = typeof FILTERS[number];

function groupByMonth(transactions: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    const date = new Date(tx.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

function formatGroupKey(key: string) {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  const now = new Date();
  if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) return "This Month";
  if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() - 1) return "Last Month";
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { fetchTransactions } = useFinance();
  const { profile } = useProfile();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    const params: Record<string, string> = {};
    if (filter === "Income") params.type = "income";
    if (filter === "Expense") params.type = "expense";
    const data = await fetchTransactions(Object.keys(params).length > 0 ? params : undefined);
    setTransactions(data);
  }, [fetchTransactions, filter]);

  useEffect(() => { setLoading(true); loadData().finally(() => setLoading(false)); }, [filter]);
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, [loadData]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;
  const cur = profile.currency || "$";

  const filtered = search.trim()
    ? transactions.filter(t =>
        t.categoryName.toLowerCase().includes(search.toLowerCase()) ||
        (t.note ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : transactions;

  const grouped = groupByMonth(filtered);

  const totalIncome = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  type ListItem =
    | { type: "stats" }
    | { type: "search" }
    | { type: "filters" }
    | { type: "header"; key: string; label: string }
    | { type: "transaction"; transaction: Transaction; isLast: boolean }
    | { type: "empty" };

  const listData: ListItem[] = [
    { type: "stats" },
    { type: "search" },
    { type: "filters" },
  ];

  if (loading) {
    // empty
  } else if (grouped.length === 0) {
    listData.push({ type: "empty" });
  } else {
    for (const [key, txs] of grouped) {
      listData.push({ type: "header", key, label: formatGroupKey(key) });
      txs.forEach((tx, i) => listData.push({ type: "transaction", transaction: tx, isLast: i === txs.length - 1 }));
    }
  }

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === "stats") {
      return (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.income + "14" }]}>
            <Ionicons name="arrow-down-circle" size={18} color={colors.income} />
            <Text style={[styles.statAmt, { color: colors.income }]}>
              {cur}{totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Income</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.expense + "14" }]}>
            <Ionicons name="arrow-up-circle" size={18} color={colors.expense} />
            <Text style={[styles.statAmt, { color: colors.expense }]}>
              {cur}{totalExpense.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Expenses</Text>
          </View>
        </View>
      );
    }
    if (item.type === "search") {
      return (
        <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search transactions..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      );
    }
    if (item.type === "filters") {
      return (
        <View style={styles.filtersRow}>
          {FILTERS.map(f => (
            <Pressable
              key={f}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter(f); }}
              style={[styles.filterChip, { backgroundColor: filter === f ? colors.tint : colors.surface }]}
            >
              <Text style={[styles.filterChipText, { color: filter === f ? "#fff" : colors.textSecondary }]}>{f}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/add-transaction"); }}
            style={[styles.addChip, { backgroundColor: colors.tint }]}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addChipText}>Add</Text>
          </Pressable>
        </View>
      );
    }
    if (item.type === "header") {
      return <Text style={[styles.groupHeader, { color: colors.textSecondary }]}>{item.label}</Text>;
    }
    if (item.type === "transaction") {
      const { transaction, isLast } = item;
      return (
        <View style={[styles.txGroup, { backgroundColor: colors.surface }]}>
          <TransactionItem
            transaction={transaction}
            onPress={() => router.push({ pathname: "/transaction-detail", params: { id: transaction.id } })}
          />
          {!isLast && <View style={[styles.sep, { backgroundColor: colors.borderLight }]} />}
        </View>
      );
    }
    if (item.type === "empty") {
      return (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="receipt-outline" size={52} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No transactions</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            {search || filter !== "All" ? "Try adjusting your filters" : "Add your first transaction above"}
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <FlatList
      style={[styles.list, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + spacing.md, paddingBottom: bottomPad, paddingHorizontal: spacing.md, gap: 2 }}
      data={listData}
      keyExtractor={(item, i) => {
        if (item.type === "transaction") return item.transaction.id;
        if (item.type === "header") return `header-${item.key}`;
        return `${item.type}-${i}`;
      }}
      renderItem={renderItem}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
      ListHeaderComponent={
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Transactions</Text>
          {loading && <ActivityIndicator color={colors.tint} />}
        </View>
      }
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={({ leadingItem }) => {
        if (!leadingItem) return null;
        if (leadingItem.type === "transaction") return null;
        return <View style={{ height: spacing.sm }} />;
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  pageHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  pageTitle: { fontSize: fontSize.xxl, fontFamily: "Inter_700Bold" },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  statCard: { flex: 1, borderRadius: radius.xl, padding: spacing.md, alignItems: "center", gap: 4 },
  statAmt: { fontSize: fontSize.md, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 12, fontFamily: "Inter_400Regular" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: fontSize.md, fontFamily: "Inter_400Regular", padding: 0 },
  filtersRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md, alignItems: "center" },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: 9, borderRadius: radius.full },
  filterChipText: { fontSize: fontSize.sm, fontFamily: "Inter_500Medium" },
  addChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.md, paddingVertical: 9, borderRadius: radius.full, marginLeft: "auto" },
  addChipText: { color: "#fff", fontSize: fontSize.sm, fontFamily: "Inter_600SemiBold" },
  groupHeader: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, paddingHorizontal: 4, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  txGroup: { borderRadius: radius.xl, overflow: "hidden" },
  sep: { height: 1, marginHorizontal: spacing.md },
  emptyCard: { borderRadius: radius.xl, padding: 48, alignItems: "center", gap: spacing.sm, marginTop: spacing.xl },
  emptyTitle: { fontSize: fontSize.lg, fontFamily: "Inter_500Medium" },
  emptySub: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular", textAlign: "center" },
});
