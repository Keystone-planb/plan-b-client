import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  styles: any;

  editingTimePlace: any;
  timePickerTarget: "visitTime" | "endTime";

  timePickerHour: number;
  timePickerMinute: number;

  padTimeUnit: (value: number) => string;

  handleSwitchTimeTarget: (
    target: "visitTime" | "endTime",
  ) => void;

  decreaseHour: () => void;
  increaseHour: () => void;

  decreaseMinute: () => void;
  increaseMinute: () => void;

  closeTimePicker: () => void;
  handleSaveTimePicker: () => void;
};

export default function OngoingTimePickerModal({
  visible,
  styles,
  editingTimePlace,
  timePickerTarget,
  timePickerHour,
  timePickerMinute,
  padTimeUnit,
  handleSwitchTimeTarget,
  decreaseHour,
  increaseHour,
  decreaseMinute,
  increaseMinute,
  closeTimePicker,
  handleSaveTimePicker,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeTimePicker}
    >
      <View style={styles.timeModalBackdrop}>
        <View style={styles.timeModalCard}>
          <View style={styles.timeModalHeader}>
            <Text style={styles.timeModalTitle}>
              방문 시간 설정
            </Text>

            <TouchableOpacity
              style={styles.timeModalCloseButton}
              activeOpacity={0.75}
              onPress={closeTimePicker}
            >
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.timeModalPlaceName} numberOfLines={1}>
            {editingTimePlace?.placeName ?? "장소"}
          </Text>

          <View style={styles.timeTargetTabs}>
            <TouchableOpacity
              style={[
                styles.timeTargetTab,
                timePickerTarget === "visitTime" &&
                  styles.timeTargetTabActive,
              ]}
              activeOpacity={0.8}
              onPress={() => handleSwitchTimeTarget("visitTime")}
            >
              <Text
                style={[
                  styles.timeTargetTabText,
                  timePickerTarget === "visitTime" &&
                    styles.timeTargetTabTextActive,
                ]}
              >
                시작 시간
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.timeTargetTab,
                timePickerTarget === "endTime" &&
                  styles.timeTargetTabActive,
              ]}
              activeOpacity={0.8}
              onPress={() => handleSwitchTimeTarget("endTime")}
            >
              <Text
                style={[
                  styles.timeTargetTabText,
                  timePickerTarget === "endTime" &&
                    styles.timeTargetTabTextActive,
                ]}
              >
                종료 시간
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timePickerPreview}>
            <Text style={styles.timePickerPreviewLabel}>
              {timePickerTarget === "visitTime" ? "시작" : "종료"}
            </Text>

            <Text style={styles.timePickerPreviewText}>
              {`${padTimeUnit(timePickerHour)}:${padTimeUnit(
                timePickerMinute,
              )}`}
            </Text>

            <Text style={styles.timePickerPreviewHelpText}>
              24시간 기준
            </Text>
          </View>

          <View style={styles.timePickerControls}>
            <View style={styles.timePickerColumn}>
              <TouchableOpacity
                style={styles.timePickerArrow}
                activeOpacity={0.75}
                onPress={decreaseHour}
              >
                <Ionicons name="chevron-up" size={22} color="#64748B" />
              </TouchableOpacity>

              <View style={styles.timePickerValueBox}>
                <Text style={styles.timePickerValueText}>
                  {padTimeUnit(timePickerHour)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.timePickerArrow}
                activeOpacity={0.75}
                onPress={increaseHour}
              >
                <Ionicons name="chevron-down" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.timePickerColon}>:</Text>

            <View style={styles.timePickerColumn}>
              <TouchableOpacity
                style={styles.timePickerArrow}
                activeOpacity={0.75}
                onPress={decreaseMinute}
              >
                <Ionicons name="chevron-up" size={22} color="#64748B" />
              </TouchableOpacity>

              <View style={styles.timePickerValueBox}>
                <Text style={styles.timePickerValueText}>
                  {padTimeUnit(timePickerMinute)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.timePickerArrow}
                activeOpacity={0.75}
                onPress={increaseMinute}
              >
                <Ionicons name="chevron-down" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.timeModalButtonRow}>
            <TouchableOpacity
              style={styles.timeModalCancelButton}
              activeOpacity={0.85}
              onPress={closeTimePicker}
            >
              <Text style={styles.timeModalCancelText}>
                취소
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.timeModalSaveButton}
              activeOpacity={0.85}
              onPress={handleSaveTimePicker}
            >
              <Text style={styles.timeModalSaveText}>
                저장
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
