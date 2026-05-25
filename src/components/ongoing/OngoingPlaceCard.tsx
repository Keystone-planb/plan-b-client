import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
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
  return (
    <View
      style={[
        styles.todayCard,
        !isCurrentTripOngoing && styles.futureTodayCard,
        focused && styles.todayCardActive,
      ]}
    >
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
  );
}
