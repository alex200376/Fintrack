import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";

import { useTheme } from "@/hooks/useTheme";
import { useProfile, CARD_THEMES, CardTheme } from "@/context/ProfileContext";
import { useFinance } from "@/context/FinanceContext";
import { spacing, radius, fontSize } from "@/constants/theme";

const AVATAR_EMOJIS = [
  "💰","🏦","💵","💳","📊","📈","🤑","💎",
  "🏠","🚀","🌟","🦁","🐉","🦊","🐺","🎯",
  "🌈","⚡","🔥","🌙","☀️","🍀","🎸","🎨",
];

const CURRENCY_OPTIONS = [
  { symbol: "$",   label: "USD — Dollar" },
  { symbol: "€",   label: "EUR — Euro" },
  { symbol: "£",   label: "GBP — Pound" },
  { symbol: "¥",   label: "JPY — Yen" },
  { symbol: "₩",   label: "KRW — Won" },
  { symbol: "₹",   label: "INR — Rupee" },
  { symbol: "A$",  label: "AUD — Dollar" },
  { symbol: "C$",  label: "CAD — Dollar" },
  { symbol: "CHF", label: "CHF — Franc" },
  { symbol: "₿",   label: "BTC — Bitcoin" },
  { symbol: "HK$", label: "HKD — Hong Kong Dollar" },
];

const APP_VERSION = "1.0.0";

