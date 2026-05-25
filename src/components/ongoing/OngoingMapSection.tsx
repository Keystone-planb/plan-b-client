import React from "react";
import { View } from "react-native";

import PlanAMapPreview from "../planA/PlanAMapPreview";

type Props = {
  places: any[];
  styles: any;
};

export default function OngoingMapSection({ places, styles }: Props) {
  return (
    <View style={styles.mapSection}>
      <PlanAMapPreview places={places} />
    </View>
  );
}
