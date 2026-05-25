import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  styles: any;
};

export default function OngoingEmptyDayCard({ styles }: Props) {
  return (
    <View style={styles.emptyDayCard}>
      <Ionicons name="calendar-outline" size={28} color="#94A3B8" />
      <Text style={styles.emptyDayTitle}>
        이 Day에는 저장된 장소가 없어요
      </Text>
      <Text style={styles.emptyDayDescription}>
        일정 편집에서 장소를 추가해보세요.
      </Text>
    </View>
  );
}
