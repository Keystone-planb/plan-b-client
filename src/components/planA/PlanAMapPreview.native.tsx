import React, { useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region, Polyline} from "react-native-maps";
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
  mapInteractive?: boolean;
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

export default function PlanAMapPreview({
  places = [],
  height = 220,
  mapInteractive = false,
}: Props) {
  const mapRef = useRef<MapView>(null);

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
          <Ionicons name="location-outline" size={22} color="#94A3B8" />
        </View>
        <Text style={styles.emptyTitle}>위치 정보를 불러오지 못했어요</Text>
        {/* description removed */}
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        key={`${initialRegion.latitude}-${initialRegion.longitude}-${visiblePlaces.length}`}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        loadingEnabled
        moveOnMarkerPress={false}
        scrollEnabled={mapInteractive}
        zoomEnabled={mapInteractive}
        rotateEnabled={mapInteractive}
        pitchEnabled={mapInteractive}
      >
        {visiblePlaces.length > 1 ? (
          <Polyline
            coordinates={visiblePlaces.map((place) => ({
              latitude: place.latitude,
              longitude: place.longitude,
            }))}
            strokeColor="#2158E8"
            strokeWidth={3}
            lineDashPattern={[8, 6]}
          />
        ) : null}

        {visiblePlaces.map((place, index) => (
          <Marker
            key={`${String(place.id ?? place.name ?? "place")}-${index}`}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            title={place.name ?? `장소 ${index + 1}`}
            description={place.address}
            tracksViewChanges={true}
          >
            <View style={styles.markerBadge}>
              <Text style={styles.markerBadgeText}>
                {index + 1}
              </Text>
            </View>
          </Marker>
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

  // Android react-native-maps는 absoluteFillObject(stretch) 높이를 0으로 측정하는 버그가 있어
  // 고정 높이 컨테이너 안에서 flex:1로 높이를 채운다.
  map: {
    flex: 1,
    width: "100%",
  },

  emptyContainer: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 34,
  },

  markerBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2158E8",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  markerBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF2F7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#334155",
    textAlign: "center",
  },

  emptyDescription: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    color: "#94A3B8",
    textAlign: "center",
  },
});
