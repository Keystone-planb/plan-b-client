import React, { useState } from "react";
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
      targetPlace?: {
        id?: string;
        name?: string;
        address?: string;
        time?: string;
        latitude?: number;
        longitude?: number;
      };
    };
  };
};

const TRANSPORT_OPTIONS: {
  label: string;
  value: TransportMode;
}[] = [
  {
    label: "도보",
    value: "WALK",
  },
  {
    label: "대중교통",
    value: "TRANSIT",
  },
  {
    label: "차량",
    value: "CAR",
  },
];

const MOVE_TIME_OPTIONS: {
  label: string;
  value: MoveTime;
}[] = [
  {
    label: "10분 이내",
    value: "10",
  },
  {
    label: "20분 이내",
    value: "20",
  },
  {
    label: "30분 이내",
    value: "30",
  },
  {
    label: "상관 없음",
    value: "ANY",
  },
];

export default function AlternativeSettingsScreen({
  navigation,
  route,
}: Props) {
  const [transportMode, setTransportMode] = useState<TransportMode>(
    route?.params?.transportMode ?? "WALK",
  );
  const [moveTime, setMoveTime] = useState<MoveTime>("10");
  const [considerDistance, setConsiderDistance] = useState(false);
  const [considerCrowd, setConsiderCrowd] = useState(false);
  const [changeCategory, setChangeCategory] = useState(false);
  const [placeScope, setPlaceScope] = useState<PlaceScope>("INDOOR");

  const handleBack = () => {
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleStartAnalysis = () => {
    navigation.navigate("AlternativeLoading", {
      scheduleId: route?.params?.scheduleId,
      tripName: route?.params?.tripName,
      startDate: route?.params?.startDate,
      endDate: route?.params?.endDate,
      location: route?.params?.location,
      transportMode,
      moveTime,
      considerDistance,
      considerCrowd,
      changeCategory,
      placeScope,
      targetPlace: route?.params?.targetPlace,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={26} color="#64748B" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>대안 설정</Text>

          <View style={styles.headerRightSpace} />
        </View>

        <View style={styles.headerDivider} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.optionBox}>
            <Text style={styles.sectionLabel}>이동 수단</Text>

            <View style={styles.segmentRow}>
              {TRANSPORT_OPTIONS.map((option) => {
                const selected = transportMode === option.value;

                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.segmentButton,
                      selected && styles.segmentButtonSelected,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setTransportMode(option.value)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        selected && styles.segmentTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, styles.moveTimeLabel]}>
              희망 이동 시간
            </Text>

            <View style={styles.timeRow}>
              {MOVE_TIME_OPTIONS.map((option) => {
                const selected = moveTime === option.value;

                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.timeButton,
                      selected && styles.timeButtonSelected,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setMoveTime(option.value)}
                  >
                    <Text
                      style={[
                        styles.timeText,
                        selected && styles.timeTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.switchCard}>
            <View style={styles.switchTextBox}>
              <Text style={styles.switchTitle}>다음 장소와의 거리 고려</Text>
            </View>

            <Switch
              value={considerDistance}
              onValueChange={setConsiderDistance}
              trackColor={{
                false: "#64748B",
                true: "#AFC8FF",
              }}
              thumbColor={considerDistance ? "#2158E8" : "#FFFFFF"}
              ios_backgroundColor="#64748B"
            />
          </View>

          <View style={styles.switchCard}>
            <View style={styles.switchTextBox}>
              <Text style={styles.switchTitle}>혼잡도 고려</Text>
            </View>

            <Switch
              value={considerCrowd}
              onValueChange={setConsiderCrowd}
              trackColor={{
                false: "#64748B",
                true: "#AFC8FF",
              }}
              thumbColor={considerCrowd ? "#2158E8" : "#FFFFFF"}
              ios_backgroundColor="#64748B"
            />
          </View>

          <View style={styles.switchCard}>
            <View style={styles.switchTextBox}>
              <Text style={styles.switchTitle}>카테고리 변경</Text>
              <Text style={styles.switchDescription}>
                기존 카테고리와 동일한 장소를 추천합니다
              </Text>
            </View>

            <Switch
              value={changeCategory}
              onValueChange={setChangeCategory}
              trackColor={{
                false: "#64748B",
                true: "#AFC8FF",
              }}
              thumbColor={changeCategory ? "#2158E8" : "#FFFFFF"}
              ios_backgroundColor="#64748B"
            />
          </View>

          <View style={styles.scopeCard}>
            <Text style={styles.sectionLabel}>실내/실외</Text>

            <View style={styles.scopeRow}>
              <TouchableOpacity
                style={[
                  styles.scopeButton,
                  placeScope === "INDOOR" && styles.scopeButtonSelected,
                ]}
                activeOpacity={0.85}
                onPress={() => setPlaceScope("INDOOR")}
              >
                <Text
                  style={[
                    styles.scopeText,
                    placeScope === "INDOOR" && styles.scopeTextSelected,
                  ]}
                >
                  실내
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.scopeButton,
                  placeScope === "OUTDOOR" && styles.scopeButtonSelected,
                ]}
                activeOpacity={0.85}
                onPress={() => setPlaceScope("OUTDOOR")}
              >
                <Text
                  style={[
                    styles.scopeText,
                    placeScope === "OUTDOOR" && styles.scopeTextSelected,
                  ]}
                >
                  실외
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.85}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.startButton}
            activeOpacity={0.85}
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
    backgroundColor: "#FFFFFF",
  },

  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    height: 92,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    backgroundColor: "#FFFFFF",
  },

  backButton: {
    width: 36,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    color: "#1C2534",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  headerRightSpace: {
    width: 36,
    height: 44,
  },

  headerDivider: {
    height: 1,
    marginHorizontal: 16,
    backgroundColor: "#E1E7EF",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 26,
    paddingBottom: 140,
  },

  optionBox: {
    borderRadius: 10,
    backgroundColor: "#F7F8FA",
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 30,
    marginBottom: 34,
  },

  sectionLabel: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginBottom: 28,
  },

  segmentRow: {
    flexDirection: "row",
    gap: 14,
  },

  segmentButton: {
    flex: 1,
    height: 62,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  segmentButtonSelected: {
    backgroundColor: "#2158E8",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },

  segmentText: {
    color: "#7A889B",
    fontSize: 20,
    fontWeight: "900",
  },

  segmentTextSelected: {
    color: "#FFFFFF",
  },

  moveTimeLabel: {
    marginTop: 54,
  },

  timeRow: {
    flexDirection: "row",
    gap: 12,
  },

  timeButton: {
    flex: 1,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  timeButtonSelected: {
    backgroundColor: "#2158E8",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },

  timeText: {
    color: "#7A889B",
    fontSize: 17,
    fontWeight: "900",
  },

  timeTextSelected: {
    color: "#FFFFFF",
  },

  switchCard: {
    minHeight: 76,
    borderRadius: 10,
    backgroundColor: "#F7F8FA",
    paddingHorizontal: 22,
    paddingVertical: 18,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  switchTextBox: {
    flex: 1,
    paddingRight: 14,
  },

  switchTitle: {
    color: "#111827",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  switchDescription: {
    color: "#8A9BB2",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 8,
  },

  scopeCard: {
    borderRadius: 10,
    backgroundColor: "#F7F8FA",
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    marginTop: 12,
  },

  scopeRow: {
    flexDirection: "row",
    gap: 14,
  },

  scopeButton: {
    flex: 1,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  scopeButtonSelected: {
    backgroundColor: "#2158E8",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },

  scopeText: {
    color: "#7A889B",
    fontSize: 20,
    fontWeight: "900",
  },

  scopeTextSelected: {
    color: "#FFFFFF",
  },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 104,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 26,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    flexDirection: "row",
    gap: 16,
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
    fontSize: 20,
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
      height: 5,
    },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },

  startButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
});
