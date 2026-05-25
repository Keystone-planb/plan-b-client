import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  styles: any;
  onBack: () => void;
};

export default function OngoingHeader({ styles, onBack }: Props) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        activeOpacity={0.75}
        onPress={onBack}
      >
        <Ionicons name="chevron-back" size={24} color="#64748B" />
      </TouchableOpacity>

      <Text style={styles.logoText}>Plan.B</Text>

      <View style={styles.headerRightSpace} />
    </View>
  );
}
