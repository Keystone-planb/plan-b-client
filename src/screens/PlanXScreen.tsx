import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  navigation: any;
};

type PastTrip = {
  id: string;
  title: string;
  period: string;
  location: string;
  placeCount: number;
  days: number;
};

const MOCK_TRIPS: PastTrip[] = [
  {
    id: "1",
    title: "제주도 힐링여행",
    period: "2024.03.15 - 2024.03.18",
    location: "제주",
    placeCount: 8,
    days: 3,
  },
  {
    id: "2",
    title: "부산 바다여행",
    period: "2024.05.02 - 2024.05.04",
    location: "부산",
    placeCount: 6,
    days: 2,
  },
  {
    id: "3",
    title: "강릉 카페투어",
    period: "2024.07.11 - 2024.07.12",
    location: "강릉",
    placeCount: 5,
    days: 1,
  },
];

export default function PlanXScreen({ navigation }: Props) {
  const handlePressTrip = (trip: PastTrip) => {
    console.log("[Plan.X 카드 클릭]", trip);

    navigation.navigate("PlanXDetail", {
      tripId: trip.id,
      title: trip.title,
    });
  };

  const renderTripCard = ({ item }: { item: PastTrip }) => {
    return (
      <TouchableOpacity
        style={styles.tripCard}
        activeOpacity={0.85}
        onPress={() => handlePressTrip(item)}
      >
        <View style={styles.thumbnailBox}>
          <Text style={styles.thumbnailEmoji}>🏝️</Text>
        </View>

        <View style={styles.tripInfo}>
          <Text style={styles.tripTitle}>{item.title}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={12} color="#8FA0B7" />
            <Text style={styles.metaText}>{item.period}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color="#8FA0B7" />
            <Text style={styles.metaText}>
              {item.location} · {item.days}일 · {item.placeCount}개 장소
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={17} color="#B9C4D3" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>Plan.X</Text>
          <Text style={styles.subtitle}>지난 여행들도 다시 떠올려보세요</Text>
        </View>

        <FlatList
          data={MOCK_TRIPS}
          keyExtractor={(item) => item.id}
          renderItem={renderTripCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 130,
  },
  header: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 32,
  },
  logo: {
    fontSize: 33,
    fontWeight: "900",
    color: "#202938",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#9AA6B8",
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 28,
    gap: 16,
  },
  tripCard: {
    minHeight: 82,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2EAF4",
  },
  thumbnailBox: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#DDF0FF",
  },
  thumbnailEmoji: {
    fontSize: 28,
  },
  tripInfo: {
    flex: 1,
    marginLeft: 14,
  },
  tripTitle: {
    marginBottom: 6,
    fontSize: 15,
    fontWeight: "800",
    color: "#202938",
  },
  metaRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    marginLeft: 5,
    fontSize: 10.5,
    fontWeight: "600",
    color: "#8FA0B7",
  },
});
