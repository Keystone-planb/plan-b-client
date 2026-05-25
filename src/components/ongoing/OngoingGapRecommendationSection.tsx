import React from "react";
import { Alert, View } from "react-native";
import type { NavigationProp } from "@react-navigation/native";

import GapRecommendationCard from "../recommendations/GapRecommendationCard";

type Props = {
  styles: any;
  navigation: NavigationProp<any>;
  scheduleId?: string;
  resolvedTripId?: string | number;
  tripName?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  transportMode?: "WALK" | "TRANSIT" | "CAR";
  transportLabel?: string;
  selectedDayIndex: number;
  currentGapPlanPairs: Array<{
    beforePlanId?: string | number;
    afterPlanId?: string | number;
  }>;
  currentPairFallbackGaps: any[];
};

export default function OngoingGapRecommendationSection({
  styles,
  navigation,
  scheduleId,
  resolvedTripId,
  tripName,
  startDate,
  endDate,
  location,
  transportMode,
  transportLabel,
  selectedDayIndex,
  currentGapPlanPairs,
  currentPairFallbackGaps,
}: Props) {
  if (!resolvedTripId || currentGapPlanPairs.length <= 0) return null;

  return (
    <View style={styles.gapRecommendationSection}>
      <GapRecommendationCard
        allowedPlanPairs={currentGapPlanPairs}
        fallbackGaps={currentPairFallbackGaps}
        onSelectPlace={(place, gap) => {
          const recommendedPlaceId = String(place.placeId);
          const recommendedGooglePlaceId =
            place.googlePlaceId ? String(place.googlePlaceId)
            : recommendedPlaceId.startsWith("ChIJ") ?
              recommendedPlaceId
            : undefined;
          const targetDay = gap.day ?? selectedDayIndex + 1;

          if (!recommendedGooglePlaceId) {
            Alert.alert(
              "장소 추가 실패",
              "추천 장소의 Google Place ID가 없어 일정에 추가할 수 없습니다.",
            );

            return;
          }

          navigation.navigate("PlanA", {
            scheduleId,
            tripId: resolvedTripId,
            serverTripId: resolvedTripId,
            tripName,
            startDate,
            endDate,
            location,
            transportMode,
            transportLabel,

            gapSelectedPlace: {
              day: targetDay,
              id:
                recommendedGooglePlaceId ??
                `recommended-place-${recommendedPlaceId}`,
              placeId: recommendedGooglePlaceId,
              googlePlaceId: recommendedGooglePlaceId,

              tripPlaceId: undefined,
              serverTripPlaceId: undefined,

              name: place.name,
              address: place.address,
              category: place.category,

              latitude: place.latitude,
              longitude: place.longitude,

              time: "",
            },
          });
        }}
        tripId={resolvedTripId}
      />
    </View>
  );
}
