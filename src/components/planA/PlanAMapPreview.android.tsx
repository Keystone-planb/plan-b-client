import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

type PlaceLike = {
  id?: string | number;
  name?: string;
  address?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

type Props = {
  places?: PlaceLike[];
  height?: number;
};

const DEFAULT_REGION: Region = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const toNumber = (value?: number | string | null) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export default function PlanAMapPreview({ places = [], height = 220 }: Props) {
  const visiblePlaces = useMemo(() => {
    return places
      .map((place) => {
        const latitude = toNumber(place.latitude);
        const longitude = toNumber(place.longitude);

        if (latitude === null || longitude === null) return null;

        return {
          ...place,
          latitude,
          longitude,
        };
      })
      .filter(Boolean) as Array<
      PlaceLike & { latitude: number; longitude: number }
    >;
  }, [places]);

  const initialRegion = useMemo<Region>(() => {
    const firstPlace = visiblePlaces[0];

    if (!firstPlace) return DEFAULT_REGION;

    return {
      latitude: firstPlace.latitude,
      longitude: firstPlace.longitude,
      latitudeDelta: 0.03,
      longitudeDelta: 0.03,
    };
  }, [visiblePlaces]);

  if (visiblePlaces.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="location-outline" size={24} color="#94A3B8" />
        </View>
        <Text style={styles.emptyTitle}>장소 좌표 정보가 없습니다</Text>
        <Text style={styles.emptyDescription}>
          장소 데이터에 latitude / longitude 값이 있어야 지도에 표시됩니다.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        key={`${initialRegion.latitude}-${initialRegion.longitude}-${visiblePlaces.length}`}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        loadingEnabled
        moveOnMarkerPress={false}
      >
        {visiblePlaces.map((place, index) => (
          <Marker
            key={`${String(place.id ?? place.name ?? "place")}-${index}`}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            title={place.name ?? `장소 ${index + 1}`}
            description={place.address}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },

  emptyContainer: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
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
});
