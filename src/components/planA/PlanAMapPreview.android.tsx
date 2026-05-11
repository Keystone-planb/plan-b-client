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

const hasValidCoordinate = (place: PlaceLike) => {
  return (
    typeof place.latitude === "number" &&
    Number.isFinite(place.latitude) &&
    typeof place.longitude === "number" &&
    Number.isFinite(place.longitude)
  );
};

export default function PlanAMapPreview({ places = [] }: Props) {
  const visiblePlaces = places.filter(hasValidCoordinate);

  if (visiblePlaces.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyMapBox}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="location-outline" size={24} color="#94A3B8" />
          </View>

          <Text style={styles.emptyTitle}>장소 좌표 정보가 없습니다</Text>

          <Text style={styles.emptyDescription}>
            서버에서 위도/경도 값이 내려오면 지도에 장소를 표시합니다.
          </Text>

          {places.length > 0 ? (
            <View style={styles.pendingList}>
              {places.slice(0, 3).map((place, index) => (
                <View
                  key={`${String(place.id ?? place.name ?? "place")}-${index}`}
                  style={styles.pendingPlaceRow}
                >
                  <View style={styles.pendingDot} />
                  <Text style={styles.pendingPlaceText} numberOfLines={1}>
                    {place.name ?? `장소 ${index + 1}`}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.coordinateBox}>
        <View style={styles.coordinateHeader}>
          <Ionicons name="map-outline" size={18} color="#2158E8" />
          <Text style={styles.coordinateTitle}>지도 표시 가능 장소</Text>
        </View>

        <View style={styles.placeList}>
          {visiblePlaces.slice(0, 4).map((place, index) => (
            <View
              key={`${String(place.id ?? place.name ?? "place")}-${index}`}
              style={styles.placeRow}
            >
              <View style={styles.placeNumber}>
                <Text style={styles.placeNumberText}>{index + 1}</Text>
              </View>

              <View style={styles.placeInfo}>
                <Text style={styles.placeName} numberOfLines={1}>
                  {place.name ?? `장소 ${index + 1}`}
                </Text>
                <Text style={styles.coordinateText} numberOfLines={1}>
                  {place.latitude}, {place.longitude}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 18,
  },

  emptyMapBox: {
    minHeight: 170,
    borderRadius: 24,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 24,
  },

  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EEF2F7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#334155",
    textAlign: "center",
  },

  emptyDescription: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    color: "#94A3B8",
    textAlign: "center",
  },

  pendingList: {
    width: "100%",
    marginTop: 16,
    gap: 8,
  },

  pendingPlaceRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  pendingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#CBD5E1",
    marginRight: 8,
  },

  pendingPlaceText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
  },

  coordinateBox: {
    minHeight: 170,
    borderRadius: 24,
    backgroundColor: "#EEF5FF",
    borderWidth: 1,
    borderColor: "#D8E6FF",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  coordinateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 12,
  },

  coordinateTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1E3A8A",
  },

  placeList: {
    gap: 8,
  },

  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  placeNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  placeNumberText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  placeInfo: {
    flex: 1,
  },

  placeName: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1E293B",
  },

  coordinateText: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
});
