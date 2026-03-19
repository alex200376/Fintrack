import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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
  "ellipsis-horizontal": "ellipsis-horizontal",
};

export default function SettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { fetchCategories, deleteCategory } = useFinance();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

  const loadData = useCallback(async () => {
    const data = await fetchCategories();
    setCategories(data);
  }, [fetchCategories]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, []);

  const handleDeleteCategory = (cat: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete Category",
      `Delete "${cat.name}"? Existing transactions will still reference it.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCategory(cat.id);
              await loadData();
            } catch {
              Alert.alert("Error", "Could not delete category");
            }
          },
        },
      ]
    );
  };

  const filtered = categories.filter(c =>
    activeTab === "expense"
      ? c.type === "expense" || c.type === "both"
      : c.type === "income" || c.type === "both"
  );

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPadding + spacing.md,
          paddingBottom: Platform.OS === "web" ? 34 + 84 : 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

      {/* About Card */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.aboutHeader}>
          <View style={[styles.aboutIcon, { backgroundColor: colors.tint }]}>
            <Ionicons name="wallet" size={24} color="#fff" />
          </View>
          <View>
            <Text style={[styles.aboutTitle, { color: colors.text }]}>Personal Finance</Text>
            <Text style={[styles.aboutSubtitle, { color: colors.textSecondary }]}>
              Track your income and expenses
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Tips */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>QUICK TIPS</Text>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        {[
          { icon: "add-circle-outline", text: "Add transactions with the + button" },
          { icon: "filter-outline", text: "Filter transactions by type in the Transactions tab" },
          { icon: "wallet-outline", text: "Set budgets to track spending limits" },
          { icon: "pie-chart-outline", text: "View spending breakdown in the Dashboard" },
        ].map((tip, i) => (
          <View key={i}>
            <View style={styles.tipRow}>
              <Ionicons name={tip.icon as any} size={20} color={colors.tint} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip.text}</Text>
            </View>
            {i < 3 && <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />}
          </View>
        ))}
      </View>

      {/* Categories */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CATEGORIES</Text>
      <View style={styles.tabRow}>
        {(["expense", "income"] as const).map(tab => (
          <Pressable
            key={tab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab);
            }}
            style={[
              styles.tab,
              { backgroundColor: activeTab === tab ? colors.tint : colors.surface },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? "#fff" : colors.textSecondary },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.tint} style={{ marginTop: spacing.lg }} />
      ) : (
        <View style={[styles.card, { backgroundColor: colors.surface, padding: 0 }]}>
          {filtered.map((cat, i) => {
            const iconName = (ICON_MAP[cat.icon] || "ellipsis-horizontal") as any;
            return (
              <View key={cat.id}>
                <View style={styles.categoryRow}>
                  <View style={[styles.catIcon, { backgroundColor: cat.color + "20" }]}>
                    <Ionicons name={iconName} size={18} color={cat.color} />
                  </View>
                  <Text style={[styles.catName, { color: colors.text }]}>{cat.name}</Text>
                  <View style={[styles.catTypeBadge, { backgroundColor: colors.borderLight }]}>
                    <Text style={[styles.catTypeText, { color: colors.textSecondary }]}>{cat.type}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleDeleteCategory(cat)}
                    hitSlop={8}
                    style={{ marginLeft: spacing.sm }}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
                  </Pressable>
                </View>
                {i < filtered.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.borderLight, marginHorizontal: spacing.md }]} />
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.md, gap: spacing.md },
  title: {
    fontSize: fontSize.xxl,
    fontFamily: "Inter_700Bold",
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  aboutHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  aboutIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  aboutTitle: {
    fontSize: fontSize.lg,
    fontFamily: "Inter_600SemiBold",
  },
  aboutSubtitle: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    paddingHorizontal: spacing.xs,
    marginBottom: -spacing.xs,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  tipText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    height: 1,
  },
  tabRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: -spacing.xs,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.full,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_500Medium",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  catIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  catName: {
    flex: 1,
    fontSize: fontSize.md,
    fontFamily: "Inter_400Regular",
  },
  catTypeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  catTypeText: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
});
