import React from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { MemoItem, PlaceItem } from "../../types/planA";
import PlanAMemoList from "./PlanAMemoList";

type EditingMemoState = {
  placeId: string;
  memoId: string;
} | null;

type Props = {
  place: PlaceItem;
  index: number;

  memoDraft: string;
  editingMemo: EditingMemoState;
  editingMemoText: string;


  onDeletePlace: (placeId: string) => void;
  onQuickEditTime: (place: PlaceItem) => void;

  onChangeMemoDraft: (placeId: string, value: string) => void;
  onAddMemo: (placeId: string) => void;
  onClearMemo: (placeId: string) => void;
  onStartEditMemo: (placeId: string, item: MemoItem) => void;
  onCancelEditMemo: () => void;
  onSaveEditMemo: () => void;
  onDeleteMemo: (placeId: string, memoId: string) => void;
  onChangeEditingMemoText: (value: string) => void;
};

const makeDisplayTime = (place: PlaceItem) => {
  const visitTime = place.visitTime?.trim();
  const endTime = place.endTime?.trim();

  if (visitTime && endTime) return `${visitTime} - ${endTime}`;
  if (visitTime) return visitTime;
  if (endTime) return endTime;
  if (place.time?.trim()) return place.time;

  return "시간을 설정해주세요";
};

export default function PlanAPlaceCard({
  place,
  index,

  memoDraft,
  editingMemo,
  editingMemoText,


  onDeletePlace,
  onQuickEditTime,

  onChangeMemoDraft,
  onAddMemo,
  onClearMemo,
  onStartEditMemo,
  onCancelEditMemo,
  onSaveEditMemo,
  onDeleteMemo,
  onChangeEditingMemoText,
}: Props) {

  return (
    <View style={styles.placeCard}>
      <View style={styles.placeHeader}>
        <View style={styles.placeTitleBox}>
          <Text style={styles.placeTitle}>{place.name}</Text>
          <Text style={styles.placeTime}>{makeDisplayTime(place)}</Text>
        </View>

        <View style={styles.placeHeaderActions}>
          <TouchableOpacity
            style={styles.placeDeleteIconButton}
            activeOpacity={0.85}
            onPress={(event) => {
              event.stopPropagation();

              Alert.alert(
                "장소 삭제",
                "이 장소와 연결된 메모가 함께 삭제됩니다. 삭제할까요?",
                [
                  { text: "취소", style: "cancel" },
                  {
                    text: "삭제",
                    style: "destructive",
                    onPress: () => onDeletePlace(place.id),
                  },
                ],
              );
            }}
          >
            <Ionicons name="close" size={15} color="#EF4444" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.placeTimeEditIconButton}
            activeOpacity={0.85}
            onPress={(event) => {
              event.stopPropagation();
              onQuickEditTime(place);
            }}
          >
            <Ionicons name="time-outline" size={15} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>

      <PlanAMemoList
        place={place}
        memoDraft={memoDraft}
        editingMemo={editingMemo}
        editingMemoText={editingMemoText}
        onChangeMemoDraft={onChangeMemoDraft}
        onAddMemo={onAddMemo}
        onClearMemo={onClearMemo}
        onStartEditMemo={onStartEditMemo}
        onCancelEditMemo={onCancelEditMemo}
        onSaveEditMemo={onSaveEditMemo}
        onDeleteMemo={onDeleteMemo}
        onChangeEditingMemoText={onChangeEditingMemoText}
      />
    </View>
  );
}

const styles = StyleSheet.create({

  placeCard: {
    flex: 1,
    minHeight: 132,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E1E7EF",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },

  placeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  placeTitleBox: {
    flex: 1,
    minWidth: 0,
  },

  placeTitle: {
    color: "#252D3C",
    fontSize: 15,
    fontWeight: "900",
    flexShrink: 1,
  },

  placeTime: {
    marginTop: 7,
    color: "#627187",
    fontSize: 12,
    fontWeight: "600",
  },

  placeHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  placeDeleteIconButton: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  placeTimeEditIconButton: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },













});
