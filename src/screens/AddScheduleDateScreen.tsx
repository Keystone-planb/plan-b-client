import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import TravelDateRangeModal from "../components/TravelDateRangeModal";

const WEEKDAY_LABELS = [
  "일",
  "월",
  "화",
  "수",
  "목",
  "금",
  "토",
] as const;

type Props = {
  navigation: any;
  route: {
    params?: {
      tripName?: string;
    };
  };
};

export default function AddScheduleDateScreen({ navigation, route }: Props) {
  const tripName = route.params?.tripName ?? "";

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [calendarVisible, setCalendarVisible] = useState(false);

  const isEndDateBeforeStartDate = (start: string, end: string) => {
    if (!start || !end) return false;

    const startTime = new Date(`${start}T00:00:00`).getTime();
    const endTime = new Date(`${end}T00:00:00`).getTime();

    return endTime < startTime;
  };

  const dateErrorMessage = useMemo(() => {
    if (!startDate || !endDate) return "";

    if (isEndDateBeforeStartDate(startDate, endDate)) {
      return "출발일은 도착일보다 늦을 수 없습니다.";
    }

    return "";
  }, [startDate, endDate]);

  const hasDateError = Boolean(dateErrorMessage);

  const canGoNext = Boolean(
    tripName.trim() && startDate && endDate && !hasDateError,
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
    if (!startDate || !endDate) {
      Alert.alert("날짜 선택", "여행 시작일과 종료일을 선택해주세요.");
      return;
    }

    navigation.navigate("AddScheduleLocation", {
      tripName,
      startDate,
      endDate,
    });
  };

  const handleApplyDateRange = ({
    startDate: nextStartDate,
    endDate: nextEndDate,
  }: {
    startDate: string;
    endDate: string;
  }) => {
    setStartDate(nextStartDate);
    setEndDate(nextEndDate);
  };

  const formatTravelDate = (
    value: string,
  ) => {
    if (!value) return "날짜 선택";

    const [
      yearText,
      monthText,
      dayText,
    ] = value.split("-");

    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);

    const date = new Date(
      year,
      month - 1,
      day,
    );

    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day) ||
      Number.isNaN(date.getTime())
    ) {
      return value.replace(/-/g, ".");
    }

    const weekday =
      WEEKDAY_LABELS[date.getDay()];

    return `${String(month).padStart(
      2,
      "0",
    )}월 ${String(day).padStart(
      2,
      "0",
    )}일 (${weekday})`;
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
            >
              <Ionicons name="chevron-back" size={24} color="#64748B" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Plan.A</Text>

            <View style={styles.iconPlaceholder} />
          </View>

          <View style={styles.topSection}>
            <View style={styles.illustrationWrapper}>
              <View style={styles.illustrationCircle}>
                <View style={styles.dateIllustration}>
                  <View style={styles.dateTop}>
                    <Text style={styles.dateMonthText}>JUL</Text>

                    <View style={styles.dateRingRow}>
                      <View style={styles.dateRing} />
                      <View style={styles.dateRing} />
                    </View>

                    <View style={styles.dateDotGroup}>
                      <View style={styles.dateDot} />
                      <View style={styles.dateDot} />
                      <View style={styles.dateDot} />
                      <View style={styles.dateDot} />
                      <View style={styles.dateDot} />
                      <View style={styles.dateDot} />
                      <View style={styles.dateDot} />
                      <View style={styles.dateDot} />
                      <View style={styles.dateDot} />
                    </View>
                  </View>

                  <View style={styles.dateBody}>
                    <Text style={styles.dateNumberText}>17</Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={styles.title}>
              여행 날짜를{"\n"}선택해 주세요
            </Text>

            <Text style={styles.description}>
              {tripName ? (
                <Text>
                  <Text style={styles.tripNameText}>
                    {tripName}
                  </Text>
                  {" 여행은 언제 떠나시나요?"}
                </Text>
              ) : (
                "언제부터 언제까지 여행하시나요?"
              )}
            </Text>
          </View>

          <View style={styles.inputSection}>
            <TouchableOpacity
              style={styles.travelPeriodCard}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="여행 기간 선택"
              onPress={() =>
                setCalendarVisible(true)
              }
            >
              <View style={styles.periodCardHeader}>
                <View style={styles.periodTitleRow}>
                  <View style={styles.periodIconBox}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#2158E8"
                    />
                  </View>

                  <Text style={styles.periodTitle}>
                    여행 기간
                  </Text>
                </View>

                <View style={styles.periodChangeRow}>
                  <Text
                    style={styles.periodChangeText}
                  >
                    {startDate || endDate
                      ? "날짜 변경"
                      : "날짜 선택"}
                  </Text>

                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="#2158E8"
                  />
                </View>
              </View>

              <View
                style={
                  styles.periodHorizontalDivider
                }
              />

              <View style={styles.periodDateRow}>
                <View
                  style={styles.periodDateColumn}
                >
                  <Text style={styles.periodLabel}>
                    여행 출발일
                  </Text>

                  <Text
                    style={[
                      styles.periodDateValue,
                      !startDate &&
                        styles.periodPlaceholder,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                  >
                    {formatTravelDate(startDate)}
                  </Text>
                </View>

                <View
                  style={
                    styles.periodVerticalDivider
                  }
                />

                <View
                  style={styles.periodDateColumn}
                >
                  <Text style={styles.periodLabel}>
                    여행 도착일
                  </Text>

                  <Text
                    style={[
                      styles.periodDateValue,
                      !endDate &&
                        styles.periodPlaceholder,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                  >
                    {formatTravelDate(endDate)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.periodHintRow}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#7C8CA3"
              />

              <Text style={styles.periodHintText}>
                카드를 눌러 달력에서 여행 기간을
                선택할 수 있어요.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footerSection}>
          <View style={styles.pagination}>
            <View style={styles.dot} />
            <View style={styles.activeDot} />
            <View style={styles.dot} />
          </View>

          <TouchableOpacity
            style={[styles.nextButton, !canGoNext && styles.disabledButton]}
            onPress={handleNext}
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
        onApply={handleApplyDateRange}
      />
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
    height: 170,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },

  illustrationCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#FFEBC2",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C28A2E",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5,
  },

  dateIllustration: {
    width: 86,
    height: 86,
    backgroundColor: "#E9EAEC",
    overflow: "hidden",
  },

  dateTop: {
    height: 31,
    backgroundColor: "#B85F66",
    paddingHorizontal: 7,
    paddingTop: 6,
    position: "relative",
  },

  dateMonthText: {
    color: "#F8E7E5",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  dateRingRow: {
    position: "absolute",
    top: -5,
    left: 19,
    right: 19,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  dateRing: {
    width: 9,
    height: 14,
    borderRadius: 5,
    backgroundColor: "#FFF2D7",
  },

  dateDotGroup: {
    position: "absolute",
    right: 8,
    bottom: 6,
    width: 30,
    height: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    opacity: 0.4,
  },

  dateDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#F8E7E5",
  },

  dateBody: {
    flex: 1,
    backgroundColor: "#E9EAEC",
    alignItems: "center",
    justifyContent: "center",
  },

  dateNumberText: {
    color: "#333333",
    fontSize: 50,
    fontWeight: "300",
    lineHeight: 56,
    letterSpacing: -2,
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

  tripNameText: {
    color: "#2158E8",
    fontWeight: "900",
  },

  inputSection: {
    marginBottom: 20,
  },

  travelPeriodCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DDE5EF",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },

  periodCardHeader: {
    minHeight: 58,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  periodTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  periodIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  periodTitle: {
    color: "#1C2534",
    fontSize: 16,
    fontWeight: "900",
  },

  periodChangeRow: {
    minHeight: 36,
    paddingLeft: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },

  periodChangeText: {
    color: "#2158E8",
    fontSize: 12,
    fontWeight: "800",
  },

  periodHorizontalDivider: {
    height: 1,
    backgroundColor: "#EEF2F7",
  },

  periodDateRow: {
    minHeight: 100,
    paddingVertical: 18,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "stretch",
  },

  periodDateColumn: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  periodVerticalDivider: {
    width: 1,
    backgroundColor: "#E7ECF3",
  },

  periodLabel: {
    color: "#8190A5",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },

  periodDateValue: {
    width: "100%",
    color: "#1C2534",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 23,
    textAlign: "center",
    letterSpacing: -0.3,
  },

  periodPlaceholder: {
    color: "#9AA8BA",
    fontWeight: "700",
  },

  periodHintRow: {
    marginTop: 11,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  periodHintText: {
    flexShrink: 1,
    color: "#7C8CA3",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    textAlign: "center",
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
