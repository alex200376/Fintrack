import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type CardTheme = {
  id: string;
  name: string;
  colors: [string, string, string];
  start: { x: number; y: number };
  end: { x: number; y: number };
};

export const CARD_THEMES: CardTheme[] = [
  {
    id: "ocean",
    name: "Ocean",
    colors: ["#4F6EF7", "#3B55D9", "#2B43B8"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    id: "sunset",
    name: "Sunset",
    colors: ["#FF6B6B", "#FF8E53", "#FFC947"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    id: "forest",
    name: "Forest",
    colors: ["#11998E", "#38EF7D", "#1FA87A"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    id: "royal",
    name: "Royal",
    colors: ["#7B2FF7", "#A855F7", "#6B21A8"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    id: "midnight",
    name: "Midnight",
    colors: ["#1A1A2E", "#16213E", "#0F3460"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    id: "cherry",
    name: "Cherry",
    colors: ["#F72585", "#B5179E", "#7209B7"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    id: "ember",
    name: "Ember",
    colors: ["#E53935", "#C62828", "#FF7043"],
    start: { x: 0, y: 1 },
    end: { x: 1, y: 0 },
  },
  {
    id: "teal",
    name: "Teal",
    colors: ["#00B4D8", "#0077B6", "#023E8A"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    id: "gold",
    name: "Gold",
    colors: ["#B8860B", "#DAA520", "#F0C040"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    id: "slate",
    name: "Slate",
    colors: ["#2D3748", "#4A5568", "#718096"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
];

export type ProfileData = {
  name: string;
  avatar: string;
  currency: string;
  cardThemeId: string;
};

const DEFAULT_PROFILE: ProfileData = {
  name: "",
  avatar: "💰",
  currency: "$",
  cardThemeId: "ocean",
};

const STORAGE_KEY = "@finance_profile";

interface ProfileContextValue {
  profile: ProfileData;
  cardTheme: CardTheme;
  updateProfile: (updates: Partial<ProfileData>) => Promise<void>;
  isLoaded: boolean;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: DEFAULT_PROFILE,
  cardTheme: CARD_THEMES[0],
  updateProfile: async () => {},
  isLoaded: false,
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as Partial<ProfileData>;
          setProfile({ ...DEFAULT_PROFILE, ...saved });
        } catch {}
      }
      setIsLoaded(true);
    });
  }, []);

  const updateProfile = useCallback(async (updates: Partial<ProfileData>) => {
    const next = { ...profile, ...updates };
    setProfile(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, [profile]);

  const cardTheme = CARD_THEMES.find(t => t.id === profile.cardThemeId) ?? CARD_THEMES[0];

  return (
    <ProfileContext.Provider value={{ profile, cardTheme, updateProfile, isLoaded }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
