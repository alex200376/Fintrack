import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { useFinance, type Category } from "@/context/FinanceContext";
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

const PERIODS = ["monthly", "weekly", "yearly"] as const;

export default function AddBudgetScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { fetchCategories, createBudget } = useFinance();

  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<"monthly" | "weekly" | "yearly">("monthly");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    const data = await fetchCategories();
    const expenseCategories = data.filter((c: Category) => c.type === "expense" || c.type === "both");
    setCategories(expenseCategories);
  }, [fetchCategories]);

  useEffect(() => {
    setLoading(true);
    loadCategories().finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("No Category", "Please select a category");
      return;
    }
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await createBudget({
        categoryId: selectedCategory.id,
        amount: parseFloat(amount),
        period,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Could not save budget");
    } finally {
      setSaving(false);
    }
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Budget</Text>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveButton, { backgroundColor: colors.tint, opacity: saving ? 0.7 : 1 }]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + spacing.lg }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Amount */}
        <View style={[styles.amountCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Budget Amount</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.currencySign, { color: colors.tint }]}>$</Text>
            <TextInput
              style={[styles.amountInput, { color: colors.tint }]}
              value={amount}
              onChangeText={v => {
                const cleaned = v.replace(/[^0-9.]/g, "");
                const parts = cleaned.split(".");
                if (parts.length > 2) return;
                if (parts[1] && parts[1].length > 2) return;
                setAmount(cleaned);
              }}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              autoFocus
            />
          </View>
        </View>

        {/* Period */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PERIOD</Text>
        <View style={[styles.periodRow, { backgroundColor: colors.surface }]}>
          {PERIODS.map(p => (
            <Pressable
              key={p}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPeriod(p);
              }}
              style={[
                styles.periodButton,
                { backgroundColor: period === p ? colors.tint : "transparent" },
              ]}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  { color: period === p ? "#fff" : colors.textSecondary },
                ]}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Category */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CATEGORY</Text>
        {loading ? (
          <ActivityIndicator color={colors.tint} />
        ) : (
          <View style={styles.categoryGrid}>
            {categories.map(cat => {
              const isSelected = selectedCategory?.id === cat.id;
              const iconName = (ICON_MAP[cat.icon] || "ellipsis-horizontal") as any;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(cat);
                  }}
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
                    <Ionicons name={iconName} size={20} color={cat.color} />
                  </View>
                  <Text
                    style={[styles.categoryName, { color: isSelected ? cat.color : colors.text }]}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
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
  headerTitle: {
    fontSize: fontSize.lg,
    fontFamily: "Inter_600SemiBold",
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.full,
    minWidth: 60,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: fontSize.md,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  amountCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  amountLabel: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_400Regular",
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
  periodRow: {
    flexDirection: "row",
    borderRadius: radius.lg,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
  },
  periodButtonText: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_600SemiBold",
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
    width: 44,
    height: 44,
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
