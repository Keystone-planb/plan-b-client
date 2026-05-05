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
import RadialBackground from "../components/RadialBackground";
import { getTrips, TripSummary } from "../../api/schedules/server";

type Props = {
  navigation: any;
};

type PlanXDisplayTrip = PlanXTrip & {
  source: "server";
  tripId: string;
};

const formatDateForPlanX = (date: string) => {
  return date.replace(/-/g, ".");
};

const guessLocationFromTitle = (title: string) => {
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    return "지역 미정";
  }

  const [firstWord] = trimmedTitle.split(/\s+/);

  return firstWord || "지역 미정";
};

const convertTripToPlanXTrip = (trip: TripSummary): PlanXDisplayTrip => {
  return {
    id: String(trip.tripId),
    tripId: String(trip.tripId),
    title: trip.title,
    startDate: formatDateForPlanX(trip.startDate),
    endDate: formatDateForPlanX(trip.endDate),
    location: guessLocationFromTitle(trip.title),
    placeCount: 0,
    emoji: "🧳",
    source: "server",
  };
};

export default function PlanXScreen({ navigation }: Props) {
  const [trips, setTrips] = useState<PlanXDisplayTrip[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadTrips = async () => {
        try {
          setLoading(true);

          const serverTrips = await getTrips("PAST");
          const nextTrips = serverTrips.map(convertTripToPlanXTrip);

          setTrips(nextTrips);
        } catch (error) {
          console.log("Plan.X 여행 목록 조회 실패:", error);
          setTrips([]);
        } finally {
          setLoading(false);
        }
      };

      loadTrips();
    }, []),
  );

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("MainTabs");
  };

  const handlePressTrip = (trip: PlanXTrip) => {
    const selectedTrip = trips.find(
      (item) => item.id === trip.id && item.title === trip.title,
    );

    if (!selectedTrip) {
      return;
    }

    navigation.navigate("PlanXDetail", {
      tripId: selectedTrip.tripId,
      tripName: selectedTrip.title,
      startDate: selectedTrip.startDate,
      endDate: selectedTrip.endDate,
      location: selectedTrip.location,
    });
  };

  const hasTrips = trips.length > 0;

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
              <Text style={styles.loadingText}>여행 목록을 불러오는 중...</Text>
            </View>
          : null}

          {!loading && !hasTrips ?
            <View style={styles.emptyBox}>
              <View style={styles.emptyRadialBackground} pointerEvents="none">
                <RadialBackground />
              </View>

              <View style={styles.emptyContent}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="time-outline" size={34} color="#2158E8" />
                </View>

                <Text style={styles.emptyTitle}>아직 지난 여행이 없어요</Text>

                <Text style={styles.emptyDescription}>
                  완료된 여행이 생기면 이곳에서 다시 확인할 수 있어요.
                </Text>
              </View>
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

  emptyBox: {
    minHeight: 430,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    position: "relative",
    overflow: "hidden",
  },

  emptyRadialBackground: {
    position: "absolute",
    top: 34,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 0,
  },

  emptyContent: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },

  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#CFE3FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    color: "#202938",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },

  emptyDescription: {
    color: "#9AA8BA",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
    textAlign: "center",
  },
});
