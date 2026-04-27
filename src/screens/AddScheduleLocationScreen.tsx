import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import { saveSchedule } from "../../api/schedules/storage";

type Props = {
  navigation: any;
  route: {
    params?: {
      tripName?: string;
      startDate?: string;
      endDate?: string;
    };
  };
};

type LocationOption = {
  id: string;
  name: string;
  description: string;
};

const LOCATION_OPTIONS: LocationOption[] = [
  {
    id: "seoul",
    name: "서울",
    description: "도심, 맛집, 전시, 쇼핑",
  },
  {
    id: "busan",
    name: "부산",
    description: "바다, 감성 카페, 야경",
  },
  {
    id: "jeju",
    name: "제주",
    description: "자연, 드라이브, 힐링",
  },
  {
    id: "gangneung",
    name: "강릉",
    description: "바다, 커피거리, 당일치기",
  },
  {
    id: "gyeongju",
    name: "경주",
    description: "역사, 산책, 감성 숙소",
  },
];

export default function AddScheduleLocationScreen({
  navigation,
  route,
}: Props) {
  const [selectedLocation, setSelectedLocation] =
    useState<LocationOption | null>(null);

  const tripName = route.params?.tripName ?? "";
  const startDate = route.params?.startDate ?? "";
  const endDate = route.params?.endDate ?? "";

  const handleBack = () => {
    navigation.goBack();
  };

  const handleComplete = async () => {
    if (!selectedLocation) {
      Alert.alert("알림", "여행 지역을 선택해주세요.");
      return;
    }

    if (!tripName || !startDate || !endDate) {
      Alert.alert("알림", "여행 이름과 날짜 정보가 없습니다.");
      return;
    }

    try {
      const savedSchedule = await saveSchedule({
        tripName,
        startDate,
        endDate,
        location: selectedLocation.name,
      });

      console.log("[일정 저장 완료]", savedSchedule);

      navigation.reset({
        index: 0,
        routes: [
          {
            name: "PlanA",
            params: {
              tripName,
              startDate,
              endDate,
              location: selectedLocation.name,
            },
          },
        ],
      });
    } catch (error) {
      console.log("일정 저장 실패:", error);
      Alert.alert("오류", "일정 저장에 실패했습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              activeOpacity={0.75}
            >
              <Ionicons name="chevron-back" size={24} color="#1E293B" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>일정 추가</Text>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.progressBox}>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>

            <Text style={styles.progressText}>3 / 3</Text>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.title}>어디로 떠나시나요?</Text>

            <Text style={styles.subtitle}>
              여행할 지역을 선택하면 Plan.A 일정 화면으로 이동해요.
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>현재 입력한 일정</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>여행명</Text>
              <Text style={styles.summaryValue}>
                {tripName || "입력된 여행명이 없습니다"}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>기간</Text>
              <Text style={styles.summaryValue}>
                {startDate && endDate ?
                  `${startDate} - ${endDate}`
                : "선택된 날짜가 없습니다"}
              </Text>
            </View>
          </View>

          <View style={styles.locationList}>
            {LOCATION_OPTIONS.map((location) => {
              const isSelected = selectedLocation?.id === location.id;

              return (
                <TouchableOpacity
                  key={location.id}
                  style={[
                    styles.locationCard,
                    isSelected && styles.selectedLocationCard,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedLocation(location)}
                >
                  <View style={styles.locationTextBox}>
                    <Text
                      style={[
                        styles.locationName,
                        isSelected && styles.selectedLocationName,
                      ]}
                    >
                      {location.name}
                    </Text>

                    <Text style={styles.locationDescription}>
                      {location.description}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.checkCircle,
                      isSelected && styles.selectedCheckCircle,
                    ]}
                  >
                    {isSelected ?
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footerSection}>
          <TouchableOpacity
            style={[
              styles.completeButton,
              !selectedLocation && styles.disabledButton,
            ]}
            activeOpacity={0.85}
            onPress={handleComplete}
            disabled={!selectedLocation}
          >
            <Text style={styles.completeButtonText}>Plan.A 만들기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },

  screen: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1E293B",
  },

  headerSpacer: {
    width: 38,
  },

  progressBox: {
    marginTop: 8,
  },

  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },

  progressFill: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2158E8",
  },

  progressText: {
    alignSelf: "flex-end",
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },

  titleSection: {
    marginTop: 28,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1E293B",
    letterSpacing: -0.8,
  },

  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: "#64748B",
    fontWeight: "500",
  },

  summaryCard: {
    marginTop: 24,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  summaryLabel: {
    marginBottom: 12,
    fontSize: 13,
    fontWeight: "800",
    color: "#2158E8",
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 6,
  },

  summaryKey: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },

  summaryValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
  },

  locationList: {
    marginTop: 24,
    gap: 12,
  },

  locationCard: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectedLocationCard: {
    borderColor: "#2158E8",
    backgroundColor: "#EEF5FF",
  },

  locationTextBox: {
    flex: 1,
    paddingRight: 12,
  },

  locationName: {
    fontSize: 17,
    fontWeight: "900",
    color: "#1E293B",
  },

  selectedLocationName: {
    color: "#2158E8",
  },

  locationDescription: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },

  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  selectedCheckCircle: {
    borderColor: "#2158E8",
    backgroundColor: "#2158E8",
  },

  footerSection: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 18,
    backgroundColor: "#F7F9FB",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },

  completeButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 4,
  },

  disabledButton: {
    opacity: 0.45,
  },

  completeButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
