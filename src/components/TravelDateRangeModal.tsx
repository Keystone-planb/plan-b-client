import React, { useEffect, useMemo, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = {
  visible: boolean;
  initialStartDate?: string;
  initialEndDate?: string;
  onClose: () => void;
  onApply: (range: { startDate: string; endDate: string }) => void;
};

type MarkedDates = Record<
  string,
  {
    startingDay?: boolean;
    endingDay?: boolean;
    color?: string;
    textColor?: string;
  }
>;

const PRIMARY = "#2158E8";
const PRIMARY_SOFT = "#EAF3FF";
const PRIMARY_LIGHT = "#F4F8FF";

const TEXT_MAIN = "#1C2534";
const TEXT_SUB = "#627187";
const TEXT_MUTED = "#8C9BB1";

const BG = "#F7F9FB";
const BORDER = "#E1E7EF";
const ERROR = "#F04438";
const ERROR_BG = "#FFF1F0";

function formatDisplayDate(date?: string) {
  if (!date) return "날짜 선택";

  const [year, month, day] = date.split("-");
  return `${year}.${month}.${day}`;
}

function getDatesInRange(start: string, end: string) {
  const dates: string[] = [];
  const current = new Date(start);
  const last = new Date(end);

  while (current <= last) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");

    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function buildMarkedDates(startDate?: string, endDate?: string): MarkedDates {
  if (!startDate) return {};

  if (!endDate || startDate === endDate) {
    return {
      [startDate]: {
        startingDay: true,
        endingDay: true,
        color: PRIMARY,
        textColor: "#FFFFFF",
      },
    };
  }

  const dates = getDatesInRange(startDate, endDate);
  const marked: MarkedDates = {};

  dates.forEach((date, index) => {
    const isFirst = index === 0;
    const isLast = index === dates.length - 1;

    marked[date] = {
      startingDay: isFirst,
      endingDay: isLast,
      color: isFirst || isLast ? PRIMARY : PRIMARY_SOFT,
      textColor: isFirst || isLast ? "#FFFFFF" : TEXT_MAIN,
    };
  });

  return marked;
}

export default function TravelDateRangeModal({
  visible,
  initialStartDate,
  initialEndDate,
  onClose,
  onApply,
}: Props) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!visible) return;

    setStartDate(initialStartDate ?? "");
    setEndDate(initialEndDate ?? "");
    setErrorMessage("");
  }, [visible, initialStartDate, initialEndDate]);

  const markedDates = useMemo(() => {
    return buildMarkedDates(startDate || undefined, endDate || undefined);
  }, [startDate, endDate]);

  const isApplyDisabled = !startDate || !endDate;

  const handleDayPress = (day: DateData) => {
    const selectedDate = day.dateString;

    setErrorMessage("");

    /**
     * 출발일이 없거나 이미 출발일/도착일 선택이 끝난 상태라면
     * 새 출발일로 다시 선택한다.
     */
    if (!startDate || endDate) {
      setStartDate(selectedDate);
      setEndDate("");
      return;
    }

    /**
     * 도착일은 출발일보다 빠를 수 없다.
     * 이 경우 기존 출발일은 유지하고 에러만 표시한다.
     */
    if (selectedDate < startDate) {
      setErrorMessage("도착일은 출발일보다 빠를 수 없어요!");
      return;
    }

    setEndDate(selectedDate);
  };

  const handleClose = () => {
    setErrorMessage("");
    onClose();
  };

  const handleApply = () => {
    if (!startDate || !endDate) {
      setErrorMessage("출발일과 도착일을 모두 선택해주세요.");
      return;
    }

    onApply({
      startDate,
      endDate,
    });

    setErrorMessage("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.headerTextBox}>
              <Text style={styles.title}>여행 날짜 선택</Text>
              <Text style={styles.subtitle}>
                여행의 출발일과 도착일을 선택해주세요
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={20} color={TEXT_SUB} />
            </TouchableOpacity>
          </View>

          {errorMessage ?
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={15} color={ERROR} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          : null}

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>출발일</Text>

              <Text
                style={[
                  styles.summaryValue,
                  startDate && styles.selectedSummaryValue,
                ]}
                numberOfLines={1}
              >
                {formatDisplayDate(startDate)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>도착일</Text>

              <Text
                style={[
                  styles.summaryValue,
                  endDate && styles.selectedSummaryValue,
                ]}
                numberOfLines={1}
              >
                {formatDisplayDate(endDate)}
              </Text>
            </View>
          </View>

          <Text style={styles.helperText}>
            출발일을 먼저 선택하고, 그다음 도착일을 선택해주세요.
          </Text>

          <View style={styles.calendarCard}>
            <Calendar
              markingType="period"
              markedDates={markedDates}
              onDayPress={handleDayPress}
              hideExtraDays
              firstDay={0}
              theme={{
                backgroundColor: "#FFFFFF",
                calendarBackground: "#FFFFFF",

                textSectionTitleColor: TEXT_MUTED,
                selectedDayBackgroundColor: PRIMARY,
                selectedDayTextColor: "#FFFFFF",
                todayTextColor: PRIMARY,
                dayTextColor: TEXT_MAIN,
                textDisabledColor: "#C3CDD9",

                arrowColor: PRIMARY,
                monthTextColor: TEXT_MAIN,

                textDayFontWeight: "600",
                textMonthFontWeight: "900",
                textDayHeaderFontWeight: "700",

                textDayFontSize: 14,
                textMonthFontSize: 17,
                textDayHeaderFontSize: 12,
              }}
              style={styles.calendar}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.applyButton,
                isApplyDisabled && styles.applyButtonDisabled,
              ]}
              onPress={handleApply}
              activeOpacity={0.85}
              disabled={isApplyDisabled}
            >
              <Text style={styles.applyButtonText}>적용</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(28, 37, 52, 0.28)",
    justifyContent: "flex-end",
  },

  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },

  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D6DFEA",
    marginBottom: 18,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 12,
  },

  headerTextBox: {
    flex: 1,
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: TEXT_MAIN,
    letterSpacing: -0.4,
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "600",
    color: TEXT_SUB,
    lineHeight: 19,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
  },

  errorBox: {
    minHeight: 34,
    borderRadius: 12,
    backgroundColor: ERROR_BG,
    borderWidth: 1,
    borderColor: "#FFD7D3",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 12,
  },

  errorText: {
    flex: 1,
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "800",
    color: ERROR,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: PRIMARY_LIGHT,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PRIMARY_SOFT,
    marginBottom: 10,
    overflow: "hidden",
  },

  summaryCard: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },

  summaryDivider: {
    width: 1,
    backgroundColor: PRIMARY_SOFT,
  },

  summaryLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: TEXT_SUB,
    marginBottom: 6,
  },

  summaryValue: {
    fontSize: 16,
    fontWeight: "900",
    color: TEXT_MUTED,
  },

  selectedSummaryValue: {
    color: TEXT_MAIN,
  },

  helperText: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT_SUB,
    marginBottom: 12,
  },

  calendarCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    marginBottom: 18,
  },

  calendar: {
    paddingTop: 4,
    paddingBottom: 10,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },

  cancelButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: TEXT_MAIN,
  },

  applyButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },

  applyButtonDisabled: {
    opacity: 0.45,
  },

  applyButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
