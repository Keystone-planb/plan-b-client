import React from "react";
import { Modal, StyleSheet, View } from "react-native";

import type { PlaceItem } from "../../types/planA";
import {
  getPlaceEndTime,
  getPlaceVisitTime,
} from "../../utils/planA/planAScreenUtils";
import VisitTimePickerPanel from "../common/VisitTimePickerPanel";

type TimePickerTarget =
  | "visitTime"
  | "endTime"
  | "transportStartTime"
  | "transportEndTime";

type Props = {
  visible: boolean;
  place: PlaceItem | null;
  target: TimePickerTarget;
  previewText: string;
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

export default function PlanATimePickerModal({
  visible,
  place,
  target,
  previewText,
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
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    
        presentationStyle="overFullScreen">
      <View style={styles.timeModalBackdrop}>
        <VisitTimePickerPanel
          placeName={place?.name ?? "장소"}
          target={target}
          previewText={previewText}
          visitTimeText={place ? getPlaceVisitTime(place) : "00:00"}
          endTimeText={place ? getPlaceEndTime(place) : "00:00"}
          hourText={hourText}
          minuteText={minuteText}
          onClose={onClose}
          onSwitchTarget={onSwitchTarget}
          onDecreaseHour={onDecreaseHour}
          onIncreaseHour={onIncreaseHour}
          onDecreaseMinute={onDecreaseMinute}
          onIncreaseMinute={onIncreaseMinute}
          onSave={onSave}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  timeModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    paddingHorizontal: 20,
    alignItems: "center",
    paddingVertical: 24,
  },
});
