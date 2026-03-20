import React, { useState } from "react";
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
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { router } from "expo-router";

import { useTheme } from "@/hooks/useTheme";
import { useProfile, CARD_THEMES, CardTheme } from "@/context/ProfileContext";
import { spacing, radius, fontSize } from "@/constants/theme";

const AVATAR_OPTIONS = [
  "💰", "🏦", "💵", "💳", "📊", "📈", "🤑", "💎",
  "🏠", "🚀", "🌟", "🦁", "🐉", "🦊", "🐺", "🎯",
  "🌈", "⚡", "🔥", "🌙", "☀️", "🍀", "🎸", "🎨",
];

const CURRENCY_OPTIONS = [
  { symbol: "$", label: "USD — Dollar" },
  { symbol: "€", label: "EUR — Euro" },
  { symbol: "£", label: "GBP — Pound" },
  { symbol: "¥", label: "JPY — Yen" },
  { symbol: "₩", label: "KRW — Won" },
  { symbol: "₹", label: "INR — Rupee" },
  { symbol: "₿", label: "BTC — Bitcoin" },
  { symbol: "A$", label: "AUD — Aus. Dollar" },
  { symbol: "C$", label: "CAD — Can. Dollar" },
  { symbol: "CHF", label: "CHF — Franc" },
];

