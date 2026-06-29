import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, {
  Marker,
  Polyline,
} from "react-native-maps";

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
  const mapRef = useRef<MapView | null>(null);

  const points = [
    {
      point: previous,
      role: "existing" as const,
    },
    {
      point: alternative,
      role: "alternative" as const,
    },
    {
      point: next,
      role: "existing" as const,
    },
  ]
    .filter(({ point }) => isValidPoint(point))
    .map(({ point, role }) => ({
      latitude: point!.latitude as number,
      longitude: point!.longitude as number,
      name: point!.name,
      role,
    }));

  const coordinates = points.map((point) => ({
    latitude: point.latitude,
    longitude: point.longitude,
  }));

  useEffect(() => {
    if (coordinates.length < 2) return;

    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coordinates, {
        animated: false,
        edgePadding: {
          top: 34,
          right: 34,
          bottom: 40,
          left: 34,
        },
      });
    }, 120);

    return () => clearTimeout(timer);
  }, [
    coordinates
      .map(
        (point) =>
          `${point.latitude}:${point.longitude}`,
      )
      .join("|"),
  ]);

  if (points.length <= 0) {
    return (
      <View style={styles.emptyMap}>
        <Text style={styles.emptyMapText}>
          지도 정보를 불러올 수 없습니다.
        </Text>
      </View>
    );
  }

  const latitude =
    points.reduce(
      (sum, point) => sum + point.latitude,
      0,
    ) / points.length;

  const longitude =
    points.reduce(
      (sum, point) => sum + point.longitude,
      0,
    ) / points.length;

  return (
    <View style={styles.mapBox}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        }}
        pointerEvents="none"
        onMapReady={() => {
          if (coordinates.length < 2) return;

          mapRef.current?.fitToCoordinates(coordinates, {
            animated: false,
            edgePadding: {
              top: 34,
              right: 34,
              bottom: 40,
              left: 34,
            },
          });
        }}
      >
        {points.map((point, index) => (
          <Marker
            key={[
              point.role,
              point.latitude,
              point.longitude,
              index,
            ].join("-")}
            coordinate={{
              latitude: point.latitude,
              longitude: point.longitude,
            }}
            title={point.name ?? undefined}
            pinColor={
              point.role === "alternative"
                ? "#2158E8"
                : "#94A3B8"
            }
          />
        ))}

        {points.length >= 2 ? (
          <Polyline
            coordinates={coordinates}
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
    height: 118,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    marginBottom: 8,
  },

  map: {
    flex: 1,
  },

  emptyMap: {
    height: 118,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  emptyMapText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
  },
});
