// src/components/ongoing/TransportConnectionCard.tsx

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  iconName: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  expanded?: boolean;
  title: string;
  description: string;
  onPress: () => void;
  children?: React.ReactNode;
};

export default function TransportConnectionCard({
  iconName,
  selected,
  expanded = false,
  title,
  description,
  onPress,
  children,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.timelineColumn}>
        <View style={styles.blueLineCover} />
        <View style={styles.dashedLineTop} />
        <View style={styles.iconSlot}>
          <Ionicons name={iconName} size={15} color="#94A3B8" />
        </View>
        <View style={styles.dashedLineBottom} />
      </View>

      <View style={styles.card}>
        <TouchableOpacity activeOpacity={0.85} style={styles.header} onPress={onPress}>
          <View style={styles.textGroup}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color="#CBD5E1"
          />
        </TouchableOpacity>

        {expanded ? <View style={styles.body}>{children}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: 6,
    marginBottom: 14,
    zIndex: 3,
  },
  timelineColumn: {
    width: 56,
    alignItems: "center",
    position: "relative",
  },
  blueLineCover: {
    position: "absolute",
    top: -8,
    bottom: -8,
    width: 10,
    backgroundColor: "#FFFFFF",
    zIndex: 1,
  },
  dashedLineTop: {
    flex: 1,
    minHeight: 14,
    borderLeftWidth: 2,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    zIndex: 2,
  },
  iconSlot: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
    zIndex: 2,
  },
  dashedLineBottom: {
    flex: 1,
    minHeight: 14,
    borderLeftWidth: 2,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    zIndex: 2,
  },
  card: {
    flex: 1,
    marginRight: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
  },
  header: {
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textGroup: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: "#64748B",
  },
  description: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  body: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});