export default function AccountScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile, cardTheme, updateProfile } = useProfile();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const saveName = async () => {
    await updateProfile({ name: nameInput.trim() });
    setEditingName(false);
  };

  const selectAvatar = async (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateProfile({ avatar: emoji });
    setShowAvatarModal(false);
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

  const displayName = profile.name || "Your Name";

  return (
    <>
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPadding + spacing.md, paddingBottom: Platform.OS === "web" ? 34 + 84 : 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>Account</Text>

        {/* Profile Card */}
        <LinearGradient
          colors={cardTheme.colors as any}
          start={cardTheme.start}
          end={cardTheme.end}
          style={styles.profileCard}
        >
          <Pressable onPress={() => setShowAvatarModal(true)} style={styles.avatarButton}>
            <Text style={styles.avatarEmoji}>{profile.avatar}</Text>
            <View style={styles.avatarEditBadge}>
              <Ionicons name="pencil" size={10} color="#fff" />
            </View>
          </Pressable>
          <View style={styles.profileCardInfo}>
            <Text style={styles.profileCardName}>{displayName}</Text>
            <Text style={styles.profileCardSub}>
              {profile.currency} · {cardTheme.name} Theme
            </Text>
          </View>
          <Pressable onPress={() => setShowCardModal(true)} style={styles.themeEditBtn}>
            <Ionicons name="color-palette-outline" size={18} color="rgba(255,255,255,0.85)" />
          </Pressable>
        </LinearGradient>

        {/* Profile Info */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PROFILE</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, padding: 0 }]}>
          {/* Name */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: colors.tint + "20" }]}>
              <Ionicons name="person-outline" size={18} color={colors.tint} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>Name</Text>
              {editingName ? (
                <View style={styles.nameEditRow}>
                  <TextInput
                    style={[styles.nameInput, { color: colors.text, borderBottomColor: colors.tint }]}
                    value={nameInput}
                    onChangeText={setNameInput}
                    autoFocus
                    maxLength={30}
                    onSubmitEditing={saveName}
                    returnKeyType="done"
                  />
                  <Pressable onPress={saveName} style={[styles.saveBtn, { backgroundColor: colors.tint }]}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={[styles.settingValue, { color: colors.text }]}>{displayName}</Text>
              )}
            </View>
            {!editingName && (
              <Pressable onPress={() => { setNameInput(profile.name); setEditingName(true); }} hitSlop={8}>
                <Ionicons name="pencil-outline" size={16} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>

          <View style={[styles.separator, { backgroundColor: colors.borderLight }]} />

          {/* Avatar */}
          <Pressable style={styles.settingRow} onPress={() => setShowAvatarModal(true)}>
            <View style={[styles.settingIcon, { backgroundColor: colors.tint + "20" }]}>
              <Ionicons name="happy-outline" size={18} color={colors.tint} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>Avatar</Text>
              <Text style={[styles.settingValue, { color: colors.text }]}>{profile.avatar}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>

          <View style={[styles.separator, { backgroundColor: colors.borderLight }]} />

          {/* Currency */}
          <Pressable style={styles.settingRow} onPress={() => setShowCurrencyModal(true)}>
            <View style={[styles.settingIcon, { backgroundColor: colors.tint + "20" }]}>
              <Ionicons name="cash-outline" size={18} color={colors.tint} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>Currency</Text>
              <Text style={[styles.settingValue, { color: colors.text }]}>
                {CURRENCY_OPTIONS.find(c => c.symbol === profile.currency)?.label ?? profile.currency}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
        </View>

        {/* Card Theme */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CARD BACKGROUND</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.themeGrid}>
            {CARD_THEMES.map(theme => {
              const isActive = theme.id === profile.cardThemeId;
              return (
                <Pressable
                  key={theme.id}
                  onPress={() => selectCardTheme(theme)}
                  style={[styles.themeOption, isActive && styles.themeOptionActive]}
                >
                  <LinearGradient
                    colors={theme.colors as any}
                    start={theme.start}
                    end={theme.end}
                    style={styles.themePreview}
                  >
                    {isActive && (
                      <View style={styles.themeCheckmark}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                    )}
                  </LinearGradient>
                  <Text style={[styles.themeName, { color: isActive ? colors.tint : colors.textSecondary }]}>
                    {theme.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* App Settings */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>APP</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, padding: 0 }]}>
          <Pressable
            style={styles.settingRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/settings");
            }}
          >
            <View style={[styles.settingIcon, { backgroundColor: "#6A4C93" + "20" }]}>
              <Ionicons name="grid-outline" size={18} color="#6A4C93" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>Categories</Text>
              <Text style={[styles.settingValue, { color: colors.text }]}>Manage & create categories</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
        </View>

        {/* Data Note */}
        <View style={[styles.noteCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            Profile data is stored only on this device and is never sent to any server.
          </Text>
        </View>
      </ScrollView>

      {/* Avatar Picker Modal */}
      <Modal visible={showAvatarModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAvatarModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowAvatarModal(false)}>
              <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Avatar</Text>
            <View style={{ width: 60 }} />
          </View>
          <View style={styles.emojiGrid}>
            {AVATAR_OPTIONS.map(emoji => (
              <Pressable
                key={emoji}
                onPress={() => selectAvatar(emoji)}
                style={[
                  styles.emojiOption,
                  { backgroundColor: profile.avatar === emoji ? colors.tint + "20" : colors.surface },
                ]}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* Currency Picker Modal */}
      <Modal visible={showCurrencyModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCurrencyModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowCurrencyModal(false)}>
              <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Currency</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView>
            {CURRENCY_OPTIONS.map((opt, i) => {
              const isActive = profile.currency === opt.symbol;
              return (
                <Pressable
                  key={opt.symbol}
                  onPress={() => selectCurrency(opt.symbol)}
                  style={[
                    styles.currencyRow,
                    { borderBottomColor: colors.borderLight },
                  ]}
                >
                  <Text style={[styles.currencySymbol, { color: isActive ? colors.tint : colors.text }]}>
                    {opt.symbol}
                  </Text>
                  <Text style={[styles.currencyLabel, { color: colors.textSecondary }]}>{opt.label}</Text>
                  {isActive && <Ionicons name="checkmark" size={18} color={colors.tint} />}
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
  content: { paddingHorizontal: spacing.md, gap: spacing.md },
  title: { fontSize: fontSize.xxl, fontFamily: "Inter_700Bold" },
  profileCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 100,
  },
  avatarButton: { position: "relative" },
  avatarEmoji: { fontSize: 48 },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileCardInfo: { flex: 1 },
  profileCardName: {
    color: "#fff",
    fontSize: fontSize.xl,
    fontFamily: "Inter_700Bold",
  },
  profileCardSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: fontSize.sm,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  themeEditBtn: {
    padding: spacing.sm,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    paddingHorizontal: spacing.xs,
    marginBottom: -spacing.xs,
  },
  card: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.md },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.md,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: fontSize.xs, fontFamily: "Inter_400Regular" },
  settingValue: { fontSize: fontSize.md, fontFamily: "Inter_500Medium", marginTop: 2 },
  nameEditRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 2 },
  nameInput: {
    flex: 1,
    fontSize: fontSize.md,
    fontFamily: "Inter_500Medium",
    borderBottomWidth: 1.5,
    paddingBottom: 2,
  },
  saveBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  saveBtnText: { color: "#fff", fontSize: fontSize.sm, fontFamily: "Inter_600SemiBold" },
  separator: { height: 1, marginHorizontal: spacing.md },
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  themeOption: {
    alignItems: "center",
    gap: 6,
    padding: 4,
    borderRadius: radius.md,
  },
  themeOptionActive: {},
  themePreview: {
    width: 64,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  themeCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  themeName: { fontSize: 10, fontFamily: "Inter_500Medium" },
  noteCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  noteText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },

  // Modals
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
  modalCancel: { fontSize: fontSize.md, fontFamily: "Inter_400Regular" },
  modalTitle: { fontSize: fontSize.lg, fontFamily: "Inter_600SemiBold" },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: spacing.md,
    gap: spacing.sm,
    justifyContent: "center",
  },
  emojiOption: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: { fontSize: 32 },
  currencyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  currencySymbol: { fontSize: fontSize.xl, fontFamily: "Inter_700Bold", width: 40 },
  currencyLabel: { flex: 1, fontSize: fontSize.md, fontFamily: "Inter_400Regular" },
});
