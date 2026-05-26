import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  place: any;
  index: number;
  focused: boolean;
  isCurrentTripOngoing: boolean;
  hasServerPlanId: boolean;
  displayPlace: any;
  styles: any;
  getPlaceDisplayTime: (place: any) => string;
  handleAlternative: (place: any) => void;
};

const getMemoText = (memo: any) => {
  return String(memo?.text ?? memo?.content ?? memo?.memo ?? "").trim();
};

export default function OngoingPlaceCard({
  place,
  index,
  focused,
  isCurrentTripOngoing,
  hasServerPlanId,
  displayPlace,
  styles,
  getPlaceDisplayTime,
  handleAlternative,
}: Props) {
  const [memoExpanded, setMemoExpanded] = useState(false);

  const visibleMemos = Array.isArray(place.memos)
    ? place.memos.map(getMemoText).filter(Boolean)
    : [];

  const shownMemos = visibleMemos.slice(0, 3);
  const hiddenCount = Math.max(visibleMemos.length - shownMemos.length, 0);

  return (
    <View
      style={[
        styles.todayCard,
        !isCurrentTripOngoing && styles.futureTodayCard,
        focused && styles.todayCardActive,
      ]}
    >
      <View style={styles.placeTopRow}>
        <View style={styles.numberCircle}>
          <Text style={styles.numberText}>{index + 1}</Text>
        </View>

        <View style={styles.placeInfo}>
          <Text style={styles.placeName} numberOfLines={1}>
            {place.name || "이름 없는 장소"}
          </Text>

          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={15} color="#94A3B8" />
            <Text style={styles.timeText}>
              {getPlaceDisplayTime(displayPlace)}
            </Text>
          </View>
        </View>

        {isCurrentTripOngoing ?
          <TouchableOpacity
            style={[
              styles.alternativeButton,
              !hasServerPlanId && styles.disabledAlternativeButton,
            ]}
            activeOpacity={0.85}
            onPress={() => handleAlternative(place)}
          >
            <Text style={styles.alternativeButtonText}>대안찾기</Text>
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        : null}
      </View>

      {visibleMemos.length > 0 ? (
        <View style={localStyles.memoArea}>
          <TouchableOpacity
            style={localStyles.memoSummaryPill}
            activeOpacity={0.8}
            onPress={() => setMemoExpanded((prev) => !prev)}
          >
            <Ionicons
              name="chatbox-ellipses-outline"
              size={13}
              color="#94A3B8"
            />

            <Text style={localStyles.memoSummaryText}>
              메모 {visibleMemos.length}개
            </Text>

            <Ionicons
              name={memoExpanded ? "chevron-up" : "chevron-down"}
              size={13}
              color="#94A3B8"
            />
          </TouchableOpacity>

          {memoExpanded ? (
            <View style={localStyles.memoPanel}>
              {shownMemos.map((memo, memoIndex) => (
                <View
                  key={`${String(place.id ?? index)}-memo-${memoIndex}`}
                  style={localStyles.memoRow}
                >
                  <Text style={localStyles.memoBullet}>•</Text>
                  <Text style={localStyles.memoText} numberOfLines={2}>
                    {memo}
                  </Text>
                </View>
              ))}

              {hiddenCount > 0 ? (
                <Text style={localStyles.moreMemoText}>외 {hiddenCount}개</Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const localStyles = StyleSheet.create({
  memoArea: {
    marginLeft: 62,
    marginTop: 10,
    alignSelf: "stretch",
  },
  memoSummaryPill: {
    alignSelf: "flex-start",
    minHeight: 28,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memoSummaryText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
  },
  memoPanel: {
    marginTop: 7,
    marginRight: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 6,
  },
  memoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  memoBullet: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900",
  },
  memoText: {
    flex: 1,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 17,
  },
  moreMemoText: {
    marginTop: 2,
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "800",
  },
});
