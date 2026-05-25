import React from "react";
import { View } from "react-native";

type Props = {
  hasPlaces: boolean;
  placeCount: number;
  isCurrentTripOngoing: boolean;
  styles: any;
};

export default function OngoingTimelineMarker({
  hasPlaces,
  placeCount,
  isCurrentTripOngoing,
  styles,
}: Props) {
  if (!hasPlaces || placeCount <= 1) return null;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.timelineLine,
        !isCurrentTripOngoing && styles.futureTimelineLine,
      ]}
    />
  );
}
