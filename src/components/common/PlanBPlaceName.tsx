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

  return {
    displayName:
      bracketMatch?.[1]?.trim() ||
      withoutSuffix ||
      "이름 없는 장소",
    isPlanB: true,
  };
};

export default function PlanBPlaceName({
  name,
  textStyle,
  numberOfLines,
  testID,
}: Props) {
  const { displayName, isPlanB } =
    getPlanBPlaceDisplay(name);

  return (
    <View style={styles.row}>
      {isPlanB ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Plan.B</Text>
        </View>
      ) : null}

      <Text
        style={[styles.name, textStyle]}
        numberOfLines={numberOfLines}
        ellipsizeMode="tail"
        testID={testID}
      >
        {displayName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: 6,
    rowGap: 4,
    minWidth: 0,
  },

  badge: {
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
    flexShrink: 1,
    minWidth: 0,
  },
});
