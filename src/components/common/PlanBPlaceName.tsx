import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from "react-native";

type Props = {
  name?: string | null;
  textStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
  stacked?: boolean;
  testID?: string;
};

const PLAN_B_SUFFIX_PATTERN = /\s*\(\s*PLAN\s*B\s*\)\s*$/i;
const BRACKET_NAME_PATTERN = /^\s*\[([\s\S]+)\]\s*$/;

export const getPlanBPlaceDisplay = (name?: string | null) => {
  const rawName = String(name ?? "").trim();
  const isPlanB = PLAN_B_SUFFIX_PATTERN.test(rawName);

  if (!isPlanB) {
    return {
      displayName: rawName || "이름 없는 장소",
      isPlanB: false,
    };
  }

  const withoutSuffix = rawName
    .replace(PLAN_B_SUFFIX_PATTERN, "")
    .trim();

  const bracketMatch = withoutSuffix.match(BRACKET_NAME_PATTERN);
  const displayName =
    bracketMatch?.[1]?.trim() ||
    withoutSuffix ||
    "이름 없는 장소";

  return {
    displayName,
    isPlanB: true,
  };
};

export default function PlanBPlaceName({
  name,
  textStyle,
  numberOfLines,
  stacked = false,
  testID,
}: Props) {
  const { displayName, isPlanB } =
    getPlanBPlaceDisplay(name);

  return (
    <View
      style={[
        styles.row,
        stacked && styles.stackedRow,
      ]}
    >
      {isPlanB ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Plan.B</Text>
        </View>
      ) : null}

      <Text
        style={[styles.name, textStyle]}
        numberOfLines={numberOfLines}
        ellipsizeMode="tail"
        lineBreakStrategyIOS="hangul-word"
        android_hyphenationFrequency="none"
        testID={testID}
      >
        {displayName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    minWidth: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },

  stackedRow: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 5,
  },

  badge: {
    marginTop: 2,
    minHeight: 20,
    borderRadius: 999,
    backgroundColor: "#2158E8",
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  name: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
});
