import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius, fontSize } from "@/constants/theme";
import type { Budget } from "@/context/FinanceContext";

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
  home: "home-outline",
  heart: "heart-outline",
  fitness: "fitness-outline",
  "game-controller": "game-controller-outline",
  cafe: "cafe-outline",
  bicycle: "bicycle-outline",
  book: "book-outline",
  briefcase: "briefcase-outline",
  beer: "beer-outline",
  paw: "paw-outline",
  leaf: "leaf-outline",
  "musical-notes": "musical-notes-outline",
  "ellipsis-horizontal": "ellipsis-horizontal",
};

interface Props {
  budget: Budget;
  onDelete?: () => void;
}

export function BudgetCard({ budget, onDelete }: Props) {
  const { colors } = useTheme();
  const progress = Math.min(budget.spent / budget.amount, 1);
  const remaining = budget.amount - budget.spent;
  const isOverBudget = budget.spent > budget.amount;
  const iconName = (ICON_MAP[budget.categoryIcon] || "ellipsis-horizontal") as any;

  const barColor = isOverBudget
    ? colors.expense
    : progress > 0.8
    ? colors.gold
    : colors.income;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.left}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: budget.categoryColor + "20" },
            ]}
          >
            <Ionicons name={iconName} size={18} color={budget.categoryColor} />
          </View>
          <View>
            <Text style={[styles.name, { color: colors.text }]}>
              {budget.categoryName}
            </Text>
            <Text style={[styles.period, { color: colors.textSecondary }]}>
              {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)}
            </Text>
          </View>
        </View>
        <View style={styles.right}>
          <Text style={[styles.budgetAmount, { color: colors.text }]}>
            ${budget.amount.toFixed(0)}
          </Text>
          {onDelete && (
            <Pressable onPress={onDelete} hitSlop={8}>
              <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%` as any,
                backgroundColor: barColor,
              },
            ]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={[styles.spentLabel, { color: colors.textSecondary }]}>
            ${budget.spent.toFixed(2)} spent
          </Text>
          <Text
            style={[
              styles.remainingLabel,
              { color: isOverBudget ? colors.expense : colors.textSecondary },
            ]}
          >
            {isOverBudget
              ? `$${Math.abs(remaining).toFixed(2)} over`
              : `$${remaining.toFixed(2)} left`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: fontSize.md,
    fontFamily: "Inter_500Medium",
  },
  period: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_400Regular",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  budgetAmount: {
    fontSize: fontSize.lg,
    fontFamily: "Inter_700Bold",
  },
  progressSection: {
    gap: spacing.xs,
  },
  progressBar: {
    height: 8,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  spentLabel: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
  remainingLabel: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_500Medium",
  },
});
