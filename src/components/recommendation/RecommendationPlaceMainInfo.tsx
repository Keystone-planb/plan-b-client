import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  iconSource: any;
  name: string;
  ratingText: string;
  reviewCountText: string;
  address: string;
};

export default function RecommendationPlaceMainInfo({
  iconSource,
  name,
  ratingText,
  reviewCountText,
  address,
}: Props) {
  return (
    <View style={styles.placeTopRow}>
      <Image source={iconSource} style={styles.categoryImageIcon} />

      <View style={styles.placeMainInfo}>
        <View style={styles.placeNameRow}>
          <Text style={styles.placeName} numberOfLines={1}>
            {name}
          </Text>
        </View>

        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#FFD400" />
          <Text style={styles.ratingText}>{ratingText}</Text>
          <Text style={styles.reviewText}>({reviewCountText})</Text>
        </View>

        <View style={styles.infoLine}>
          <Ionicons name="location-outline" size={18} color="#8EA0B7" />
          <Text style={styles.infoText} numberOfLines={1}>
            {address}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  categoryImageIcon: {
    width: 72,
    height: 72,
    resizeMode: "contain",
    marginRight: 24,
  },

  placeMainInfo: {
    flex: 1,
  },

  placeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  placeName: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
    flexShrink: 1,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  ratingText: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
  },

  reviewText: {
    color: "#7C8CA3",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 4,
  },

  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  infoText: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
    marginLeft: 7,
    flex: 1,
  },
});
