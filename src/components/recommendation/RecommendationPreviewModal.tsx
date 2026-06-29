import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import VisitTimePickerPanel from "../common/VisitTimePickerPanel";
import RecommendationHeader from "./RecommendationHeader";
import RecommendationMap from "./RecommendationMap";
import RecommendationTimeline from "./RecommendationTimeline";
import WhiteToast from "./WhiteToast";
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
  visitTimeText: string;
  endTimeText: string;
  hourText: string;
  minuteText: string;

  onClose: () => void;
  onChangeTransportMode: (mode: RecommendationTransportMode) => void;
  onChangePreviousTransportMode?: (mode: RecommendationTransportMode) => void;
  onChangeNextTransportMode?: (mode: RecommendationTransportMode) => void;
  onPressTimeEdit: () => void;
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
  onSaveTime: () => void;
  onConfirm: () => void;
};

export default function RecommendationPreviewModal({
  visible,
  pendingPlace,
  originalPlace,
  nextPlace,
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
  visitTimeText,
  endTimeText,
  hourText,
  minuteText,
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
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    
        presentationStyle="overFullScreen">
      <View style={styles.previewOverlay}>
        <View style={styles.previewModal}>
          <RecommendationHeader title="이렇게 바꿀까요?" onClose={onClose} />

          {timePickerVisible ? (
            <View style={styles.previewTimePickerPanelOverlay}>
              <VisitTimePickerPanel
                placeName={timePickerPlaceName}
                target={timePickerTarget}
                previewText={timePickerPreviewText}
                visitTimeText={visitTimeText}
                endTimeText={endTimeText}
                hourText={hourText}
                minuteText={minuteText}
                onClose={onTimePickerClose}
                onSwitchTarget={onSwitchTimeTarget}
                onDecreaseHour={onDecreaseHour}
                onIncreaseHour={onIncreaseHour}
                onDecreaseMinute={onDecreaseMinute}
                onIncreaseMinute={onIncreaseMinute}
                onSave={onSaveTime}
              />
            </View>
          ) : null}

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
            alternativeTime={alternativeTime}
            alternativeAddress={alternativeAddress}
            originalPlaceName={originalPlaceName}
            nextName={nextName}
            nextTime={nextTime}
            nextAddress={nextAddress}
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

          <TouchableOpacity
            style={styles.previewConfirmButton}
            activeOpacity={0.86}
            onPress={onConfirm}
          >
            <Text style={styles.previewConfirmButtonText}>교체하기</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 18,
  },

  previewModal: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    maxWidth: 390,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },

  previewMapLegend: {
    minHeight: 26,
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

  previewConfirmButton: {
    minHeight: 52,
    marginTop: 12,
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

  previewConfirmButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  previewTimePickerPanelOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 100,
    borderRadius: 22,
    justifyContent: "center",
    paddingHorizontal: 20,
    flex: 1,
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
});
