import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import TravelDateRangeModal from "../components/TravelDateRangeModal";

type Props = {
  navigation: any;
  route: any;
};

export default function AddScheduleDateScreen({ navigation, route }: Props) {
  const tripName = route?.params?.tripName ?? "";

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [calendarVisible, setCalendarVisible] = useState(false);

  const canGoNext = Boolean(startDate && endDate);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleComplete = () => {
    if (!startDate || !endDate) {
      Alert.alert("알림", "여행 날짜를 선택해주세요.");
      return;
    }

    navigation.navigate("AddScheduleLocation", {
      tripName,
      startDate,
      endDate,
    });
  };

  const formatDate = (value: string) => value.replace(/-/g, ".");

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
              style={[styles.nextButton, !canGoNext && styles.disabledButton]}
              onPress={handleComplete}
              activeOpacity={0.85}
              disabled={!canGoNext}
            >
              <Text style={styles.nextButtonText}>다음</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Plan.A</Text>

            <View style={styles.iconPlaceholder} />
          </View>

          <View style={styles.centerSection}>
            <View style={[styles.illustrationWrapper, styles.calendarBg]}>
              <Text style={styles.illustrationEmoji}>📅</Text>
            </View>

            <Text style={styles.title}>여행 날짜를{"\n"}알려주세요</Text>

            <Text style={styles.description}>
              {tripName ?
                `"${tripName}" 여행은 언제 떠나시나요?`
              : "언제부터 언제까지 여행하시나요?"}
            </Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>출발일</Text>

              <TouchableOpacity
                style={styles.dateField}
                activeOpacity={0.85}
                onPress={() => setCalendarVisible(true)}
              >
                <Text
                  style={[
                    styles.dateText,
                    startDate && styles.selectedDateText,
                  ]}
                >
                  {startDate ? formatDate(startDate) : "2026.01.01"}
                </Text>

                <View style={styles.calendarButton}>
                  <Ionicons name="calendar-outline" size={20} color="#2158E8" />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>종료일</Text>

              <TouchableOpacity
                style={styles.dateField}
                activeOpacity={0.85}
                onPress={() => setCalendarVisible(true)}
              >
                <Text
                  style={[styles.dateText, endDate && styles.selectedDateText]}
                >
                  {endDate ? formatDate(endDate) : "2026.01.02"}
                </Text>

                <View style={styles.calendarButton}>
                  <Ionicons name="calendar-outline" size={20} color="#2158E8" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* 
          중요:
          하단 버튼은 ScrollView 밖에 있어야 함.
          그래야 이름 입력 화면처럼 스크롤하지 않아도 항상 보인다.
        */}
        <View style={styles.footerSection}>
          <View style={styles.pagination}>
            <View style={styles.dot} />
            <View style={styles.activeDot} />
          </View>

          <TouchableOpacity
            style={[styles.nextButton, !canGoNext && styles.disabledButton]}
            onPress={handleComplete}
            activeOpacity={0.85}
            disabled={!canGoNext}
          >
            <Text style={styles.nextButtonText}>다음</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TravelDateRangeModal
        visible={calendarVisible}
        initialStartDate={startDate}
        initialEndDate={endDate}
        onClose={() => setCalendarVisible(false)}
        onApply={({ startDate: nextStartDate, endDate: nextEndDate }) => {
          setStartDate(nextStartDate);
          setEndDate(nextEndDate);
        }}
      />
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
    borderRadius: 999,
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

  calendarBg: {
    backgroundColor: "#FFEDD2",
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

  formSection: {
    marginTop: 2,
  },

  fieldGroup: {
    marginBottom: 16,
  },

  fieldLabel: {
    color: "#252D3C",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },

  dateField: {
    minHeight: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E1E7EF",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },

  dateText: {
    color: "#8C9BB1",
    fontSize: 16,
    fontWeight: "500",
  },

  selectedDateText: {
    color: "#1C2534",
    fontWeight: "700",
  },

  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
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
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E1E7EF",
    marginRight: 8,
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
