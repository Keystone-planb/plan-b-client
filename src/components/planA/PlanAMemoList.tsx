import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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
};

export default function PlanAMemoList({
  place,
  memoDraft,
  editingMemo,
  editingMemoText,
  onChangeMemoDraft,
  onAddMemo,
  onClearMemo,
  onStartEditMemo,
  onCancelEditMemo,
  onSaveEditMemo,
  onDeleteMemo,
  onChangeEditingMemoText,
}: Props) {
  const hasMemoText = memoDraft.trim().length > 0;
  const hasEditingText = editingMemoText.trim().length > 0;
  const isAnyMemoEditing = Boolean(editingMemo);

  return (
    <View style={styles.memoList}>
      {place.memos.map((item) => {
        const isEditing =
          editingMemo?.placeId === place.id && editingMemo.memoId === item.id;

        if (isEditing) {
          return (
            <View key={item.id} style={styles.memoEditItem}>
              <TextInput
                value={editingMemoText}
                onChangeText={onChangeEditingMemoText}
                style={styles.memoEditInput}
                placeholder="메모를 수정하세요"
                placeholderTextColor="#8C9BB1"
                autoFocus
              />

              <TouchableOpacity
                style={[
                  styles.memoEditSaveButton,
                  !hasEditingText && styles.memoButtonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={onSaveEditMemo}
                disabled={!hasEditingText}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.memoEditCancelButton}
                activeOpacity={0.85}
                onPress={onCancelEditMemo}
              >
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.memoItem}
            activeOpacity={0.85}
            onPress={() => onStartEditMemo(place.id, item)}
          >
            <Ionicons name="document-text-outline" size={14} color="#8C9BB1" />

            <Text style={styles.memoItemText} numberOfLines={1}>
              {item.text}
            </Text>

            <TouchableOpacity
              style={styles.memoDeleteButton}
              activeOpacity={0.8}
              onPress={() => onDeleteMemo(place.id, item.id)}
            >
              <Ionicons name="trash-outline" size={14} color="#94A3B8" />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      })}

      {!isAnyMemoEditing ?
        <View style={styles.memoInputRow}>
          <TextInput
            value={memoDraft}
            onChangeText={(value) => onChangeMemoDraft(place.id, value)}
            placeholder="메모를 입력하세요"
            placeholderTextColor="#8C9BB1"
            style={styles.memoInput}
          />

          <TouchableOpacity
            style={[
              styles.memoConfirmButton,
              hasMemoText && styles.memoConfirmButtonActive,
              !hasMemoText && styles.memoButtonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={() => onAddMemo(place.id)}
            disabled={!hasMemoText}
          >
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.memoCancelButton}
            activeOpacity={0.85}
            onPress={() => onClearMemo(place.id)}
          >
            <Ionicons name="close" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      : null}
    </View>
  );
}

const styles = StyleSheet.create({
  memoList: {
    marginTop: 14,
    gap: 8,
  },

  memoItem: {
    minHeight: 34,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E1E7EF",
    backgroundColor: "#F8FBFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
  },

  memoItemText: {
    flex: 1,
    marginLeft: 6,
    color: "#627187",
    fontSize: 11,
    fontWeight: "600",
  },

  memoDeleteButton: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },

  memoEditItem: {
    minHeight: 34,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#9FC8FF",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 6,
  },

  memoEditInput: {
    flex: 1,
    height: 34,
    paddingVertical: 0,
    paddingHorizontal: 6,
    color: "#1C2534",
    fontSize: 11,
    fontWeight: "700",
  },

  memoEditSaveButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
  },

  memoEditCancelButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#B8C4D4",
    alignItems: "center",
    justifyContent: "center",
  },

  memoInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  memoInput: {
    flex: 1,
    height: 34,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#9FC8FF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    fontSize: 11,
    color: "#1C2534",
  },

  memoConfirmButton: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: "#8DBEFF",
    alignItems: "center",
    justifyContent: "center",
  },

  memoConfirmButtonActive: {
    backgroundColor: "#2158E8",
  },

  memoButtonDisabled: {
    opacity: 0.45,
  },

  memoCancelButton: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: "#B8C4D4",
    alignItems: "center",
    justifyContent: "center",
  },
});
