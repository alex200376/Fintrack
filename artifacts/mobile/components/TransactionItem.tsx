import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius, fontSize, fontWeight } from "@/constants/theme";
import type { Transaction } from "@/context/FinanceContext";

interface Props {
  transaction: Transaction;
  onPress?: () => void;
}

function formatAmount(amount: number, type: string) {
  const sign = type === "income" ? "+" : "-";
  return `${sign}$${amount.toFixed(2)}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const txDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = today.getTime() - txDate.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

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

export function TransactionItem({ transaction, onPress }: Props) {
  const { colors } = useTheme();
  const isIncome = transaction.type === "income";
  const iconName = (ICON_MAP[transaction.categoryIcon] || "ellipsis-horizontal") as any;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.surface,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: transaction.categoryColor + "20" },
        ]}
      >
        <Ionicons
          name={iconName}
          size={20}
          color={transaction.categoryColor}
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>
          {transaction.categoryName}
        </Text>
        {transaction.note ? (
          <Text style={[styles.note, { color: colors.textSecondary }]} numberOfLines={1}>
            {transaction.note}
          </Text>
        ) : (
          <Text style={[styles.note, { color: colors.textTertiary }]}>
            {formatDate(transaction.date)}
          </Text>
        )}
      </View>
      <View style={styles.right}>
        <Text
          style={[
            styles.amount,
            { color: isIncome ? colors.income : colors.expense },
          ]}
        >
          {formatAmount(transaction.amount, transaction.type)}
        </Text>
        {transaction.note ? (
          <Text style={[styles.dateRight, { color: colors.textTertiary }]}>
            {formatDate(transaction.date)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 3,
  },
  categoryName: {
    fontSize: fontSize.md,
    fontFamily: "Inter_500Medium",
  },
  note: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_400Regular",
  },
  right: {
    alignItems: "flex-end",
    gap: 3,
  },
  amount: {
    fontSize: fontSize.md,
    fontFamily: "Inter_600SemiBold",
  },
  dateRight: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_400Regular",
  },
});
