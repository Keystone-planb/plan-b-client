import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";

import { PlaceItem } from "../../types/planA";

type Props = {
  places?: PlaceItem[];
};

type MapPlace = PlaceItem & {
  latitude: number;
  longitude: number;
};

const DEFAULT_REGION: Region = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const hasValidCoordinate = (place: PlaceItem): place is MapPlace => {
  return (
    typeof place.latitude === "number" &&
    typeof place.longitude === "number" &&
    Number.isFinite(place.latitude) &&
    Number.isFinite(place.longitude)
  );
};

const createRegionFromPlaces = (places: MapPlace[]): Region => {
  if (places.length === 0) {
    return DEFAULT_REGION;
  }

  if (places.length === 1) {
    return {
      latitude: places[0].latitude,
      longitude: places[0].longitude,
      latitudeDelta: 0.018,
      longitudeDelta: 0.018,
    };
  }

  const latitudes = places.map((place) => place.latitude);
  const longitudes = places.map((place) => place.longitude);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const latitudeDelta = Math.max((maxLat - minLat) * 1.8, 0.018);
  const longitudeDelta = Math.max((maxLng - minLng) * 1.8, 0.018);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta,
    longitudeDelta,
  };
};

function MockMapPreview() {
  return (
    <View style={styles.mockMapArea}>
      <View style={styles.mapRoadHorizontal} />
      <View style={styles.mapRoadVertical} />
      <View style={styles.mapRoadDiagonal} />

      <View style={styles.mapGreenAreaOne}>
        <Text style={styles.mapAreaText}>장소 좌표{"\n"}대기 중</Text>
      </View>

      <View style={styles.mapGreenAreaTwo} />

      <Text style={[styles.mapPlaceLabel, styles.mapLabelOne]}>
        장소를 추가하면
      </Text>

      <Text style={[styles.mapPlaceLabel, styles.mapLabelTwo]}>
        지도에 표시돼요
      </Text>

      <View style={[styles.mapPin, styles.mapPinOne]}>
        <Text style={styles.mapPinText}>1</Text>
      </View>
    </View>
  );
}

export default function PlanAMapPreview({ places = [] }: Props) {
  const mapPlaces = useMemo(() => {
    return places.filter(hasValidCoordinate);
  }, [places]);

  const initialRegion = useMemo(() => {
    return createRegionFromPlaces(mapPlaces);
  }, [mapPlaces]);

  const routeCoordinates = useMemo(() => {
    return mapPlaces.map((place) => ({
      latitude: place.latitude,
      longitude: place.longitude,
    }));
  }, [mapPlaces]);

  if (Platform.OS === "web") {
    return <MockMapPreview />;
  }

  if (mapPlaces.length === 0) {
    return <MockMapPreview />;
  }

  return (
    <View style={styles.mapArea}>
      <MapView
        style={styles.realMap}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={false}
        pitchEnabled={false}
        scrollEnabled
        zoomEnabled
      >
        {routeCoordinates.length >= 2 ?
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor="#2158E8"
          />
        : null}

        {mapPlaces.map((place, index) => (
          <Marker
            key={`${place.id}-${place.latitude}-${place.longitude}`}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            title={place.name}
            description={place.address}
          >
            <View style={styles.marker}>
              <Text style={styles.markerText}>{index + 1}</Text>
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapArea: {
    height: 128,
    backgroundColor: "#EEF3F7",
    overflow: "hidden",
  },

  realMap: {
    flex: 1,
  },

  marker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  markerText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  mockMapArea: {
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

  mapPinText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
});
