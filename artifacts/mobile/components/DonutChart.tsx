import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useTheme } from "@/hooks/useTheme";
import { fontSize, fontWeight } from "@/constants/theme";

interface Segment {
  color: string;
  percentage: number;
  label: string;
}

interface Props {
  segments: Segment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSubLabel?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export function DonutChart({
  segments,
  size = 160,
  strokeWidth = 24,
  centerLabel,
  centerSubLabel,
}: Props) {
  const { colors } = useTheme();
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;
  const total = segments.reduce((s, seg) => s + seg.percentage, 0);

  let currentAngle = 0;
  const paths: { d: string; color: string }[] = [];

  if (total === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
        </Svg>
        {centerLabel ? (
          <View style={styles.center}>
            <Text style={[styles.centerLabel, { color: colors.text }]}>{centerLabel}</Text>
            {centerSubLabel ? (
              <Text style={[styles.centerSubLabel, { color: colors.textSecondary }]}>{centerSubLabel}</Text>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

  for (const seg of segments) {
    const anglePct = (seg.percentage / total) * 360;
    if (anglePct > 0.5) {
      const endAngle = currentAngle + anglePct - 1.5;
      const d = describeArc(cx, cy, r, currentAngle + 0.75, Math.max(currentAngle + 0.75, endAngle));
      paths.push({ d, color: seg.color });
    }
    currentAngle += anglePct;
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {paths.map((p, i) => (
          <Path
            key={i}
            d={p.d}
            stroke={p.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </Svg>
      {centerLabel ? (
        <View style={styles.center}>
          <Text style={[styles.centerLabel, { color: colors.text }]}>{centerLabel}</Text>
          {centerSubLabel ? (
            <Text style={[styles.centerSubLabel, { color: colors.textSecondary }]}>{centerSubLabel}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: {
    fontSize: fontSize.xl,
    fontFamily: "Inter_700Bold",
  },
  centerSubLabel: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
