import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type TransportMode = "WALK" | "TRANSIT" | "CAR";
type MoveTime = "10" | "20" | "30" | "ANY";
type PlaceScope = "INDOOR" | "OUTDOOR";

type TodayPlace = {
  id?: string | number;
  name?: string;
  address?: string;
  time?: string;
  latitude?: number;
  longitude?: number;
};

type RecommendationType = "PLACE" | "GAP";

type Props = {
  navigation: any;
  route?: {
    params?: {
      scheduleId?: string;
      tripName?: string;
      startDate?: string;
      endDate?: string;
      location?: string;
      transportMode?: TransportMode;
      transportLabel?: string;
      targetPlace?: TodayPlace;

      recommendationType?: RecommendationType;
      beforePlanId?: string | number;
      afterPlanId?: string | number;
    };
  };
};

type TransportOption = {
  key: TransportMode;
  label: string;
};

type MoveTimeOption = {
  key: MoveTime;
  label: string;
};

type PlaceScopeOption = {
  key: PlaceScope;
  label: string;
};

const TRANSPORT_OPTIONS: TransportOption[] = [
  {
    key: "WALK",
    label: "도보",
  },
  {
    key: "TRANSIT",
    label: "대중교통",
  },
  {
    key: "CAR",
    label: "차량",
  },
];

const MOVE_TIME_OPTIONS: MoveTimeOption[] = [
  {
    key: "10",
    label: "10분 이내",
  },
  {
    key: "20",
    label: "20분 이내",
  },
  {
    key: "30",
    label: "30분 이내",
  },
  {
    key: "ANY",
    label: "상관 없음",
  },
];

const PLACE_SCOPE_OPTIONS: PlaceScopeOption[] = [
  {
    key: "INDOOR",
    label: "실내",
  },
  {
    key: "OUTDOOR",
    label: "실외",
  },
];

const TRANSPORT_LABEL_MAP: Record<TransportMode, string> = {
  WALK: "도보",
  TRANSIT: "대중교통",
  CAR: "차량",
};

