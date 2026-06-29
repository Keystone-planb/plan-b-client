import React, { useEffect, useRef } from "react";
import {
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

type TimePickerTarget =
  | "visitTime"
  | "endTime"
  | "transportStartTime"
  | "transportEndTime";

type Props = {
  placeName?: string | null;
  target: TimePickerTarget;
  previewText: string;
  visitTimeText: string;
  endTimeText: string;
  hourText: string;
  minuteText: string;
  onClose: () => void;
  onSwitchTarget: (target: TimePickerTarget) => void;
  onDecreaseHour: () => void;
  onIncreaseHour: () => void;
  onDecreaseMinute: () => void;
  onIncreaseMinute: () => void;
  onSave: () => void;
};

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);
const ITEM_HEIGHT = 42;
const WHEEL_PADDING = ITEM_HEIGHT * 2;

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const pad = (value: number) => String(value).padStart(2, "0");

const toMinutes = (value?: string | null) => {
  const safeValue =
    typeof value === "string" && /^\d{1,2}:\d{2}$/.test(value)
      ? value
      : "00:00";

  const [hour, minute] = safeValue.split(":").map(Number);

  return hour * 60 + minute;
};



const moveByStep = (
  current: number,
  next: number,
  max: number,
  decrease: () => void,
  increase: () => void,
) => {
  if (current === next) return;

  const forward = (next - current + max) % max;
  const backward = (current - next + max) % max;

  const count = Math.min(forward, backward);
  const action = forward <= backward ? increase : decrease;

  for (let index = 0; index < count; index += 1) {
    action();
  }
};

