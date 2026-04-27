import React from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type TravelPlan = {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  placeCount: number;
  emoji?: string;
};

const mockPlans: TravelPlan[] = [
  {
    id: 1,
    title: "제주도 힐링여행",
    startDate: "2024.03.15",
    endDate: "2024.03.18",
    location: "제주",
    placeCount: 8,
    emoji: "🏝️",
  },
];

export default function TravelHomeScreen({ navigation }: any) {
  const plans = mockPlans;
  const hasPlans = plans.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={28} color="#1C2534" />
            </TouchableOpacity>

            <Text style={styles.logoText}>
              {hasPlans ? "Plan.X" : "Plan.A"}
            </Text>

            <View style={styles.headerSpacer} />
          </View>

          <Text style={styles.subTitle}>
            {hasPlans ?
              "지난 여행들을 다시 떠올려보세요"
            : "새로운 여행을 계획해보세요"}
          </Text>
        </View>

        {hasPlans ?
          <View style={styles.listContainer}>
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={styles.card}
                activeOpacity={0.8}
              >
                <View style={styles.thumbnail}>
                  <Text style={styles.emoji}>{plan.emoji ?? "✈️"}</Text>
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{plan.title}</Text>

                  <View style={styles.infoRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#627187"
                    />
                    <Text style={styles.infoText}>
                      {plan.startDate} - {plan.endDate}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color="#627187"
                    />
                    <Text style={styles.infoText}>
                      {plan.location} · {plan.placeCount}개 장소
                    </Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={24} color="#9AA6B7" />
              </TouchableOpacity>
            ))}
          </View>
        : <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🧳</Text>
            <Text style={styles.emptyTitle}>아직 저장된 일정이 없어요</Text>
            <Text style={styles.emptyDescription}>
              첫 여행 일정을 만들어 Plan.X로 저장해보세요.
            </Text>

            <TouchableOpacity
              style={styles.addButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("AddScheduleName")}
            >
              <Text style={styles.addButtonText}>일정 추가하기</Text>
            </TouchableOpacity>
          </View>
        }
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
    backgroundColor: "#F7F9FB",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E1E7EF",
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 22,
    marginBottom: 30,
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  logoText: {
    color: "#1C2534",
    fontSize: 40,
    fontWeight: "800",
    textAlign: "center",
  },
  headerSpacer: {
    width: 28,
  },
  subTitle: {
    color: "#627187",
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 21,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E1E7EF",
    borderRadius: 15,
    borderWidth: 1,
    padding: 17,
    marginBottom: 20,
  },
  thumbnail: {
    width: 72,
    height: 86,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D5EBFC",
    borderColor: "#E1E7EF",
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 13,
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  emoji: {
    fontSize: 38,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: "#252D3C",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  infoText: {
    color: "#627187",
    fontSize: 12,
    marginLeft: 5,
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 58,
    marginBottom: 18,
  },
  emptyTitle: {
    color: "#1C2534",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptyDescription: {
    color: "#627187",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
  },
  addButton: {
    backgroundColor: "#2158E8",
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 28,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
