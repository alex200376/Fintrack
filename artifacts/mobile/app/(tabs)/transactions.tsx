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
import { TransactionItem } from "@/components/TransactionItem";
import { spacing, radius, fontSize } from "@/constants/theme";

const FILTERS = ["All", "Income", "Expense"] as const;
type Filter = typeof FILTERS[number];

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { fetchTransactions } = useFinance();
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

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const filtered = transactions.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.categoryName.toLowerCase().includes(q) ||
      (t.note ?? "").toLowerCase().includes(q)
    );
  });

  const grouped: { title: string; data: Transaction[] }[] = [];
  const groupMap = new Map<string, Transaction[]>();
  for (const t of filtered) {
    const date = new Date(t.date);
    const key = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(t);
  }
  for (const [title, data] of groupMap) {
    grouped.push({ title, data });
  }

  const flatData: Array<{ type: "header"; title: string } | { type: "item"; transaction: Transaction; isLast: boolean }> = [];
  for (const group of grouped) {
    flatData.push({ type: "header", title: group.title });
    group.data.forEach((t, i) => {
      flatData.push({ type: "item", transaction: t, isLast: i === group.data.length - 1 });
    });
  }

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPadding + spacing.md,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Transactions</Text>
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

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search transactions..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <Pressable
            key={f}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilter(f);
            }}
            style={[
              styles.filterTab,
              {
                backgroundColor: filter === f ? colors.tint : colors.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f ? "#fff" : colors.textSecondary },
              ]}
            >
              {f}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : flatData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={56} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No transactions</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Add your first transaction to get started
          </Text>
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item, i) =>
            item.type === "header" ? `header-${item.title}` : item.transaction.id
          }
          renderItem={({ item }) => {
            if (item.type === "header") {
              return (
                <Text style={[styles.groupHeader, { color: colors.textSecondary }]}>
                  {item.title}
                </Text>
              );
            }
            return (
              <View style={{ backgroundColor: colors.surface, marginHorizontal: spacing.md }}>
                <TransactionItem
                  transaction={item.transaction}
                  onPress={() =>
                    router.push({
                      pathname: "/transaction-detail",
                      params: { id: item.transaction.id },
                    })
                  }
                />
                {!item.isLast && (
                  <View
                    style={[styles.separator, { backgroundColor: colors.borderLight }]}
                  />
                )}
              </View>
            );
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
          }
          contentContainerStyle={{
            paddingBottom: Platform.OS === "web" ? 34 + 84 : 100,
          }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.full,
  },
  filterText: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_500Medium",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.xl,
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
  },
  groupHeader: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  separator: {
    height: 1,
    marginHorizontal: spacing.md,
  },
});
