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

type Props = {
  navigation: any;
  route: {
    params?: {
      tripId?: string;
      title?: string;
    };
  };
};

type MemoItem = {
  id: string;
  text: string;
};

type PlaceItem = {
  id: string;
  order: number;
  name: string;
  time: string;
  memos?: MemoItem[];
};

type DayPlan = {
  id: string;
  dayLabel: string;
  date: string;
  places: PlaceItem[];
};

const DAY_PLANS: DayPlan[] = [
  {
    id: "day1",
    dayLabel: "Day 1",
    date: "2024.03.15",
    places: [
      {
        id: "place1",
        order: 1,
        name: "강릉역",
        time: "10:00",
        memos: [
          { id: "memo1", text: "내릴 때 짐 까먹지 말기" },
          { id: "memo2", text: "내릴 때 짐 까먹지 말기" },
          { id: "memo3", text: "내릴 때 짐 까먹지 말기" },
        ],
      },
      {
        id: "place2",
        order: 2,
        name: "강릉역",
        time: "10:00",
      },
    ],
  },
  {
    id: "day2",
    dayLabel: "Day 2",
    date: "2024.03.16",
    places: [
      {
        id: "place3",
        order: 2,
        name: "강릉역",
        time: "10:00",
      },
      {
        id: "place4",
        order: 1,
        name: "강릉역",
        time: "10:00",
        memos: [
          { id: "memo4", text: "내릴 때 짐 까먹지 말기" },
          { id: "memo5", text: "내릴 때 짐 까먹지 말기" },
          { id: "memo6", text: "내릴 때 짐 까먹지 말기" },
        ],
      },
      {
        id: "place5",
        order: 2,
        name: "강릉역",
        time: "10:00",
      },
    ],
  },
];

export default function PlanXDetailScreen({ navigation, route }: Props) {
  const title = route.params?.title ?? "제주도 힐링여행";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.75}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={26} color="#6B7A90" />
            </TouchableOpacity>

            <Text style={styles.logo}>Plan.X</Text>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.tripSummary}>
            <View style={styles.thumbnailBox}>
              <Text style={styles.thumbnailEmoji}>🏝️</Text>
            </View>

            <View style={styles.tripInfo}>
              <Text style={styles.tripTitle}>{title}</Text>

              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={16} color="#8FA0B7" />
                <Text style={styles.metaText}>2024.03.15 - 2024.03.18</Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={16} color="#8FA0B7" />
                <Text style={styles.metaText}>제주 · 8개 장소</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.timelineSection}>
          {DAY_PLANS.map((day) => (
            <View key={day.id} style={styles.dayBlock}>
              <View style={styles.dayHeader}>
                <View style={styles.dayPill}>
                  <Text style={styles.dayPillText}>{day.dayLabel}</Text>
                </View>
                <Text style={styles.dayDate}>{day.date}</Text>
              </View>

              {day.places.map((place, index) => {
                const isLastPlace =
                  day.id === DAY_PLANS[DAY_PLANS.length - 1].id &&
                  index === day.places.length - 1;

                return (
                  <View key={place.id} style={styles.placeRow}>
                    <View style={styles.timelineColumn}>
                      <View style={styles.orderCircle}>
                        <Text style={styles.orderText}>{place.order}</Text>
                      </View>

                      {!isLastPlace && <View style={styles.timelineLine} />}
                    </View>

                    <View style={styles.placeCard}>
                      <Text style={styles.placeName}>{place.name}</Text>
                      <Text style={styles.placeTime}>{place.time}</Text>

                      {place.memos?.length ?
                        <View style={styles.memoList}>
                          {place.memos.map((memo) => (
                            <View key={memo.id} style={styles.memoBox}>
                              <Ionicons
                                name="document-text-outline"
                                size={16}
                                color="#718096"
                              />
                              <Text style={styles.memoText}>{memo.text}</Text>
                            </View>
                          ))}
                        </View>
                      : null}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 36,
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 36,
    backgroundColor: "#FFFFFF",
  },
  topBar: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  logo: {
    fontSize: 40,
    fontWeight: "900",
    color: "#172132",
    letterSpacing: -1,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  tripSummary: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
  },
  thumbnailBox: {
    width: 82,
    height: 82,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#DDF0FF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 4,
  },
  thumbnailEmoji: {
    fontSize: 42,
  },
  tripInfo: {
    flex: 1,
    marginLeft: 22,
  },
  tripTitle: {
    marginBottom: 10,
    fontSize: 28,
    fontWeight: "900",
    color: "#172132",
    letterSpacing: -0.5,
  },
  metaRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
  },
  timelineSection: {
    paddingHorizontal: 24,
    paddingTop: 34,
    backgroundColor: "#F4F7FB",
  },
  dayBlock: {
    marginBottom: 28,
  },
  dayHeader: {
    marginBottom: 26,
    flexDirection: "row",
    alignItems: "center",
  },
  dayPill: {
    minWidth: 82,
    height: 46,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#2563EB",
    shadowColor: "#2563EB",
    shadowOpacity: 0.32,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 5,
  },
  dayPillText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  dayDate: {
    marginLeft: 26,
    fontSize: 17,
    fontWeight: "700",
    color: "#64748B",
  },
  placeRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  timelineColumn: {
    width: 76,
    alignItems: "center",
  },
  orderCircle: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#2563EB",
    borderWidth: 3,
    borderColor: "#DDEAFF",
    shadowColor: "#2563EB",
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 4,
    zIndex: 2,
  },
  orderText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  timelineLine: {
    flex: 1,
    width: 2,
    minHeight: 46,
    backgroundColor: "#D7E0EC",
  },
  placeCard: {
    flex: 1,
    marginBottom: 22,
    paddingHorizontal: 26,
    paddingTop: 30,
    paddingBottom: 24,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE5F0",
  },
  placeName: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
  },
  placeTime: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "500",
    color: "#475569",
  },
  memoList: {
    marginTop: 24,
    gap: 10,
  },
  memoBox: {
    height: 42,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#D8E0EA",
    backgroundColor: "#F8FAFC",
  },
  memoText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
});
