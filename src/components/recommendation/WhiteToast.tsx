import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type WhiteToastState = {
  title: string;
  message?: string;
  type?: "success" | "error" | "info";
} | null;

export default function WhiteToast({ toast }: { toast: WhiteToastState }) {
  if (!toast) return null;

  const iconName =
    toast.type === "success" ? "checkmark-circle"
    : toast.type === "error" ? "alert-circle"
    : "information-circle";

  const iconColor =
    toast.type === "success" ? "#16A34A"
    : toast.type === "error" ? "#EF4444"
    : "#2158E8";

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={styles.toast}>
        <Ionicons name={iconName} size={20} color={iconColor} />
        <View style={styles.textBox}>
          <Text style={styles.title}>{toast.title}</Text>
          {toast.message ? (
            <Text style={styles.message}>{toast.message}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 28,
    zIndex: 999,
    elevation: 999,
    alignItems: "center",
  },

  toast: {
    width: "100%",
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
  },

  textBox: {
    flex: 1,
  },

  title: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "900",
  },

  message: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
  },
});
