import React, { useCallback, useEffect, useState } from "react";
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
import { useFocusEffect } from "@react-navigation/native";

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
import RadialBackground from "../components/RadialBackground";
import CalendarIcon from "../assets/calendar.svg";
import WeatherNotificationCard from "../components/notifications/WeatherNotificationCard";
import {
  dismissNotification,
  getWeatherNotifications,
} from "../../api/notifications/notifications";
import type { WeatherNotification } from "../types/notification";

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
    title: "진행중인 여행",
    location: firstPlace.name,
    startDate: "",
    endDate: "",
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

const getTodayText = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const date = `${now.getDate()}`.padStart(2, "0");

  return `${year}.${month}.${date}`;
};

const getHomeStatusText = ({
  hasOngoingSchedule,
  firstUpcomingTrip,
}: {
  hasOngoingSchedule: boolean;
  firstUpcomingTrip?: UpcomingTrip;
}) => {
  if (hasOngoingSchedule) {
    return "Day 1";
  }

  if (firstUpcomingTrip) {
    return "예정";
  }

  return "일정 없음";
};

export default function MainScreen({ navigation }: Props) {

  const [weatherNotifications, setWeatherNotifications] = useState<
    WeatherNotification[]
  >([]);


  useEffect(() => {
    const loadWeatherNotifications = async () => {
      const notifications = await getWeatherNotifications(1);
      setWeatherNotifications(notifications);
    };

    loadWeatherNotifications();
  }, []);

  const [loading, setLoading] = useState(true);
  const [homeData, setHomeData] = useState<HomeScheduleResponse>({
    ongoingPlaces: [],
    upcomingTrips: [],
  });

  const loadHomeSchedules = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getHomeSchedules();
      setHomeData(data);
    } catch (error) {
      console.log("홈 일정 조회 실패:", error);

      setHomeData({
        ongoingPlaces: [],
        upcomingTrips: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHomeSchedules();
    }, [loadHomeSchedules]),
  );

  const ongoingSchedule = createOngoingSchedule(homeData.ongoingPlaces);
  const upcomingTrips = homeData.upcomingTrips.map(convertUpcomingTrip);
  const firstUpcomingTrip = upcomingTrips[0];

  const hasOngoingSchedule = Boolean(ongoingSchedule);
  const hasAnySchedule = hasOngoingSchedule || Boolean(firstUpcomingTrip);
  const statusText = getHomeStatusText({
    hasOngoingSchedule,
    firstUpcomingTrip,
  });

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
      tripId: trip.id,
    });
  };

  const handleDismissWeatherNotification = async (
    notification: WeatherNotification,
  ) => {
    await dismissNotification(notification.notificationId);

    setWeatherNotifications((prev) =>
      prev.filter(
        (item) => item.notificationId !== notification.notificationId,
      ),
    );
  };

  const handlePressWeatherRecommend = (notification: WeatherNotification) => {
    navigation.navigate("PlanA", {
      tripId: String(notification.tripId ?? ""),
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

        {weatherNotifications.map((notification) => (
          <WeatherNotificationCard
            key={String(notification.notificationId)}
            notification={notification}
            onDismiss={handleDismissWeatherNotification}
            onPressRecommend={handlePressWeatherRecommend}
          />
        ))}

          <Text style={styles.logo}>Plan.B</Text>

          {loading ?
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#2158E8" />
            </View>
          : <>
              <View style={styles.statusWrapper}>
                <HomeStatusBar
                  temperature={23}
                  dateText={getTodayText()}
                  statusText={statusText}
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
              : null}

              {!hasAnySchedule ?
                <View style={styles.emptyStateContainer}>
                  <View
                    style={styles.emptyRadialBackground}
                    pointerEvents="none"
                  >
                    <RadialBackground />
                  </View>

                  <View style={styles.emptyContent}>
                    <View style={styles.emptyIconWrapper}>
                      <CalendarIcon width={80} height={80} />
                    </View>

                    <Text style={styles.emptyTitle}>
                      등록된 일정이 없습니다
                    </Text>

                    <Text style={styles.emptyDescription}>
                      새로운 여행 일정을 추가해보세요
                    </Text>

                    <TouchableOpacity
                      style={styles.addScheduleButton}
                      activeOpacity={0.82}
                      onPress={handleOpenAddSchedule}
                    >
                      <Text style={styles.addScheduleButtonText}>
                        일정 추가하기
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              : null}
            </>
          }
        </ScrollView>

        {hasAnySchedule ?
          <TouchableOpacity
            style={styles.floatingAddButton}
            activeOpacity={0.85}
            onPress={handleOpenAddSchedule}
          >
            <Ionicons name="add" size={27} color="#FFFFFF" />
          </TouchableOpacity>
        : null}
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

  emptyStateContainer: {
    flex: 1,
    minHeight: 520,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 120,
    position: "relative",
    overflow: "hidden",
  },

  emptyRadialBackground: {
    position: "absolute",
    top: 42,
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

  emptyIconWrapper: {
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
    textAlign: "center",
    marginBottom: 28,
  },

  addScheduleButton: {
    minWidth: 132,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },

  addScheduleButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  floatingAddButton: {
    position: "absolute",
    right: 24,
    bottom: 104,
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
    elevation: 20,
    zIndex: 999,
  },
});
