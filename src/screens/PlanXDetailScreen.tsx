import React from "react";
import {
  FlatList,
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

type PlaceItem = {
  id: string;
  time: string;
  name: string;
  memo: string;
};

type DayPlan = {
  id: string;
  day: string;
  date: string;
  places: PlaceItem[];
};

const MOCK_DAY_PLANS: DayPlan[] = [
  {
    id: "day1",
    day: "Day 1",
    date: "2024.03.15",
    places: [
      {
        id: "1",
        time: "10:00",
        name: "제주공항",
        memo: "렌터카 수령 후 이동",
      },
      {
        id: "2",
        time: "12:30",
        name: "고기국수 맛집",
        memo: "점심 식사",
      },
      {
        id: "3",
        time: "15:00",
        name: "이호테우해변",
        memo: "사진 찍기 좋은 바다",
      },
    ],
  },
  {
    id: "day2",
    day: "Day 2",
    date: "2024.03.16",
    places: [
      {
        id: "4",
        time: "09:30",
        name: "성산일출봉",
        memo: "아침 산책",
      },
      {
        id: "5",
        time: "13:00",
        name: "우도",
        memo: "배 시간 확인 필요",
      },
      {
        id: "6",
        time: "18:30",
        name: "흑돼지 거리",
        memo: "저녁 식사",
      },
    ],
  },
];

export default function PlanXDetailScreen({ navigation, route }: Props) {
  const title = route.params?.title ?? "제주도 힐링여행";

  const renderPlace = ({ item }: { item: PlaceItem }) => {
    return (
      <View style={styles.placeRow}>
        <View style={styles.timelineColumn}>
          <Text style={styles.placeTime}>{item.time}</Text>
          <View style={styles.timelineDot} />
        </View>

        <View style={styles.placeCard}>
          <Text style={styles.placeName}>{item.name}</Text>
          <Text style={styles.placeMemo}>{item.memo}</Text>
        </View>
      </View>
    );
  };

  const renderDaySection = (dayPlan: DayPlan) => {
    return (
      <View key={dayPlan.id} style={styles.daySection}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle}>{dayPlan.day}</Text>
          <Text style={styles.dayDate}>{dayPlan.date}</Text>
        </View>

        <FlatList
          data={dayPlan.places}
          keyExtractor={(item) => item.id}
          renderItem={renderPlace}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.placeGap} />}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.75}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={25} color="#637083" />
        </TouchableOpacity>

        <Text style={styles.logo}>Plan.X</Text>

        <View style={styles.headerRightSpace} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.tripTitle}>{title}</Text>

          <View style={styles.summaryMetaRow}>
            <Ionicons name="calendar-outline" size={13} color="#8FA0B7" />
            <Text style={styles.summaryMetaText}>2024.03.15 - 2024.03.18</Text>
          </View>

          <View style={styles.summaryMetaRow}>
            <Ionicons name="location-outline" size={13} color="#8FA0B7" />
            <Text style={styles.summaryMetaText}>제주 · 3일 · 8개 장소</Text>
          </View>
        </View>

        <View style={styles.memoCard}>
          <Text style={styles.memoTitle}>여행 메모</Text>
          <Text style={styles.memoText}>
            바다를 많이 보고 여유롭게 쉬었던 여행. 다음에는 우도에서 하루 더
            머물러도 좋을 것 같다.
          </Text>
        </View>

        <View style={styles.planSection}>
          <Text style={styles.sectionTitle}>여행 일정</Text>
          {MOCK_DAY_PLANS.map(renderDaySection)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  header: {
    height: 58,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  logo: {
    fontSize: 31,
    fontWeight: "900",
    color: "#202938",
  },
  headerRightSpace: {
    width: 38,
    height: 38,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 36,
  },
  summaryCard: {
    padding: 18,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2EAF4",
  },
  tripTitle: {
    marginBottom: 10,
    fontSize: 20,
    fontWeight: "900",
    color: "#202938",
  },
  summaryMetaRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  summaryMetaText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#8FA0B7",
  },
  memoCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2EAF4",
  },
  memoTitle: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "900",
    color: "#202938",
  },
  memoText: {
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "500",
    color: "#64748B",
  },
  planSection: {
    marginTop: 22,
  },
  sectionTitle: {
    marginBottom: 14,
    fontSize: 16,
    fontWeight: "900",
    color: "#202938",
  },
  daySection: {
    marginBottom: 22,
  },
  dayHeader: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#202938",
  },
  dayDate: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9AA6B8",
  },
  placeRow: {
    flexDirection: "row",
  },
  timelineColumn: {
    width: 58,
    alignItems: "center",
  },
  placeTime: {
    marginBottom: 6,
    fontSize: 11,
    fontWeight: "800",
    color: "#8FA0B7",
  },
  timelineDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#273142",
  },
  placeCard: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2EAF4",
  },
  placeName: {
    fontSize: 14,
    fontWeight: "900",
    color: "#202938",
  },
  placeMemo: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500",
    color: "#8FA0B7",
  },
  placeGap: {
    height: 10,
  },
});
