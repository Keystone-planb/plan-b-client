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
  UpcomingTrip,
} from "../../api/home/homeSchedules";

type Props = {
  navigation: any;
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

        console.log("[홈 화면] 진행중인 일정:", data.ongoingPlaces.length);
        console.log("[홈 화면] 다음 여행:", data.upcomingTrips.length);
      } catch (error) {
        console.log("[홈 화면] 일정 조회 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHomeSchedules();
  }, []);

  const handleOpenAddSchedule = () => {
    navigation.navigate("AddSchedule");
  };

  const handleOpenPlanX = () => {
    navigation.navigate("PlanX");
  };

  const handleOpenPlace = (place: OngoingPlace) => {
    console.log("[홈 화면] 진행중인 장소 선택:", place);
  };

  const handleOpenTrip = (trip: UpcomingTrip) => {
    console.log("[홈 화면] 다음 여행 선택:", trip);
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

          <View style={styles.mapPreview}>
            <View style={styles.mapBackground}>
              <View style={[styles.mapRoad, styles.mapRoadOne]} />
              <View style={[styles.mapRoad, styles.mapRoadTwo]} />
              <View style={[styles.mapRoad, styles.mapRoadThree]} />

              <View style={[styles.mapBlock, styles.mapBlockOne]} />
              <View style={[styles.mapBlock, styles.mapBlockTwo]} />
              <View style={[styles.mapBlock, styles.mapBlockThree]} />

              <View style={styles.mapPin}>
                <Ionicons name="location" size={19} color="#FFFFFF" />
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>진행중인 일정</Text>

            <TouchableOpacity activeOpacity={0.75}>
              <Text style={styles.viewAllText}>전체</Text>
            </TouchableOpacity>
          </View>

          {loading ?
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#2158E8" />
            </View>
          : <View style={styles.ongoingList}>
              {homeData.ongoingPlaces.map((place) => (
                <TouchableOpacity
                  key={place.id}
                  style={styles.ongoingItem}
                  activeOpacity={0.78}
                  onPress={() => handleOpenPlace(place)}
                >
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderText}>{place.order}</Text>
                  </View>

                  <View style={styles.ongoingInfo}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <Text style={styles.placeAddress}>{place.address}</Text>

                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={14} color="#70839C" />
                      <Text style={styles.timeText}>{place.time}</Text>
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color="#C5CEDA" />
                </TouchableOpacity>
              ))}
            </View>
          }

          <View style={styles.todayCard}>
            <Text style={styles.todayText}>📅 2026.05.05</Text>
            <Text style={styles.todayText}>🗺️ Day 1</Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>다음 여행</Text>

            <TouchableOpacity activeOpacity={0.75} onPress={handleOpenPlanX}>
              <Text style={styles.viewAllText}>전체</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tripList}>
            {homeData.upcomingTrips.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                style={styles.tripCard}
                activeOpacity={0.78}
                onPress={() => handleOpenTrip(trip)}
              >
                <View style={styles.tripThumbnail}>
                  <Text style={styles.tripEmoji}>{trip.thumbnailEmoji}</Text>
                </View>

                <View style={styles.tripInfo}>
                  <Text style={styles.tripTitle}>{trip.title}</Text>

                  <View style={styles.tripMetaRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={13}
                      color="#70839C"
                    />
                    <Text style={styles.tripMetaText}>
                      {trip.startDate} - {trip.endDate}
                    </Text>
                  </View>

                  <View style={styles.tripMetaRow}>
                    <Ionicons
                      name="location-outline"
                      size={13}
                      color="#70839C"
                    />
                    <Text style={styles.tripMetaText}>
                      {trip.location} · {trip.placeCount}개 장소
                    </Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#C5CEDA" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.bottomTab}>
          <TouchableOpacity style={styles.tabButton} activeOpacity={0.75}>
            <Ionicons name="refresh-outline" size={27} color="#B7C2D1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabButton} activeOpacity={0.75}>
            <Ionicons name="home-outline" size={27} color="#273142" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabButton}
            activeOpacity={0.75}
            onPress={handleOpenAddSchedule}
          >
            <Ionicons name="person-outline" size={27} color="#B7C2D1" />
          </TouchableOpacity>
        </View>
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
    backgroundColor: "#FFFFFF",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 17,
    paddingBottom: 138,
  },

  logo: {
    marginTop: 28,
    marginBottom: 54,
    color: "#202938",
    fontSize: 40,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -1.1,
  },

  mapPreview: {
    height: 200,
    borderRadius: 11,
    overflow: "hidden",
    backgroundColor: "#E8EEF5",
    marginBottom: 31,
  },

  mapBackground: {
    flex: 1,
    backgroundColor: "#EEF3F7",
    overflow: "hidden",
  },

  mapRoad: {
    position: "absolute",
    height: 8,
    borderRadius: 999,
    backgroundColor: "#D2DAE5",
    transform: [{ rotate: "-34deg" }],
  },

  mapRoadOne: {
    width: 280,
    top: 40,
    left: -50,
  },

  mapRoadTwo: {
    width: 360,
    top: 106,
    left: 18,
    backgroundColor: "#C9D2DE",
  },

  mapRoadThree: {
    width: 250,
    top: 156,
    right: -30,
  },

  mapBlock: {
    position: "absolute",
    borderRadius: 12,
    backgroundColor: "#D9EAD7",
  },

  mapBlockOne: {
    width: 86,
    height: 70,
    top: 16,
    left: 18,
  },

  mapBlockTwo: {
    width: 96,
    height: 80,
    top: 72,
    right: 28,
  },

  mapBlockThree: {
    width: 66,
    height: 58,
    bottom: 20,
    left: 78,
  },

  mapPin: {
    position: "absolute",
    left: "48%",
    top: "46%",
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  sectionHeader: {
    marginHorizontal: 19,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    color: "#111827",
    fontSize: 21,
    fontWeight: "900",
  },

  viewAllText: {
    color: "#2158E8",
    fontSize: 14,
    fontWeight: "700",
  },

  loadingBox: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },

  ongoingList: {
    marginHorizontal: 5,
    marginBottom: 8,
  },

  ongoingItem: {
    minHeight: 105,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E6ECF3",
    paddingHorizontal: 24,
  },

  orderBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 22,
  },

  orderText: {
    color: "#2158E8",
    fontSize: 15,
    fontWeight: "800",
  },

  ongoingInfo: {
    flex: 1,
  },

  placeName: {
    color: "#273142",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 7,
  },

  placeAddress: {
    color: "#70839C",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 7,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  timeText: {
    marginLeft: 4,
    color: "#70839C",
    fontSize: 13,
    fontWeight: "600",
  },

  todayCard: {
    minHeight: 70,
    marginTop: 10,
    marginBottom: 37,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 21,
  },

  todayText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "800",
    marginRight: 21,
  },

  tripList: {
    marginHorizontal: 18,
  },

  tripCard: {
    minHeight: 94,
    flexDirection: "row",
    alignItems: "center",
  },

  tripThumbnail: {
    width: 73,
    height: 73,
    borderRadius: 10,
    backgroundColor: "#D5EBFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 23,
  },

  tripEmoji: {
    fontSize: 35,
  },

  tripInfo: {
    flex: 1,
  },

  tripTitle: {
    color: "#273142",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 9,
  },

  tripMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  tripMetaText: {
    marginLeft: 6,
    color: "#70839C",
    fontSize: 12,
    fontWeight: "600",
  },

  bottomTab: {
    position: "absolute",
    left: 11,
    right: 11,
    bottom: 28,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE5F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#1E293B",
    shadowOpacity: 0.08,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 12,
    elevation: 6,
  },

  tabButton: {
    width: 74,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },
});