export default function AccountScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile, cardTheme, updateProfile } = useProfile();
  const {
    fetchTransactions, fetchCategories, fetchBudgets,
    createTransaction, createCategory, createBudget,
    deleteTransaction, deleteCategory, deleteBudget,
    fetchSummary,
  } = useFinance();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(false);
  const [biometricLock, setBiometricLock] = useState(false);
  const [monthlySummaryLoading, setMonthlySummaryLoading] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState<{
    income: number; expense: number; balance: number;
  } | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    loadMonthlySummary();
  }, []);

  const loadMonthlySummary = async () => {
    try {
      setMonthlySummaryLoading(true);
      const data = await fetchSummary(currentMonth, currentYear);
      setMonthlySummary({
        income: data.totalIncome,
        expense: data.totalExpense,
        balance: data.balance,
      });
    } catch (e) {
      // silent fail
    } finally {
      setMonthlySummaryLoading(false);
    }
  };

  const saveName = async () => {
    await updateProfile({ name: nameInput.trim() });
    setEditingName(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const pickAvatarPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to use a custom photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await updateProfile({ avatarUri: result.assets[0].uri, avatar: "" });
      setShowAvatarModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const selectEmoji = async (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateProfile({ avatar: emoji, avatarUri: "" });
    setShowAvatarModal(false);
  };

  const pickCardPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to use a custom background.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [16, 7], quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      await updateProfile({ cardImageUri: result.assets[0].uri });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const clearCardPhoto = async () => {
    await updateProfile({ cardImageUri: "" });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const selectCurrency = async (symbol: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateProfile({ currency: symbol });
    setShowCurrencyModal(false);
  };

  const selectCardTheme = async (theme: CardTheme) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateProfile({ cardThemeId: theme.id });
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const [transactions, categories, budgets] = await Promise.all([
        fetchTransactions(), fetchCategories(), fetchBudgets(),
      ]);
      const data = {
        exportedAt: new Date().toISOString(),
        version: 1,
        transactions,
        categories: categories.filter((c: any) => !c.isDefault),
        budgets: budgets.map((b: any) => ({
          categoryId: b.categoryId, amount: b.amount, period: b.period,
        })),
      };
      const json = JSON.stringify(data, null, 2);

      if (Platform.OS === "web") {
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `fintrack-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert("Exported", "Your data has been downloaded.");
        return;
      }

      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) { Alert.alert("Export failed", "Could not access the file cache directory."); return; }
      const fileUri = `${cacheDir}fintrack-export-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, { mimeType: "application/json", dialogTitle: "Export Fintrack Data" });
      } else {
        Alert.alert("Exported", `File saved to: ${fileUri}`);
      }
    } catch (e: any) {
      Alert.alert("Export failed", e?.message ?? "Unknown error");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json", copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      setImporting(true);
      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
      const data = JSON.parse(content);
      if (!data.version || !Array.isArray(data.transactions)) {
        Alert.alert("Invalid file", "This file doesn't appear to be a Fintrack export.");
        return;
      }
      Alert.alert(
        "Import Data",
        `Found ${data.transactions.length} transactions, ${data.categories?.length ?? 0} categories, ${data.budgets?.length ?? 0} budgets. Import all?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Import",
            onPress: async () => {
              let imported = 0;
              const categoryMap: Record<string, string> = {};
              for (const cat of data.categories ?? []) {
                try {
                  const newCat = await createCategory({ name: cat.name, icon: cat.icon, color: cat.color, type: cat.type });
                  categoryMap[cat.id] = newCat.id;
                  imported++;
                } catch {}
              }
              for (const tx of data.transactions ?? []) {
                try {
                  await createTransaction({
                    amount: tx.amount, type: tx.type,
                    categoryId: categoryMap[tx.categoryId] ?? tx.categoryId,
                    note: tx.note, date: tx.date,
                  });
                  imported++;
                } catch {}
              }
              for (const b of data.budgets ?? []) {
                try {
                  await createBudget({ categoryId: b.categoryId, amount: b.amount, period: b.period });
                  imported++;
                } catch {}
              }
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Import complete", `Successfully imported ${imported} items.`);
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert("Import failed", e?.message ?? "Could not read the file");
    } finally {
      setImporting(false);
    }
  };

  const handleResetAllData = () => {
    Alert.alert(
      "Delete All Data",
      "This will permanently delete ALL transactions, categories, and budgets. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            Alert.alert(
              "Are you absolutely sure?",
              "All records will be permanently removed.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete All",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      const [transactions, categories, budgets] = await Promise.all([
                        fetchTransactions(), fetchCategories(), fetchBudgets(),
                      ]);
                      await Promise.all(budgets.map((b: any) => deleteBudget(b.id)));
                      await Promise.all(transactions.map((t: any) => deleteTransaction(t.id)));
                      const customCats = categories.filter((c: any) => !c.isDefault);
                      await Promise.all(customCats.map((c: any) => deleteCategory(c.id)));
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      Alert.alert("Done", "All data has been deleted.");
                      loadMonthlySummary();
                    } catch (e: any) {
                      Alert.alert("Error", e?.message ?? "Failed to delete data");
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const formatAmount = (amount: number) => {
    return `${profile.currency}${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const displayName = profile.name || "Your Name";
  const hasAvatarPhoto = !!profile.avatarUri;
  const hasCardPhoto = !!profile.cardImageUri;
  const monthName = now.toLocaleString("en-US", { month: "long" });

  return (
    <>
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          paddingTop: topPad + spacing.md,
          paddingBottom: bottomPad,
          gap: spacing.md,
          paddingHorizontal: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: colors.text }]}>Account</Text>

        {/* ── Profile Hero Card ───────────────────────────── */}
        <View style={styles.heroCard}>
          {hasCardPhoto ? (
            <Image source={{ uri: profile.cardImageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <LinearGradient colors={cardTheme.colors as any} start={cardTheme.start} end={cardTheme.end} style={StyleSheet.absoluteFill} />
          )}
          <View style={styles.heroOverlay}>
            <Pressable onPress={() => setShowAvatarModal(true)} style={styles.heroPressable}>
              <View style={styles.heroAvatarWrapper}>
                {hasAvatarPhoto ? (
                  <Image source={{ uri: profile.avatarUri }} style={styles.heroAvatarPhoto} />
                ) : (
                  <Text style={styles.heroAvatarEmoji}>{profile.avatar}</Text>
                )}
                <View style={styles.heroAvatarBadge}>
                  <Ionicons name="camera" size={11} color="#fff" />
                </View>
              </View>
              <View>
                <Text style={styles.heroName}>{displayName}</Text>
                <Text style={styles.heroSub}>{cardTheme.name} Theme · {profile.currency}</Text>
              </View>
            </Pressable>
            <Pressable onPress={pickCardPhoto} style={styles.heroEditBtn}>
              <Ionicons name="image-outline" size={18} color="rgba(255,255,255,0.9)" />
            </Pressable>
          </View>
        </View>

        {/* ── Monthly Summary ─────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {monthName.toUpperCase()} OVERVIEW
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {monthlySummaryLoading ? (
            <View style={styles.summaryLoadingRow}>
              <ActivityIndicator size="small" color={colors.tint} />
              <Text style={[styles.summaryLoadingText, { color: colors.textSecondary }]}>Loading summary…</Text>
            </View>
          ) : monthlySummary ? (
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <View style={[styles.summaryDot, { backgroundColor: "#34C759" }]} />
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Income</Text>
                <Text style={[styles.summaryAmount, { color: "#34C759" }]}>
                  {formatAmount(monthlySummary.income)}
                </Text>
              </View>
              <View style={[styles.summarySep, { backgroundColor: colors.borderLight }]} />
              <View style={styles.summaryItem}>
                <View style={[styles.summaryDot, { backgroundColor: "#FF3B30" }]} />
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Expense</Text>
                <Text style={[styles.summaryAmount, { color: "#FF3B30" }]}>
                  {formatAmount(monthlySummary.expense)}
                </Text>
              </View>
              <View style={[styles.summarySep, { backgroundColor: colors.borderLight }]} />
              <View style={styles.summaryItem}>
                <View style={[styles.summaryDot, { backgroundColor: colors.tint }]} />
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Balance</Text>
                <Text style={[
                  styles.summaryAmount,
                  { color: monthlySummary.balance >= 0 ? colors.tint : "#FF3B30" },
                ]}>
                  {formatAmount(monthlySummary.balance)}
                </Text>
              </View>
            </View>
          ) : (
            <Pressable style={styles.row} onPress={loadMonthlySummary}>
              <View style={[styles.rowIcon, { backgroundColor: colors.tint + "18" }]}>
                <Ionicons name="refresh-outline" size={18} color={colors.tint} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowValue, { color: colors.text }]}>Load Summary</Text>
                <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Tap to reload monthly overview</Text>
              </View>
            </Pressable>
          )}
        </View>

        {/* ── PROFILE ─────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PROFILE</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Name */}
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.tint + "18" }]}>
              <Ionicons name="person-outline" size={18} color={colors.tint} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Name</Text>
              {editingName ? (
                <View style={styles.inlineEdit}>
                  <TextInput
                    style={[styles.inlineInput, { color: colors.text, borderBottomColor: colors.tint }]}
                    value={nameInput}
                    onChangeText={setNameInput}
                    autoFocus
                    maxLength={30}
                    onSubmitEditing={saveName}
                    returnKeyType="done"
                  />
                  <Pressable onPress={saveName} style={[styles.inlineSave, { backgroundColor: colors.tint }]}>
                    <Text style={styles.inlineSaveText}>Save</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={[styles.rowValue, { color: colors.text }]}>{displayName}</Text>
              )}
            </View>
            {!editingName && (
              <Pressable onPress={() => { setNameInput(profile.name); setEditingName(true); }} hitSlop={12}>
                <Ionicons name="pencil-outline" size={16} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>
          <View style={[styles.sep, { backgroundColor: colors.borderLight }]} />
          {/* Avatar */}
          <Pressable style={styles.row} onPress={() => setShowAvatarModal(true)}>
            <View style={[styles.rowIcon, { backgroundColor: colors.tint + "18" }]}>
              <Ionicons name="happy-outline" size={18} color={colors.tint} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Avatar</Text>
              <Text style={[styles.rowValue, { color: colors.text }]}>
                {hasAvatarPhoto ? "Custom photo" : profile.avatar}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
          <View style={[styles.sep, { backgroundColor: colors.borderLight }]} />
          {/* Currency */}
          <Pressable style={styles.row} onPress={() => setShowCurrencyModal(true)}>
            <View style={[styles.rowIcon, { backgroundColor: colors.tint + "18" }]}>
              <Ionicons name="cash-outline" size={18} color={colors.tint} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Currency</Text>
              <Text style={[styles.rowValue, { color: colors.text }]}>
                {CURRENCY_OPTIONS.find(c => c.symbol === profile.currency)?.label ?? profile.currency}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
        </View>

        {/* ── CARD BACKGROUND ─────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CARD BACKGROUND</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardBgRow}>
            <Pressable style={[styles.cardBgOption, { backgroundColor: colors.borderLight }]} onPress={pickCardPhoto}>
              {hasCardPhoto ? (
                <Image source={{ uri: profile.cardImageUri }} style={styles.cardBgPreviewImg} />
              ) : (
                <Ionicons name="image-outline" size={22} color={colors.textSecondary} />
              )}
            </Pressable>
            <View style={styles.cardBgInfo}>
              <Text style={[styles.rowValue, { color: colors.text }]}>
                {hasCardPhoto ? "Custom Photo" : "Use Custom Photo"}
              </Text>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
                {hasCardPhoto ? "Tap to change" : "Pick from library"}
              </Text>
            </View>
            <View style={{ gap: 6 }}>
              <Pressable onPress={pickCardPhoto} style={[styles.photoActionBtn, { backgroundColor: colors.tint }]}>
                <Text style={styles.photoActionBtnText}>{hasCardPhoto ? "Change" : "Pick"}</Text>
              </Pressable>
              {hasCardPhoto && (
                <Pressable onPress={clearCardPhoto} style={[styles.photoActionBtn, { backgroundColor: colors.borderLight }]}>
                  <Text style={[styles.photoActionBtnText, { color: colors.textSecondary }]}>Remove</Text>
                </Pressable>
              )}
            </View>
          </View>
          <View style={[styles.sep, { backgroundColor: colors.borderLight }]} />
          <Text style={[styles.rowLabel, { color: colors.textSecondary, marginBottom: 2, paddingHorizontal: spacing.md, paddingTop: spacing.sm }]}>
            Or choose a gradient theme:
          </Text>
          <View style={styles.themeGrid}>
            {CARD_THEMES.map(theme => {
              const isActive = !hasCardPhoto && theme.id === profile.cardThemeId;
              return (
                <Pressable key={theme.id} onPress={() => { clearCardPhoto(); selectCardTheme(theme); }} style={styles.themeItem}>
                  <LinearGradient colors={theme.colors as any} start={theme.start} end={theme.end} style={[styles.themePreview, isActive && { borderWidth: 3, borderColor: "#fff" }]}>
                    {isActive && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </LinearGradient>
                  <Text style={[styles.themeName, { color: isActive ? colors.tint : colors.textSecondary }]}>{theme.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── APPEARANCE ──────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: "#5856D6" + "18" }]}>
              <Ionicons name={isDark ? "moon" : "sunny"} size={18} color="#5856D6" />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowValue, { color: colors.text }]}>Dark Mode</Text>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
                {isDark ? "Currently dark" : "Currently light"}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleTheme();
              }}
              trackColor={{ false: colors.borderLight, true: colors.tint }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* ── NOTIFICATIONS ───────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>NOTIFICATIONS</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: "#FF9500" + "18" }]}>
              <Ionicons name="alert-circle-outline" size={18} color="#FF9500" />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowValue, { color: colors.text }]}>Budget Alerts</Text>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
                Notify when approaching budget limit
              </Text>
            </View>
            <Switch
              value={budgetAlerts}
              onValueChange={(v) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setBudgetAlerts(v);
              }}
              trackColor={{ false: colors.borderLight, true: colors.tint }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.sep, { backgroundColor: colors.borderLight }]} />
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: "#34C759" + "18" }]}>
              <Ionicons name="notifications-outline" size={18} color="#34C759" />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowValue, { color: colors.text }]}>Daily Reminder</Text>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
                Remind to log transactions each day
              </Text>
            </View>
            <Switch
              value={dailyReminder}
              onValueChange={(v) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDailyReminder(v);
              }}
              trackColor={{ false: colors.borderLight, true: colors.tint }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* ── SECURITY ────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SECURITY</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: "#30B0C7" + "18" }]}>
              <Ionicons name="finger-print" size={18} color="#30B0C7" />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowValue, { color: colors.text }]}>Biometric Lock</Text>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
                Use Face ID / Touch ID to unlock
              </Text>
            </View>
            <Switch
              value={biometricLock}
              onValueChange={(v) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setBiometricLock(v);
                if (v) Alert.alert("Biometric Lock", "Biometric authentication will be enabled on next app launch.");
              }}
              trackColor={{ false: colors.borderLight, true: colors.tint }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* ── DATA ────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>DATA</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Pressable style={styles.row} onPress={handleExport} disabled={exporting}>
            <View style={[styles.rowIcon, { backgroundColor: "#34C759" + "18" }]}>
              {exporting ? <ActivityIndicator size="small" color="#34C759" /> : <Ionicons name="share-outline" size={18} color="#34C759" />}
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowValue, { color: colors.text }]}>Export Data</Text>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Download all transactions as JSON</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
          <View style={[styles.sep, { backgroundColor: colors.borderLight }]} />
          <Pressable style={styles.row} onPress={handleImport} disabled={importing}>
            <View style={[styles.rowIcon, { backgroundColor: "#4F6EF7" + "18" }]}>
              {importing ? <ActivityIndicator size="small" color="#4F6EF7" /> : <Ionicons name="download-outline" size={18} color="#4F6EF7" />}
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowValue, { color: colors.text }]}>Import Data</Text>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Load from a Fintrack JSON export</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
        </View>

        {/* ── APP ─────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>APP</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Pressable
            style={styles.row}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/categories"); }}
          >
            <View style={[styles.rowIcon, { backgroundColor: "#6A4C93" + "18" }]}>
              <Ionicons name="grid-outline" size={18} color="#6A4C93" />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowValue, { color: colors.text }]}>Manage Categories</Text>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Create and delete categories</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
          <View style={[styles.sep, { backgroundColor: colors.borderLight }]} />
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.tint + "18" }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.tint} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowValue, { color: colors.text }]}>Version</Text>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Fintrack v{APP_VERSION}</Text>
            </View>
          </View>
        </View>

        {/* ── DANGER ZONE ─────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: "#FF3B30" }]}>DANGER ZONE</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Pressable style={styles.row} onPress={handleResetAllData}>
            <View style={[styles.rowIcon, { backgroundColor: "#FF3B30" + "18" }]}>
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowValue, { color: "#FF3B30" }]}>Delete All Data</Text>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
                Permanently delete all transactions, categories &amp; budgets
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#FF3B30" />
          </Pressable>
        </View>

        <View style={[styles.noteCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            Profile &amp; settings stored locally on this device. Transactions are stored on the server.
          </Text>
        </View>
      </ScrollView>

      {/* ── Avatar Modal ─────────────────────────────────── */}
      <Modal visible={showAvatarModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAvatarModal(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowAvatarModal(false)}>
              <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Avatar</Text>
            <Pressable onPress={pickAvatarPhoto} style={[styles.photoBtn, { backgroundColor: colors.tint }]}>
              <Ionicons name="image" size={14} color="#fff" />
              <Text style={styles.photoBtnText}>Photo</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.emojiGrid}>
            {AVATAR_EMOJIS.map(emoji => (
              <Pressable
                key={emoji}
                onPress={() => selectEmoji(emoji)}
                style={[styles.emojiBtn, { backgroundColor: profile.avatar === emoji && !hasAvatarPhoto ? colors.tint + "20" : colors.surface }]}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* ── Currency Modal ───────────────────────────────── */}
      <Modal visible={showCurrencyModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCurrencyModal(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowCurrencyModal(false)}>
              <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Currency</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView>
            {CURRENCY_OPTIONS.map(opt => {
              const isActive = profile.currency === opt.symbol;
              return (
                <Pressable key={opt.symbol} onPress={() => selectCurrency(opt.symbol)} style={[styles.currencyRow, { borderBottomColor: colors.borderLight }]}>
                  <Text style={[styles.currencySymbol, { color: isActive ? colors.tint : colors.text }]}>{opt.symbol}</Text>
                  <Text style={[styles.currencyLabel, { color: colors.textSecondary }]}>{opt.label}</Text>
                  {isActive && <Ionicons name="checkmark-circle" size={20} color={colors.tint} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  pageTitle: { fontSize: fontSize.xxl, fontFamily: "Inter_700Bold" },
  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.9, paddingHorizontal: 4, marginBottom: -spacing.xs,
  },
  card: { borderRadius: radius.xl, overflow: "hidden" },
  heroCard: { borderRadius: radius.xl, overflow: "hidden", height: 120 },
  heroOverlay: {
    flex: 1, flexDirection: "row", alignItems: "center",
    padding: spacing.md, gap: spacing.md, backgroundColor: "rgba(0,0,0,0.18)",
  },
  heroPressable: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md },
  heroAvatarWrapper: { position: "relative" },
  heroAvatarPhoto: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: "rgba(255,255,255,0.6)" },
  heroAvatarEmoji: { fontSize: 48 },
  heroAvatarBadge: {
    position: "absolute", bottom: 0, right: -2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center",
  },
  heroName: { color: "#fff", fontSize: fontSize.xl, fontFamily: "Inter_700Bold" },
  heroSub: { color: "rgba(255,255,255,0.75)", fontSize: fontSize.sm, fontFamily: "Inter_400Regular", marginTop: 2 },
  heroEditBtn: { padding: spacing.sm },
  summaryLoadingRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: spacing.sm, padding: spacing.lg,
  },
  summaryLoadingText: { fontSize: fontSize.sm, fontFamily: "Inter_400Regular" },
  summaryRow: { flexDirection: "row", alignItems: "stretch" },
  summaryItem: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: spacing.md, gap: 4,
  },
  summarySep: { width: 1, marginVertical: spacing.md },
  summaryDot: { width: 8, height: 8, borderRadius: 4 },
  summaryLabel: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 0.4 },
  summaryAmount: { fontSize: fontSize.md, fontFamily: "Inter_700Bold" },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: 14, gap: spacing.md },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  rowValue: { fontSize: fontSize.md, fontFamily: "Inter_500Medium", marginTop: 1 },
  sep: { height: 1, marginHorizontal: spacing.md },
  inlineEdit: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 2 },
  inlineInput: { flex: 1, fontSize: fontSize.md, fontFamily: "Inter_500Medium", borderBottomWidth: 1.5, paddingBottom: 2 },
  inlineSave: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.full },
  inlineSaveText: { color: "#fff", fontSize: fontSize.sm, fontFamily: "Inter_600SemiBold" },
  cardBgRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.md },
  cardBgOption: { width: 60, height: 44, borderRadius: radius.md, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  cardBgPreviewImg: { width: 60, height: 44, borderRadius: radius.md },
  cardBgInfo: { flex: 1 },
  photoActionBtn: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full, alignItems: "center" },
  photoActionBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#fff" },
  themeGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  themeItem: { alignItems: "center", gap: 4 },
  themePreview: { width: 56, height: 36, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  themeName: { fontSize: 10, fontFamily: "Inter_500Medium" },
  noteCard: { borderRadius: radius.xl, padding: spacing.md, flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  noteText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  modalCancel: { fontSize: fontSize.md, fontFamily: "Inter_400Regular" },
  modalTitle: { fontSize: fontSize.lg, fontFamily: "Inter_600SemiBold" },
  photoBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full },
  photoBtnText: { color: "#fff", fontSize: fontSize.sm, fontFamily: "Inter_600SemiBold" },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", padding: spacing.md, gap: spacing.sm, justifyContent: "center" },
  emojiBtn: { width: 68, height: 68, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  emojiText: { fontSize: 34 },
  currencyRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: 16, borderBottomWidth: 1, gap: spacing.md },
  currencySymbol: { fontSize: fontSize.xl, fontFamily: "Inter_700Bold", width: 44 },
  currencyLabel: { flex: 1, fontSize: fontSize.md, fontFamily: "Inter_400Regular" },
});
