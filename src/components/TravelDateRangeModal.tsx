import React, { useMemo, useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Calendar, DateData } from "react-native-calendars";

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
const TEXT_MAIN = "#1C2534";
const TEXT_SUB = "#627187";
const BG = "#F7F9FB";
const BORDER = "#E1E7EF";

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
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
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
      color: PRIMARY,
      textColor: "#FFFFFF",
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
  const [startDate, setStartDate] = useState(initialStartDate ?? "");
  const [endDate, setEndDate] = useState(initialEndDate ?? "");

  const markedDates = useMemo(
    () => buildMarkedDates(startDate || undefined, endDate || undefined),
    [startDate, endDate],
  );

  const handleDayPress = (day: DateData) => {
    const selected = day.dateString;

    if (!startDate || (startDate && endDate)) {
      setStartDate(selected);
      setEndDate("");
      return;
    }

    if (selected < startDate) {
      setStartDate(selected);
      return;
    }

    setEndDate(selected);
  };

  const handleApply = () => {
    if (!startDate || !endDate) return;
    onApply({ startDate, endDate });
    onClose();
  };

  const isApplyDisabled = !startDate || !endDate;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <Text style={styles.title}>여행 날짜 선택</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeText}>닫기</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>출발일</Text>
              <Text style={styles.summaryValue}>
                {formatDisplayDate(startDate)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>종료일</Text>
              <Text style={styles.summaryValue}>
                {formatDisplayDate(endDate)}
              </Text>
            </View>
          </View>

          <Text style={styles.helperText}>
            출발일을 먼저 선택하고, 그다음 종료일을 선택해주세요.
          </Text>

          <Calendar
            markingType="period"
            markedDates={markedDates}
            onDayPress={handleDayPress}
            hideExtraDays
            firstDay={0}
            theme={{
              backgroundColor: "#FFFFFF",
              calendarBackground: "#FFFFFF",
              textSectionTitleColor: "#9AA6B2",
              selectedDayBackgroundColor: "#2158E8",
              selectedDayTextColor: "#FFFFFF",
              todayTextColor: "#2158E8",
              dayTextColor: "#1C2534",
              textDisabledColor: "#C3CDD9",
              arrowColor: "#2158E8",
              monthTextColor: "#111827",
              textDayFontWeight: "500",
              textMonthFontWeight: "800",
              textDayHeaderFontWeight: "600",
              textDayFontSize: 15,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 13,
            }}
            style={styles.calendar}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
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
    backgroundColor: "rgba(28, 37, 52, 0.24)",
    justifyContent: "flex-end",
  },

  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },

  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D6DFEA",
    marginBottom: 16,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: TEXT_MAIN,
  },

  closeText: {
    fontSize: 15,
    fontWeight: "700",
    color: TEXT_SUB,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
    overflow: "hidden",
  },

  summaryCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },

  summaryDivider: {
    width: 1,
    backgroundColor: BORDER,
  },

  summaryLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: TEXT_SUB,
    marginBottom: 6,
  },

  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT_MAIN,
  },

  helperText: {
    fontSize: 13,
    color: TEXT_SUB,
    marginBottom: 14,
  },

  calendar: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    paddingBottom: 8,
    marginBottom: 18,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },

  cancelButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT_MAIN,
  },

  applyButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },

  applyButtonDisabled: {
    opacity: 0.45,
  },

  applyButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
