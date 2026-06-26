import React, { forwardRef, useState } from "react";
import { Image, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getPlaceCategoryIcon } from "../../utils/placeCategoryIcon";
import PlanBPlaceName from "../common/PlanBPlaceName";


const getMemoText = (memo: any) => {
  return String(memo?.text ?? memo?.content ?? memo?.memo ?? "").trim();
};

const getVisibleMemoTexts = (place: any) => {
  const memos = Array.isArray(place?.memos) ? place.memos : [];
  return memos.map(getMemoText).filter(Boolean);
};

const getMemoPreviewText = (place: any) => {
  const visibleMemos = getVisibleMemoTexts(place);

  if (visibleMemos.length === 0) return "";

  if (visibleMemos.length === 1) return visibleMemos[0];

  return `${visibleMemos[0]} 외 ${visibleMemos.length - 1}개`;
};

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

const OngoingPlaceCard = forwardRef<View, Props>(function OngoingPlaceCard(
  {
    place,
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
  const [isMemoExpanded, setIsMemoExpanded] = useState(false);
  const visibleMemoTexts = getVisibleMemoTexts(place);
  const memoPreviewText = getMemoPreviewText(place);

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
      <View style={localStyles.cardInner}>
        <View style={localStyles.categoryIconBox}>
          <Image
            source={getPlaceCategoryIcon(
              place.category ?? place.type ?? place.placeType,
            )}
            style={localStyles.categoryIcon}
            resizeMode="contain"
          />
        </View>

        <View style={localStyles.contentArea}>
          <View style={localStyles.titleActionRow}>
            <View style={localStyles.titleTimeBox}>
              <PlanBPlaceName
                name={place.name}
                textStyle={[
                  styles.placeName,
                  localStyles.placeName,
                ]}
                numberOfLines={2}
              />

              <View style={localStyles.timeRow}>
                <Ionicons name="time-outline" size={14} color="#8B95A1" />
                <Text style={localStyles.timeText}>
                  {getPlaceDisplayTime(displayPlace)}
                </Text>
              </View>
            </View>

            {isCurrentTripOngoing ? (
              <TouchableOpacity
                style={[
                  styles.alternativeButton,
                  localStyles.alternativeButton,
                  !hasServerPlanId && styles.disabledAlternativeButton,
                ]}
                activeOpacity={0.85}
                onPress={() => handleAlternative(place)}
              >
                <View
                  style={
                    localStyles.alternativeButtonContent
                  }
                >
                  <Text
                    style={[
                      styles.alternativeButtonText,
                      localStyles.alternativeButtonText,
                    ]}
                  >
                    대안찾기
                  </Text>

                  <Ionicons
                    name="chevron-forward"
                    size={15}
                    color="#FFFFFF"
                    style={
                      localStyles.alternativeButtonIcon
                    }
                  />
                </View>
              </TouchableOpacity>
            ) : null}
          </View>

          {memoPreviewText ? (
            <TouchableOpacity
              style={[
                localStyles.memoPreviewBox,
                isMemoExpanded && localStyles.memoPreviewBoxExpanded,
              ]}
              activeOpacity={0.85}
              onPress={() => setIsMemoExpanded((prev) => !prev)}
            >
              <View style={localStyles.memoPreviewRow}>
                <Ionicons
                  name="document-text-outline"
                  size={13}
                  color="#64748B"
                />
                <Text style={localStyles.memoPreviewText} numberOfLines={1}>
                  {memoPreviewText}
                </Text>
                {visibleMemoTexts.length > 1 ? (
                  <Ionicons
                    name={isMemoExpanded ? "chevron-up" : "chevron-down"}
                    size={12}
                    color="#94A3B8"
                  />
                ) : null}
              </View>

              {isMemoExpanded && visibleMemoTexts.length > 1 ? (
                <View style={localStyles.memoExpandedList}>
                  {visibleMemoTexts.map((memoText: string, memoIndex: number) => (
                    <View
                      key={`${memoText}-${memoIndex}`}
                      style={localStyles.memoExpandedItem}
                    >
                      <View style={localStyles.memoExpandedDot} />
                      <Text
                        style={localStyles.memoExpandedText}
                        numberOfLines={2}
                      >
                        {memoText}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </TouchableOpacity>
          ) : null}
        </View>


      </View>
    </TouchableOpacity>
  );
});

export default OngoingPlaceCard;

const localStyles = StyleSheet.create({
  placeCard: {
    minHeight: 118,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E1E7EF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 18,
    marginBottom: 0,
    shadowColor: "transparent",
    elevation: 0,
  },

  placeCardActive: {
    borderColor: "#2158E8",
  },

  cardInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 0,
  },

  categoryIconBox: {
    width: 66,
    height: 66,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
    marginTop: 0,
    transform: [
      {
        translateY: -2,
      },
    ],
  },

  categoryIcon: {
    width: 66,
    height: 66,
  },

  contentArea: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  titleActionRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  titleTimeBox: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    paddingRight: 4,
  },

  placeName: {
    width: "100%",
    color: "#252D3C",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
    marginBottom: 5,
    textAlign: "left",
    letterSpacing: -0.3,
  },

  timeRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  timeText: {
    color: "#627187",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },

  memoPreviewBox: {
    marginTop: 11,
    borderRadius: 13,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignSelf: "stretch",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  memoPreviewBoxExpanded: {
    paddingBottom: 8,
  },

  memoPreviewRow: {
    minHeight: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  memoPreviewText: {
    flex: 1,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
  },

  memoExpandedList: {
    marginTop: 7,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: "#CBD5E1",
    gap: 0,
  },

  memoExpandedItem: {
    minHeight: 23,
    flexDirection: "row",
    alignItems: "flex-start",
    maxWidth: "100%",
    paddingVertical: 2,
  },

  memoExpandedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    marginTop: 7,
    marginRight: 7,
  },

  memoExpandedText: {
    flex: 1,
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },

  alternativeButton: {
    marginTop: 0,
    width: 90,
    minWidth: 90,
    maxWidth: 90,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#2158E8",
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  alternativeButtonContent: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingRight: 10,
  },

  alternativeButtonIcon: {
    position: "absolute",
    right: 0,
  },

  alternativeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 18,
    textAlign: "center",
  },
});
