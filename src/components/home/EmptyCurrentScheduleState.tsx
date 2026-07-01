import React, { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = {
  addButton: ReactNode;
  onPressPastTrips: () => void;
};

export default function EmptyCurrentScheduleState({
  addButton,
  onPressPastTrips,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons
          name="briefcase-outline"
          size={52}
          color="#2158E8"
        />
      </View>

      <Text style={styles.title}>
        현재 진행 중이거나{"\n"}
        예정된 일정이 없습니다
      </Text>

      <Text style={styles.description}>
        새로운 여행 일정을 추가해{"\n"}
        즐거운 여행을 계획해보세요!
      </Text>

      <View style={styles.addButtonArea}>
        {addButton}
      </View>

      <TouchableOpacity
        style={styles.pastTripCard}
        activeOpacity={0.85}
        onPress={onPressPastTrips}
      >
        <View style={styles.pastTripIconCircle}>
          <Ionicons
            name="time-outline"
            size={27}
            color="#2158E8"
          />
        </View>

        <View style={styles.pastTripTextArea}>
          <Text style={styles.pastTripTitle}>
            지난 여행이 있으신가요?
          </Text>

          <Text style={styles.pastTripDescription}>
            왼쪽 탭에서 지난 여행 일정을{"\n"}
            확인할 수 있어요.
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={23}
          color="#64748B"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 24,
  },

  iconCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "#D7E9FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },

  title: {
    color: "#1C2534",
    fontSize: 23,
    lineHeight: 33,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.6,
  },

  description: {
    marginTop: 14,
    color: "#9AA8BA",
    fontSize: 16,
    lineHeight: 25,
    fontWeight: "600",
    textAlign: "center",
  },

  addButtonArea: {
    marginTop: 28,
    alignItems: "center",
  },

  pastTripCard: {
    width: "100%",
    minHeight: 102,
    marginTop: 30,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: "#E3EEFF",
    flexDirection: "row",
    alignItems: "center",
  },

  pastTripIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  pastTripTextArea: {
    flex: 1,
  },

  pastTripTitle: {
    color: "#1C2534",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },

  pastTripDescription: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
});
