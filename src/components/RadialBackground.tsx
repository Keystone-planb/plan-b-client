import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Circle } from "react-native-svg";

export default function RadialBackground() {
  return (
    <View style={styles.container}>
      <Svg width="100%" height="100%" viewBox="0 0 350 350">
        <Defs>
          <RadialGradient
            id="refinedGrad"
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
            fx="50%"
            fy="50%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#CAE1FC" stopOpacity="0.6" />

            <Stop offset="25%" stopColor="#CAE1FC" stopOpacity="0.45" />

            <Stop offset="50%" stopColor="#CAE1FC" stopOpacity="0.25" />

            <Stop offset="75%" stopColor="#CAE1FC" stopOpacity="0.1" />

            <Stop offset="100%" stopColor="#CAE1FC" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Circle cx="175" cy="175" r="175" fill="url(#refinedGrad)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: 350,
    height: 350,
    justifyContent: "center",
    alignItems: "center",
    zIndex: -1,
  },
});
