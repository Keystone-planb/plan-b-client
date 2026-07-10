import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import VisitTimePickerPanel from "../common/VisitTimePickerPanel";
import RecommendationHeader from "./RecommendationHeader";
import RecommendationMap from "./RecommendationMap";
import RecommendationTimeline from "./RecommendationTimeline";
import {
  normalizeDisplayTime,
  normalizeDisplayTimeRange,
} from "../../utils/recommendation/recommendationFormatters";
import type {
  PreviewScheduleTimeTarget,
} from "../../hooks/recommendation/useRecommendationPreview";
import type { RecommendationTransportMode } from "./RecommendationTransportCard";

type PreviewPlace = {
  name?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type Props = {
  visible: boolean;
  pendingPlace?: PreviewPlace | null;
  originalPlace?: PreviewPlace | null;
  nextPlace?: PreviewPlace | null;
  hasPreviousSchedule?: boolean;
  hasNextSchedule?: boolean;

  previousName: string;
  previousTime: string;
  previousAddress?: string;

  alternativeName: string;
  alternativeTime: string;
  alternativeAddress?: string;

  originalPlaceName: string;

  nextName: string;
  nextTime: string;
  nextAddress?: string;

  transportMode: RecommendationTransportMode;
  previousTransportMode?: RecommendationTransportMode;
  nextTransportMode?: RecommendationTransportMode;
  previousMoveTimeText?: string;
  nextMoveTimeText?: string;

  timePickerVisible: boolean;
  timePickerPlaceName: string;
  timePickerTarget: "visitTime" | "endTime";
  timePickerPreviewText: string;
  timePickerErrorMessage?: string;
  visitTimeText: string;
  endTimeText: string;
  hourText: string;
  minuteText: string;
  confirmErrorMessage?: string;
  confirming?: boolean;
  confirmLabel?: string;
  confirmingLabel?: string;

  onClose: () => void;
  onChangeTransportMode: (mode: RecommendationTransportMode) => void;
  onChangePreviousTransportMode?: (mode: RecommendationTransportMode) => void;
  onChangeNextTransportMode?: (mode: RecommendationTransportMode) => void;
  onPressTimeEdit: (
    target: PreviewScheduleTimeTarget,
  ) => void;
  onTimePickerClose: () => void;
  onSwitchTimeTarget: (
    target:
      | "visitTime"
      | "endTime"
      | "transportStartTime"
      | "transportEndTime",
  ) => void;
  onDecreaseHour: () => void;
  onIncreaseHour: () => void;
  onDecreaseMinute: () => void;
  onIncreaseMinute: () => void;
  onSaveTime: () => boolean | Promise<boolean>;
  onConfirm: () => void;
};

export default function RecommendationPreviewModal({
  visible,
  pendingPlace,
  originalPlace,
  nextPlace,
  hasPreviousSchedule = true,
  hasNextSchedule = true,
  previousName,
  previousTime,
  previousAddress,
  alternativeName,
  alternativeTime,
  alternativeAddress,
  originalPlaceName,
  nextName,
  nextTime,
  nextAddress,
  transportMode,
  previousTransportMode,
  nextTransportMode,
  previousMoveTimeText,
  nextMoveTimeText,
  timePickerVisible,
  timePickerPlaceName,
  timePickerTarget,
  timePickerPreviewText,
  timePickerErrorMessage = "",
  visitTimeText,
  endTimeText,
  hourText,
  minuteText,
  confirmErrorMessage = "",
  confirming = false,
  confirmLabel = "교체하기",
  confirmingLabel = "교체 중...",
  onClose,
  onChangeTransportMode,
  onChangePreviousTransportMode,
  onChangeNextTransportMode,
  onPressTimeEdit,
  onTimePickerClose,
  onSwitchTimeTarget,
  onDecreaseHour,
  onIncreaseHour,
  onDecreaseMinute,
  onIncreaseMinute,
  onSaveTime,
  onConfirm,
}: Props) {
  const displayVisitTimeText =
    normalizeDisplayTime(visitTimeText) ||
    visitTimeText;
  const displayEndTimeText =
    normalizeDisplayTime(endTimeText) ||
    endTimeText;

  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [isSavingTime, setIsSavingTime] = useState(false);
  const modalMaxHeight = Math.max(
    460,
    windowHeight - insets.top - insets.bottom - 44,
  );

  const handleSaveTime = async () => {
    if (isSavingTime || confirming) {
      return;
    }

    setIsSavingTime(true);

    try {
      await onSaveTime();
    } finally {
      setIsSavingTime(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      hardwareAccelerated
      navigationBarTranslucent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.previewOverlay,
          {
            paddingTop: insets.top + 10,
            paddingBottom: Math.max(insets.bottom, 12) + 10,
          },
        ]}
      >
        {timePickerVisible ? (
          <View style={styles.previewTimePickerBackdrop}>
            <VisitTimePickerPanel
              placeName={timePickerPlaceName}
              target={timePickerTarget}
              previewText={timePickerPreviewText}
              visitTimeText={displayVisitTimeText}
              endTimeText={displayEndTimeText}
              hourText={hourText}
              minuteText={minuteText}
              errorMessage={timePickerErrorMessage}
              saving={confirming || isSavingTime}
              onClose={onTimePickerClose}
              onSwitchTarget={onSwitchTimeTarget}
              onDecreaseHour={onDecreaseHour}
              onIncreaseHour={onIncreaseHour}
              onDecreaseMinute={onDecreaseMinute}
              onIncreaseMinute={onIncreaseMinute}
              onSave={handleSaveTime}
            />
          </View>
        ) : null}

        <View
          style={[
            styles.previewModal,
            {
              maxHeight: modalMaxHeight,
            },
          ]}
        >
          <ScrollView
            style={styles.previewScroll}
            contentContainerStyle={styles.previewContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            <RecommendationHeader
              title="이렇게 바꿀까요?"
              onClose={onClose}
            />

            <RecommendationMap
            previous={originalPlace}
            alternative={pendingPlace}
            next={nextPlace}
          />

          <View style={styles.previewMapLegend}>
            <View style={styles.previewLegendItem}>
              <View
                style={[
                  styles.previewLegendMarker,
                  styles.previewLegendMarkerBefore,
                ]}
              />

              <Text style={styles.previewLegendText}>기존 장소</Text>
            </View>

            <View style={styles.previewLegendItem}>
              <View
                style={[
                  styles.previewLegendMarker,
                  styles.previewLegendMarkerAfter,
                ]}
              />

              <Text style={styles.previewLegendText}>대안 장소</Text>
            </View>
          </View>

          <RecommendationTimeline
            previousName={previousName}
            previousTime={previousTime}
            previousAddress={previousAddress}
            alternativeName={alternativeName}
            alternativeTime={
              normalizeDisplayTimeRange(alternativeTime) ||
              alternativeTime
            }
            alternativeAddress={alternativeAddress}
            originalPlaceName={originalPlaceName}
            nextName={nextName}
            nextTime={nextTime}
            nextAddress={nextAddress}
            hasPreviousSchedule={hasPreviousSchedule}
            hasNextSchedule={hasNextSchedule}
            transportMode={transportMode}
            previousTransportMode={previousTransportMode}
            nextTransportMode={nextTransportMode}
            previousMoveTimeText={previousMoveTimeText}
            nextMoveTimeText={nextMoveTimeText}
            onChangeTransportMode={onChangeTransportMode}
            onChangePreviousTransportMode={onChangePreviousTransportMode}
            onChangeNextTransportMode={onChangeNextTransportMode}
            onPressTimeEdit={onPressTimeEdit}
          />
          </ScrollView>

          <View style={styles.previewFooter}>
            {confirmErrorMessage ? (
              <View
                style={
                  styles.previewErrorArea
                }
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={17}
                  color="#DC2626"
                />

                <Text
                  style={
                    styles.previewErrorText
                  }
                >
                  {confirmErrorMessage}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
            style={[
              styles.previewConfirmButton,
              confirming &&
                styles.previewConfirmButtonDisabled,
            ]}
            activeOpacity={0.86}
            disabled={confirming}
            onPress={onConfirm}
          >
            <Text
              style={
                styles.previewConfirmButtonText
              }
            >
              {confirming
                ? confirmingLabel
                : confirmLabel}
            </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

    </Modal>
  );
}

const styles = StyleSheet.create({
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.48)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 17,
  },

  previewModal: {
    position: "relative",
    overflow: "hidden",
    width: "96%",
    maxWidth: 390,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    elevation: 24,
  },


  previewScroll: {
    flexGrow: 0,
  },

  previewContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 4,
  },

  previewFooter: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
  },

  previewMapLegend: {
    minHeight: 25,
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },

  previewLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  previewLegendMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  previewLegendMarkerBefore: {
    backgroundColor: "#94A3B8",
    opacity: 0.75,
  },

  previewLegendMarkerAfter: {
    backgroundColor: "#2158E8",
  },

  previewLegendText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
  },

  previewErrorArea: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },

  previewErrorText: {
    maxWidth: 290,
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center",
  },

  previewConfirmButton: {
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },

  previewConfirmButtonDisabled: {
    backgroundColor: "#94A3B8",
    shadowOpacity: 0,
    elevation: 0,
  },

  previewConfirmButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  previewTimePickerBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 200,
    elevation: 200,
    backgroundColor: "rgba(15, 23, 42, 0.48)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
});
