import React, { forwardRef, useState } from "react";
import { Image, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getPlaceCategoryIcon } from "../../utils/placeCategoryIcon";

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
  onPress?: () => void;
};

const getMemoText = (memo: any) => {
  return String(memo?.text ?? memo?.content ?? memo?.memo ?? "").trim();
};

const OngoingPlaceCard = forwardRef<View, Props>(function OngoingPlaceCard(
  {
    place,
    index,
    focused,
    isCurrentTripOngoing,
    hasServerPlanId,
    displayPlace,
    styles,
    getPlaceDisplayTime,
    handleAlternative,
    onPress,
  },
  ref,
) {
  const [memoExpanded, setMemoExpanded] = useState(false);

  const visibleMemos = Array.isArray(place.memos)
    ? place.memos.map(getMemoText).filter(Boolean)
    : [];

  const shownMemos = visibleMemos.slice(0, 3);
  const hiddenCount = Math.max(visibleMemos.length - shownMemos.length, 0);

  return (
    <TouchableOpacity
      ref={ref as any}
      activeOpacity={0.86}
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.todayCard,
        !isCurrentTripOngoing && styles.futureTodayCard,
        focused && styles.todayCardActive,
        localStyles.placeCard,
        focused && localStyles.placeCardActive,
      ]}
    >
      <View style={styles.placeTopRow}>


        <View style={localStyles.contentArea}>
          <View style={localStyles.topContentRow}>
            <View style={styles.placeInfo}>
              <View style={localStyles.placeNameRow}>
                <View style={localStyles.categoryIconBox}>
                  <Image
                    source={getPlaceCategoryIcon(
                      place.category ?? place.type ?? place.placeType,
                    )}
                    style={localStyles.categoryIcon}
                    resizeMode="contain"
                  />
                </View>

                <Text
                  style={[styles.placeName, localStyles.placeNameWithIcon]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {place.name || "이름 없는 장소"}
                </Text>
              </View>

              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={15} color="#94A3B8" />
                <Text style={styles.timeText}>
                  {getPlaceDisplayTime(displayPlace)}
                </Text>
              </View>
            </View>

            {isCurrentTripOngoing ? (
              <TouchableOpacity
                style={[
                  styles.alternativeButton,
                  localStyles.compactAlternativeButton,
                  !hasServerPlanId && styles.disabledAlternativeButton,
                ]}
                activeOpacity={0.85}
                onPress={() => handleAlternative(place)}
              >
                <Text
                  style={[
                    styles.alternativeButtonText,
                    localStyles.compactAlternativeButtonText,
                  ]}
                >
                  대안찾기
                </Text>
                <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
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
                  {shownMemos.map((memo: string, memoIndex: number) => (
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
                    <Text style={localStyles.moreMemoText}>
                      외 {hiddenCount}개
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default OngoingPlaceCard;

const localStyles = StyleSheet.create({
  placeCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginRight: 18,
    marginBottom: 0,

    shadowColor: "#0F172A",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 3,
  },

  placeCardActive: {
    borderColor: "#2563EB",
  },

  contentArea: {
    flex: 1,
    minWidth: 0,
    marginLeft: 0,
  },

  topContentRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  compactAlternativeButton: {
    minWidth: 96,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 16,
    flexShrink: 0,
  },

  compactAlternativeButtonText: {
    fontSize: 14,
    fontWeight: "900",
  },


  placeNameWithIcon: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    lineHeight: 24,
    fontSize: 17,
  },

  placeNameRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    minWidth: 0,
    paddingRight: 8,
  },

  categoryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F7FF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  categoryIcon: {
    width: 27,
    height: 27,
  },

  memoArea: {
    marginTop: 8,
    alignItems: "flex-start",
  },

  memoSummaryPill: {
    minHeight: 28,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
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
    marginTop: 8,
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
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
