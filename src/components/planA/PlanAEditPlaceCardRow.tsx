// src/components/planA/PlanAEditPlaceCardRow.tsx

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import PlanAPlaceCard from "./PlanAPlaceCard";
import type { MemoItem, PlaceItem } from "../../types/planA";
import { getTransportLabel } from "../../utils/planA/planAScreenUtils";

type TransportMode = "WALK" | "TRANSIT" | "CAR";

type TransportOption = {
  key: TransportMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type Props = {
  place: PlaceItem;
  index: number;
  isLast: boolean;
  nextPlace?: PlaceItem;
  pairKey: string;
  selectedTransportMode: TransportMode | null;
  activeTransportPairKey?: string | null;
  selectedEditTransportMode?: TransportMode;
  transportOptions: TransportOption[];

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

  onOpenTransportPicker: (params: {
    pairKey: string;
    beforePlaceName?: string;
    afterPlaceName?: string;
  }) => void;
  onSelectTransportMode: (mode: TransportMode) => void;
  onConfirmTransportMode: () => void;
};

export default function PlanAEditPlaceCardRow({
  place,
  index,
  isLast,
  nextPlace,
  pairKey,
  selectedTransportMode,
  activeTransportPairKey,
  selectedEditTransportMode,
  transportOptions,
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
  onOpenTransportPicker,
  onSelectTransportMode,
  onConfirmTransportMode,
}: Props) {
  const selectedTransportLabel =
    selectedTransportMode ? getTransportLabel(selectedTransportMode) : null;
  const isTransportPickerOpen = activeTransportPairKey === pairKey;

  return (
    <View style={styles.editTimelineGroup}>
      <View style={styles.editPlaceRow}>
        <View style={styles.editSidebarColumn}>
          <View style={styles.editBlueDot} />
          {!isLast ? <View style={styles.editBlueLine} /> : null}
        </View>

        <View style={styles.editPlaceCardContent}>
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
          />
        </View>
      </View>

      {!isLast ? (
        <View style={styles.editTransportRow}>
          <View style={styles.editTransportIconColumn}>
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

          <View style={styles.editTransportAxisColumn}>
            <View style={styles.editTransportLineCover} />
            <View style={styles.editTransportDashedLine} />
          </View>

          <View
            style={[
              styles.editTransportCard,
              !selectedTransportLabel ? styles.editTransportCardWarning : null,
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.editTransportHeader}
              onPress={() =>
                onOpenTransportPicker({
                  pairKey,
                  beforePlaceName: place.name,
                  afterPlaceName: nextPlace?.name,
                })
              }
            >
              <View style={styles.editTransportTextGroup}>
                <Text
                  style={[
                    styles.editTransportTitle,
                    !selectedTransportLabel
                      ? styles.editTransportTitleWarning
                      : null,
                  ]}
                >
                  {selectedTransportLabel
                    ? `${selectedTransportLabel}(으)로 이동`
                    : "⚠ 이동수단을 선택해주세요"}
                </Text>

                <Text
                  style={[
                    styles.editTransportDescription,
                    !selectedTransportLabel
                      ? styles.editTransportDescriptionWarning
                      : null,
                  ]}
                >
                  {selectedTransportLabel
                    ? `${place.endTime ?? place.visitTime ?? ""} - ${
                        nextPlace?.visitTime ?? ""
                      }`
                    : `${place.name ?? "장소"} → ${nextPlace?.name ?? "장소"}`}
                </Text>
              </View>

              <Ionicons
                name={isTransportPickerOpen ? "chevron-up" : "chevron-down"}
                size={17}
                color="#CBD5E1"
              />
            </TouchableOpacity>

            {isTransportPickerOpen ? (
              <View style={styles.editTransportPickerBody}>
                <View style={styles.editTransportOptionRow}>
                  {transportOptions.map((option) => {
                    const selected = selectedEditTransportMode === option.key;

                    return (
                      <TouchableOpacity
                        key={option.key}
                        activeOpacity={0.85}
                        style={[
                          styles.editTransportOptionButton,
                          selected
                            ? styles.editTransportOptionButtonActive
                            : null,
                        ]}
                        onPress={() => onSelectTransportMode(option.key)}
                      >
                        <Ionicons
                          name={option.icon}
                          size={15}
                          color={selected ? "#FFFFFF" : "#64748B"}
                        />

                        <Text
                          style={[
                            styles.editTransportOptionText,
                            selected
                              ? styles.editTransportOptionTextActive
                              : null,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.editTransportConfirmButton}
                  onPress={onConfirmTransportMode}
                >
                  <Text style={styles.editTransportConfirmText}>확인</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  editTimelineGroup: {
    width: "100%",
  },
  editPlaceRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  editSidebarColumn: {
    width: 34,
    alignItems: "center",
    position: "relative",
    marginRight: 10,
  },
  editBlueDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
    marginTop: 18,
    zIndex: 3,
  },
  editBlueLine: {
    width: 2,
    flex: 1,
    minHeight: 96,
    backgroundColor: "#2563EB",
    marginTop: 4,
  },
  editPlaceCardContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 2,
  },
  editTransportRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: -2,
    marginBottom: 18,
  },
  editTransportIconColumn: {
    width: 34,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  editTransportAxisColumn: {
    width: 34,
    alignItems: "center",
    position: "relative",
    marginLeft: -44,
    marginRight: 10,
  },
  editTransportLineCover: {
    position: "absolute",
    top: -10,
    bottom: -10,
    width: 18,
    backgroundColor: "#FFFFFF",
    zIndex: 1,
  },
  editTransportDashedLine: {
    flex: 1,
    minHeight: 70,
    borderLeftWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    zIndex: 2,
  },
  editTransportCard: {
    flex: 1,
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
  },
  editTransportCardWarning: {
    borderWidth: 1.5,
    borderColor: "#F59E0B",
    backgroundColor: "#FFF7ED",
  },
  editTransportHeader: {
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editTransportTextGroup: {
    flex: 1,
    paddingRight: 10,
  },
  editTransportTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
  },
  editTransportTitleWarning: {
    color: "#D97706",
  },
  editTransportDescription: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
  },
  editTransportDescriptionWarning: {
    color: "#92400E",
  },
  editTransportPickerBody: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  editTransportOptionRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 10,
  },
  editTransportOptionButton: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D9E2F2",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  editTransportOptionButtonActive: {
    borderColor: "#64748B",
    backgroundColor: "#64748B",
  },
  editTransportOptionText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
  },
  editTransportOptionTextActive: {
    color: "#FFFFFF",
  },
  editTransportConfirmButton: {
    height: 38,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  editTransportConfirmText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
