// src/components/planA/PlanAViewPlaceCardRow.tsx

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import PlanAPlaceCard from "./PlanAPlaceCard";
import type { MemoItem, PlaceItem } from "../../types/planA";
import {
  getPlaceDisplayTime,
  getTransportLabel,
} from "../../utils/planA/planAScreenUtils";

type TransportMode = "WALK" | "TRANSIT" | "CAR";

type Props = {
  place: PlaceItem;
  index: number;
  isLast: boolean;
  nextPlace?: PlaceItem;
  selectedTransportMode: TransportMode | null;
  memoDraft: string;
  editingMemo: { placeId: string; memoId: string } | null;
  editingMemoText: string;
  onDeletePlace: (placeId: string) => void;
  onQuickEditTime: (place: PlaceItem) => void;
  onChangeMemoDraft: (placeId: string, value: string) => void;
  onAddMemo: (placeId: string) => void;
  onClearMemo: (placeId: string) => void;
  onStartEditMemo: (placeId: string, memo: MemoItem) => void;
  onCancelEditMemo: () => void;
  onSaveEditMemo: () => void;
  onDeleteMemo: (placeId: string, memoId: string) => void;
  onChangeEditingMemoText: (value: string) => void;
  onOpenMemoSheet: (placeId: string) => void;
  onOpenMemoEditor: (placeId: string) => void;
};

export default function PlanAViewPlaceCardRow({
  place,
  index,
  isLast,
  nextPlace,
  selectedTransportMode,
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
  onOpenMemoSheet,
  onOpenMemoEditor,
}: Props) {
  const selectedTransportLabel =
    selectedTransportMode ? getTransportLabel(selectedTransportMode) : null;

  return (
    <View style={styles.viewTimelineGroup}>
      <View style={styles.viewPlaceRow}>
        <View style={styles.viewSidebarColumn}>
          <View style={styles.viewBlueDot} />
          {!isLast ? <View style={styles.viewBlueLine} /> : null}
        </View>

        <View style={styles.viewPlaceCardContent}>
          <PlanAPlaceCard
            place={place}
            index={index}
            memoDraft={memoDraft}
            editingMemo={editingMemo}
            editingMemoText={editingMemoText}
            onDeletePlace={onDeletePlace}
            onQuickEditTime={onQuickEditTime}
            onChangeMemoDraft={onChangeMemoDraft}
            onAddMemo={onAddMemo}
            onClearMemo={onClearMemo}
            onStartEditMemo={onStartEditMemo}
            onCancelEditMemo={onCancelEditMemo}
            onSaveEditMemo={onSaveEditMemo}
            onDeleteMemo={onDeleteMemo}
            onChangeEditingMemoText={onChangeEditingMemoText}
            onOpenMemoSheet={onOpenMemoSheet}
        onOpenMemoEditor={onOpenMemoEditor}
          />
        </View>
      </View>

      {!isLast ? (
        <View style={styles.viewTransportRow}>
          <View style={styles.viewTransportIconColumn}>
            <Ionicons
              name={
                selectedTransportMode === "TRANSIT"
                  ? "train-outline"
                  : selectedTransportMode === "CAR"
                    ? "car-outline"
                    : "walk-outline"
              }
              size={15}
              color="#94A3B8"
            />
          </View>

          <View style={styles.viewTransportAxisColumn}>
            <View style={styles.viewTransportLineCover} />
            <View style={styles.viewTransportDashedLine} />
          </View>

          <View style={styles.viewTransportCard}>
            <View style={styles.viewTransportHeader}>
              <View style={styles.viewTransportTextGroup}>
                <Text style={styles.viewTransportTitle}>
                  {selectedTransportLabel
                    ? `${selectedTransportLabel}(으)로 이동`
                    : "이동수단 미설정"}
                </Text>

                <Text style={styles.viewTransportDescription}>
                  {selectedTransportLabel
                    ? `${place.endTime ?? place.visitTime ?? ""} - ${
                        nextPlace?.visitTime ?? ""
                      }`
                    : "수정 화면에서 이동수단을 설정할 수 있어요"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  viewTimelineGroup: {
    width: "100%",
  },
  viewPlaceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  viewSidebarColumn: {
    width: 26,
    alignItems: "center",
  },
  viewBlueDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#2563EB",
    marginTop: 26,
    zIndex: 3,
  },
  viewBlueLine: {
    width: 2,
    flex: 1,
    minHeight: 88,
    backgroundColor: "#2563EB",
    marginTop: 4,
  },
  viewPlaceCardContent: {
    flex: 1,
    minWidth: 0,
  },
  viewTransportRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: -2,
    marginBottom: 18,
  },
  viewTransportIconColumn: {
    width: 34,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  viewTransportAxisColumn: {
    width: 34,
    alignItems: "center",
    position: "relative",
    marginLeft: -44,
    marginRight: 10,
  },
  viewTransportLineCover: {
    position: "absolute",
    top: -10,
    bottom: -10,
    width: 18,
    backgroundColor: "#FFFFFF",
    zIndex: 1,
  },
  viewTransportDashedLine: {
    flex: 1,
    minHeight: 70,
    borderLeftWidth: 2,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    zIndex: 2,
  },
  viewTransportCard: {
    flex: 1,
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
  },
  viewTransportHeader: {
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: "center",
  },
  viewTransportTextGroup: {
    flex: 1,
    paddingRight: 10,
  },
  viewTransportTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
  },
  viewTransportDescription: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
  },
});
