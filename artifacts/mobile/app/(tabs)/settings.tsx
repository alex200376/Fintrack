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
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { useFinance, type Category } from "@/context/FinanceContext";
import { spacing, radius, fontSize } from "@/constants/theme";

const ICON_OPTIONS = [
  { key: "restaurant", icon: "restaurant" },
  { key: "car", icon: "car" },
  { key: "cart", icon: "cart" },
  { key: "medical", icon: "medical" },
  { key: "tv", icon: "tv" },
  { key: "receipt", icon: "receipt" },
  { key: "school", icon: "school" },
  { key: "airplane", icon: "airplane" },
  { key: "cash", icon: "cash" },
  { key: "laptop", icon: "laptop-outline" },
  { key: "trending-up", icon: "trending-up" },
  { key: "gift", icon: "gift" },
  { key: "home", icon: "home-outline" },
  { key: "heart", icon: "heart-outline" },
  { key: "fitness", icon: "fitness-outline" },
  { key: "game-controller", icon: "game-controller-outline" },
  { key: "cafe", icon: "cafe-outline" },
  { key: "bicycle", icon: "bicycle-outline" },
  { key: "book", icon: "book-outline" },
  { key: "briefcase", icon: "briefcase-outline" },
  { key: "beer", icon: "beer-outline" },
  { key: "paw", icon: "paw-outline" },
  { key: "leaf", icon: "leaf-outline" },
  { key: "musical-notes", icon: "musical-notes-outline" },
  { key: "ellipsis-horizontal", icon: "ellipsis-horizontal" },
];

const ICON_MAP: Record<string, string> = Object.fromEntries(
  ICON_OPTIONS.map(o => [o.key, o.icon])
);

const COLOR_OPTIONS = [
  "#FF6B6B", "#FF8E53", "#FFCA3A", "#8AC926",
  "#1982C4", "#6A4C93", "#FF595E", "#6BCB77",
  "#4D96FF", "#C77DFF", "#F72585", "#4CC9F0",
  "#F4A261", "#2A9D8F", "#E9C46A", "#E76F51",
  "#DDA0DD", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#58D68D", "#82E0AA", "#AED6F1", "#BDC3C7",
];

type CategoryType = "expense" | "income" | "both";

