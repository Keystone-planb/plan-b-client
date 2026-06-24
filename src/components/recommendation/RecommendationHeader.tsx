import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  title: string;
  onClose: () => void;
};

export default function RecommendationHeader({ title, onClose }: Props) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>

      <TouchableOpacity
        style={styles.closeButton}
        activeOpacity={0.8}
        onPress={onClose}
      >
        <Ionicons name="close" size={22} color="#64748B" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    position: "relative",
  },

  title: {
    flex: 1,
    color: "#1C2534",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },

  closeButton: {
    position: "absolute",
    right: 0,
    top: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});
