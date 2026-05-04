import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  getHomeSchedules,
  HomeScheduleResponse,
  OngoingPlace,
  UpcomingTrip as ApiUpcomingTrip,
} from "../../api/home/homeSchedules";

import HomeStatusBar from "../components/home/HomeStatusBar";
import OngoingScheduleCard, {
  OngoingSchedule,
} from "../components/home/OngoingScheduleCard";
import UpcomingTripCard, {
  UpcomingTrip,
} from "../components/home/UpcomingTripCard";

type Props = {
  navigation: any;
};

const createOngoingSchedule = (
  ongoingPlaces: OngoingPlace[],
): OngoingSchedule | null => {
  if (ongoingPlaces.length === 0) {
    return null;
  }

  const firstPlace = ongoingPlaces[0];

  return {
    id: "ongoing-schedule-1",
    title: "강릉 여행",
    location: firstPlace.name,
    startDate: "2026.04.30",
    endDate: "2026.05.05",
  };
};

const convertUpcomingTrip = (trip: ApiUpcomingTrip): UpcomingTrip => {
  return {
    id: trip.id,
    title: trip.title,
    location: trip.location,
    startDate: trip.startDate,
    endDate: trip.endDate,
    placeCount: trip.placeCount,
    thumbnailEmoji: trip.thumbnailEmoji,
  };
};

export default function MainScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [homeData, setHomeData] = useState<HomeScheduleResponse>({
    ongoingPlaces: [],
    upcomingTrips: [],
  });

  useEffect(() => {
    const loadHomeSchedules = async () => {
      try {
        setLoading(true);

        const data = await getHomeSchedules();
        setHomeData(data);
      } catch {
        setHomeData({
          ongoingPlaces: [],
          upcomingTrips: [],
        });
      } finally {
        setLoading(false);
      }
    };

    loadHomeSchedules();
  }, []);

  const ongoingSchedule = createOngoingSchedule(homeData.ongoingPlaces);
  const upcomingTrips = homeData.upcomingTrips.map(convertUpcomingTrip);
  const firstUpcomingTrip = upcomingTrips[0];

  const hasOngoingSchedule = Boolean(ongoingSchedule);

  const handleOpenAddSchedule = () => {
    navigation.navigate("AddSchedule");
  };

  const handleOpenPlanX = () => {
    navigation.navigate("PlanX");
  };

  const handleOpenOngoingSchedule = () => {
    if (!ongoingSchedule) {
      return;
    }

    navigation.navigate("PlanA", {
      tripName: ongoingSchedule.title,
      startDate: ongoingSchedule.startDate,
      endDate: ongoingSchedule.endDate,
      location: ongoingSchedule.location,
    });
  };

  const handleOpenUpcomingTrip = (trip: UpcomingTrip) => {
    navigation.navigate("PlanA", {
      tripName: trip.title,
      startDate: trip.startDate,
      endDate: trip.endDate,
      location: trip.location,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.logo}>Plan.B</Text>

          {loading ?
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#2158E8" />
            </View>
          : <>
              <View style={styles.statusWrapper}>
                <HomeStatusBar
                  temperature={23}
                  dateText="2026.04.30"
                  statusText={hasOngoingSchedule ? "Day 1" : "D-78"}
                />
              </View>

              {ongoingSchedule ?
                <View style={styles.sectionBlock}>
                  <OngoingScheduleCard
                    schedule={ongoingSchedule}
                    onPress={handleOpenOngoingSchedule}
                  />
                </View>
              : null}

              <View
                style={[
                  styles.sectionHeader,
                  !hasOngoingSchedule && styles.firstSectionHeader,
                ]}
              >
                <Text style={styles.sectionTitle}>다음 여행</Text>

                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={handleOpenPlanX}
                >
                  <Text style={styles.viewAllText}>전체</Text>
                </TouchableOpacity>
              </View>

              {firstUpcomingTrip ?
                <View style={styles.sectionBlock}>
                  <UpcomingTripCard
                    trip={firstUpcomingTrip}
                    onPress={() => handleOpenUpcomingTrip(firstUpcomingTrip)}
                  />
                </View>
              : <View style={styles.emptyTripCard}>
                  <Ionicons name="calendar-outline" size={28} color="#9AA8BA" />
                  <Text style={styles.emptyTitle}>예정된 여행이 없어요</Text>
                  <Text style={styles.emptyDescription}>
                    새로운 여행 일정을 추가해보세요.
                  </Text>

                  <TouchableOpacity
                    style={styles.addScheduleButton}
                    activeOpacity={0.82}
                    onPress={handleOpenAddSchedule}
                  >
                    <Text style={styles.addScheduleButtonText}>
                      여행 일정 추가
                    </Text>
                  </TouchableOpacity>
                </View>
              }
            </>
          }
        </ScrollView>

        <TouchableOpacity
          style={styles.floatingAddButton}
          activeOpacity={0.85}
          onPress={handleOpenAddSchedule}
        >
          <Ionicons name="add" size={27} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  screen: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 21,
    paddingBottom: 120,
  },

  logo: {
    marginTop: 30,
    marginBottom: 50,
    color: "#202938",
    fontSize: 40,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -1.1,
  },

  loadingBox: {
    height: 260,
    alignItems: "center",
    justifyContent: "center",
  },

  statusWrapper: {
    marginBottom: 25,
  },

  sectionBlock: {
    marginBottom: 35,
  },

  sectionHeader: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  firstSectionHeader: {
    marginTop: 72,
  },

  sectionTitle: {
    color: "#111827",
    fontSize: 21,
    fontWeight: "900",
  },

  viewAllText: {
    color: "#2158E8",
    fontSize: 14,
    fontWeight: "800",
  },

  emptyTripCard: {
    minHeight: 190,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3EAF3",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 28,
    shadowColor: "#E7EEF8",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 3,
  },

  emptyTitle: {
    marginTop: 12,
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
  },

  emptyDescription: {
    marginTop: 7,
    color: "#7A8BA3",
    fontSize: 13,
    fontWeight: "600",
  },

  addScheduleButton: {
    height: 40,
    marginTop: 20,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
  },

  addScheduleButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  floatingAddButton: {
    position: "absolute",
    right: 24,
    bottom: 31,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#273142",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1E293B",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
});
