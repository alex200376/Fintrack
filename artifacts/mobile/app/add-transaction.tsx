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
import { useFinance, type Category, type TransactionType } from "@/context/FinanceContext";
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

export default function AddTransactionScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { fetchCategories, createTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const loadCategories = useCallback(async () => {
    const data = await fetchCategories();
    setCategories(data);
  }, [fetchCategories]);

  useEffect(() => {
    setLoading(true);
    loadCategories().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSelectedCategory(null);
  }, [type]);

  const filteredCategories = categories.filter(c =>
    c.type === type || c.type === "both"
  );

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleaned);
  };

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
      await createTransaction({
        amount: parseFloat(amount),
        type,
        categoryId: selectedCategory.id,
        note: note.trim() || undefined,
        date,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err) {
      Alert.alert("Error", "Could not save transaction");
    } finally {
      setSaving(false);
    }
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPadding + spacing.sm,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Transaction</Text>
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
        {/* Type Toggle */}
        <View style={[styles.typeToggle, { backgroundColor: colors.surface }]}>
          {(["expense", "income"] as TransactionType[]).map(t => (
            <Pressable
              key={t}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setType(t);
              }}
              style={[
                styles.typeButton,
                {
                  backgroundColor:
                    type === t
                      ? t === "expense"
                        ? colors.expense
                        : colors.income
                      : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  { color: type === t ? "#fff" : colors.textSecondary },
                ]}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Amount Input */}
        <View style={[styles.amountCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Amount</Text>
          <View style={styles.amountRow}>
            <Text
              style={[
                styles.currencySign,
                { color: type === "expense" ? colors.expense : colors.income },
              ]}
            >
              $
            </Text>
            <TextInput
              style={[
                styles.amountInput,
                { color: type === "expense" ? colors.expense : colors.income },
              ]}
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              autoFocus
            />
          </View>
        </View>

        {/* Date */}
        <View style={[styles.fieldCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Date</Text>
          <TextInput
            style={[styles.fieldInput, { color: colors.text }]}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Note */}
        <View style={[styles.fieldCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Note (optional)</Text>
          <TextInput
            style={[styles.fieldInput, { color: colors.text }]}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note..."
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Category Selection */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CATEGORY</Text>
        {loading ? (
          <ActivityIndicator color={colors.tint} />
        ) : (
          <View style={styles.categoryGrid}>
            {filteredCategories.map(cat => {
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
                  <View
                    style={[
                      styles.categoryIconContainer,
                      { backgroundColor: cat.color + "20" },
                    ]}
                  >
                    <Ionicons name={iconName} size={20} color={cat.color} />
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      { color: isSelected ? cat.color : colors.text },
                    ]}
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
