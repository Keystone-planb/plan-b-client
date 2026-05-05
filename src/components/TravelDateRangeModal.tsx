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

    if (isFirst) {
      marked[date] = {
        startingDay: true,
        color: PRIMARY,
        textColor: "#FFFFFF",
      };
      return;
    }

    if (isLast) {
      marked[date] = {
        endingDay: true,
        color: PRIMARY,
        textColor: "#FFFFFF",
      };
      return;
    }

    marked[date] = {
      color: "#D7E3FF",
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
  const renderDay = ({
    date,
    state,
  }: {
    date?: DateData;
    state?: string;
  }) => {
    if (!date) {
      return <View style={styles.dayCell} />;
    }

    const dateString = date.dateString;
    const isDisabled = state === "disabled";
    const hasRange = Boolean(startDate && endDate);
    const isSingleSelected = startDate === dateString && !endDate;
    const isStart = startDate === dateString;
    const isEnd = endDate === dateString;
    const isInRange =
      hasRange && dateString >= startDate && dateString <= endDate;
    const isMiddle = isInRange && !isStart && !isEnd;
    const isSelectedCircle = isSingleSelected || isStart || isEnd;

    const handlePress = () => {
      handleDayPress(date);
    };

    return (
      <TouchableOpacity
        style={styles.dayCell}
        activeOpacity={0.85}
        onPress={handlePress}
        disabled={isDisabled}
      >
        {isInRange && !isSingleSelected ? (
          <View
            style={[
              styles.rangeBackground,
              isStart && styles.rangeBackgroundStart,
              isEnd && styles.rangeBackgroundEnd,
              isMiddle && styles.rangeBackgroundMiddle,
            ]}
          />
        ) : null}

        <View
          style={[
            styles.dayCircle,
            isSelectedCircle && styles.selectedDayCircle,
          ]}
        >
          <Text
            style={[
              styles.dayText,
              isDisabled && styles.disabledDayText,
              isMiddle && styles.rangeDayText,
              isSelectedCircle && styles.selectedDayText,
            ]}
          >
            {date.day}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };


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
            dayComponent={renderDay}
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
    backgroundColor: "rgba(28, 37, 52, 0.22)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  sheet: {
    width: 310,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 22,
  },

  handle: {
    display: "none",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  title: {
    fontSize: 20,
    fontWeight: "900",
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
    width: 282,
    alignSelf: "center",
    borderRadius: 18,
    paddingBottom: 8,
    marginBottom: 18,
    overflow: "hidden",
  },

  dayCell: {
    width: 40,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  rangeBackground: {
    position: "absolute",
    top: 3,
    bottom: 3,
    left: 0,
    right: 0,
    backgroundColor: "#D7E3FF",
  },

  rangeBackgroundStart: {
    left: 20,
    right: 0,
  },

  rangeBackgroundEnd: {
    left: 0,
    right: 20,
  },

  rangeBackgroundMiddle: {
    left: 0,
    right: 0,
  },

  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },

  selectedDayCircle: {
    backgroundColor: PRIMARY,
  },

  dayText: {
    color: TEXT_MAIN,
    fontSize: 14,
    fontWeight: "600",
  },

  selectedDayText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  rangeDayText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  disabledDayText: {
    color: "#C3CDD9",
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
