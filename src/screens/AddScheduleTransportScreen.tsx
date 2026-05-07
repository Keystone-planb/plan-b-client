import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type TransportMode = "WALK" | "TRANSIT" | "CAR";

type TransportOption = {
  mode: TransportMode;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

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

const TRANSPORT_OPTIONS: TransportOption[] = [
  {
    mode: "WALK",
    label: "도보",
    description: "가까운 장소 위주로 천천히 둘러볼게요",
    icon: "walk-outline",
  },
  {
    mode: "TRANSIT",
    label: "대중교통",
    description: "버스, 지하철 등 대중교통을 이용할게요",
    icon: "bus-outline",
  },
  {
    mode: "CAR",
    label: "자동차",
    description: "차량 이동을 기준으로 일정을 만들게요",
    icon: "car-outline",
  },
];

export default function AddScheduleTransportScreen({
  navigation,
  route,
}: Props) {
  const tripName = route.params?.tripName ?? "";
  const startDate = route.params?.startDate ?? "";
  const endDate = route.params?.endDate ?? "";

  const [selectedMode, setSelectedMode] = useState<TransportMode | null>(null);

  const selectedOption = TRANSPORT_OPTIONS.find(
    (option) => option.mode === selectedMode,
  );

  const canGoNext = Boolean(
    tripName.trim() && startDate && endDate && selectedOption,
  );

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      const browserWindow = globalThis as typeof globalThis & {
        alert?: (message?: string) => void;
      };

      if (typeof browserWindow.alert === "function") {
        browserWindow.alert(`${title}\n${message}`);
        return;
      }
    }

    Alert.alert(title, message);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleNext = () => {
    if (!selectedOption) {
      showAlert("이동수단 선택", "여행 이동수단을 선택해주세요.");
      return;
    }

    navigation.navigate("AddScheduleLocation", {
      tripName: tripName.trim(),
      startDate,
      endDate,
      transportMode: selectedOption.mode,
      transportLabel: selectedOption.label,
    });
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
              activeOpacity={0.8}
              onPress={handleBack}
            >
              <Ionicons name="chevron-back" size={24} color="#64748B" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Plan.A</Text>

            <View style={styles.iconPlaceholder} />
          </View>

          <View style={styles.topSection}>
            <View style={styles.illustrationWrapper}>
              <View style={styles.illustrationCircle}>
                <Ionicons name="navigate" size={48} color="#2158E8" />
              </View>
            </View>

            <Text style={styles.title}>이동수단을{"\n"}선택해주세요</Text>

            <Text style={styles.description}>
              여행 중 주로 어떤 방식으로 이동하시나요?
            </Text>
          </View>

          <View style={styles.optionSection}>
            {TRANSPORT_OPTIONS.map((option) => {
              const selected = selectedMode === option.mode;

              return (
                <TouchableOpacity
                  key={option.mode}
                  style={[
                    styles.optionCard,
                    selected && styles.optionCardSelected,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedMode(option.mode)}
                >
                  <View
                    style={[
                      styles.optionIconCircle,
                      selected && styles.optionIconCircleSelected,
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={26}
                      color={selected ? "#FFFFFF" : "#2158E8"}
                    />
                  </View>

                  <View style={styles.optionTextBox}>
                    <Text
                      style={[
                        styles.optionTitle,
                        selected && styles.optionTitleSelected,
                      ]}
                    >
                      {option.label}
                    </Text>

                    <Text
                      style={[
                        styles.optionDescription,
                        selected && styles.optionDescriptionSelected,
                      ]}
                    >
                      {option.description}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioOuter,
                      selected && styles.radioOuterSelected,
                    ]}
                  >
                    {selected ?
                      <View style={styles.radioInner} />
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
            style={[styles.nextButton, !canGoNext && styles.disabledButton]}
            activeOpacity={0.85}
            onPress={handleNext}
            disabled={!canGoNext}
          >
            <Text style={styles.nextButtonText}>완료</Text>
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
    backgroundColor: "#F7F9FB",
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: 18,
    paddingHorizontal: 21,
    paddingBottom: 24,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 42,
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
    letterSpacing: -1,
  },

  topSection: {
    alignItems: "center",
    marginBottom: 34,
  },

  illustrationWrapper: {
    width: 170,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },

  illustrationCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#D7E9FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 5,
  },

  title: {
    color: "#000000",
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 16,
  },

  description: {
    color: "#627187",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },

  optionSection: {
    gap: 14,
    marginBottom: 20,
  },

  optionCard: {
    minHeight: 88,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E1E7EF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },

  optionCardSelected: {
    borderColor: "#2158E8",
    backgroundColor: "#F3F8FF",
    shadowColor: "#2158E8",
    shadowOpacity: 0.12,
    elevation: 4,
  },

  optionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  optionIconCircleSelected: {
    backgroundColor: "#2158E8",
  },

  optionTextBox: {
    flex: 1,
  },

  optionTitle: {
    color: "#1C2534",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 6,
  },

  optionTitleSelected: {
    color: "#174AC9",
  },

  optionDescription: {
    color: "#8C9BB1",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },

  optionDescriptionSelected: {
    color: "#4B6EA8",
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D2DBE8",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  radioOuterSelected: {
    borderColor: "#2158E8",
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2158E8",
  },

  footerSection: {
    paddingHorizontal: 21,
    paddingBottom: 24,
    backgroundColor: "#F7F9FB",
  },

  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  activeDot: {
    width: 24,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#2158E8",
    marginHorizontal: 8,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E1E7EF",
  },

  nextButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2158E8",
    borderRadius: 14,
    minHeight: 56,
    shadowColor: "#2158E8",
    shadowOpacity: 0.3,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 10,
    elevation: 10,
  },

  disabledButton: {
    opacity: 0.45,
  },

  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
