import React, { useEffect, useMemo, useState } from "react";
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
  getTripDetail,
  TripDetailResponse,
  TripItinerary,
  TripPlace,
} from "../../api/schedules/server";

type Props = {
  navigation: any;
  route?: {
    params?: {
      tripId?: string | number;
      tripName?: string;
      startDate?: string;
      endDate?: string;
      location?: string;
      placeCount?: number;
      emoji?: string;
    };
  };
};

const formatDateForDisplay = (date?: string) => {
  if (!date) {
    return "";
  }

  return date.replace(/-/g, ".");
};

const getPlaceTimeText = (place: TripPlace) => {
  if (place.visitTime && place.endTime) {
    return `${place.visitTime} - ${place.endTime}`;
  }

  if (place.visitTime) {
    return place.visitTime;
  }

  return "시간 미정";
};

const getItineraryDate = (itinerary: TripItinerary) => {
  if (itinerary.date) {
    return formatDateForDisplay(itinerary.date);
  }

  return "";
};

const sortPlaces = (places: TripPlace[]) => {
  return [...places].sort((a, b) => {
    const aOrder = a.visitOrder ?? 0;
    const bOrder = b.visitOrder ?? 0;

    return aOrder - bOrder;
  });
};

export default function PlanXDetailScreen({ navigation, route }: Props) {
  const params = route?.params ?? {};

  const [tripDetail, setTripDetail] = useState<TripDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const tripId = params.tripId;

  const title = tripDetail?.title ?? params.tripName ?? "지난 여행";
  const startDate = formatDateForDisplay(
    tripDetail?.startDate ?? params.startDate,
  );
  const endDate = formatDateForDisplay(tripDetail?.endDate ?? params.endDate);
  const location = params.location || "지역 미정";
  const emoji = params.emoji || "🧳";

  const itineraries = useMemo(() => {
    return [...(tripDetail?.itineraries ?? [])].sort((a, b) => {
      return a.day - b.day;
    });
  }, [tripDetail?.itineraries]);

  const totalPlaceCount = useMemo(() => {
    if (!tripDetail) {
      return params.placeCount ?? 0;
    }

    return tripDetail.itineraries.reduce((sum, itinerary) => {
      return sum + itinerary.places.length;
    }, 0);
  }, [params.placeCount, tripDetail]);

  const handleBack = () => {
    navigation.goBack();
  };

  useEffect(() => {
    let cancelled = false;

    const loadTripDetail = async () => {
      if (!tripId) {
        setLoadError("여행 상세 조회에 필요한 tripId가 없습니다.");
        return;
      }

      try {
        setLoading(true);
        setLoadError("");

        const detail = await getTripDetail(tripId);

        if (cancelled) {
          return;
        }

        console.log("[PlanXDetail] 여행 상세 조회 완료:", {
          tripId: detail.tripId,
          title: detail.title,
          itineraryCount: detail.itineraries.length,
        });

        setTripDetail(detail);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.log("[PlanXDetail] 여행 상세 조회 실패:", error);
        setLoadError("지난 여행 상세 정보를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTripDetail();

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.75}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={25} color="#64748B" />
          </TouchableOpacity>

          <Text style={styles.logoText}>Plan.X</Text>

          <View style={styles.headerRightSpace} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tripHeader}>
            <View style={styles.tripImageBox}>
              <Text style={styles.tripEmoji}>{emoji}</Text>
            </View>

            <View style={styles.tripInfoBox}>
              <Text style={styles.tripTitle} numberOfLines={1}>
                {title}
              </Text>

              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                <Text style={styles.metaText}>
                  {startDate || "시작일 미정"} - {endDate || "종료일 미정"}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color="#94A3B8" />
                <Text style={styles.metaText}>
                  {location} · {totalPlaceCount}개 장소
                </Text>
              </View>
            </View>
          </View>

          {loading ?
            <View style={styles.statusCard}>
              <ActivityIndicator color="#2158E8" />
              <Text style={styles.statusText}>지난 여행을 불러오는 중...</Text>
            </View>
          : null}

          {!loading && loadError ?
            <View style={styles.statusCard}>
              <Ionicons name="alert-circle-outline" size={28} color="#EF4444" />
              <Text style={styles.errorTitle}>불러오기 실패</Text>
              <Text style={styles.statusText}>{loadError}</Text>
            </View>
          : null}

          {!loading && !loadError && itineraries.length === 0 ?
            <View style={styles.statusCard}>
              <Ionicons name="map-outline" size={28} color="#94A3B8" />
              <Text style={styles.emptyTitle}>저장된 상세 일정이 없습니다</Text>
              <Text style={styles.statusText}>
                서버에 등록된 Day별 장소 정보가 없어요.
              </Text>
            </View>
          : null}

          {!loading && !loadError && itineraries.length > 0 ?
            <View style={styles.timelinePanel}>
              {itineraries.map((day) => {
                const sortedPlaces = sortPlaces(day.places);

                return (
                  <View
                    key={`${day.itineraryId ?? "itinerary"}-${day.day}`}
                    style={styles.dayBlock}
                  >
                    <View style={styles.dayHeaderRow}>
                      <View style={styles.dayBadge}>
                        <Text style={styles.dayBadgeText}>Day {day.day}</Text>
                      </View>

                      <Text style={styles.dayDate}>
                        {getItineraryDate(day)}
                      </Text>
                    </View>

                    <View style={styles.dayTimelineBody}>
                      <View style={styles.verticalLine} />

                      {sortedPlaces.length === 0 ?
                        <View style={styles.emptyPlaceRow}>
                          <Text style={styles.emptyPlaceText}>
                            이 Day에는 저장된 장소가 없습니다.
                          </Text>
                        </View>
                      : null}

                      {sortedPlaces.map((place, index) => {
                        const order = place.visitOrder ?? index + 1;

                        return (
                          <View
                            key={`${place.tripPlaceId}-${place.placeId}-${index}`}
                            style={styles.placeRow}
                          >
                            <View style={styles.orderBadge}>
                              <Text style={styles.orderBadgeText}>{order}</Text>
                            </View>

                            <View style={styles.placeCard}>
                              <Text style={styles.placeName} numberOfLines={1}>
                                {place.name || "이름 없는 장소"}
                              </Text>

                              <Text style={styles.placeTime}>
                                {getPlaceTimeText(place)}
                              </Text>

                              {place.memo ?
                                <View style={styles.memoList}>
                                  <View style={styles.memoCard}>
                                    <Ionicons
                                      name="reader-outline"
                                      size={15}
                                      color="#64748B"
                                    />
                                    <Text style={styles.memoText}>
                                      {place.memo}
                                    </Text>
                                  </View>
                                </View>
                              : null}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          : null}
        </ScrollView>
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

  header: {
    height: 82,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  logoText: {
    flex: 1,
    color: "#1C2534",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
    textAlign: "center",
  },

  headerRightSpace: {
    width: 40,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 42,
  },

  tripHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },

  tripImageBox: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#D7EDFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
    shadowColor: "#CBD5E1",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },

  tripEmoji: {
    fontSize: 35,
  },

  tripInfoBox: {
    flex: 1,
  },

  tripTitle: {
    color: "#1C2534",
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 8,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  metaText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },

  statusCard: {
    minHeight: 150,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DDE5F0",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },

  statusText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 10,
  },

  errorTitle: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 10,
  },

  emptyTitle: {
    color: "#1F2937",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 10,
  },

  timelinePanel: {
    backgroundColor: "#F5F8FC",
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 42,
  },

  dayBlock: {
    marginBottom: 24,
  },

  dayHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  dayBadge: {
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2158E8",
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },

  dayBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  dayDate: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 18,
  },

  dayTimelineBody: {
    position: "relative",
  },

  verticalLine: {
    position: "absolute",
    left: 13,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#DDE5F0",
  },

  placeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
  },

  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 22,
    zIndex: 2,
  },

  orderBadgeText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  placeCard: {
    flex: 1,
    minHeight: 84,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE5F0",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  placeName: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.2,
    marginBottom: 9,
  },

  placeTime: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "700",
  },

  memoList: {
    marginTop: 14,
    gap: 8,
  },

  memoCard: {
    minHeight: 34,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#DDE5F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  memoText: {
    color: "#1F2937",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 7,
  },

  emptyPlaceRow: {
    minHeight: 54,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE5F0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginLeft: 50,
    marginBottom: 18,
  },

  emptyPlaceText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "700",
  },
});
