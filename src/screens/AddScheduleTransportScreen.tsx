import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type TransportMode = "WALK" | "TRANSIT" | "CAR";

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

const TRANSPORT_OPTIONS: {
  key: TransportMode;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: "WALK",
    title: "도보",
    description: "가까운 장소 위주로 걸어서 이동해요",
    icon: "walk-outline",
  },
  {
    key: "TRANSIT",
    title: "대중교통",
    description: "버스와 지하철을 활용해 이동해요",
    icon: "bus-outline",
  },
  {
    key: "CAR",
    title: "자동차",
    description: "차량 이동 기준으로 일정을 구성해요",
    icon: "car-outline",
  },
];

export default function AddScheduleTransportScreen({
  navigation,
  route,
}: Props) {
  const [selectedTransport, setSelectedTransport] =
    useState<TransportMode>("WALK");

  const tripName = route?.params?.tripName ?? "";
  const startDate = route?.params?.startDate ?? "";
  const endDate = route?.params?.endDate ?? "";

  const selectedLabel = useMemo(() => {
    return (
      TRANSPORT_OPTIONS.find((option) => option.key === selectedTransport)
        ?.title ?? "도보"
    );
  }, [selectedTransport]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleNext = () => {
    navigation.navigate("PlanA", {
      tripName,
      startDate,
      endDate,
      transportMode: selectedTransport,
      transportLabel: selectedLabel,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.75}
          onPress={handleBack}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.stepText}>새 일정 추가하기</Text>
          <Text style={styles.title}>여행 수단을 선택해 주세요</Text>
          <Text style={styles.subtitle}>
            선택한 이동수단을 기준으로 Plan.A 일정을 구성해요.
          </Text>
        </View>

        <View style={styles.optionList}>
          {TRANSPORT_OPTIONS.map((option) => {
            const isSelected = selectedTransport === option.key;

            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.optionCard,
                  isSelected && styles.selectedOptionCard,
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedTransport(option.key)}
              >
                <View
                  style={[
                    styles.iconBox,
                    isSelected && styles.selectedIconBox,
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={isSelected ? "#FFFFFF" : "#22A447"}
                  />
                </View>

                <View style={styles.optionTextBox}>
                  <Text
                    style={[
                      styles.optionTitle,
                      isSelected && styles.selectedOptionTitle,
                    ]}
                  >
                    {option.title}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </View>

                <Ionicons
                  name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={isSelected ? "#22A447" : "#D1D5DB"}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.nextButton}
            activeOpacity={0.85}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>다음</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  header: {
    marginTop: 20,
    marginBottom: 28,
  },
  stepText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#22A447",
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6B7280",
  },
  optionList: {
    gap: 14,
  },
  optionCard: {
    minHeight: 92,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  selectedOptionCard: {
    borderColor: "#22A447",
    backgroundColor: "#F0FDF4",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#ECFDF3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  selectedIconBox: {
    backgroundColor: "#22A447",
  },
  optionTextBox: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  selectedOptionTitle: {
    color: "#15803D",
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
  },
  footer: {
    marginTop: "auto",
    paddingTop: 20,
    paddingBottom: 20,
  },
  nextButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
