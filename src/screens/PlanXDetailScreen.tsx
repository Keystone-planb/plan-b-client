import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
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

type DayPlan = {
  id: string;
  dayLabel: string;
  date: string;
  places: Place[];
};

type Props = {
  navigation: any;
};

const MOCK_DAYS: DayPlan[] = [
  {
    id: "day-1",
    dayLabel: "Day 1",
    date: "2024.03.15",
    places: [
      {
        id: "1-1",
        order: 1,
        name: "강릉역",
        time: "10:00",
        memos: [
          { id: "m1", text: "내릴 때 짐 가까이 말기" },
          { id: "m2", text: "내릴 때 짐 가까이 말기" },
          { id: "m3", text: "내릴 때 짐 가까이 말기" },
        ],
      },
      {
        id: "1-2",
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
        id: "2-1",
        order: 2,
        name: "강릉역",
        time: "10:00",
      },
      {
        id: "2-2",
        order: 1,
        name: "강릉역",
        time: "10:00",
        memos: [
          { id: "m4", text: "내릴 때 짐 가까이 말기" },
          { id: "m5", text: "내릴 때 짐 가까이 말기" },
          { id: "m6", text: "내릴 때 짐 가까이 말기" },
        ],
      },
      {
        id: "2-3",
        order: 2,
        name: "강릉역",
        time: "10:00",
      },
    ],
  },
];

export default function PlanXDetailScreen({ navigation }: Props) {
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.75}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={28} color="#71809A" />
          </TouchableOpacity>

          <Text style={styles.screenTitle}>Plan.X</Text>
        </View>

        <View style={styles.tripHeader}>
          <View style={styles.thumbnailBox}>
            <Text style={styles.thumbnailEmoji}>🏝️</Text>
          </View>

          <View style={styles.tripInfo}>
            <Text style={styles.tripTitle}>제주도 힐링여행</Text>

            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color="#7B8BA6" />
              <Text style={styles.metaText}>2024.03.15 - 2024.03.18</Text>
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color="#7B8BA6" />
              <Text style={styles.metaText}>제주 · 8개 장소</Text>
            </View>
          </View>
        </View>

        <View style={styles.timelineSection}>
          <View style={styles.timelineLine} />

          {MOCK_DAYS.map((day) => (
            <View key={day.id} style={styles.dayBlock}>
              <View style={styles.dayHeader}>
                <View style={styles.dayPill}>
                  <Text style={styles.dayPillText}>{day.dayLabel}</Text>
                </View>
                <Text style={styles.dayDate}>{day.date}</Text>
              </View>

              {day.places.map((place) => (
                <View key={place.id} style={styles.placeRow}>
                  <View style={styles.orderCircle}>
                    <Text style={styles.orderText}>{place.order}</Text>
                  </View>

                  <View style={styles.placeCard}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <Text style={styles.placeTime}>{place.time}</Text>

                    {place.memos && place.memos.length > 0 && (
                      <View style={styles.memoList}>
                        {place.memos.map((memo) => (
                          <View key={memo.id} style={styles.memoBox}>
                            <Ionicons
                              name="document-text-outline"
                              size={15}
                              color="#72819A"
                            />
                            <Text style={styles.memoText}>{memo.text}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ))}
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
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  contentContainer: {
    paddingBottom: 72,
  },
  header: {
    height: 90,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    left: 24,
    top: 30,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  screenTitle: {
    fontSize: 38,
    fontWeight: "900",
    color: "#202938",
    letterSpacing: -1.2,
  },
  tripHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 23,
    paddingTop: 8,
    paddingBottom: 30,
  },
  thumbnailBox: {
    width: 73,
    height: 73,
    borderRadius: 10,
    backgroundColor: "#D8F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 19,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.13,
    shadowRadius: 5,
    elevation: 4,
  },
  thumbnailEmoji: {
    fontSize: 35,
  },
  tripInfo: {
    flex: 1,
  },
  tripTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#243044",
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  metaText: {
    marginLeft: 7,
    fontSize: 12,
    color: "#5F6F8A",
    fontWeight: "500",
  },
  timelineSection: {
    position: "relative",
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  timelineLine: {
    position: "absolute",
    left: 35,
    top: 92,
    bottom: 23,
    width: 2,
    backgroundColor: "#DFE6F1",
  },
  dayBlock: {
    marginBottom: 26,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dayPill: {
    minWidth: 72,
    height: 41,
    paddingHorizontal: 16,
    borderRadius: 21,
    backgroundColor: "#2864F0",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2864F0",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 5,
  },
  dayPillText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  dayDate: {
    marginLeft: 15,
    fontSize: 14,
    fontWeight: "600",
    color: "#5E6F89",
    letterSpacing: 0.2,
  },
  placeRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 17,
  },
  orderCircle: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: "#2864F0",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 1,
    marginTop: 2,
    zIndex: 2,
    shadowColor: "#2864F0",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    elevation: 4,
  },
  orderText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  placeCard: {
    flex: 1,
    marginLeft: 20,
    minHeight: 79,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE4EE",
    paddingHorizontal: 20,
    paddingTop: 23,
    paddingBottom: 20,
  },
  placeName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 9,
  },
  placeTime: {
    fontSize: 14,
    fontWeight: "500",
    color: "#405372",
  },
  memoList: {
    marginTop: 17,
    gap: 7,
  },
  memoBox: {
    height: 35,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#DDE4EE",
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  memoText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "500",
    color: "#53627A",
  },
});
