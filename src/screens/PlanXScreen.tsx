import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { getSchedules, SavedSchedule } from "../../api/schedules/storage";

type Props = {
  navigation: any;
};

const formatPeriod = (startDate: string, endDate: string) => {
  if (!startDate && !endDate) {
    return "날짜 미정";
  }

  if (startDate && !endDate) {
    return startDate;
  }

  if (!startDate && endDate) {
    return endDate;
  }

  return `${startDate} - ${endDate}`;
};

export default function PlanXScreen({ navigation }: Props) {
  const [schedules, setSchedules] = useState<SavedSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSchedules = async () => {
    try {
      setLoading(true);

      const savedSchedules = await getSchedules();
      setSchedules(savedSchedules);
    } catch (error) {
      console.log("[Plan.X 일정 목록 불러오기 실패]", error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      loadSchedules();
    }, []),
  );

  const handlePressTrip = (schedule: SavedSchedule) => {
    console.log("[Plan.X 카드 클릭]", schedule);

    navigation.navigate("PlanXDetail", {
      tripId: schedule.id,
      title: schedule.tripName,
    });
  };

  const renderTripCard = ({ item }: { item: SavedSchedule }) => {
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
          <Text style={styles.tripTitle} numberOfLines={1}>
            {item.tripName}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={12} color="#8FA0B7" />
            <Text style={styles.metaText} numberOfLines={1}>
              {formatPeriod(item.startDate, item.endDate)}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color="#8FA0B7" />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.location || "지역 미정"}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={17} color="#B9C4D3" />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.emptyText}>저장된 여행을 불러오는 중...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="airplane-outline" size={42} color="#B9C4D3" />
        <Text style={styles.emptyTitle}>저장된 여행이 없습니다</Text>
        <Text style={styles.emptyText}>
          여행 일정을 추가하면 Plan.X에서 다시 볼 수 있어요
        </Text>
      </View>
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
          data={schedules}
          keyExtractor={(item) => item.id}
          renderItem={renderTripCard}
          contentContainerStyle={[
            styles.listContent,
            schedules.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={renderEmptyState}
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
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
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
    flex: 1,
    marginLeft: 5,
    fontSize: 10.5,
    fontWeight: "600",
    color: "#8FA0B7",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "900",
    color: "#202938",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#8FA0B7",
    textAlign: "center",
    lineHeight: 20,
  },
});
