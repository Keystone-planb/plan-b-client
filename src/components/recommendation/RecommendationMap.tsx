import React from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

type Point = {
  latitude?: number | null;
  longitude?: number | null;
  name?: string | null;
};

type Props = {
  previous?: Point | null;
  alternative?: Point | null;
  next?: Point | null;
};

const isValidPoint = (point?: Point | null) =>
  typeof point?.latitude === "number" &&
  Number.isFinite(point.latitude) &&
  typeof point?.longitude === "number" &&
  Number.isFinite(point.longitude);

export default function RecommendationMap({
  previous,
  alternative,
  next,
}: Props) {
  const points = [previous, alternative, next].filter(isValidPoint) as Array<{
    latitude: number;
    longitude: number;
    name?: string | null;
  }>;

  if (points.length <= 0) {
    return (
      <View style={styles.emptyMap}>
        <Text style={styles.emptyMapText}>지도 정보를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  const latitude =
    points.reduce((sum, point) => sum + point.latitude, 0) / points.length;

  const longitude =
    points.reduce((sum, point) => sum + point.longitude, 0) / points.length;

  return (
    <View style={styles.mapBox}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        pointerEvents="none"
      >
        {points.map((point, index) => (
          <Marker
            key={`${point.latitude}-${point.longitude}-${index}`}
            coordinate={{
              latitude: point.latitude,
              longitude: point.longitude,
            }}
            title={point.name ?? undefined}
          />
        ))}

        {points.length >= 2 ? (
          <Polyline
            coordinates={points.map((point) => ({
              latitude: point.latitude,
              longitude: point.longitude,
            }))}
            strokeWidth={3}
            strokeColor="#2158E8"
          />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapBox: {
    height: 142,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    marginBottom: 12,
  },

  map: {
    flex: 1,
  },

  emptyMap: {
    height: 142,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  emptyMapText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
  },
});
