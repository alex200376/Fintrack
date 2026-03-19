import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { radius, spacing, fontSize } from "@/constants/theme";

interface Props {
  icon: string;
  color: string;
  name: string;
  size?: "sm" | "md" | "lg";
}

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

export function CategoryBadge({ icon, color, name, size = "md" }: Props) {
  const iconSize = size === "sm" ? 14 : size === "md" ? 18 : 22;
  const containerSize = size === "sm" ? 28 : size === "md" ? 36 : 44;
  const iconName = (ICON_MAP[icon] || "ellipsis-horizontal") as any;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: color + "20",
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 4,
          },
        ]}
      >
        <Ionicons name={iconName} size={iconSize} color={color} />
      </View>
      <Text style={[styles.name, { fontSize: size === "sm" ? fontSize.xs : fontSize.sm }]}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: spacing.xs,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontFamily: "Inter_400Regular",
    color: "#888",
  },
});
