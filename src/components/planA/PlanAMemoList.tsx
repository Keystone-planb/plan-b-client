import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { MemoItem, PlaceItem } from "../../types/planA";

type EditingMemoState = {
  placeId: string;
  memoId: string;
} | null;

type Props = {
  place: PlaceItem;
  memoDraft: string;
  editingMemo: EditingMemoState;
  editingMemoText: string;
  onChangeMemoDraft: (placeId: string, value: string) => void;
  onAddMemo: (placeId: string) => void;
  onClearMemo: (placeId: string) => void;
  onStartEditMemo: (placeId: string, item: MemoItem) => void;
  onCancelEditMemo: () => void;
  onSaveEditMemo: () => void;
  onDeleteMemo: (placeId: string, memoId: string) => void;
  onChangeEditingMemoText: (value: string) => void;
  onOpenMemoSheet: (placeId: string) => void;
  onOpenMemoEditor: (placeId: string) => void;
};

export default function PlanAMemoList({
  place,
  onOpenMemoSheet,
  onOpenMemoEditor,
}: Props) {
  const memoCount = place.memos?.length ?? 0;
  const hasMemo = memoCount > 0;

  return (
    <View style={styles.memoList}>
      <View
        style={[
          styles.memoSummaryRow,
          hasMemo && styles.memoSummaryRowActive,
        ]}
      >
        <TouchableOpacity
          style={styles.memoSummaryTouch}
          activeOpacity={0.85}
          onPress={() => onOpenMemoSheet(place.id)}
        >
          <View style={styles.memoSummaryLeft}>
            <Ionicons
              name={hasMemo ? "document-text" : "document-text-outline"}
              size={15}
              color={hasMemo ? "#2158E8" : "#94A3B8"}
            />

            <Text
              style={[
                styles.memoSummaryText,
                hasMemo && styles.memoSummaryTextActive,
              ]}
              numberOfLines={1}
            >
              {hasMemo ? `메모가 ${memoCount}개 있어요` : "메모를 추가해볼까요?"}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.memoAddCircle}
          activeOpacity={0.85}
          onPress={() => onOpenMemoEditor(place.id)}
        >
          <Ionicons name="add" size={17} color="#2158E8" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  memoList: {
    marginTop: 14,
  },

  memoSummaryRow: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DDE6F2",
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 12,
    paddingRight: 8,
  },

  memoSummaryRowActive: {
    borderColor: "#D5E5FF",
    backgroundColor: "#F8FBFF",
  },

  memoSummaryTouch: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  memoSummaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    flex: 1,
  },

  memoSummaryText: {
    flexShrink: 1,
    marginLeft: 8,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "800",
  },

  memoSummaryTextActive: {
    color: "#2158E8",
  },

  memoAddCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#BFD7FF",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
});
