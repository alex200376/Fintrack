/**
 * accounts.tsx
 * Manage financial accounts: cash, savings, credit card, piggy bank, e-wallet…
 * Uses local AsyncStorage via AccountContext (no server needed).
 */
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { spacing, radius, fontSize } from "@/constants/theme";
import {
  useAccounts,
  ACCOUNT_TYPE_META,
  type AccountType,
  type FinancialAccount,
} from "@/context/AccountContext";

// ─── Constants ──────────────────────────────────────────────────────────────

const ACCOUNT_TYPES = Object.entries(ACCOUNT_TYPE_META) as [
  AccountType,
  { label: string; icon: string; color: string },
][];

const COLOR_OPTIONS = [
  "#34C759", "#007AFF", "#5856D6", "#FF3B30",
  "#FF9500", "#FF2D55", "#30B0C7", "#AF52DE",
  "#FFCC00", "#00C7BE", "#32ADE6", "#FF6B35",
  "#6AC4DC", "#8E8E93", "#1C1C1E", "#2C2C2E",
];

// ─── Utility ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency = "$"): string {
  const abs = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (amount < 0 ? "-" : "") + currency + abs;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function AccountCard({
  account,
  currency,
  colors,
  onPress,
  onLongPress,
}: {
  account: FinancialAccount;
  currency: string;
  colors: any;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const meta = ACCOUNT_TYPE_META[account.type];
  const isNegative = account.balance < 0;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.accountCard,
        { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
    >
      {/* Color accent bar */}
      <View style={[styles.cardAccent, { backgroundColor: account.color }]} />

      <View style={styles.cardBody}>
        {/* Icon + Info */}
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.cardIconWrap,
              { backgroundColor: account.color + "20" },
            ]}
          >
            <Ionicons
              name={account.icon as any}
              size={22}
              color={account.color}
            />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: colors.text }]}>
              {account.name}
            </Text>
            <Text style={[styles.cardType, { color: colors.textSecondary }]}>
              {meta.label}
              {!account.includeInTotal && " · Excluded"}
            </Text>
          </View>
        </View>

        {/* Balance */}
        <View style={styles.cardRight}>
          <Text
            style={[
              styles.cardBalance,
              {
                color: isNegative
                  ? "#FF3B30"
                  : account.type === "credit"
                  ? "#FF9500"
                  : colors.text,
              },
            ]}
          >
            {formatCurrency(account.balance, currency)}
          </Text>
          {account.note ? (
            <Text
              style={[styles.cardNote, { color: colors.textTertiary }]}
              numberOfLines={1}
            >
              {account.note}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function AccountsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { accounts, loading, totalBalance, createAccount, updateAccount, deleteAccount } = useAccounts();

  // ── Modal state ────────────────────────────────────────────────────────
  const [modalMode, setModalMode] = useState<"create" | "edit" | "adjust" | null>(null);
  const [editTarget, setEditTarget] = useState<FinancialAccount | null>(null);

  // Create/Edit form
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<AccountType>("cash");
  const [formBalance, setFormBalance] = useState("0");
  const [formColor, setFormColor] = useState(COLOR_OPTIONS[0]);
  const [formIcon, setFormIcon] = useState(ACCOUNT_TYPE_META.cash.icon);
  const [formNote, setFormNote] = useState("");
  const [formInclude, setFormInclude] = useState(true);
  const [saving, setSaving] = useState(false);

  // Adjust balance
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustMode, setAdjustMode] = useState<"add" | "subtract" | "set">("set");

  const currency = "$"; // TODO: pull from ProfileContext if needed

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  // ── Computed ────────────────────────────────────────────────────────────
  const groupedAccounts = useMemo(() => {
    const order: AccountType[] = ["cash", "checking", "savings", "credit", "ewallet", "investment", "piggy", "other"];
    const groups: Record<string, FinancialAccount[]> = {};
    for (const type of order) {
      const list = accounts.filter(a => a.type === type);
      if (list.length > 0) groups[type] = list;
    }
    return groups;
  }, [accounts]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const openCreate = () => {
    setFormName("");
    setFormType("cash");
    setFormBalance("0");
    setFormColor(ACCOUNT_TYPE_META.cash.color);
    setFormIcon(ACCOUNT_TYPE_META.cash.icon);
    setFormNote("");
    setFormInclude(true);
    setEditTarget(null);
    setModalMode("create");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const openEdit = (acc: FinancialAccount) => {
    setEditTarget(acc);
    setFormName(acc.name);
    setFormType(acc.type);
    setFormBalance(String(acc.balance));
    setFormColor(acc.color);
    setFormIcon(acc.icon);
    setFormNote(acc.note ?? "");
    setFormInclude(acc.includeInTotal);
    setModalMode("edit");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const openAdjust = (acc: FinancialAccount) => {
    setEditTarget(acc);
    setAdjustAmount("");
    setAdjustMode("set");
    setModalMode("adjust");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAccountTypeSelect = (type: AccountType) => {
    const meta = ACCOUNT_TYPE_META[type];
    setFormType(type);
    setFormIcon(meta.icon);
    setFormColor(meta.color);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSaveAccount = async () => {
    if (!formName.trim()) {
      Alert.alert("Name required", "Please enter an account name.");
      return;
    }
    const bal = parseFloat(formBalance);
    if (isNaN(bal)) {
      Alert.alert("Invalid balance", "Please enter a valid number.");
      return;
    }
    try {
      setSaving(true);
      if (modalMode === "create") {
        await createAccount({
          name: formName.trim(),
          type: formType,
          balance: bal,
          color: formColor,
          icon: formIcon,
          note: formNote.trim() || undefined,
          includeInTotal: formInclude,
        });
      } else if (editTarget) {
        await updateAccount(editTarget.id, {
          name: formName.trim(),
          type: formType,
          balance: bal,
          color: formColor,
          icon: formIcon,
          note: formNote.trim() || undefined,
          includeInTotal: formInclude,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalMode(null);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not save account");
    } finally {
      setSaving(false);
    }
  };

  const handleAdjust = async () => {
    if (!editTarget) return;
    const val = parseFloat(adjustAmount);
    if (isNaN(val)) {
      Alert.alert("Invalid amount", "Please enter a valid number.");
      return;
    }
    try {
      setSaving(true);
      let newBalance = editTarget.balance;
      if (adjustMode === "add") newBalance = editTarget.balance + val;
      else if (adjustMode === "subtract") newBalance = editTarget.balance - val;
      else newBalance = val;
      await updateAccount(editTarget.id, { balance: newBalance });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalMode(null);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not adjust balance");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (acc: FinancialAccount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Delete Account",
      `Delete "${acc.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteAccount(acc.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleCardLongPress = (acc: FinancialAccount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(acc.name, "What would you like to do?", [
      { text: "Edit",           onPress: () => openEdit(acc) },
      { text: "Adjust Balance", onPress: () => openAdjust(acc) },
      { text: "Delete",         style: "destructive", onPress: () => handleDelete(acc) },
      { text: "Cancel",         style: "cancel" },
    ]);
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          paddingTop: topPad + spacing.md,
          paddingBottom: bottomPad,
          paddingHorizontal: spacing.md,
          gap: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ───────────────────────────────────────── */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={20} color={colors.tint} />
          </Pressable>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Accounts</Text>
          <Pressable
            onPress={openCreate}
            style={[styles.addBtn, { backgroundColor: colors.tint }]}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>

        {/* ── Total Balance Hero ────────────────────────────── */}
        <View style={[styles.heroCard, { backgroundColor: colors.tint }]}>
          <Text style={styles.heroLabel}>NET WORTH</Text>
          <Text style={styles.heroAmount}>
            {formatCurrency(totalBalance, currency)}
          </Text>
          <Text style={styles.heroSub}>
            {accounts.filter(a => a.includeInTotal).length} account
            {accounts.filter(a => a.includeInTotal).length !== 1 ? "s" : ""} included
          </Text>
          {/* Mini breakdown */}
          <View style={styles.heroBreakdownRow}>
            {["savings", "credit", "investment"].map(type => {
              const list = accounts.filter(a => a.type === type && a.includeInTotal);
              if (!list.length) return null;
              const total = list.reduce((s, a) => s + a.balance, 0);
              const meta = ACCOUNT_TYPE_META[type as AccountType];
              return (
                <View key={type} style={styles.heroBreakdownItem}>
                  <Ionicons name={meta.icon as any} size={13} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.heroBreakdownText}>
                    {formatCurrency(total, currency)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Account Groups ───────────────────────────────── */}
        {loading ? (
          <ActivityIndicator color={colors.tint} style={{ marginTop: spacing.xl }} />
        ) : accounts.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="wallet-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No accounts yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Add your bank accounts, credit cards, savings, and more.
            </Text>
            <Pressable
              onPress={openCreate}
              style={[styles.emptyBtn, { backgroundColor: colors.tint }]}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>Add first account</Text>
            </Pressable>
          </View>
        ) : (
          Object.entries(groupedAccounts).map(([type, list]) => {
            const meta = ACCOUNT_TYPE_META[type as AccountType];
            const groupTotal = list
              .filter(a => a.includeInTotal)
              .reduce((s, a) => s + a.balance, 0);
            return (
              <View key={type}>
                <View style={styles.groupHeader}>
                  <View style={[styles.groupDot, { backgroundColor: meta.color }]} />
                  <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>
                    {meta.label.toUpperCase()}
                  </Text>
                  <Text style={[styles.groupTotal, { color: colors.textSecondary }]}>
                    {formatCurrency(groupTotal, currency)}
                  </Text>
                </View>
                <View style={styles.groupCards}>
                  {list.map(acc => (
                    <AccountCard
                      key={acc.id}
                      account={acc}
                      currency={currency}
                      colors={colors}
                      onPress={() => openEdit(acc)}
                      onLongPress={() => handleCardLongPress(acc)}
                    />
                  ))}
                </View>
              </View>
            );
          })
        )}

        {/* ── Quick Add Row ─────────────────────────────────── */}
        {!loading && accounts.length > 0 && (
          <Pressable
            onPress={openCreate}
            style={[styles.quickAddRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
          >
            <View style={[styles.quickAddIcon, { backgroundColor: colors.tint + "18" }]}>
              <Ionicons name="add" size={18} color={colors.tint} />
            </View>
            <Text style={[styles.quickAddText, { color: colors.tint }]}>Add new account</Text>
          </Pressable>
        )}

        {/* ── Footnote ─────────────────────────────────────── */}
        <View style={[styles.footnote, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle-outline" size={15} color={colors.textSecondary} />
          <Text style={[styles.footnoteText, { color: colors.textSecondary }]}>
            Long-press any account to edit, adjust balance, or delete.
            Credit card balances shown in orange.
          </Text>
        </View>
      </ScrollView>

      {/* ── Create / Edit Modal ───────────────────────────── */}
      <Modal
        visible={modalMode === "create" || modalMode === "edit"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalMode(null)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setModalMode(null)}>
                <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {modalMode === "create" ? "New Account" : "Edit Account"}
              </Text>
              <Pressable
                onPress={handleSaveAccount}
                disabled={saving || !formName.trim()}
                style={[
                  styles.modalSave,
                  {
                    backgroundColor: colors.tint,
                    opacity: saving || !formName.trim() ? 0.4 : 1,
                  },
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>
                    {modalMode === "create" ? "Create" : "Save"}
                  </Text>
                )}
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={{
                padding: spacing.md,
                gap: spacing.md,
                paddingBottom: 60,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Preview Card */}
              <View
                style={[
                  styles.previewCard,
                  { backgroundColor: formColor + "18", borderColor: formColor + "40" },
                ]}
              >
                <View style={[styles.previewIconWrap, { backgroundColor: formColor + "22" }]}>
                  <Ionicons name={formIcon as any} size={32} color={formColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.previewName, { color: colors.text }]}>
                    {formName || "Account Name"}
                  </Text>
                  <Text style={[styles.previewType, { color: colors.textSecondary }]}>
                    {ACCOUNT_TYPE_META[formType].label}
                  </Text>
                </View>
                <Text style={[styles.previewBalance, { color: formColor }]}>
                  {formatCurrency(parseFloat(formBalance) || 0, currency)}
                </Text>
              </View>

              {/* Account Type */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>ACCOUNT TYPE</Text>
              <View style={[styles.typeGrid, { backgroundColor: colors.surface }]}>
                {ACCOUNT_TYPES.map(([type, meta]) => {
                  const isSelected = formType === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => handleAccountTypeSelect(type)}
                      style={[
                        styles.typeChip,
                        {
                          backgroundColor: isSelected ? meta.color + "20" : colors.borderLight,
                          borderColor: isSelected ? meta.color : "transparent",
                          borderWidth: isSelected ? 1.5 : 0,
                        },
                      ]}
                    >
                      <Ionicons
                        name={meta.icon as any}
                        size={16}
                        color={isSelected ? meta.color : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.typeChipText,
                          { color: isSelected ? meta.color : colors.textSecondary },
                        ]}
                      >
                        {meta.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Name */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>NAME</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.surface }]}>
                <TextInput
                  style={[styles.inputText, { color: colors.text }]}
                  placeholder="e.g. HSBC Savings, PayMe…"
                  placeholderTextColor={colors.textTertiary}
                  value={formName}
                  onChangeText={setFormName}
                  maxLength={30}
                  autoFocus={modalMode === "create"}
                />
              </View>

              {/* Balance */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>CURRENT BALANCE</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.surface }]}>
                <Text style={[styles.inputPrefix, { color: colors.textSecondary }]}>{currency}</Text>
                <TextInput
                  style={[styles.inputText, { color: colors.text, flex: 1 }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  value={formBalance}
                  onChangeText={setFormBalance}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Color */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>COLOR</Text>
              <View style={[styles.colorGrid, { backgroundColor: colors.surface }]}>
                {COLOR_OPTIONS.map(c => (
                  <Pressable
                    key={c}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setFormColor(c);
                    }}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c },
                      formColor === c && styles.colorSwatchActive,
                    ]}
                  >
                    {formColor === c && (
                      <Ionicons name="checkmark" size={13} color="#fff" />
                    )}
                  </Pressable>
                ))}
              </View>

              {/* Note */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>NOTE (OPTIONAL)</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.surface }]}>
                <TextInput
                  style={[styles.inputText, { color: colors.text }]}
                  placeholder="e.g. Joint account, Emergency fund…"
                  placeholderTextColor={colors.textTertiary}
                  value={formNote}
                  onChangeText={setFormNote}
                  maxLength={60}
                />
              </View>

              {/* Include in Total */}
              <View style={[styles.toggleRow, { backgroundColor: colors.surface }]}>
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleLabel, { color: colors.text }]}>Include in Net Worth</Text>
                  <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>
                    Count this balance in your total
                  </Text>
                </View>
                <Switch
                  value={formInclude}
                  onValueChange={v => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFormInclude(v);
                  }}
                  trackColor={{ false: colors.borderLight, true: colors.tint }}
                  thumbColor="#fff"
                />
              </View>

              {/* Delete button in edit mode */}
              {modalMode === "edit" && editTarget && (
                <Pressable
                  style={[styles.deleteBtn, { borderColor: "#FF3B3050" }]}
                  onPress={() => {
                    setModalMode(null);
                    setTimeout(() => handleDelete(editTarget!), 300);
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                  <Text style={styles.deleteBtnText}>Delete Account</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Adjust Balance Modal ──────────────────────────── */}
      <Modal
        visible={modalMode === "adjust"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalMode(null)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setModalMode(null)}>
                <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Adjust Balance</Text>
              <Pressable
                onPress={handleAdjust}
                disabled={saving || !adjustAmount}
                style={[
                  styles.modalSave,
                  { backgroundColor: colors.tint, opacity: saving || !adjustAmount ? 0.4 : 1 },
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Apply</Text>
                )}
              </Pressable>
            </View>

            <View style={{ padding: spacing.md, gap: spacing.md }}>
              {/* Current balance display */}
              {editTarget && (
                <View style={[styles.adjustCurrentCard, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.adjustCurrentLabel, { color: colors.textSecondary }]}>CURRENT BALANCE</Text>
                  <Text style={[styles.adjustCurrentAmount, { color: colors.text }]}>
                    {formatCurrency(editTarget.balance, currency)}
                  </Text>
                  <Text style={[styles.adjustAccountName, { color: colors.textSecondary }]}>
                    {editTarget.name}
                  </Text>
                </View>
              )}

              {/* Mode selector */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>ADJUSTMENT TYPE</Text>
              <View style={[styles.adjustModeRow, { backgroundColor: colors.surface }]}>
                {(["set", "add", "subtract"] as const).map(mode => (
                  <Pressable
                    key={mode}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setAdjustMode(mode);
                    }}
                    style={[
                      styles.adjustModeChip,
                      {
                        backgroundColor:
                          adjustMode === mode ? colors.tint : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.adjustModeText,
                        { color: adjustMode === mode ? "#fff" : colors.textSecondary },
                      ]}
                    >
                      {mode === "set" ? "Set to" : mode === "add" ? "+ Add" : "− Subtract"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Amount input */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>AMOUNT</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.surface }]}>
                <Text style={[styles.inputPrefix, { color: colors.textSecondary }]}>{currency}</Text>
                <TextInput
                  style={[styles.inputText, { color: colors.text, flex: 1 }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  value={adjustAmount}
                  onChangeText={setAdjustAmount}
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </View>

              {/* Preview of result */}
              {editTarget && adjustAmount !== "" && !isNaN(parseFloat(adjustAmount)) && (
                <View style={[styles.adjustPreview, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.adjustPreviewLabel, { color: colors.textSecondary }]}>NEW BALANCE</Text>
                  <Text style={[styles.adjustPreviewAmount, { color: colors.tint }]}>
                    {formatCurrency(
                      adjustMode === "set"
                        ? parseFloat(adjustAmount)
                        : adjustMode === "add"
                        ? editTarget.balance + parseFloat(adjustAmount)
                        : editTarget.balance - parseFloat(adjustAmount),
                      currency
                    )}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1 },

  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  pageTitle: { flex: 1, fontSize: fontSize.xxl, fontFamily: "Inter_700Bold" },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  heroCard: {
    borderRadius: radius.xl, padding: spacing.lg,
    gap: spacing.xs,
  },
  heroLabel: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  heroAmount: { color: "#fff", fontSize: 38, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  heroSub: { color: "rgba(255,255,255,0.65)", fontSize: fontSize.sm, fontFamily: "Inter_400Regular" },
  heroBreakdownRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xs },
  heroBreakdownItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  heroBreakdownText: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Inter_500Medium" },

  emptyCard: {
    borderRadius: radius.xl, padding: 48,
    alignItems: "center", gap: spacing.sm,
  },
  emptyTitle: { fontSize: fontSize.lg, fontFamily: "Inter_600SemiBold", marginTop: spacing.sm },
  emptyDesc: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular", textAlign: "center", maxWidth: 260, lineHeight: 20 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.full, marginTop: spacing.sm,
  },
  emptyBtnText: { color: "#fff", fontSize: fontSize.sm, fontFamily: "Inter_600SemiBold" },

  groupHeader: {
    flexDirection: "row", alignItems: "center",
    gap: spacing.sm, marginBottom: spacing.sm, paddingHorizontal: 2,
  },
  groupDot: { width: 7, height: 7, borderRadius: 3.5 },
  groupTitle: { flex: 1, fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  groupTotal: { fontSize: fontSize.sm, fontFamily: "Inter_500Medium" },
  groupCards: { gap: spacing.sm },

  accountCard: {
    borderRadius: radius.xl,
    overflow: "hidden",
    flexDirection: "row",
  },
  cardAccent: { width: 4 },
  cardBody: {
    flex: 1, flexDirection: "row", alignItems: "center",
    paddingHorizontal: spacing.md, paddingVertical: 14, gap: spacing.md,
  },
  cardLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md },
  cardIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  cardName: { fontSize: fontSize.md, fontFamily: "Inter_600SemiBold" },
  cardType: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  cardRight: { alignItems: "flex-end" },
  cardBalance: { fontSize: fontSize.lg, fontFamily: "Inter_700Bold" },
  cardNote: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2, maxWidth: 100 },

  quickAddRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: radius.xl, padding: spacing.md,
    gap: spacing.md, borderWidth: 1.5, borderStyle: "dashed",
  },
  quickAddIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  quickAddText: { fontSize: fontSize.md, fontFamily: "Inter_500Medium" },

  footnote: {
    flexDirection: "row", alignItems: "flex-start",
    borderRadius: radius.xl, padding: spacing.md, gap: spacing.sm,
  },
  footnoteText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },

  // Modal
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  modalCancel: { fontSize: fontSize.md, fontFamily: "Inter_400Regular" },
  modalTitle: { fontSize: fontSize.lg, fontFamily: "Inter_600SemiBold" },
  modalSave: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.full },
  modalSaveText: { color: "#fff", fontSize: fontSize.sm, fontFamily: "Inter_600SemiBold" },

  previewCard: {
    borderRadius: radius.xl, padding: spacing.md,
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    borderWidth: 1.5,
  },
  previewIconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  previewName: { fontSize: fontSize.lg, fontFamily: "Inter_700Bold" },
  previewType: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular", marginTop: 2 },
  previewBalance: { fontSize: fontSize.lg, fontFamily: "Inter_700Bold" },

  fieldLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.9, paddingHorizontal: 2,
  },
  typeGrid: {
    flexDirection: "row", flexWrap: "wrap",
    borderRadius: radius.xl, padding: spacing.sm, gap: spacing.sm,
  },
  typeChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  typeChipText: { fontSize: fontSize.sm, fontFamily: "Inter_500Medium" },

  inputBox: {
    flexDirection: "row", alignItems: "center",
    borderRadius: radius.xl, paddingHorizontal: spacing.md, paddingVertical: 14, gap: spacing.sm,
  },
  inputPrefix: { fontSize: fontSize.md, fontFamily: "Inter_500Medium" },
  inputText: { fontSize: fontSize.md, fontFamily: "Inter_400Regular" },

  colorGrid: {
    flexDirection: "row", flexWrap: "wrap",
    borderRadius: radius.xl, padding: spacing.md, gap: spacing.sm,
  },
  colorSwatch: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  colorSwatchActive: { borderWidth: 3, borderColor: "#fff" },

  toggleRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: radius.xl, padding: spacing.md, gap: spacing.md,
  },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: fontSize.md, fontFamily: "Inter_500Medium" },
  toggleDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },

  deleteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: spacing.sm, padding: spacing.md,
    borderRadius: radius.xl, borderWidth: 1.5,
  },
  deleteBtnText: { color: "#FF3B30", fontSize: fontSize.md, fontFamily: "Inter_500Medium" },

  // Adjust modal
  adjustCurrentCard: {
    borderRadius: radius.xl, padding: spacing.md, alignItems: "center", gap: 4,
  },
  adjustCurrentLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.9 },
  adjustCurrentAmount: { fontSize: 32, fontFamily: "Inter_700Bold" },
  adjustAccountName: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular" },
  adjustModeRow: {
    flexDirection: "row", borderRadius: radius.xl, padding: 5, gap: 4,
  },
  adjustModeChip: {
    flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: radius.lg,
  },
  adjustModeText: { fontSize: fontSize.sm, fontFamily: "Inter_600SemiBold" },
  adjustPreview: {
    borderRadius: radius.xl, padding: spacing.md, alignItems: "center", gap: 4,
  },
  adjustPreviewLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.9 },
  adjustPreviewAmount: { fontSize: 28, fontFamily: "Inter_700Bold" },
});
