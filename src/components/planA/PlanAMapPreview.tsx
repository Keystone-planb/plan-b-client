import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function PlanAMapPreview() {
  return (
    <View style={styles.mapArea}>
      <View style={styles.mapRoadHorizontal} />
      <View style={styles.mapRoadVertical} />
      <View style={styles.mapRoadDiagonal} />

      <View style={styles.mapGreenAreaOne}>
        <Text style={styles.mapAreaText}>강릉종합{"\n"}운동장</Text>
      </View>

      <View style={styles.mapGreenAreaTwo} />

      <Text style={[styles.mapPlaceLabel, styles.mapLabelOne]}>강릉세무서</Text>

      <Text style={[styles.mapPlaceLabel, styles.mapLabelTwo]}>
        하슬라중학교
      </Text>

      <Text style={[styles.mapPlaceLabel, styles.mapLabelThree]}>교2동</Text>

      <View style={[styles.mapPin, styles.mapPinOne]}>
        <Text style={styles.mapPinText}>1</Text>
      </View>

      <View style={[styles.mapPin, styles.mapPinTwo]}>
        <Text style={styles.mapPinText}>2</Text>
      </View>

      <View style={[styles.mapPin, styles.mapPinThree]}>
        <Text style={styles.mapPinText}>3</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapArea: {
    height: 128,
    backgroundColor: "#EEF3F7",
    overflow: "hidden",
    position: "relative",
  },

  mapRoadHorizontal: {
    position: "absolute",
    left: -20,
    right: -20,
    top: 62,
    height: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#D8E0EA",
    transform: [{ rotate: "-4deg" }],
  },

  mapRoadVertical: {
    position: "absolute",
    top: -20,
    bottom: -20,
    left: 132,
    width: 18,
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#D8E0EA",
    transform: [{ rotate: "12deg" }],
  },

  mapRoadDiagonal: {
    position: "absolute",
    left: 170,
    top: -12,
    width: 16,
    height: 180,
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#D8E0EA",
    transform: [{ rotate: "48deg" }],
  },

  mapGreenAreaOne: {
    position: "absolute",
    left: 88,
    top: 28,
    width: 88,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#BFE8C5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  mapGreenAreaTwo: {
    position: "absolute",
    left: 18,
    top: 14,
    width: 58,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#CDEFD1",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  mapAreaText: {
    color: "#2B8A3E",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 14,
  },

  mapPlaceLabel: {
    position: "absolute",
    color: "#8C9BB1",
    fontSize: 11,
    fontWeight: "800",
  },

  mapLabelOne: {
    left: 84,
    top: 12,
  },

  mapLabelTwo: {
    right: 24,
    top: 55,
    color: "#4A8BEA",
  },

  mapLabelThree: {
    left: 154,
    bottom: 16,
  },

  mapPin: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  mapPinOne: {
    right: 82,
    top: 52,
  },

  mapPinTwo: {
    right: 48,
    bottom: 12,
  },

  mapPinThree: {
    left: 76,
    top: 58,
  },

  mapPinText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
});
