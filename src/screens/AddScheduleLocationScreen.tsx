import React, { useState } from "react";
import {
  ActivityIndicator,
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

const formatDate = (value: string) => {
  if (!value) return "";
  return value.replace(/-/g, ".");
};

export default function AddScheduleLocationScreen({
  navigation,
  route,
}: Props) {
  const [selectedLocation, setSelectedLocation] =
    useState<LocationOption | null>(null);
  const [saving, setSaving] = useState(false);

  const tripName = route.params?.tripName ?? "";
  const startDate = route.params?.startDate ?? "";
  const endDate = route.params?.endDate ?? "";

  const canComplete = Boolean(selectedLocation) && !saving;

  const handleBack = () => {
    if (saving) return;
    navigation.goBack();
  };

  const handleComplete = async () => {
    if (saving) return;

    if (!selectedLocation) {
      Alert.alert("알림", "여행 지역을 선택해주세요.");
      return;
    }

    if (!tripName || !startDate || !endDate) {
      Alert.alert("알림", "여행 이름과 날짜 정보가 없습니다.");
      return;
    }

    try {
      setSaving(true);

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
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleBack}
              activeOpacity={0.8}
              disabled={saving}
            >
              <Ionicons name="chevron-back" size={24} color="#1C2534" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Plan.A</Text>

            <View style={styles.iconPlaceholder} />
          </View>

          <View style={styles.centerSection}>
            <View style={styles.illustrationWrapper}>
              <Text style={styles.illustrationEmoji}>📍</Text>
            </View>

            <Text style={styles.title}>어디로{"\n"}떠나시나요?</Text>

            <Text style={styles.description}>
              여행할 지역을 선택하면 Plan.A 일정 화면으로 이동해요.
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>현재 입력한 일정</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>여행명</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {tripName || "입력된 여행명이 없습니다"}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>기간</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {startDate && endDate ?
                  `${formatDate(startDate)} - ${formatDate(endDate)}`
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
                  disabled={saving}
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
          <View style={styles.pagination}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.activeDot} />
          </View>

          <TouchableOpacity
            style={[
              styles.completeButton,
              !canComplete && styles.disabledButton,
            ]}
            activeOpacity={0.85}
            onPress={handleComplete}
            disabled={!canComplete}
          >
            {saving ?
              <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.completeButtonText}>Plan.A 만들기</Text>}
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
    backgroundColor: "#F7F9FB",
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingTop: 18,
    paddingHorizontal: 21,
    paddingBottom: 24,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 34,
    paddingHorizontal: 4,
  },

  iconButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  iconPlaceholder: {
    width: 30,
    height: 30,
  },

  headerTitle: {
    color: "#1C2534",
    fontSize: 40,
    fontWeight: "900",
    textAlign: "center",
  },

  centerSection: {
    alignItems: "center",
    marginBottom: 28,
  },

  illustrationWrapper: {
    width: 174,
    height: 174,
    borderRadius: 87,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowRadius: 15,
    elevation: 12,
  },

  illustrationEmoji: {
    fontSize: 68,
  },

  title: {
    color: "#000000",
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 14,
  },

  description: {
    color: "#627187",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },

  summaryCard: {
    marginTop: 2,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  summaryLabel: {
    marginBottom: 12,
    fontSize: 13,
    fontWeight: "900",
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
    marginTop: 20,
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
    paddingHorizontal: 21,
    paddingTop: 14,
    paddingBottom: 18,
    backgroundColor: "#F7F9FB",
  },

  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  activeDot: {
    width: 24,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#2158E8",
    marginRight: 8,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E1E7EF",
    marginRight: 8,
  },

  completeButton: {
    height: 56,
    borderRadius: 14,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },

  disabledButton: {
    opacity: 0.45,
  },

  completeButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
