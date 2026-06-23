import React, { useMemo, useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";

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
const ERROR = "#EF4444";

function getLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date?: string) {
  if (!date) return "날짜 선택";
  const [year, month, day] = date.split("-");
  return `${year}.${month}.${day}`;
}

function isEndBeforeStart(start?: string, end?: string) {
  if (!start || !end) return false;

  const startTime = new Date(`${start}T00:00:00`).getTime();
  const endTime = new Date(`${end}T00:00:00`).getTime();

  return endTime < startTime;
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

  if (
    !endDate ||
    startDate === endDate ||
    isEndBeforeStart(startDate, endDate)
  ) {
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

  const todayDate = useMemo(
    () => getLocalDateString(new Date()),
    [],
  );

  const hasDateError = isEndBeforeStart(startDate, endDate);
  const dateErrorMessage =
    hasDateError ? "출발일은 도착일보다 늦을 수 없습니다." : "";

  const markedDates = useMemo(
    () => buildMarkedDates(startDate || undefined, endDate || undefined),
    [startDate, endDate],
  );

  const handleDayPress = (day: DateData) => {
    const selected = day.dateString;

    if (!startDate || (startDate && endDate && !hasDateError)) {
      setStartDate(selected);
      setEndDate("");
      return;
    }

    setEndDate(selected);
  };

  const handleApply = () => {
    if (!startDate || !endDate || hasDateError) return;

    onApply({ startDate, endDate });
    onClose();
  };

  const isApplyDisabled = !startDate || !endDate || hasDateError;

  const renderDay = ({ date, state }: { date?: DateData; state?: string }) => {
    if (!date) {
      return <View style={styles.dayCell} />;
    }

    const dateString = date.dateString;
    const isDisabled = state === "disabled";
    const isToday = dateString === todayDate;

    const dayOfWeek = new Date(
      date.year,
      date.month - 1,
      date.day,
    ).getDay();

    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;

    const hasRange = Boolean(startDate && endDate && !hasDateError);
    const isSingleSelected =
      startDate === dateString && (!endDate || hasDateError);
    const isStart = startDate === dateString;
    const isEnd = endDate === dateString;
    const isInRange =
      hasRange && dateString >= startDate && dateString <= endDate;
    const isMiddle = isInRange && !isStart && !isEnd;
    const isSelectedCircle =
      isSingleSelected || isStart || (isEnd && !hasDateError);
    const isErrorEnd = hasDateError && isEnd;

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
        {isInRange && !isSingleSelected ?
          <View
            style={[
              styles.rangeBackground,
              isStart && styles.rangeBackgroundStart,
              isEnd && styles.rangeBackgroundEnd,
              isMiddle && styles.rangeBackgroundMiddle,
            ]}
          />
        : null}

        <View
          style={[
            styles.dayCircle,
            isToday &&
              !isSelectedCircle &&
              !isMiddle &&
              !isErrorEnd &&
              styles.todayDayCircle,
            isSelectedCircle &&
              styles.selectedDayCircle,
            isErrorEnd &&
              styles.errorDayCircle,
          ]}
        >
          <Text
            style={[
              styles.dayText,
              isDisabled &&
                styles.disabledDayText,
              isToday &&
                !isSelectedCircle &&
                !isMiddle &&
                !isErrorEnd &&
                styles.todayDayText,
              isSunday &&
                !isDisabled &&
                !isSelectedCircle &&
                !isMiddle &&
                !isErrorEnd &&
                styles.sundayDayText,
              isSaturday &&
                !isDisabled &&
                !isSelectedCircle &&
                !isMiddle &&
                !isErrorEnd &&
                styles.saturdayDayText,
              isMiddle &&
                styles.rangeDayText,
              isSelectedCircle && styles.selectedDayText,
              isErrorEnd && styles.errorDayText,
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
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
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
              <Text style={styles.summaryLabel}>도착일</Text>
              <Text
                style={[
                  styles.summaryValue,
                  hasDateError && styles.summaryErrorValue,
                ]}
              >
                {formatDisplayDate(endDate)}
              </Text>
            </View>
          </View>

          {hasDateError ?
            <View style={styles.modalErrorBox}>
              <Ionicons name="alert-circle" size={15} color={ERROR} />
              <Text style={styles.modalErrorText}>{dateErrorMessage}</Text>
            </View>
          : <Text style={styles.helperText}>
              출발일을 먼저 선택한 뒤, 도착일을 선택해 주세요.
            </Text>
          }

          <Calendar
            markingType="period"
            markedDates={markedDates}
            renderArrow={(direction) => (
              <Ionicons
                name={direction === "left" ? "chevron-back" : "chevron-forward"}
                size={22}
                color="#2158E8"
              />
            )}
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

              "stylesheet.calendar.header": {
                dayTextAtIndex0: {
                  color: "#EF4444",
                  fontWeight: "700",
                },
                dayTextAtIndex6: {
                  color: "#2563EB",
                  fontWeight: "700",
                },
              },
            } as any}
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
    width: "100%",
    maxWidth: 342,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 22,
  },

  handle: {
    display: "none",
  },

  headerRow: {
    minHeight: 30,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 16,
  },

  title: {
    width: "100%",
    paddingHorizontal: 54,
    fontSize: 20,
    fontWeight: "900",
    color: TEXT_MAIN,
    textAlign: "center",
  },

  closeButton: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
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
    minWidth: 0,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryDivider: {
    width: 1,
    backgroundColor: BORDER,
  },

  summaryLabel: {
    width: "100%",
    fontSize: 13,
    fontWeight: "700",
    color: TEXT_SUB,
    marginBottom: 6,
    textAlign: "center",
  },

  summaryValue: {
    width: "100%",
    fontSize: 18,
    fontWeight: "800",
    color: TEXT_MAIN,
    textAlign: "center",
  },

  summaryErrorValue: {
    color: ERROR,
  },

  helperText: {
    width: "100%",
    paddingHorizontal: 4,
    fontSize: 13,
    lineHeight: 19,
    color: TEXT_SUB,
    textAlign: "center",
    marginBottom: 16,
  },

  modalErrorBox: {
    minHeight: 34,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  modalErrorText: {
    color: ERROR,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    textAlign: "center",
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

  todayDayCircle: {
    backgroundColor: "#EEF4FF",
    borderWidth: 1.5,
    borderColor: PRIMARY,
  },

  selectedDayCircle: {
    backgroundColor: PRIMARY,
  },

  errorDayCircle: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: ERROR,
  },

  dayText: {
    color: TEXT_MAIN,
    fontSize: 14,
    fontWeight: "600",
  },

  todayDayText: {
    color: PRIMARY,
    fontWeight: "900",
  },

  sundayDayText: {
    color: "#EF4444",
    fontWeight: "800",
  },

  saturdayDayText: {
    color: "#2563EB",
    fontWeight: "800",
  },

  selectedDayText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  errorDayText: {
    color: ERROR,
    fontWeight: "900",
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