export default function VisitTimePickerPanel({
  placeName,
  target,
  previewText,
  visitTimeText,
  endTimeText,
  hourText,
  minuteText,
  onClose,
  onSwitchTarget,
  onDecreaseHour,
  onIncreaseHour,
  onDecreaseMinute,
  onIncreaseMinute,
  onSave,
}: Props) {
  const hourRef = useRef<ScrollView>(null);
  const minuteRef = useRef<ScrollView>(null);
  const lastSyncedHourRef = useRef<number | null>(null);
  const lastSyncedMinuteRef = useRef<number | null>(null);
  const lastHandledHourValueRef = useRef<number | null>(null);
  const lastHandledMinuteValueRef = useRef<number | null>(null);

  const selectedVisitTime =
    target === "visitTime" ? previewText : visitTimeText;

  const selectedEndTime =
    target === "endTime" ? previewText : endTimeText;

  const canSave =
    toMinutes(selectedVisitTime) < toMinutes(selectedEndTime);


  const hour = toNumber(hourText);
  const minute = toNumber(minuteText);

  useEffect(() => {
    if (lastSyncedHourRef.current === hour) return;

    lastSyncedHourRef.current = hour;
    lastHandledHourValueRef.current = null;

    hourRef.current?.scrollTo({
      y: hour * ITEM_HEIGHT,
      animated: false,
    });
  }, [hour]);

  useEffect(() => {
    if (lastSyncedMinuteRef.current === minute) return;

    lastSyncedMinuteRef.current = minute;
    lastHandledMinuteValueRef.current = null;

    minuteRef.current?.scrollTo({
      y: minute * ITEM_HEIGHT,
      animated: false,
    });
  }, [minute]);

  const handleHourScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const next = Math.round(
      event.nativeEvent.contentOffset.y / ITEM_HEIGHT,
    );

    const normalized = Math.max(0, Math.min(23, next));

    if (lastHandledHourValueRef.current === normalized) return;

    lastHandledHourValueRef.current = normalized;

    moveByStep(
      hour,
      normalized,
      24,
      onDecreaseHour,
      onIncreaseHour,
    );
  };

  const handleMinuteScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const next = Math.round(
      event.nativeEvent.contentOffset.y / ITEM_HEIGHT,
    );

    const normalized = Math.max(0, Math.min(59, next));

    if (lastHandledMinuteValueRef.current === normalized) return;

    lastHandledMinuteValueRef.current = normalized;

    moveByStep(
      minute,
      normalized,
      60,
      onDecreaseMinute,
      onIncreaseMinute,
    );
  };

  const renderWheelItem = (value: number, active: boolean) => (
    <View key={value} style={styles.wheelItem}>
      <Text
        style={[
          styles.wheelItemText,
          active && styles.wheelItemTextActive,
        ]}
      >
        {pad(value)}
      </Text>
    </View>
  );

  return (
    <View
      style={styles.timeModalCard}
      testID="plan-a-time-picker"
      accessibilityLabel="Plan A time picker"
    >
      <View style={styles.timeModalHeader}>
        <Text style={styles.timeModalTitle}>방문 시간 설정</Text>

        <TouchableOpacity
          style={styles.timeModalCloseButton}
          activeOpacity={0.75}
          onPress={onClose}
        >
          <Ionicons name="close" size={22} color="#64748B" />
        </TouchableOpacity>
      </View>

      <Text style={styles.timeModalPlaceName} numberOfLines={1}>
        {placeName ?? "장소"}
      </Text>

      <Text style={styles.timeModalGuide}>
        시작 시간과 종료 시간을 각각 선택해 주세요.
      </Text>


      <View style={styles.timeTargetTabs}>
        <TouchableOpacity
          style={[
            styles.timeTargetTab,
            target === "visitTime" && styles.timeTargetTabActive,
          ]}
          testID="plan-a-time-picker-start-tab"
          accessibilityLabel="Plan A time picker start time tab"
          activeOpacity={0.8}
          onPress={() => onSwitchTarget("visitTime")}
        >
          <Text
            style={[
              styles.timeTargetTabText,
              target === "visitTime" && styles.timeTargetTabTextActive,
            ]}
          >
            시작 시간
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.timeTargetTab,
            target === "endTime" && styles.timeTargetTabActive,
          ]}
          testID="plan-a-time-picker-end-tab"
          accessibilityLabel="Plan A time picker end time tab"
          activeOpacity={0.8}
          onPress={() => onSwitchTarget("endTime")}
        >
          <Text
            style={[
              styles.timeTargetTabText,
              target === "endTime" && styles.timeTargetTabTextActive,
            ]}
          >
            종료 시간
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timePickerPreview}>
        <View
          style={[
            styles.timePickerSummaryCard,
            target === "visitTime" && styles.timePickerSummaryCardActive,
          ]}
        >
          <Text
            style={[
              styles.timePickerSummaryLabel,
              target === "visitTime" && styles.timePickerSummaryLabelActive,
            ]}
          >
            시작 시간
          </Text>

          <Text
            style={[
              styles.timePickerSummaryValue,
              target === "visitTime" && styles.timePickerSummaryValueActive,
            ]}
            testID="plan-a-time-picker-start-value"
            accessibilityLabel={`Plan A time picker start value ${target === "visitTime" ? previewText : visitTimeText}`}
          >
            {target === "visitTime" ? previewText : visitTimeText}
          </Text>
        </View>

        <View
          style={[
            styles.timePickerSummaryCard,
            target === "endTime" && styles.timePickerSummaryCardActive,
          ]}
        >
          <Text
            style={[
              styles.timePickerSummaryLabel,
              target === "endTime" && styles.timePickerSummaryLabelActive,
            ]}
          >
            종료 시간
          </Text>

          <Text
            style={[
              styles.timePickerSummaryValue,
              target === "endTime" && styles.timePickerSummaryValueActive,
            ]}
            testID="plan-a-time-picker-end-value"
            accessibilityLabel={`Plan A time picker end value ${target === "endTime" ? previewText : endTimeText}`}
          >
            {target === "endTime" ? previewText : endTimeText}
          </Text>
        </View>
      </View>

      <View style={styles.wheelPickerArea}>
        <View style={styles.wheelSelectionBar} />

        <ScrollView
          ref={hourRef}
          testID="plan-a-time-picker-hour-wheel"
          accessibilityLabel={`Plan A time picker hour wheel ${hourText}`}
          style={styles.wheelColumn}
          contentContainerStyle={styles.wheelContent}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          bounces={false}
          overScrollMode="never"
          onMomentumScrollEnd={handleHourScrollEnd}
        >
          {HOURS.map((value) => renderWheelItem(value, value === hour))}
        </ScrollView>

        <Text style={styles.timePickerColon}>:</Text>

        <ScrollView
          ref={minuteRef}
          testID="plan-a-time-picker-minute-wheel"
          accessibilityLabel={`Plan A time picker minute wheel ${minuteText}`}
          style={styles.wheelColumn}
          contentContainerStyle={styles.wheelContent}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          bounces={false}
          overScrollMode="never"
          onMomentumScrollEnd={handleMinuteScrollEnd}
        >
          {MINUTES.map((value) => renderWheelItem(value, value === minute))}
        </ScrollView>
      </View>

      <Text style={styles.timeStandardText}>24시간 기준</Text>

      <View style={styles.timeModalButtonRow}>
        <TouchableOpacity
          style={styles.timeModalCancelButton}
          activeOpacity={0.8}
          onPress={onClose}
        >
          <Text style={styles.timeModalCancelText}>취소</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.timeModalSaveButton,
            !canSave && styles.timeModalSaveButtonDisabled,
          ]}
          testID="plan-a-time-picker-save-button"
          accessibilityLabel="Plan A time picker save"
          disabled={!canSave}
          activeOpacity={0.8}
          onPress={() => {
            const nextVisit =
              target === "visitTime"
                ? previewText
                : visitTimeText;

            const nextEnd =
              target === "endTime"
                ? previewText
                : endTimeText;

            if (
              toMinutes(nextVisit) >=
              toMinutes(nextEnd)
            ) {
              Alert.alert(
                "시간을 다시 확인해 주세요",
                "종료 시간은 시작 시간보다 늦어야 합니다.",
              );
              return;
            }

            onSave();
          }}
        >
          <Text style={styles.timeModalSaveText}>저장</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timeModalCard: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 18,

    width: "90%",
    maxWidth: 400,
    maxHeight: "82%",
    alignSelf: "center",
    flexGrow: 0,
    flexShrink: 1,

  },
  timeModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeModalTitle: {
    color: "#1E293B",
    fontSize: 20,
    fontWeight: "900",
  },
  timeModalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  timeModalPlaceName: {
    marginTop: 14,
    color: "#475569",
    fontSize: 14,
    fontWeight: "800",
  },


  timeModalGuide: {
    marginTop: 10,
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },

  timeModalSaveButtonDisabled: {
    backgroundColor: "#D7DCE5",
  },

  timeTargetTabs: {
    marginTop: 18,
    flexDirection: "row",
    gap: 10,
  },
  timeTargetTab: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  timeTargetTabActive: {
    backgroundColor: "#2158E8",
  },
  timeTargetTabText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "900",
  },
  timeTargetTabTextActive: {
    color: "#FFFFFF",
  },
  timePickerPreview: {
    marginTop: 16,
    flexDirection: "row",
    gap: 8,
  },
  timePickerSummaryCard: {
    flex: 1,
    minHeight: 92,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  timePickerSummaryCardActive: {
    backgroundColor: "#EFF6FF",
  },
  timePickerSummaryLabel: {
    color: "#CBD5E1",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  timePickerSummaryLabelActive: {
    color: "#2158E8",
  },
  timePickerSummaryValue: {
    marginTop: 10,
    color: "#475569",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
    textAlign: "center",
  },
  timePickerSummaryValueActive: {
    color: "#1E40AF",
  },
  wheelPickerArea: {
    marginTop: 18,
    width: 260,
    alignSelf: "center",
    height: ITEM_HEIGHT * 5,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  wheelSelectionBar: {
    position: "absolute",
    left: 10,
    right: 10,
    top: ITEM_HEIGHT * 2,
    height: ITEM_HEIGHT,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
  },
  wheelColumn: {
    width: 60,
    height: ITEM_HEIGHT * 5,
  },
  wheelContent: {
    paddingVertical: WHEEL_PADDING,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  wheelItemText: {
    color: "#CBD5E1",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 28,
  },
  wheelItemTextActive: {
    color: "#2158E8",
    fontWeight: "900",
  },
  timePickerColon: {
    zIndex: 2,
    color: "#111827",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
  },
  timeStandardText: {
    marginTop: 12,
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  timeModalButtonRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10,
  },
  timeModalCancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  timeModalCancelText: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "900",
  },
  timeModalSaveButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
  },
  timeModalSaveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
});