export default function AlternativeSettingsScreen({
  navigation,
  route,
}: Props) {
  const params = route?.params ?? {};
  const isGapRecommendation = params.recommendationType === "GAP";

  const initialTransportMode = params.transportMode ?? "WALK";

  const [selectedTransportMode, setSelectedTransportMode] =
    useState<TransportMode>(initialTransportMode);
  const [selectedMoveTime, setSelectedMoveTime] = useState<MoveTime>("10");
  const [considerDistance, setConsiderDistance] = useState(false);
  const [changeCategory, setChangeCategory] = useState(false);
  const [selectedPlaceScope, setSelectedPlaceScope] =
    useState<PlaceScope>("INDOOR");

  const selectedTransportLabel = useMemo(() => {
    return TRANSPORT_LABEL_MAP[selectedTransportMode];
  }, [selectedTransportMode]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleStartAnalysis = () => {
    navigation.navigate("AlternativeLoading", {
      ...params,
      recommendationType: params.recommendationType ?? "PLACE",
      transportMode: selectedTransportMode,
      transportLabel: selectedTransportLabel,
      moveTime: selectedMoveTime,
      considerDistance,
      changeCategory,
      placeScope: selectedPlaceScope,
    });
  };

  if (isGapRecommendation) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.gapScreen}>
          <View style={styles.gapHeader}>
            <TouchableOpacity
              style={styles.gapBackButton}
              activeOpacity={0.75}
              onPress={handleBack}
            >
              <Ionicons name="chevron-back" size={25} color="#64748B" />
            </TouchableOpacity>

            <Text style={styles.gapLogoText}>Plan.A</Text>

            <View style={styles.gapHeaderRightSpace} />
          </View>

          <View style={styles.gapContent}>
            <View style={styles.gapIconCircle}>
              <Text style={styles.gapTransportEmoji}>🚌</Text>
            </View>

            <Text style={styles.gapTitle}>이동 수단을{"\n"}알려주세요</Text>

            <Text style={styles.gapSubtitle}>어떤 수단으로 이동할까요?</Text>

            <View style={styles.gapOptionRow}>
              {TRANSPORT_OPTIONS.map((option) => {
                const selected = selectedTransportMode === option.key;

                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.gapTransportButton,
                      selected && styles.gapTransportButtonActive,
                    ]}
                    activeOpacity={0.82}
                    onPress={() => setSelectedTransportMode(option.key)}
                  >
                    <Text
                      style={[
                        styles.gapTransportButtonText,
                        selected && styles.gapTransportButtonTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.gapFooter}>
            <TouchableOpacity
              style={styles.gapCompleteButton}
              activeOpacity={0.86}
              onPress={handleStartAnalysis}
            >
              <Text style={styles.gapCompleteButtonText}>완료</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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

          <Text style={styles.headerTitle}>대안 설정</Text>

          <View style={styles.headerRightSpace} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.conditionCard}>
            <Text style={styles.sectionTitle}>이동 수단</Text>

            <View style={styles.optionRow}>
              {TRANSPORT_OPTIONS.map((option) => {
                const selected = selectedTransportMode === option.key;

                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.segmentButton,
                      selected && styles.segmentButtonActive,
                    ]}
                    activeOpacity={0.82}
                    onPress={() => setSelectedTransportMode(option.key)}
                  >
                    <Text
                      style={[
                        styles.segmentButtonText,
                        selected && styles.segmentButtonTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionTitle, styles.sectionTitleSpacing]}>
              희망 이동 시간
            </Text>

            <View style={styles.timeOptionRow}>
              {MOVE_TIME_OPTIONS.map((option) => {
                const selected = selectedMoveTime === option.key;

                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.timeButton,
                      selected && styles.timeButtonActive,
                    ]}
                    activeOpacity={0.82}
                    onPress={() => setSelectedMoveTime(option.key)}
                  >
                    <Text
                      style={[
                        styles.timeButtonText,
                        selected && styles.timeButtonTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.toggleCard}>
            <View style={styles.toggleTextBox}>
              <Text style={styles.toggleTitle}>다음 장소와의 거리 고려</Text>
            </View>

            <Switch
              value={considerDistance}
              onValueChange={setConsiderDistance}
              trackColor={{
                false: "#CBD5E1",
                true: "#BBD0FF",
              }}
              thumbColor={considerDistance ? "#2158E8" : "#FFFFFF"}
            />
          </View>

          <View style={styles.toggleCard}>
            <View style={styles.toggleTextBox}></View>
          </View>

          <View style={styles.toggleCard}>
            <View style={styles.toggleTextBox}>
              <Text style={styles.toggleTitle}>카테고리 변경</Text>
              <Text style={styles.toggleSubtitle}>
                기존 카테고리와 동일한 장소를 추천합니다
              </Text>
            </View>

            <Switch
              value={changeCategory}
              onValueChange={setChangeCategory}
              trackColor={{
                false: "#CBD5E1",
                true: "#BBD0FF",
              }}
              thumbColor={changeCategory ? "#2158E8" : "#FFFFFF"}
            />
          </View>

          {changeCategory ?
            <View style={styles.conditionCard}>
              <Text style={styles.sectionTitle}>실내/실외</Text>

              <View style={styles.scopeRow}>
                {PLACE_SCOPE_OPTIONS.map((option) => {
                  const selected = selectedPlaceScope === option.key;

                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.scopeButton,
                        selected && styles.scopeButtonActive,
                      ]}
                      activeOpacity={0.82}
                      onPress={() => setSelectedPlaceScope(option.key)}
                    >
                      <Text
                        style={[
                          styles.scopeButtonText,
                          selected && styles.scopeButtonTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          : null}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.82}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.startButton}
            activeOpacity={0.86}
            onPress={handleStartAnalysis}
          >
            <Text style={styles.startButtonText}>AI 분석 시작</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F8FC",
  },

  screen: {
    flex: 1,
    backgroundColor: "#F5F8FC",
  },

  header: {
    height: 76,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#DDE5F0",
    backgroundColor: "#FFFFFF",
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    color: "#1F2937",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  headerRightSpace: {
    width: 40,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 24,
    paddingBottom: 120,
  },

  conditionCard: {
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 18,
    paddingVertical: 22,
    marginBottom: 14,
  },

  sectionTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 18,
  },

  sectionTitleSpacing: {
    marginTop: 34,
  },

  optionRow: {
    flexDirection: "row",
    gap: 12,
  },

  segmentButton: {
    flex: 1,
    height: 58,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    alignItems: "center",
    justifyContent: "center",
  },

  segmentButtonActive: {
    backgroundColor: "#2158E8",
    borderColor: "#2158E8",
  },

  segmentButtonText: {
    color: "#64748B",
    fontSize: 17,
    fontWeight: "900",
  },

  segmentButtonTextActive: {
    color: "#FFFFFF",
  },

  timeOptionRow: {
    flexDirection: "row",
    gap: 10,
  },

  timeButton: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  timeButtonActive: {
    backgroundColor: "#2158E8",
  },

  timeButtonText: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "900",
  },

  timeButtonTextActive: {
    color: "#FFFFFF",
  },

  toggleCard: {
    minHeight: 72,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 18,
    paddingVertical: 15,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  toggleTextBox: {
    flex: 1,
    paddingRight: 12,
  },

  toggleTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  toggleSubtitle: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
    lineHeight: 18,
  },

  scopeRow: {
    flexDirection: "row",
    gap: 14,
  },

  scopeButton: {
    flex: 1,
    height: 58,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  scopeButtonActive: {
    backgroundColor: "#2158E8",
  },

  scopeButtonText: {
    color: "#64748B",
    fontSize: 17,
    fontWeight: "900",
  },

  scopeButtonTextActive: {
    color: "#FFFFFF",
  },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
  },

  cancelButton: {
    flex: 1,
    height: 58,
    borderRadius: 14,
    backgroundColor: "#F1F3F6",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    color: "#64748B",
    fontSize: 17,
    fontWeight: "900",
  },

  startButton: {
    flex: 1,
    height: 58,
    borderRadius: 14,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },

  startButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  gapScreen: {
    flex: 1,
    backgroundColor: "#F5F8FC",
  },

  gapHeader: {
    height: 92,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
  },

  gapBackButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  gapLogoText: {
    flex: 1,
    color: "#1C2534",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1.1,
    textAlign: "center",
  },

  gapHeaderRightSpace: {
    width: 40,
  },

  gapContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 70,
  },

  gapIconCircle: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: "#D9F2DB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 46,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 9,
  },

  gapTransportEmoji: {
    fontSize: 58,
  },

  gapTitle: {
    color: "#000000",
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 42,
    letterSpacing: -0.9,
    textAlign: "center",
    marginBottom: 26,
  },

  gapSubtitle: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 94,
  },

  gapOptionRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  gapTransportButton: {
    flex: 1,
    height: 50,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE5F0",
    alignItems: "center",
    justifyContent: "center",
  },

  gapTransportButtonActive: {
    backgroundColor: "#2158E8",
    borderColor: "#2158E8",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },

  gapTransportButtonText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "900",
  },

  gapTransportButtonTextActive: {
    color: "#FFFFFF",
  },

  gapFooter: {
    paddingHorizontal: 28,
    paddingBottom: 38,
  },

  gapCompleteButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 9,
    },
    shadowOpacity: 0.28,
    shadowRadius: 13,
    elevation: 8,
  },

  gapCompleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
});
