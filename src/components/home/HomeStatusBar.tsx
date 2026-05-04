import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  temperature?: number;
  dateText?: string;
  statusText?: string;
};

export default function HomeStatusBar({
  temperature = 23,
  dateText = "2026.04.30",
  statusText = "Day 1",
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Text style={styles.emoji}>☀️</Text>
        <Text style={styles.text}>{temperature}°</Text>
      </View>

      <View style={styles.item}>
        <Text style={styles.emoji}>📅</Text>
        <Text style={styles.text}>{dateText}</Text>
      </View>

      <View style={styles.item}>
        <Text style={styles.emoji}>🗺️</Text>
        <Text style={styles.text}>{statusText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 58,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#E7EEF8",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 2,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
  },

  emoji: {
    fontSize: 14,
    marginRight: 7,
  },

  text: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "800",
  },
});