export default function SettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { fetchCategories, createCategory, deleteCategory } = useFinance();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<CategoryType>("expense");
  const [newIcon, setNewIcon] = useState("ellipsis-horizontal");
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const data = await fetchCategories();
    setCategories(data);
  }, [fetchCategories]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, []);

  const openModal = () => {
    setNewName("");
    setNewType("expense");
    setNewIcon("ellipsis-horizontal");
    setNewColor(COLOR_OPTIONS[0]);
    setShowModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      Alert.alert("Name required", "Please enter a category name");
      return;
    }
    try {
      setSaving(true);
      await createCategory({
        name: newName.trim(),
        icon: newIcon,
        color: newColor,
        type: newType,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowModal(false);
      await loadData();
    } catch {
      Alert.alert("Error", "Could not create category");
    } finally {
      setSaving(false);
    }
  };

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

  const previewIconKey = newIcon;
  const previewIconName = (ICON_MAP[previewIconKey] || "ellipsis-horizontal") as any;

  return (
    <>
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

        {/* Categories Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginBottom: 0 }]}>CATEGORIES</Text>
          <Pressable
            onPress={openModal}
            style={[styles.addCatButton, { backgroundColor: colors.tint }]}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addCatButtonText}>New</Text>
          </Pressable>
        </View>

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
        ) : filtered.length === 0 ? (
          <View style={[styles.card, { backgroundColor: colors.surface, alignItems: "center", paddingVertical: spacing.xl }]}>
            <Ionicons name="folder-open-outline" size={36} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No categories yet</Text>
            <Pressable onPress={openModal} style={[styles.inlineAddButton, { backgroundColor: colors.tint }]}>
              <Text style={styles.inlineAddButtonText}>Create one</Text>
            </Pressable>
          </View>
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

      {/* Create Category Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setShowModal(false)} hitSlop={8}>
                <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Category</Text>
              <Pressable
                onPress={handleCreate}
                disabled={saving || !newName.trim()}
                style={[
                  styles.modalSave,
                  { backgroundColor: colors.tint, opacity: saving || !newName.trim() ? 0.5 : 1 },
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Create</Text>
                )}
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Preview */}
              <View style={[styles.previewCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.previewIcon, { backgroundColor: newColor + "25" }]}>
                  <Ionicons name={previewIconName} size={32} color={newColor} />
                </View>
                <Text style={[styles.previewName, { color: colors.text }]}>
                  {newName || "Category Name"}
                </Text>
                <Text style={[styles.previewType, { color: colors.textSecondary }]}>{newType}</Text>
              </View>

              {/* Name */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>NAME</Text>
              <View style={[styles.nameInputWrapper, { backgroundColor: colors.surface }]}>
                <TextInput
                  style={[styles.nameInput, { color: colors.text }]}
                  placeholder="e.g. Groceries, Rent, Bonus..."
                  placeholderTextColor={colors.textTertiary}
                  value={newName}
                  onChangeText={setNewName}
                  autoFocus
                  maxLength={30}
                />
              </View>

              {/* Type */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>TYPE</Text>
              <View style={[styles.typeRow, { backgroundColor: colors.surface }]}>
                {(["expense", "income", "both"] as CategoryType[]).map(t => (
                  <Pressable
                    key={t}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setNewType(t);
                    }}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor:
                          newType === t
                            ? t === "income"
                              ? colors.income
                              : t === "expense"
                              ? colors.expense
                              : colors.tint
                            : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        { color: newType === t ? "#fff" : colors.textSecondary },
                      ]}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Color */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>COLOR</Text>
              <View style={[styles.colorGrid, { backgroundColor: colors.surface }]}>
                {COLOR_OPTIONS.map(c => (
                  <Pressable
                    key={c}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setNewColor(c);
                    }}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c },
                      newColor === c && styles.colorSwatchSelected,
                    ]}
                  >
                    {newColor === c && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </Pressable>
                ))}
              </View>

              {/* Icon */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>ICON</Text>
              <View style={[styles.iconGrid, { backgroundColor: colors.surface }]}>
                {ICON_OPTIONS.map(opt => {
                  const isSelected = newIcon === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setNewIcon(opt.key);
                      }}
                      style={[
                        styles.iconOption,
                        {
                          backgroundColor: isSelected ? newColor + "25" : colors.borderLight,
                          borderColor: isSelected ? newColor : "transparent",
                          borderWidth: isSelected ? 2 : 0,
                        },
                      ]}
                    >
                      <Ionicons
                        name={opt.icon as any}
                        size={22}
                        color={isSelected ? newColor : colors.textSecondary}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
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
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
  },
  addCatButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  addCatButtonText: {
    color: "#fff",
    fontSize: fontSize.sm,
    fontFamily: "Inter_600SemiBold",
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
  divider: { height: 1 },
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
  emptyText: {
    fontSize: fontSize.md,
    fontFamily: "Inter_500Medium",
    marginTop: spacing.sm,
  },
  inlineAddButton: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  inlineAddButtonText: {
    color: "#fff",
    fontSize: fontSize.sm,
    fontFamily: "Inter_600SemiBold",
  },

  // Modal styles
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: fontSize.md,
    fontFamily: "Inter_400Regular",
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontFamily: "Inter_600SemiBold",
  },
  modalSave: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.full,
    minWidth: 64,
    alignItems: "center",
  },
  modalSaveText: {
    color: "#fff",
    fontSize: fontSize.md,
    fontFamily: "Inter_600SemiBold",
  },
  modalScroll: { flex: 1 },
  modalContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 60,
  },
  previewCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  previewIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  previewName: {
    fontSize: fontSize.xl,
    fontFamily: "Inter_700Bold",
  },
  previewType: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_400Regular",
  },
  fieldLabel: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    paddingHorizontal: spacing.xs,
    marginBottom: -spacing.xs,
  },
  nameInputWrapper: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  nameInput: {
    fontSize: fontSize.lg,
    fontFamily: "Inter_500Medium",
    padding: 0,
  },
  typeRow: {
    flexDirection: "row",
    borderRadius: radius.lg,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  typeChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
  },
  typeChipText: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_600SemiBold",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchSelected: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    transform: [{ scale: 1.15 }],
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
