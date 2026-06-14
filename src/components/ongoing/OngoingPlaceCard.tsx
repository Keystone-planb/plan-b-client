import React, { forwardRef } from "react";
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
          <Text
            style={[styles.placeName, localStyles.placeName]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {place.name || "이름 없는 장소"}
          </Text>

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
            <Text
              style={[
                styles.alternativeButtonText,
                localStyles.alternativeButtonText,
              ]}
            >
              대안찾기
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
});

export default OngoingPlaceCard;

const localStyles = StyleSheet.create({
  placeCard: {
    height: 100,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E1E7EF",
    paddingHorizontal: 14,
    paddingVertical: 0,
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
  },

  categoryIconBox: {
    width: 66,
    height: 66,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },

  categoryIcon: {
    width: 66,
    height: 66,
  },

  contentArea: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
    justifyContent: "center",
  },

  placeName: {
    color: "#252D3C",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24,
    marginBottom: 4,
  },

  timeRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  timeText: {
    color: "#627187",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },

  alternativeButton: {
    width: 86,
    minWidth: 86,
    maxWidth: 86,
    height: 35,
    borderRadius: 10,
    backgroundColor: "#2158E8",
    paddingHorizontal: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    flexShrink: 0,
  },

  alternativeButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 15,
  },
});
