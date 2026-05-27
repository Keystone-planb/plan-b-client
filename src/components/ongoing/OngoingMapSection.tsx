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
  return (
    <View style={[styles.mapSection, { height: collapsed ? 620 : 220 }]}>
      <PlanAMapPreview
        places={places}
        height={collapsed ? 620 : 220}
        mapInteractive={mapInteractive}
      />
    </View>
  );
}
