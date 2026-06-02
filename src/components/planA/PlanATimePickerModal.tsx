// src/components/planA/PlanATimePickerModal.tsx

import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import type { PlaceItem } from "../../types/planA";
import {
  getPlaceEndTime,
  getPlaceVisitTime,
} from "../../utils/planA/planAScreenUtils";

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
    >
      <View style={styles.timeModalBackdrop}>
        <View style={styles.timeModalCard}>
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
            {place?.name ?? "장소"}
          </Text>

          <View style={styles.timeTargetTabs}>
            <TouchableOpacity
              style={[
                styles.timeTargetTab,
                target === "visitTime" && styles.timeTargetTabActive,
              ]}
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
              >
                {target === "visitTime"
                  ? previewText
                  : place
                    ? getPlaceVisitTime(place)
                    : "00:00"}
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
              >
                {target === "endTime"
                  ? previewText
                  : place
                    ? getPlaceEndTime(place)
                    : "00:00"}
              </Text>
            </View>
          </View>

          <View style={styles.timePickerControls}>
            <View style={styles.timePickerColumn}>
              <TouchableOpacity
                style={styles.timePickerArrow}
                activeOpacity={0.75}
                onPress={onDecreaseHour}
              >
                <Ionicons name="chevron-up" size={22} color="#64748B" />
              </TouchableOpacity>

              <View style={styles.timePickerValueBox}>
                <Text style={styles.timePickerValueText}>{hourText}</Text>
              </View>

              <TouchableOpacity
                style={styles.timePickerArrow}
                activeOpacity={0.75}
                onPress={onIncreaseHour}
              >
                <Ionicons name="chevron-down" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.timePickerColon}>:</Text>

            <View style={styles.timePickerColumn}>
              <TouchableOpacity
                style={styles.timePickerArrow}
                activeOpacity={0.75}
                onPress={onDecreaseMinute}
              >
                <Ionicons name="chevron-up" size={22} color="#64748B" />
              </TouchableOpacity>

              <View style={styles.timePickerValueBox}>
                <Text style={styles.timePickerValueText}>{minuteText}</Text>
              </View>

              <TouchableOpacity
                style={styles.timePickerArrow}
                activeOpacity={0.75}
                onPress={onIncreaseMinute}
              >
                <Ionicons name="chevron-down" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.timeModalButtonRow}>
            <TouchableOpacity
              style={styles.timeModalCancelButton}
              activeOpacity={0.8}
              onPress={onClose}
            >
              <Text style={styles.timeModalCancelText}>취소</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.timeModalSaveButton}
              activeOpacity={0.8}
              onPress={onSave}
            >
              <Text style={styles.timeModalSaveText}>저장</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  timeModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  timeModalCard: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
  },
  timeModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeModalTitle: { color: "#1E293B", fontSize: 20, fontWeight: "900" },
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
  timeTargetTabs: {
    marginTop: 18,
    flexDirection: "row",
    gap: 10,
  },
  timeTargetTab: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  timeTargetTabActive: {
    backgroundColor: "#2158E8",
  },
  timeTargetTabText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "900",
  },
  timeTargetTabTextActive: {
    color: "#FFFFFF",
  },
  timePickerPreview: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10,
  },
  timePickerSummaryCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  timePickerSummaryCardActive: {
    backgroundColor: "#EFF6FF",
  },
  timePickerSummaryLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "900",
  },
  timePickerSummaryLabelActive: {
    color: "#2158E8",
  },
  timePickerSummaryValue: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 16,
    fontWeight: "900",
  },
  timePickerSummaryValueActive: {
    color: "#1E40AF",
  },
  timePickerControls: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  timePickerColumn: { alignItems: "center", gap: 8 },
  timePickerArrow: {
    width: 42,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  timePickerValueBox: {
    width: 72,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  timePickerValueText: { color: "#111827", fontSize: 18, fontWeight: "900" },
  timePickerColon: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "900",
  },
  timeModalButtonRow: {
    marginTop: 22,
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
  timeModalCancelText: { color: "#64748B", fontSize: 14, fontWeight: "900" },
  timeModalSaveButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
  },
  timeModalSaveText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
});
