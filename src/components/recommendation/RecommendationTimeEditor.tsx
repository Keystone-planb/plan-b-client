import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import VisitTimePickerPanel from "../common/VisitTimePickerPanel";

type Props = {
  visible: boolean;
  visitTime: string;
  endTime: string;
  onChangeVisitTime: (value: string) => void;
  onChangeEndTime: (value: string) => void;
  onClose: () => void;
  onApply: () => void;
};

export default function RecommendationTimeEditor({
  visible,
  visitTime,
  endTime,
  onChangeVisitTime,
  onChangeEndTime,
  onClose,
  onApply,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>방문 시간 변경</Text>

          <VisitTimePickerPanel
            visitTime={visitTime}
            endTime={endTime}
            onChangeVisitTime={onChangeVisitTime}
            onChangeEndTime={onChangeEndTime}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.8}
              onPress={onClose}
            >
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyButton}
              activeOpacity={0.85}
              onPress={onApply}
            >
              <Text style={styles.applyText}>적용</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 18,
  },

  title: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 14,
    textAlign: "center",
  },

  buttonRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10,
  },

  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "900",
  },

  applyButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
  },

  applyText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});
