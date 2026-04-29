import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PlanXScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Plan.X</Text>
        <Text style={styles.description}>Plan.X 화면 구현 예정</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 130,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#202938",
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#8FA0B7",
  },
});
