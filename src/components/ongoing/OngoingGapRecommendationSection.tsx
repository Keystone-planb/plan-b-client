import React from "react";
import { View } from "react-native";
import type { NavigationProp } from "@react-navigation/native";

import GapRecommendationCard from "../recommendations/GapRecommendationCard";

type WhiteToastState = {
  title: string;
  message?: string;
  type?: "success" | "error" | "info";
};

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
  showWhiteToast?: (toast: WhiteToastState) => void;
  currentGapPlanPairs: Array<{
    beforePlanId?: string | number;
    afterPlanId?: string | number;
  }>;
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
  showWhiteToast,
  currentGapPlanPairs,
}: Props) {
  if (!resolvedTripId || currentGapPlanPairs.length <= 0) return null;

  return (
    <View style={styles.gapRecommendationSection}>
      <GapRecommendationCard
        allowedPlanPairs={currentGapPlanPairs}
        tripId={resolvedTripId}
        selectedDay={selectedDayIndex + 1}
      />
    </View>
  );
}
