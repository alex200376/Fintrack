import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { useFinance, type Transaction, type Category, type TransactionType } from "@/context/FinanceContext";
import { spacing, radius, fontSize } from "@/constants/theme";

const ICON_MAP: Record<string, string> = {
  restaurant: "restaurant",
  car: "car",
  cart: "cart",
  medical: "medical",
  tv: "tv",
  receipt: "receipt",
  school: "school",
  airplane: "airplane",
  cash: "cash",
  laptop: "laptop-outline",
  "trending-up": "trending-up",
  gift: "gift",
  "ellipsis-horizontal": "ellipsis-horizontal",
};

export default function TransactionDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fetchTransactions, updateTransaction, deleteTransaction, fetchCategories } = useFinance();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editType, setEditType] = useState<TransactionType>("expense");

  const load = useCallback(async () => {
    const [txns, cats] = await Promise.all([fetchTransactions(), fetchCategories()]);
    const t = txns.find((tx: Transaction) => tx.id === id);
    if (t) {
      setTransaction(t);
      setEditAmount(String(t.amount));
      setEditNote(t.note ?? "");
      setEditDate(t.date);
      setEditType(t.type);
      const cat = cats.find((c: Category) => c.id === t.categoryId);
      setEditCategory(cat ?? null);
    }
    setCategories(cats);
  }, [id, fetchTransactions, fetchCategories]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, []);

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Transaction", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteTransaction(id!);
          router.back();
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!editAmount || parseFloat(editAmount) <= 0 || !editCategory) return;
    try {
      setSaving(true);
      await updateTransaction(id!, {
        amount: parseFloat(editAmount),
        type: editType,
        categoryId: editCategory.id,
        note: editNote.trim() || undefined,
        date: editDate,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditing(false);
      await load();
    } catch {
      Alert.alert("Error", "Could not update transaction");
    } finally {
      setSaving(false);
    }
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topPadding }]}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topPadding }]}>
        <Text style={[styles.notFound, { color: colors.text }]}>Transaction not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.goBack, { color: colors.tint }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const iconName = (ICON_MAP[transaction.categoryIcon] || "ellipsis-horizontal") as any;
  const isIncome = transaction.type === "income";

  const filteredCategories = categories.filter(c =>
    c.type === editType || c.type === "both"
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[styles.header, { paddingTop: topPadding + spacing.sm }]}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {editing ? "Edit Transaction" : "Transaction"}
        </Text>
        <View style={styles.headerActions}>
          {editing ? (
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={[styles.actionButton, { backgroundColor: colors.tint }]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>Save</Text>
              )}
            </Pressable>
          ) : (
            <>
              <Pressable onPress={() => setEditing(true)} hitSlop={8}>
                <Ionicons name="pencil" size={20} color={colors.tint} />
              </Pressable>
              <Pressable onPress={handleDelete} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color={colors.expense} />
              </Pressable>
            </>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!editing ? (
          <>
            {/* Amount Hero */}
            <View style={[styles.heroCard, { backgroundColor: colors.tint }]}>
              <View style={[styles.heroIcon, { backgroundColor: transaction.categoryColor + "30" }]}>
                <Ionicons name={iconName} size={28} color="#fff" />
              </View>
              <Text style={styles.heroAmount}>
                {isIncome ? "+" : "-"}${transaction.amount.toFixed(2)}
              </Text>
              <Text style={styles.heroCategory}>{transaction.categoryName}</Text>
            </View>

            {/* Details */}
            <View style={[styles.detailCard, { backgroundColor: colors.surface }]}>
              <DetailRow label="Type" value={transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} colors={colors} />
              <View style={[styles.detailDivider, { backgroundColor: colors.borderLight }]} />
              <DetailRow label="Date" value={new Date(transaction.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} colors={colors} />
              {transaction.note && (
                <>
                  <View style={[styles.detailDivider, { backgroundColor: colors.borderLight }]} />
                  <DetailRow label="Note" value={transaction.note} colors={colors} />
                </>
              )}
            </View>
          </>
        ) : (
          <>
            {/* Type Toggle */}
            <View style={[styles.typeToggle, { backgroundColor: colors.surface }]}>
              {(["expense", "income"] as TransactionType[]).map(t => (
                <Pressable
                  key={t}
                  onPress={() => {
                    setEditType(t);
                    setEditCategory(null);
                  }}
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor:
                        editType === t
                          ? t === "expense" ? colors.expense : colors.income
                          : "transparent",
                    },
                  ]}
                >
                  <Text style={[styles.typeButtonText, { color: editType === t ? "#fff" : colors.textSecondary }]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Amount */}
            <View style={[styles.fieldCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Amount</Text>
              <View style={styles.amountRow}>
                <Text style={[styles.currencySign, { color: editType === "expense" ? colors.expense : colors.income }]}>$</Text>
                <TextInput
                  style={[styles.amountInput, { color: editType === "expense" ? colors.expense : colors.income }]}
                  value={editAmount}
                  onChangeText={setEditAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            {/* Date */}
            <View style={[styles.fieldCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Date</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.text }]}
                value={editDate}
                onChangeText={setEditDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Note */}
            <View style={[styles.fieldCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Note</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.text }]}
                value={editNote}
                onChangeText={setEditNote}
                placeholder="Add a note..."
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Category */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CATEGORY</Text>
            <View style={styles.categoryGrid}>
              {filteredCategories.map(cat => {
                const isSelected = editCategory?.id === cat.id;
                const catIcon = (ICON_MAP[cat.icon] || "ellipsis-horizontal") as any;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setEditCategory(cat)}
                    style={[
                      styles.categoryItem,
                      {
                        backgroundColor: isSelected ? cat.color + "20" : colors.surface,
                        borderColor: isSelected ? cat.color : colors.border,
                        borderWidth: isSelected ? 1.5 : 1,
                      },
                    ]}
                  >
                    <View style={[styles.categoryIconContainer, { backgroundColor: cat.color + "20" }]}>
                      <Ionicons name={catIcon} size={18} color={cat.color} />
                    </View>
                    <Text style={[styles.categoryName, { color: isSelected ? cat.color : colors.text }]} numberOfLines={1}>
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  notFound: { fontSize: fontSize.lg, fontFamily: "Inter_500Medium" },
  goBack: { fontSize: fontSize.md, fontFamily: "Inter_400Regular" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontFamily: "Inter_600SemiBold",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.full,
    minWidth: 56,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: fontSize.md,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  heroCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  heroAmount: {
    color: "#fff",
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
  },
  heroCategory: {
    color: "rgba(255,255,255,0.8)",
    fontSize: fontSize.md,
    fontFamily: "Inter_500Medium",
  },
  detailCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSize.md,
    fontFamily: "Inter_400Regular",
  },
  detailValue: {
    fontSize: fontSize.md,
    fontFamily: "Inter_500Medium",
    textAlign: "right",
    flex: 1,
    marginLeft: spacing.md,
  },
  detailDivider: { height: 1 },
  typeToggle: {
    flexDirection: "row",
    borderRadius: radius.lg,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
  },
  typeButtonText: {
    fontSize: fontSize.md,
    fontFamily: "Inter_600SemiBold",
  },
  fieldCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_400Regular",
  },
  fieldInput: {
    fontSize: fontSize.lg,
    fontFamily: "Inter_500Medium",
    padding: 0,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  currencySign: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  amountInput: {
    flex: 1,
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    padding: 0,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    paddingHorizontal: spacing.xs,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  categoryItem: {
    width: "30%",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
});
