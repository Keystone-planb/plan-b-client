import React, { useEffect, useRef } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { styles } from "./VisitTimePickerPanel.styles";
import {
  HOURS,
  ITEM_HEIGHT,
  MINUTES,
  canSaveTimeRange,
  moveByStep,
  padTimeUnit,
  resolveTimeText,
  toNumber,
} from "./visitTimePickerUtils";

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
  errorMessage?: string;
  saving?: boolean;
  onClose: () => void;
  onSwitchTarget: (
    target: TimePickerTarget,
  ) => void;
  onDecreaseHour: () => void;
  onIncreaseHour: () => void;
  onDecreaseMinute: () => void;
  onIncreaseMinute: () => void;
  onSave: () => void | Promise<void>;
};

export default function VisitTimePickerPanel({
  placeName,
  target,
  previewText,
  visitTimeText,
  endTimeText,
  hourText,
  minuteText,
  errorMessage = "",
  saving = false,
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

  const lastSyncedHourRef =
    useRef<number | null>(null);

  const lastSyncedMinuteRef =
    useRef<number | null>(null);

  const lastHandledHourValueRef =
    useRef<number | null>(null);

  const lastHandledMinuteValueRef =
    useRef<number | null>(null);

  const animateHourSyncRef = useRef(false);
  const animateMinuteSyncRef = useRef(false);

  const isVisitTarget =
    target === "visitTime" ||
    target === "transportStartTime";

  const isEndTarget =
    target === "endTime" ||
    target === "transportEndTime";

  const selectedVisitTime = isVisitTarget
    ? resolveTimeText(
        previewText,
        visitTimeText,
      )
    : resolveTimeText(
        visitTimeText,
        previewText,
      );

  const selectedEndTime = isEndTarget
    ? resolveTimeText(
        previewText,
        endTimeText,
      )
    : resolveTimeText(
        endTimeText,
        previewText,
      );

  const canSave = canSaveTimeRange(
    selectedVisitTime,
    selectedEndTime,
  );

  const validationMessage = canSave
    ? ""
    : "종료 시간은 시작 시간보다 늦어야 합니다.";

  const displayedErrorMessage =
    validationMessage || errorMessage;

  const hour = toNumber(hourText);
  const minute = toNumber(minuteText);

  useEffect(() => {
    if (
      lastSyncedHourRef.current === hour
    ) {
      return;
    }

    lastSyncedHourRef.current = hour;
    lastHandledHourValueRef.current = null;

    hourRef.current?.scrollTo({
      y: hour * ITEM_HEIGHT,
      animated: animateHourSyncRef.current,
    });

    animateHourSyncRef.current = false;
  }, [hour]);

  useEffect(() => {
    if (
      lastSyncedMinuteRef.current === minute
    ) {
      return;
    }

    lastSyncedMinuteRef.current = minute;
    lastHandledMinuteValueRef.current = null;

    const minuteIndex = Math.max(
      0,
      MINUTES.indexOf(minute),
    );

    minuteRef.current?.scrollTo({
      y: minuteIndex * ITEM_HEIGHT,
      animated: animateMinuteSyncRef.current,
    });

    animateMinuteSyncRef.current = false;
  }, [minute]);

  const handleHourScrollEnd = (
    event: NativeSyntheticEvent<
      NativeScrollEvent
    >,
  ) => {
    const next = Math.round(
      event.nativeEvent.contentOffset.y /
        ITEM_HEIGHT,
    );

    const normalized = Math.max(
      0,
      Math.min(23, next),
    );

    if (
      lastHandledHourValueRef.current ===
      normalized
    ) {
      return;
    }

    lastHandledHourValueRef.current =
      normalized;

    moveByStep(
      hour,
      normalized,
      24,
      onDecreaseHour,
      onIncreaseHour,
    );
  };

  const handleMinuteScrollEnd = (
    event: NativeSyntheticEvent<
      NativeScrollEvent
    >,
  ) => {
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.y /
        ITEM_HEIGHT,
    );

    const normalizedIndex = Math.max(
      0,
      Math.min(MINUTES.length - 1, nextIndex),
    );

    const nextMinute = MINUTES[normalizedIndex];

    if (
      lastHandledMinuteValueRef.current ===
      nextMinute
    ) {
      return;
    }

    lastHandledMinuteValueRef.current =
      nextMinute;

    const currentIndex = Math.max(
      0,
      MINUTES.indexOf(minute),
    );

    moveByStep(
      currentIndex,
      normalizedIndex,
      MINUTES.length,
      onDecreaseMinute,
      onIncreaseMinute,
    );
  };

  const handleHourPress = (value: number) => {
    if (value === hour) {
      return;
    }

    lastHandledHourValueRef.current = value;
    animateHourSyncRef.current = true;

    moveByStep(
      hour,
      value,
      24,
      onDecreaseHour,
      onIncreaseHour,
    );
  };

  const handleMinutePress = (value: number) => {
    const targetIndex = MINUTES.indexOf(value);
    const currentIndex = MINUTES.indexOf(minute);

    if (
      targetIndex < 0 ||
      currentIndex < 0 ||
      value === minute
    ) {
      return;
    }

    lastHandledMinuteValueRef.current = value;
    animateMinuteSyncRef.current = true;

    moveByStep(
      currentIndex,
      targetIndex,
      MINUTES.length,
      onDecreaseMinute,
      onIncreaseMinute,
    );
  };

  const handleSave = () => {
    if (!canSave || saving) {
      return;
    }

    void onSave();
  };

  const renderWheelItem = (
    value: number,
    active: boolean,
    onPress: (value: number) => void,
  ) => (
    <TouchableOpacity
      key={value}
      style={styles.wheelItem}
      activeOpacity={0.65}
      onPress={() => onPress(value)}
      accessibilityRole="button"
      accessibilityLabel={`${padTimeUnit(value)} 선택`}
    >
      <Text
        style={[
          styles.wheelItemText,
          active &&
            styles.wheelItemTextActive,
        ]}
      >
        {padTimeUnit(value)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View
      style={styles.timeModalCard}
      testID="plan-a-time-picker"
      accessibilityLabel="Plan A time picker"
    >
      <View style={styles.timeModalHeader}>
        <Text style={styles.timeModalTitle}>
          방문 시간 설정
        </Text>

        <TouchableOpacity
          style={styles.timeModalCloseButton}
          activeOpacity={0.7}
          onPress={onClose}
        >
          <Ionicons
            name="close"
            size={23}
            color="#64748B"
          />
        </TouchableOpacity>
      </View>

      <Text
        style={styles.timeModalPlaceName}
        numberOfLines={1}
      >
        {placeName ?? "장소명"}
      </Text>

      <Text style={styles.timeModalGuide}>
        시작 시간과 종료 시간을 각각 선택해 주세요.
      </Text>

      <View style={styles.timePickerPreview}>
        <TouchableOpacity
          style={[
            styles.timePickerSummaryCard,
            isVisitTarget &&
              styles.timePickerSummaryCardActive,
          ]}
          activeOpacity={0.8}
          onPress={() =>
            onSwitchTarget("visitTime")
          }
        >
          <Text
            style={[
              styles.timePickerSummaryLabel,
              isVisitTarget &&
                styles.timePickerSummaryLabelActive,
            ]}
          >
            시작 시간
          </Text>

          <Text
            style={[
              styles.timePickerSummaryValue,
              isVisitTarget &&
                styles.timePickerSummaryValueActive,
            ]}
            testID="plan-a-time-picker-start-value"
            accessibilityLabel={`Plan A time picker start value ${selectedVisitTime}`}
          >
            {selectedVisitTime || "00:00"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.timePickerSummaryCard,
            isEndTarget &&
              styles.timePickerSummaryCardActive,
          ]}
          activeOpacity={0.8}
          onPress={() =>
            onSwitchTarget("endTime")
          }
        >
          <Text
            style={[
              styles.timePickerSummaryLabel,
              isEndTarget &&
                styles.timePickerSummaryLabelActive,
            ]}
          >
            종료 시간
          </Text>

          <Text
            style={[
              styles.timePickerSummaryValue,
              isEndTarget &&
                styles.timePickerSummaryValueActive,
            ]}
            testID="plan-a-time-picker-end-value"
            accessibilityLabel={`Plan A time picker end value ${selectedEndTime}`}
          >
            {selectedEndTime || "00:00"}
          </Text>
        </TouchableOpacity>
      </View>

      {displayedErrorMessage ? (
        <View style={styles.timeErrorArea}>
          <Ionicons
            name="alert-circle-outline"
            size={16}
            color="#DC2626"
          />

          <Text style={styles.timeErrorText}>
            {displayedErrorMessage}
          </Text>
        </View>
      ) : null}

      <View style={styles.wheelPickerArea}>
        <ScrollView
          ref={hourRef}
          testID="plan-a-time-picker-hour-wheel"
          accessibilityLabel={`Plan A time picker hour wheel ${hourText}`}
          style={styles.wheelColumn}
          contentContainerStyle={
            styles.wheelContent
          }
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          bounces={false}
          overScrollMode="never"
          onMomentumScrollEnd={
            handleHourScrollEnd
          }
        >
          {HOURS.map((value) =>
            renderWheelItem(
              value,
              value === hour,
              handleHourPress,
            ),
          )}
        </ScrollView>

        <Text style={styles.timePickerColon}>
          :
        </Text>

        <ScrollView
          ref={minuteRef}
          testID="plan-a-time-picker-minute-wheel"
          accessibilityLabel={`Plan A time picker minute wheel ${minuteText}`}
          style={styles.wheelColumn}
          contentContainerStyle={
            styles.wheelContent
          }
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          bounces={false}
          overScrollMode="never"
          onMomentumScrollEnd={
            handleMinuteScrollEnd
          }
        >
          {MINUTES.map((value) =>
            renderWheelItem(
              value,
              value === minute,
              handleMinutePress,
            ),
          )}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={[
          styles.timeModalSaveButton,
          (!canSave || saving) &&
            styles.timeModalSaveButtonDisabled,
        ]}
        testID="plan-a-time-picker-save-button"
        accessibilityLabel="Plan A time picker save"
        disabled={!canSave || saving}
        activeOpacity={0.82}
        onPress={handleSave}
      >
        <Text style={styles.timeModalSaveText}>
          {saving ? "저장 중..." : "완료"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
