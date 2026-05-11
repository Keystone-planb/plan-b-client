import React from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
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

  editingPlaceId: string | null;
  editingPlaceName: string;
  editingPlaceVisitTime: string;
  editingPlaceEndTime: string;

  onStartEditPlace: (place: PlaceItem) => void;
  onCancelEditPlace: () => void;
  onSaveEditPlace: () => void;
  onDeletePlace: (placeId: string) => void;
  onChangeEditingPlaceName: (value: string) => void;
  onChangeEditingPlaceVisitTime: (value: string) => void;
  onChangeEditingPlaceEndTime: (value: string) => void;

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

  editingPlaceId,
  editingPlaceName,
  editingPlaceVisitTime,
  editingPlaceEndTime,

  onStartEditPlace,
  onCancelEditPlace,
  onSaveEditPlace,
  onDeletePlace,
  onChangeEditingPlaceName,
  onChangeEditingPlaceVisitTime,
  onChangeEditingPlaceEndTime,

  onChangeMemoDraft,
  onAddMemo,
  onClearMemo,
  onStartEditMemo,
  onCancelEditMemo,
  onSaveEditMemo,
  onDeleteMemo,
  onChangeEditingMemoText,
}: Props) {
  const isEditingPlace = editingPlaceId === place.id;

  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineLeft}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{index + 1}</Text>
        </View>

        <View style={styles.timelineLine} />
      </View>

      <View style={styles.placeCard}>
        {isEditingPlace ? (
          <View style={styles.placeEditBox}>
            <Text style={styles.editLabel}>장소명</Text>

            <TextInput
              value={editingPlaceName}
              onChangeText={onChangeEditingPlaceName}
              placeholder="장소명을 입력하세요"
              placeholderTextColor="#8C9BB1"
              style={styles.placeEditInput}
            />

            <View style={styles.timeEditRow}>
              <View style={styles.timeEditColumn}>
                <Text style={[styles.editLabel, styles.timeEditLabel]}>
                  시작 시간
                </Text>

                <TextInput
                  value={editingPlaceVisitTime}
                  onChangeText={onChangeEditingPlaceVisitTime}
                  placeholder="10:00 AM"
                  placeholderTextColor="#8C9BB1"
                  style={styles.placeEditInput}
                />
              </View>

              <View style={styles.timeEditColumn}>
                <Text style={[styles.editLabel, styles.timeEditLabel]}>
                  종료 시간
                </Text>

                <TextInput
                  value={editingPlaceEndTime}
                  onChangeText={onChangeEditingPlaceEndTime}
                  placeholder="11:00 AM"
                  placeholderTextColor="#8C9BB1"
                  style={styles.placeEditInput}
                />
              </View>
            </View>

            <View style={styles.placeEditButtonRow}>
              <TouchableOpacity
                style={styles.placeEditSaveButton}
                activeOpacity={0.85}
                onPress={onSaveEditPlace}
              >
                <Text style={styles.placeEditSaveText}>저장</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.placeEditCancelButton}
                activeOpacity={0.85}
                onPress={onCancelEditPlace}
              >
                <Text style={styles.placeEditCancelText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.placeDeleteButton}
                activeOpacity={0.85}
                onPress={() => {
                  Alert.alert(
                    "장소 삭제",
                    "이 장소와 연결된 메모가 함께 삭제됩니다. 삭제할까요?",
                    [
                      {
                        text: "취소",
                        style: "cancel",
                      },
                      {
                        text: "삭제",
                        style: "destructive",
                        onPress: () => onDeletePlace(place.id),
                      },
                    ],
                  );
                }}
              >
                <Ionicons name="trash-outline" size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.placeHeader}
              activeOpacity={0.85}
              onPress={() => onStartEditPlace(place)}
            >
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
                  <Ionicons name="trash-outline" size={15} color="#EF4444" />
                </TouchableOpacity>

                <View style={styles.placeActionBadge}>
                  <Ionicons name="create-outline" size={14} color="#2158E8" />
                  <Text style={styles.placeActionText}>수정</Text>
                </View>
              </View>
            </TouchableOpacity>

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
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  timelineLeft: {
    width: 30,
    alignItems: "center",
    marginRight: 14,
  },

  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
  },

  stepBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 204,
    marginTop: 4,
    backgroundColor: "#DCEBFF",
  },

  placeCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E1E7EF",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
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
  },

  placeTitle: {
    color: "#252D3C",
    fontSize: 15,
    fontWeight: "900",
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
    gap: 6,
  },

  placeDeleteIconButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  placeActionBadge: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: "#EAF3FF",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  placeActionText: {
    color: "#2158E8",
    fontSize: 11,
    fontWeight: "900",
  },

  placeEditBox: {
    gap: 8,
  },

  editLabel: {
    color: "#627187",
    fontSize: 11,
    fontWeight: "900",
  },

  timeEditLabel: {
    marginTop: 4,
  },

  timeEditRow: {
    flexDirection: "row",
    gap: 8,
  },

  timeEditColumn: {
    flex: 1,
  },

  placeEditInput: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#9FC8FF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    color: "#1C2534",
    fontSize: 12,
    fontWeight: "700",
  },

  placeEditButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },

  placeEditSaveButton: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
  },

  placeEditSaveText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  placeEditCancelButton: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  placeEditCancelText: {
    color: "#2158E8",
    fontSize: 12,
    fontWeight: "900",
  },

  placeDeleteButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
});
