import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type Memo = {
  id: string;
  text: string;
};

type Place = {
  id: string;
  order: number;
  name: string;
  time: string;
  memos?: Memo[];
};

type DaySchedule = {
  id: string;
  dayLabel: string;
  date: string;
  places: Place[];
};

type Props = {
  navigation: any;
  route?: {
    params?: {
      tripId?: string;
      tripName?: string;
      startDate?: string;
      endDate?: string;
      location?: string;
      placeCount?: number;
      emoji?: string;
    };
  };
};

const DEFAULT_DAYS: DaySchedule[] = [
  {
    id: "day-1",
    dayLabel: "Day 1",
    date: "2024.03.15",
    places: [
      {
        id: "place-1",
        order: 1,
        name: "강릉역",
        time: "10:00",
        memos: [
          {
            id: "memo-1",
            text: "내릴 때 짐 까먹지 말기",
          },
          {
            id: "memo-2",
            text: "내릴 때 짐 까먹지 말기",
          },
          {
            id: "memo-3",
            text: "내릴 때 짐 까먹지 말기",
          },
        ],
      },
      {
        id: "place-2",
        order: 2,
        name: "강릉역",
        time: "10:00",
      },
    ],
  },
  {
    id: "day-2",
    dayLabel: "Day 2",
    date: "2024.03.16",
    places: [
      {
        id: "place-3",
        order: 2,
        name: "강릉역",
        time: "10:00",
      },
      {
        id: "place-4",
        order: 1,
        name: "강릉역",
        time: "10:00",
        memos: [
          {
            id: "memo-4",
            text: "내릴 때 짐 까먹지 말기",
          },
          {
            id: "memo-5",
            text: "내릴 때 짐 까먹지 말기",
          },
          {
            id: "memo-6",
            text: "내릴 때 짐 까먹지 말기",
          },
        ],
      },
      {
        id: "place-5",
        order: 2,
        name: "강릉역",
        time: "10:00",
      },
    ],
  },
];

export default function PlanXDetailScreen({ navigation, route }: Props) {
  const params = route?.params ?? {};

  const title = params.tripName || "제주도 힐링여행";
  const startDate = params.startDate || "2024.03.15";
  const endDate = params.endDate || "2024.03.18";
  const location = params.location || "제주";
  const placeCount = params.placeCount ?? 8;
  const emoji = params.emoji || "🏝️";

  const handleBack = () => {
    navigation.goBack();
  };

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
              <Text style={styles.tripTitle}>{title}</Text>

              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                <Text style={styles.metaText}>
                  {startDate} - {endDate}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color="#94A3B8" />
                <Text style={styles.metaText}>
                  {location} · {placeCount}개 장소
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.timelinePanel}>
            {DEFAULT_DAYS.map((day) => (
              <View key={day.id} style={styles.dayBlock}>
                <View style={styles.dayHeaderRow}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>{day.dayLabel}</Text>
                  </View>

                  <Text style={styles.dayDate}>{day.date}</Text>
                </View>

                <View style={styles.dayTimelineBody}>
                  <View style={styles.verticalLine} />

                  {day.places.map((place) => (
                    <View key={place.id} style={styles.placeRow}>
                      <View style={styles.orderBadge}>
                        <Text style={styles.orderBadgeText}>{place.order}</Text>
                      </View>

                      <View style={styles.placeCard}>
                        <Text style={styles.placeName}>{place.name}</Text>
                        <Text style={styles.placeTime}>{place.time}</Text>

                        {place.memos?.length ?
                          <View style={styles.memoList}>
                            {place.memos.map((memo) => (
                              <View key={memo.id} style={styles.memoCard}>
                                <Ionicons
                                  name="reader-outline"
                                  size={15}
                                  color="#64748B"
                                />
                                <Text style={styles.memoText}>{memo.text}</Text>
                              </View>
                            ))}
                          </View>
                        : null}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
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
});
