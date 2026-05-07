import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type PlaceLike = {
  id?: string | number;
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

type Props = {
  places?: PlaceLike[];
};

export default function PlanAMapPreview({ places = [] }: Props) {
  const visiblePlaces = places.filter(
    (place) =>
      typeof place.latitude === "number" && typeof place.longitude === "number",
  );

  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <View style={styles.iconCircle}>
          <Ionicons name="map-outline" size={28} color="#2158E8" />
        </View>

        <Text style={styles.title}>지도 미리보기</Text>

        <Text style={styles.description}>
          웹에서는 간단 미리보기로 표시됩니다.
        </Text>

        {visiblePlaces.length > 0 ?
          <View style={styles.placeList}>
            {visiblePlaces.slice(0, 3).map((place, index) => (
              <View
                key={`${place.id ?? place.name ?? "place"}-${index}`}
                style={styles.placeRow}
              >
                <View style={styles.placeDot} />
                <Text style={styles.placeName} numberOfLines={1}>
                  {place.name ?? `장소 ${index + 1}`}
                </Text>
              </View>
            ))}
          </View>
        : <Text style={styles.emptyText}>선택된 장소가 없습니다.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 18,
  },

  mapPlaceholder: {
    minHeight: 160,
    borderRadius: 24,
    backgroundColor: "#EEF5FF",
    borderWidth: 1,
    borderColor: "#D8E6FF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 22,
  },

  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 6,
  },

  description: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },

  placeList: {
    width: "100%",
    marginTop: 14,
    gap: 8,
  },

  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  placeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#2158E8",
    marginRight: 8,
  },

  placeName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },

  emptyText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
});
