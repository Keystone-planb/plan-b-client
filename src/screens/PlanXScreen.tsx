import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";

import PlanXTripCard, { PlanXTrip } from "../components/PlanXTripCard";
import { loadLatestPlanASchedule } from "../api/schedules/planAStorage";
import { TravelSchedule } from "../types/schedule";

type Props = {
  navigation: any;
};

type PlanXDisplayTrip = PlanXTrip & {
  source?: "saved" | "mock";
  scheduleId?: string;
};

/**
 * 임시 목데이터
 *
 * 저장된 Plan.A 일정이 있으면 목록 맨 위에 추가로 표시된다.
 * 나중에는 서버 또는 AsyncStorage 전체 목록으로 대체하면 된다.
 */
const MOCK_TRIPS: PlanXDisplayTrip[] = [
  {
    id: "1",
    title: "제주도 힐링여행",
    startDate: "2024-03-15",
    endDate: "2024-03-18",
    location: "제주",
    placeCount: 8,
    emoji: "🏝️",
    source: "mock",
  },
  {
    id: "2",
    title: "강릉 감성여행",
    startDate: "2024-05-03",
    endDate: "2024-05-05",
    location: "강릉",
    placeCount: 6,
    emoji: "🌊",
    source: "mock",
  },
  {
    id: "3",
    title: "부산 야경여행",
    startDate: "2024-07-12",
    endDate: "2024-07-14",
    location: "부산",
    placeCount: 9,
    emoji: "🌉",
    source: "mock",
  },
];

const getPlaceCount = (schedule: TravelSchedule) => {
  return schedule.days.reduce((total, day) => {
    return total + day.places.length;
  }, 0);
};

const convertScheduleToPlanXTrip = (
  schedule: TravelSchedule,
): PlanXDisplayTrip => {
  return {
    id: schedule.id,
    scheduleId: schedule.id,
    title: schedule.tripName,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
    location: schedule.location || "지역 미정",
    placeCount: getPlaceCount(schedule),
    emoji: "🧳",
    source: "saved",
  };
};

export default function PlanXScreen({ navigation }: Props) {
  const [trips, setTrips] = useState<PlanXDisplayTrip[]>(MOCK_TRIPS);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadTrips = async () => {
        try {
          setLoading(true);

          const latestSchedule = await loadLatestPlanASchedule();

          if (!latestSchedule) {
            setTrips(MOCK_TRIPS);
            return;
          }

          const savedTrip = convertScheduleToPlanXTrip(latestSchedule);

          const filteredMockTrips = MOCK_TRIPS.filter(
            (trip) => trip.id !== savedTrip.id,
          );

          setTrips([savedTrip, ...filteredMockTrips]);
        } catch (error) {
          console.log("Plan.X 일정 불러오기 실패:", error);
          setTrips(MOCK_TRIPS);
        } finally {
          setLoading(false);
        }
      };

      loadTrips();
    }, []),
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePressTrip = (trip: PlanXTrip) => {
    const selectedTrip = trips.find(
      (item) => item.id === trip.id && item.title === trip.title,
    );

    if (selectedTrip?.source === "saved" && selectedTrip.scheduleId) {
      navigation.navigate("PlanA", {
        scheduleId: selectedTrip.scheduleId,
        tripName: selectedTrip.title,
        startDate: selectedTrip.startDate,
        endDate: selectedTrip.endDate,
        location: selectedTrip.location,
      });

      return;
    }

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
          {loading ?
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#2158E8" />
              <Text style={styles.loadingText}>
                저장된 여행을 불러오는 중...
              </Text>
            </View>
          : null}

          {trips.map((trip) => (
            <PlanXTripCard
              key={`${trip.source}-${trip.id}`}
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

  loadingBox: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: "#EAF3FF",
    borderWidth: 1,
    borderColor: "#DCEBFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },

  loadingText: {
    color: "#2158E8",
    fontSize: 13,
    fontWeight: "800",
  },
});
