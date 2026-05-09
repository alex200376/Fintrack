import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { useTheme } from "@/hooks/useTheme";
import { useProfile } from "@/context/ProfileContext";
import { spacing, radius, fontSize } from "@/constants/theme";

// ─── Types ───────────────────────────────────────────────────────────────────
export type AccountType =
  | "credit_card"
  | "savings"
  | "piggy_bank"
  | "cash"
  | "investment"
  | "e_wallet"
  | "loan";

export interface FinancialAccount {
  id: string;
  type: AccountType;
  name: string;
  balance: number;
  currency: string;
  last4?: string;       // last 4 digits for cards
  color: string;        // gradient start
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const STORAGE_KEY = "@fintrack_financial_accounts";

const ACCOUNT_TYPES: { type: AccountType; label: string; icon: string; gradient: [string, string] }[] = [
  { type: "credit_card",  label: "Credit Card",   icon: "card",             gradient: ["#1a1a2e", "#16213e"] },
  { type: "savings",      label: "Savings",        icon: "wallet",           gradient: ["#0f3460", "#533483"] },
  { type: "piggy_bank",   label: "Piggy Bank",     icon: "pricetag",         gradient: ["#c75b7a", "#f4a7b9"] },
  { type: "cash",         label: "Cash",           icon: "cash",             gradient: ["#2d6a4f", "#52b788"] },
  { type: "investment",   label: "Investment",     icon: "trending-up",      gradient: ["#7b2d8b", "#e040fb"] },
  { type: "e_wallet",     label: "E-Wallet",       icon: "phone-portrait",   gradient: ["#0d7377", "#14a085"] },
  { type: "loan",         label: "Loan",           icon: "alert-circle",     gradient: ["#b5451b", "#e27d60"] },
];

const getAccountMeta = (type: AccountType) =>
  ACCOUNT_TYPES.find(a => a.type === type) ?? ACCOUNT_TYPES[0];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Storage helpers ─────────────────────────────────────────────────────────
async function loadAccounts(): Promise<FinancialAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveAccounts(accounts: FinancialAccount[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({ onAdd, colors }: { onAdd: () => void; colors: any }) {
  return (
    <View style={[emptyStyles.wrap, { backgroundColor: colors.surface }]}>
      <Ionicons name="wallet-outline" size={52} color={colors.textFaint} />
      <Text style={[emptyStyles.title, { color: colors.text }]}>No accounts yet</Text>
      <Text style={[emptyStyles.sub, { color: colors.textSecondary }]}>
        Add your credit cards, savings, piggy bank and more to track your balances in one place.
      </Text>
      <Pressable onPress={onAdd} style={[emptyStyles.btn, { backgroundColor: colors.tint }]}>
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={emptyStyles.btnText}>Add Account</Text>
      </Pressable>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: { borderRadius: radius.xl, padding: 40, alignItems: "center", gap: spacing.sm },
  title: { fontSize: fontSize.xl, fontFamily: "Inter_700Bold", marginTop: spacing.sm },
  sub: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular", textAlign: "center", maxWidth: 280, lineHeight: 20 },
  btn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, marginTop: spacing.md },
  btnText: { color: "#fff", fontSize: fontSize.sm, fontFamily: "Inter_600SemiBold" },
});

// ─── Account Card ─────────────────────────────────────────────────────────────
function AccountCard({
  account, currency, onEdit, onDelete,
}: {
  account: FinancialAccount;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = getAccountMeta(account.type);
  const isNegative = account.balance < 0;
  const displayBalance = `${account.currency || currency}${Math.abs(account.balance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <View style={cardStyles.wrapper}>
      <LinearGradient
        colors={meta.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={cardStyles.card}
      >
        {/* Top row */}
        <View style={cardStyles.topRow}>
          <View style={cardStyles.iconWrap}>
            <Ionicons name={meta.icon as any} size={20} color="rgba(255,255,255,0.85)" />
          </View>
          <Text style={cardStyles.typeLabel}>{meta.label}</Text>
          <View style={cardStyles.actions}>
            <Pressable onPress={onEdit} hitSlop={10} style={cardStyles.actionBtn}>
              <Ionicons name="pencil" size={14} color="rgba(255,255,255,0.75)" />
            </Pressable>
            <Pressable onPress={onDelete} hitSlop={10} style={cardStyles.actionBtn}>
              <Ionicons name="trash" size={14} color="rgba(255,255,255,0.75)" />
            </Pressable>
          </View>
        </View>

        {/* Account name */}
        <Text style={cardStyles.accountName}>{account.name}</Text>

        {/* Balance */}
        <View style={cardStyles.balanceRow}>
          <View>
            <Text style={cardStyles.balanceLabel}>Balance</Text>
            <Text style={[cardStyles.balance, isNegative && { color: "#ff6b6b" }]}>
              {isNegative ? "-" : ""}{displayBalance}
            </Text>
          </View>
          {account.last4 && (
            <Text style={cardStyles.last4}>•••• {account.last4}</Text>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 6 },
  card: { borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  iconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  typeLabel: { flex: 1, color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  actions: { flexDirection: "row", gap: spacing.sm },
  actionBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  accountName: { color: "#fff", fontSize: fontSize.xl, fontFamily: "Inter_700Bold", marginTop: 4 },
  balanceRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: spacing.sm },
  balanceLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  balance: { color: "#fff", fontSize: fontSize.xl, fontFamily: "Inter_700Bold" },
  last4: { color: "rgba(255,255,255,0.6)", fontSize: fontSize.md, fontFamily: "Inter_500Medium", letterSpacing: 3 },
});

// ─── Modal form ───────────────────────────────────────────────────────────────
interface FormState {
  type: AccountType;
  name: string;
  balance: string;
  last4: string;
  note: string;
}

const INITIAL_FORM: FormState = {
  type: "savings",
  name: "",
  balance: "",
  last4: "",
  note: "",
};

function AccountFormModal({
  visible,
  editing,
  colors,
  currency,
  onClose,
  onSave,
}: {
  visible: boolean;
  editing: FinancialAccount | null;
  colors: any;
  currency: string;
  onClose: () => void;
  onSave: (form: FormState) => void;
}) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editing) {
        setForm({
          type: editing.type,
          name: editing.name,
          balance: String(editing.balance),
          last4: editing.last4 ?? "",
          note: editing.note ?? "",
        });
      } else {
        setForm(INITIAL_FORM);
      }
    }
  }, [visible, editing]);

  const update = (field: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.name.trim()) {
      Alert.alert("Name required", "Please enter an account name.");
      return;
    }
    const parsed = parseFloat(form.balance.replace(/,/g, ""));
    if (isNaN(parsed)) {
      Alert.alert("Invalid balance", "Please enter a valid number.");
      return;
    }
    if (form.last4 && !/^\d{4}$/.test(form.last4)) {
      Alert.alert("Invalid card digits", "Last 4 digits must be exactly 4 numbers.");
      return;
    }
    setSaving(true);
    setTimeout(() => { setSaving(false); onSave(form); }, 200);
  };

  const selectedMeta = getAccountMeta(form.type);
  const showLast4 = form.type === "credit_card" || form.type === "savings" || form.type === "e_wallet";

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[modalStyles.root, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[modalStyles.header, { borderBottomColor: colors.border }]}>
            <Pressable onPress={onClose}>
              <Text style={[modalStyles.cancel, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Text style={[modalStyles.title, { color: colors.text }]}>
              {editing ? "Edit Account" : "Add Account"}
            </Text>
            <Pressable
              onPress={handleSave}
              disabled={saving || !form.name.trim()}
              style={[modalStyles.saveBtn, { backgroundColor: colors.tint, opacity: !form.name.trim() ? 0.4 : 1 }]}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={modalStyles.saveBtnText}>{editing ? "Save" : "Add"}</Text>
              }
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 60 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Mini card preview */}
            <LinearGradient
              colors={selectedMeta.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={modalStyles.previewCard}
            >
              <View style={modalStyles.previewTop}>
                <Ionicons name={selectedMeta.icon as any} size={22} color="rgba(255,255,255,0.85)" />
                <Text style={modalStyles.previewType}>{selectedMeta.label}</Text>
              </View>
              <Text style={modalStyles.previewName}>{form.name || "Account Name"}</Text>
              <View style={modalStyles.previewBottom}>
                <Text style={modalStyles.previewBalance}>
                  {currency}{parseFloat(form.balance || "0").toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                {form.last4 ? <Text style={modalStyles.previewLast4}>•••• {form.last4}</Text> : null}
              </View>
            </LinearGradient>

            {/* Account Type */}
            <Text style={[modalStyles.label, { color: colors.textSecondary }]}>ACCOUNT TYPE</Text>
            <View style={modalStyles.typeGrid}>
              {ACCOUNT_TYPES.map(at => {
                const isSelected = form.type === at.type;
                return (
                  <Pressable
                    key={at.type}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); update("type", at.type); }}
                    style={[modalStyles.typeChip, {
                      backgroundColor: isSelected ? colors.tint : colors.surface,
                      borderColor: isSelected ? colors.tint : colors.borderLight,
                    }]}
                  >
                    <Ionicons name={at.icon as any} size={16} color={isSelected ? "#fff" : colors.textSecondary} />
                    <Text style={[modalStyles.typeChipText, { color: isSelected ? "#fff" : colors.textSecondary }]}>
                      {at.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Name */}
            <Text style={[modalStyles.label, { color: colors.textSecondary }]}>ACCOUNT NAME</Text>
            <View style={[modalStyles.inputBox, { backgroundColor: colors.surface }]}>
              <TextInput
                style={[modalStyles.input, { color: colors.text }]}
                placeholder="e.g. My HSBC Savings, Piggy Bank..."
                placeholderTextColor={colors.textTertiary}
                value={form.name}
                onChangeText={v => update("name", v)}
                maxLength={40}
              />
            </View>

            {/* Balance */}
            <Text style={[modalStyles.label, { color: colors.textSecondary }]}>CURRENT BALANCE</Text>
            <View style={[modalStyles.inputBox, { backgroundColor: colors.surface }]}>
              <Text style={[modalStyles.inputPrefix, { color: colors.textSecondary }]}>{currency}</Text>
              <TextInput
                style={[modalStyles.input, { color: colors.text, flex: 1 }]}
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
                value={form.balance}
                onChangeText={v => update("balance", v)}
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={[modalStyles.hint, { color: colors.textTertiary }]}>
              Use negative value for debt (e.g. -500 for credit card debt)
            </Text>

            {/* Last 4 digits — cards / wallets */}
            {showLast4 && (
              <>
                <Text style={[modalStyles.label, { color: colors.textSecondary }]}>LAST 4 DIGITS (optional)</Text>
                <View style={[modalStyles.inputBox, { backgroundColor: colors.surface }]}>
                  <TextInput
                    style={[modalStyles.input, { color: colors.text }]}
                    placeholder="e.g. 4242"
                    placeholderTextColor={colors.textTertiary}
                    value={form.last4}
                    onChangeText={v => update("last4", v.replace(/\D/g, "").slice(0, 4))}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>
              </>
            )}

            {/* Note */}
            <Text style={[modalStyles.label, { color: colors.textSecondary }]}>NOTE (optional)</Text>
            <View style={[modalStyles.inputBox, { backgroundColor: colors.surface, minHeight: 80, alignItems: "flex-start", paddingTop: 12 }]}>
              <TextInput
                style={[modalStyles.input, { color: colors.text, flex: 1 }]}
                placeholder="Any additional details..."
                placeholderTextColor={colors.textTertiary}
                value={form.note}
                onChangeText={v => update("note", v)}
                multiline
                maxLength={120}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  cancel: { fontSize: fontSize.md, fontFamily: "Inter_400Regular" },
  title: { fontSize: fontSize.lg, fontFamily: "Inter_600SemiBold" },
  saveBtn: { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.full, minWidth: 60, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: fontSize.md, fontFamily: "Inter_600SemiBold" },
  previewCard: { borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  previewTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  previewType: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Inter_500Medium" },
  previewName: { color: "#fff", fontSize: fontSize.xl, fontFamily: "Inter_700Bold" },
  previewBottom: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: spacing.sm },
  previewBalance: { color: "#fff", fontSize: fontSize.xl, fontFamily: "Inter_700Bold" },
  previewLast4: { color: "rgba(255,255,255,0.6)", fontSize: fontSize.md, fontFamily: "Inter_500Medium", letterSpacing: 3 },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.9, paddingHorizontal: 4 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  typeChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 9,
    borderRadius: radius.full, borderWidth: 1,
  },
  typeChipText: { fontSize: fontSize.sm, fontFamily: "Inter_500Medium" },
  inputBox: { borderRadius: radius.xl, paddingHorizontal: spacing.md, paddingVertical: 14, flexDirection: "row", alignItems: "center" },
  inputPrefix: { fontSize: fontSize.lg, fontFamily: "Inter_500Medium", marginRight: 4 },
  input: { fontSize: fontSize.lg, fontFamily: "Inter_500Medium", padding: 0 },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular", paddingHorizontal: 4, marginTop: -spacing.sm },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function FinancialAccountsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();

  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 24;

  const load = useCallback(async () => {
    const data = await loadAccounts();
    setAccounts(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  // ─── Total net worth ────────────────────────────────────────────────────────
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const currency = profile.currency || "$";

  // ─── CRUD ───────────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingAccount(null);
    setShowModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const openEdit = (account: FinancialAccount) => {
    setEditingAccount(account);
    setShowModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSave = async (form: FormState) => {
    const now = new Date().toISOString();
    let updated: FinancialAccount[];

    if (editingAccount) {
      updated = accounts.map(a =>
        a.id === editingAccount.id
          ? {
              ...a,
              type: form.type,
              name: form.name.trim(),
              balance: parseFloat(form.balance.replace(/,/g, "") || "0"),
              last4: form.last4 || undefined,
              note: form.note.trim() || undefined,
              currency,
              updatedAt: now,
            }
          : a
      );
    } else {
      const newAccount: FinancialAccount = {
        id: generateId(),
        type: form.type,
        name: form.name.trim(),
        balance: parseFloat(form.balance.replace(/,/g, "") || "0"),
        currency,
        last4: form.last4 || undefined,
        note: form.note.trim() || undefined,
        color: getAccountMeta(form.type).gradient[0],
        createdAt: now,
        updatedAt: now,
      };
      updated = [...accounts, newAccount];
    }

    await saveAccounts(updated);
    setAccounts(updated);
    setShowModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = (account: FinancialAccount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete Account",
      `Delete "${account.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updated = accounts.filter(a => a.id !== account.id);
            await saveAccounts(updated);
            setAccounts(updated);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const formatBalance = (v: number) =>
    `${v < 0 ? "-" : ""}${currency}${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={20} color={colors.tint} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Accounts</Text>
            <Text style={[styles.pageSub, { color: colors.textSecondary }]}>
              {accounts.length} account{accounts.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <Pressable onPress={openAdd} style={[styles.addBtn, { backgroundColor: colors.tint }]}>
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.tint} style={{ marginTop: 60 }} />
        ) : accounts.length === 0 ? (
          <EmptyState onAdd={openAdd} colors={colors} />
        ) : (
          <>
            {/* Net Worth Summary */}
            <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Net Worth</Text>
              <Text style={[
                styles.summaryAmount,
                { color: totalBalance >= 0 ? colors.tint : "#FF3B30" },
              ]}>
                {formatBalance(totalBalance)}
              </Text>
              <View style={styles.summaryBreakdown}>
                <View style={styles.summaryCol}>
                  <Text style={[styles.summaryColLabel, { color: colors.textSecondary }]}>Assets</Text>
                  <Text style={[styles.summaryColValue, { color: "#34C759" }]}>
                    {formatBalance(accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0))}
                  </Text>
                </View>
                <View style={[styles.summarySep, { backgroundColor: colors.borderLight }]} />
                <View style={styles.summaryCol}>
                  <Text style={[styles.summaryColLabel, { color: colors.textSecondary }]}>Liabilities</Text>
                  <Text style={[styles.summaryColValue, { color: "#FF3B30" }]}>
                    {formatBalance(accounts.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0))}
                  </Text>
                </View>
              </View>
            </View>

            {/* Account Cards */}
            {accounts.map(account => (
              <AccountCard
                key={account.id}
                account={account}
                currency={currency}
                onEdit={() => openEdit(account)}
                onDelete={() => handleDelete(account)}
              />
            ))}

            {/* Account Type Breakdown */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>BREAKDOWN BY TYPE</Text>
            <View style={[styles.breakdownCard, { backgroundColor: colors.surface }]}>
              {ACCOUNT_TYPES.map(at => {
                const typeAccounts = accounts.filter(a => a.type === at.type);
                if (typeAccounts.length === 0) return null;
                const total = typeAccounts.reduce((s, a) => s + a.balance, 0);
                return (
                  <View key={at.type}>
                    <View style={styles.breakdownRow}>
                      <View style={[styles.breakdownIconWrap, { backgroundColor: at.gradient[0] + "22" }]}>
                        <Ionicons name={at.icon as any} size={16} color={at.gradient[0]} />
                      </View>
                      <View style={styles.breakdownInfo}>
                        <Text style={[styles.breakdownLabel, { color: colors.text }]}>{at.label}</Text>
                        <Text style={[styles.breakdownCount, { color: colors.textSecondary }]}>
                          {typeAccounts.length} account{typeAccounts.length > 1 ? "s" : ""}
                        </Text>
                      </View>
                      <Text style={[
                        styles.breakdownAmount,
                        { color: total >= 0 ? colors.text : "#FF3B30" },
                      ]}>
                        {formatBalance(total)}
                      </Text>
                    </View>
                    <View style={[styles.sep, { backgroundColor: colors.borderLight }]} />
                  </View>
                );
              }).filter(Boolean)}
            </View>
          </>
        )}
      </ScrollView>

      {/* Add / Edit Modal */}
      <AccountFormModal
        visible={showModal}
        editing={editingAccount}
        colors={colors}
        currency={currency}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerText: { flex: 1 },
  pageTitle: { fontSize: fontSize.xxl, fontFamily: "Inter_700Bold" },
  pageSub: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular", marginTop: 1 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  summaryCard: { borderRadius: radius.xl, padding: spacing.lg, gap: spacing.xs },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  summaryAmount: { fontSize: 28, fontFamily: "Inter_700Bold" },
  summaryBreakdown: { flexDirection: "row", marginTop: spacing.sm },
  summaryCol: { flex: 1, alignItems: "center", paddingVertical: spacing.sm },
  summaryColLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  summaryColValue: { fontSize: fontSize.md, fontFamily: "Inter_700Bold" },
  summarySep: { width: 1, marginVertical: 4 },
  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.9, paddingHorizontal: 4,
  },
  breakdownCard: { borderRadius: radius.xl, overflow: "hidden" },
  breakdownRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: 14, gap: spacing.md },
  breakdownIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  breakdownInfo: { flex: 1 },
  breakdownLabel: { fontSize: fontSize.md, fontFamily: "Inter_500Medium" },
  breakdownCount: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  breakdownAmount: { fontSize: fontSize.md, fontFamily: "Inter_700Bold" },
  sep: { height: 1, marginHorizontal: spacing.md },
});
