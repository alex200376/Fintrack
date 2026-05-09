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
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { useFinance, type Category } from "@/context/FinanceContext";
import { useProfile } from "@/context/ProfileContext";
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

const ICON_MAP: Record<string, string> = Object.fromEntries(ICON_OPTIONS.map(o => [o.key, o.icon]));

const COLOR_OPTIONS = [
  "#FF6B6B","#FF8E53","#FFCA3A","#8AC926",
  "#1982C4","#6A4C93","#FF595E","#6BCB77",
  "#4D96FF","#C77DFF","#F72585","#4CC9F0",
  "#F4A261","#2A9D8F","#E9C46A","#E76F51",
  "#DDA0DD","#4ECDC4","#45B7D1","#96CEB4",
  "#58D68D","#82E0AA","#AED6F1","#BDC3C7",
];

type CategoryType = "expense" | "income" | "both";

export default function SettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { fetchCategories, createCategory, deleteCategory } = useFinance();
  const { profile } = useProfile();
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

  useEffect(() => { setLoading(true); loadData().finally(() => setLoading(false)); }, []);

  const openModal = () => {
    setNewName(""); setNewType("expense"); setNewIcon("ellipsis-horizontal"); setNewColor(COLOR_OPTIONS[0]);
    setShowModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleCreate = async () => {
    if (!newName.trim()) { Alert.alert("Name required", "Please enter a category name."); return; }
    try {
      setSaving(true);
      await createCategory({ name: newName.trim(), icon: newIcon, color: newColor, type: newType });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowModal(false);
      await loadData();
    } catch { Alert.alert("Error", "Could not create category"); }
    finally { setSaving(false); }
  };

  const handleDelete = (cat: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Category", `Delete "${cat.name}"? Existing transactions will still reference it.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteCategory(cat.id); await loadData(); } },
    ]);
  };

  const filtered = categories.filter(c =>
    activeTab === "expense" ? c.type === "expense" || c.type === "both" : c.type === "income" || c.type === "both"
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 20;
  const previewIcon = (ICON_MAP[newIcon] || "ellipsis-horizontal") as any;

  return (
    <>
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: topPad + spacing.md, paddingBottom: bottomPad, paddingHorizontal: spacing.md, gap: spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={colors.tint} />
          </Pressable>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Settings</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* ── MANAGE FINANCIAL ACCOUNTS ── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>FINANCIAL ACCOUNTS</Text>
        <Pressable
          style={[styles.manageCard, { backgroundColor: colors.surface }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/financial-accounts");
          }}
        >
          <View style={[styles.manageIconWrap, { backgroundColor: "#0f3460" + "22" }]}>
            <Ionicons name="wallet" size={22} color="#0f3460" />
          </View>
          <View style={styles.manageInfo}>
            <Text style={[styles.manageName, { color: colors.text }]}>Manage Accounts</Text>
            <Text style={[styles.manageSub, { color: colors.textSecondary }]}>
              Credit cards, savings, piggy bank and more
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </Pressable>

        {/* ── PROFILE ── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PROFILE</Text>
        <Pressable
          style={[styles.manageCard, { backgroundColor: colors.surface }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(tabs)/account");
          }}
        >
          <View style={[styles.accountAvatar, { backgroundColor: colors.tint + "20" }]}>
            <Text style={styles.accountAvatarEmoji}>{profile.avatar || "💰"}</Text>
          </View>
          <View style={styles.manageInfo}>
            <Text style={[styles.manageName, { color: colors.text }]}>{profile.name || "Your Name"}</Text>
            <Text style={[styles.manageSub, { color: colors.textSecondary }]}>
              Avatar, currency, appearance &amp; more
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </Pressable>

        {/* ── CATEGORIES ── */}
        <View style={styles.categoriesHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CATEGORIES</Text>
          <Pressable onPress={openModal} style={[styles.addBtn, { backgroundColor: colors.tint }]}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>New</Text>
          </Pressable>
        </View>

        {/* Type Tabs */}
        <View style={[styles.tabRow, { backgroundColor: colors.surface }]}>
          {(["expense", "income"] as const).map(tab => (
            <Pressable
              key={tab}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(tab); }}
              style={[styles.tabChip, { backgroundColor: activeTab === tab ? colors.tint : "transparent" }]}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? "#fff" : colors.textSecondary }]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.tint} style={{ marginTop: spacing.xl }} />
        ) : filtered.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="folder-open-outline" size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No {activeTab} categories</Text>
            <Pressable onPress={openModal} style={[styles.createBtn, { backgroundColor: colors.tint }]}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.createBtnText}>Create one</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.categoryList, { backgroundColor: colors.surface }]}>
            {filtered.map((cat, i) => {
              const iconName = (ICON_MAP[cat.icon] || "ellipsis-horizontal") as any;
              return (
                <View key={cat.id}>
                  <View style={styles.catRow}>
                    <View style={[styles.catIcon, { backgroundColor: cat.color + "20" }]}>
                      <Ionicons name={iconName} size={18} color={cat.color} />
                    </View>
                    <Text style={[styles.catName, { color: colors.text }]}>{cat.name}</Text>
                    <View style={[styles.catBadge, { backgroundColor: colors.borderLight }]}>
                      <Text style={[styles.catBadgeText, { color: colors.textSecondary }]}>{cat.type}</Text>
                    </View>
                    <Pressable onPress={() => handleDelete(cat)} hitSlop={10}>
                      <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
                    </Pressable>
                  </View>
                  {i < filtered.length - 1 && <View style={[styles.sep, { backgroundColor: colors.borderLight }]} />}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Create Category Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setShowModal(false)}>
                <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Category</Text>
              <Pressable
                onPress={handleCreate}
                disabled={saving || !newName.trim()}
                style={[styles.modalSave, { backgroundColor: colors.tint, opacity: saving || !newName.trim() ? 0.4 : 1 }]}
              >
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSaveText}>Create</Text>}
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Preview */}
              <View style={[styles.previewCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.previewIcon, { backgroundColor: newColor + "22" }]}>
                  <Ionicons name={previewIcon} size={36} color={newColor} />
                </View>
                <Text style={[styles.previewName, { color: colors.text }]}>{newName || "Category Name"}</Text>
                <Text style={[styles.previewType, { color: colors.textSecondary }]}>{newType}</Text>
              </View>

              {/* Name */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>NAME</Text>
              <View style={[styles.nameInput, { backgroundColor: colors.surface }]}>
                <TextInput
                  style={[styles.nameInputText, { color: colors.text }]}
                  placeholder="e.g. Groceries, Salary..."
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
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNewType(t); }}
                    style={[styles.typeChip, {
                      backgroundColor: newType === t
                        ? (t === "income" ? colors.income : t === "expense" ? colors.expense : colors.tint)
                        : "transparent",
                    }]}
                  >
                    <Text style={[styles.typeChipText, { color: newType === t ? "#fff" : colors.textSecondary }]}>
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
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNewColor(c); }}
                    style={[styles.colorSwatch, { backgroundColor: c }, newColor === c && styles.colorSwatchSelected]}
                  >
                    {newColor === c && <Ionicons name="checkmark" size={14} color="#fff" />}
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
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNewIcon(opt.key); }}
                      style={[styles.iconOption, {
                        backgroundColor: isSelected ? newColor + "22" : colors.borderLight,
                        borderColor: isSelected ? newColor : "transparent",
                        borderWidth: isSelected ? 2 : 0,
                      }]}
                    >
                      <Ionicons name={opt.icon as any} size={22} color={isSelected ? newColor : colors.textSecondary} />
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
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  pageTitle: { flex: 1, fontSize: fontSize.xxl, fontFamily: "Inter_700Bold" },
  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.9, paddingHorizontal: 4,
  },
  manageCard: {
    borderRadius: radius.xl, flexDirection: "row", alignItems: "center",
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.md,
  },
  manageIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  manageInfo: { flex: 1 },
  manageName: { fontSize: fontSize.md, fontFamily: "Inter_600SemiBold" },
  manageSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  accountAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  accountAvatarEmoji: { fontSize: 26 },
  categoriesHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full },
  addBtnText: { color: "#fff", fontSize: fontSize.sm, fontFamily: "Inter_600SemiBold" },
  tabRow: { flexDirection: "row", borderRadius: radius.xl, padding: 5, gap: 4 },
  tabChip: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: radius.lg },
  tabText: { fontSize: fontSize.sm, fontFamily: "Inter_600SemiBold" },
  emptyCard: { borderRadius: radius.xl, padding: 48, alignItems: "center", gap: spacing.sm },
  emptyText: { fontSize: fontSize.md, fontFamily: "Inter_500Medium" },
  createBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, marginTop: spacing.sm },
  createBtnText: { color: "#fff", fontSize: fontSize.sm, fontFamily: "Inter_600SemiBold" },
  categoryList: { borderRadius: radius.xl, overflow: "hidden" },
  catRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: 14, gap: spacing.md },
  catIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  catName: { flex: 1, fontSize: fontSize.md, fontFamily: "Inter_400Regular" },
  catBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  catBadgeText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  sep: { height: 1, marginHorizontal: spacing.md },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  modalCancel: { fontSize: fontSize.md, fontFamily: "Inter_400Regular", width: 60 },
  modalTitle: { fontSize: fontSize.lg, fontFamily: "Inter_600SemiBold" },
  modalSave: { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.full, minWidth: 60, alignItems: "center" },
  modalSaveText: { color: "#fff", fontSize: fontSize.md, fontFamily: "Inter_600SemiBold" },
  previewCard: { borderRadius: radius.xl, padding: spacing.xl, alignItems: "center", gap: spacing.sm },
  previewIcon: { width: 76, height: 76, borderRadius: radius.xl, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  previewName: { fontSize: fontSize.xl, fontFamily: "Inter_700Bold" },
  previewType: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular" },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, paddingHorizontal: 4, marginBottom: -spacing.xs },
  nameInput: { borderRadius: radius.xl, paddingHorizontal: spacing.md, paddingVertical: 16 },
  nameInputText: { fontSize: fontSize.lg, fontFamily: "Inter_500Medium", padding: 0 },
  typeRow: { flexDirection: "row", borderRadius: radius.xl, padding: 5, gap: 4 },
  typeChip: { flex: 1, paddingVertical: 10, borderRadius: radius.lg, alignItems: "center" },
  typeChipText: { fontSize: fontSize.sm, fontFamily: "Inter_600SemiBold" },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", borderRadius: radius.xl, padding: spacing.md, gap: spacing.sm },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  colorSwatchSelected: { transform: [{ scale: 1.15 }], shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", borderRadius: radius.xl, padding: spacing.md, gap: spacing.sm },
  iconOption: { width: 50, height: 50, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
});
