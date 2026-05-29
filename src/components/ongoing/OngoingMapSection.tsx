import React from "react";
import { View } from "react-native";

import PlanAMapPreview from "../planA/PlanAMapPreview";

type Props = {
  places: any[];
  styles: any;
  mapInteractive?: boolean;
  collapsed?: boolean;
};

export default function OngoingMapSection({
  places,
  styles,
  mapInteractive = false,
  collapsed = false,
}: Props) {
  const hasPlaces = Array.isArray(places) && places.length > 0;
  const mapHeight =
    collapsed ? 620
    : hasPlaces ? 220
    : 160;

  return (
    <View style={[styles.mapSection, { height: mapHeight }]}>
      <PlanAMapPreview
        places={places}
        height={mapHeight}
        mapInteractive={mapInteractive}
      />
    </View>
  );
}
