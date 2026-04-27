import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import PlanXTripCard, { PlanXTrip } from "../components/PlanXTripCard";

type Props = {
  navigation: any;
};

/**
 * 임시 목데이터
 *
 * 나중에는 서버 또는 AsyncStorage에서 지난 여행 목록을 받아와서
 * 이 배열을 대체하면 된다.
 */
const MOCK_TRIPS: PlanXTrip[] = [
  {
    id: "1",
    title: "제주도 힐링여행",
    startDate: "2024-03-15",
    endDate: "2024-03-18",
    location: "제주",
    placeCount: 8,
    emoji: "🏝️",
  },
  {
    id: "2",
    title: "강릉 감성여행",
    startDate: "2024-05-03",
    endDate: "2024-05-05",
    location: "강릉",
    placeCount: 6,
    emoji: "🌊",
  },
  {
    id: "3",
    title: "부산 야경여행",
    startDate: "2024-07-12",
    endDate: "2024-07-14",
    location: "부산",
    placeCount: 9,
    emoji: "🌉",
  },
];

export default function PlanXScreen({ navigation }: Props) {
  const handleBack = () => {
    navigation.goBack();
  };

  const handlePressTrip = (trip: PlanXTrip) => {
    /**
     * 추후 지난 여행 상세 화면 연결 예정
     *
     * 예:
     * navigation.navigate("PlanXDetail", {
     *   tripId: trip.id,
     * });
     */
    console.log("[지난 여행 선택]", trip);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.8}
              onPress={handleBack}
            >
              <Ionicons name="chevron-back" size={24} color="#1C2534" />
            </TouchableOpacity>

            <Text style={styles.logoText}>Plan.X</Text>

            <View style={styles.iconPlaceholder} />
          </View>

          <Text style={styles.description}>
            지난 여행들을 다시 떠올려보세요
          </Text>
        </View>

        <View style={styles.listSection}>
          {MOCK_TRIPS.map((trip) => (
            <PlanXTripCard
              key={trip.id}
              trip={trip}
              onPress={handlePressTrip}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },

  scrollContent: {
    paddingBottom: 40,
  },

  header: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E1E7EF",
    paddingTop: 18,
    paddingHorizontal: 24,
    paddingBottom: 20,
    marginBottom: 30,
  },

  headerRow: {
    width: "100%",
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  iconButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  iconPlaceholder: {
    width: 34,
    height: 34,
  },

  logoText: {
    color: "#1C2534",
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: -1,
  },

  description: {
    color: "#627187",
    fontSize: 14,
    fontWeight: "500",
  },

  listSection: {
    paddingHorizontal: 21,
  },
});
