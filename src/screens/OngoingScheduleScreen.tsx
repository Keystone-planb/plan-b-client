import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

type TodayPlace = {
  id?: string;
  name?: string;
  address?: string;
  time?: string;
  latitude?: number;
  longitude?: number;
};

type Props = {
  navigation: any;
  route?: {
    params?: {
      scheduleId?: string;
      tripName?: string;
      startDate?: string;
      endDate?: string;
      location?: string;
      transportMode?: "WALK" | "TRANSIT" | "CAR";
      transportLabel?: string;
      places?: TodayPlace[];
    };
  };
};

const DEFAULT_REGION = {
  latitude: 37.7519,
  longitude: 128.8761,
  latitudeDelta: 0.014,
  longitudeDelta: 0.014,
};

const MOCK_TODAY_PLACES: TodayPlace[] = [
  {
    id: "today-1",
    name: "강릉역",
    address: "강원도 강릉시",
    time: "10:00",
    latitude: 37.7643,
    longitude: 128.8993,
  },
  {
    id: "today-2",
    name: "강릉역",
    address: "강원도 강릉시",
    time: "10:00",
    latitude: 37.7629,
    longitude: 128.8978,
  },
  {
    id: "today-3",
    name: "강릉역",
    address: "강원도 강릉시",
    time: "10:00",
    latitude: 37.7617,
    longitude: 128.8964,
  },
  {
    id: "today-4",
    name: "강릉역",
    address: "강원도 강릉시",
    time: "10:00",
    latitude: 37.7605,
    longitude: 128.895,
  },
];

export default function OngoingScheduleScreen({ navigation, route }: Props) {
  const scheduleId = route?.params?.scheduleId;
  const tripName = route?.params?.tripName || "신나는 강릉 여행";
  const startDate = route?.params?.startDate;
  const endDate = route?.params?.endDate;
  const location = route?.params?.location || "강원도 강릉시";
  const transportMode = route?.params?.transportMode;
  const transportLabel = route?.params?.transportLabel;

  const places =
    route?.params?.places && route.params.places.length > 0 ?
      route.params.places
    : MOCK_TODAY_PLACES;

  const firstPlace = places[0];

  const region = {
    latitude: firstPlace?.latitude || DEFAULT_REGION.latitude,
    longitude: firstPlace?.longitude || DEFAULT_REGION.longitude,
    latitudeDelta: DEFAULT_REGION.latitudeDelta,
    longitudeDelta: DEFAULT_REGION.longitudeDelta,
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEdit = () => {
    navigation.navigate("PlanA", {
      scheduleId,
      tripName,
      startDate,
      endDate,
      location,
      transportMode,
      transportLabel,
    });
  };

  const handleAlternative = (place: TodayPlace) => {
    navigation.navigate("PlanA", {
      scheduleId,
      tripName,
      startDate,
      endDate,
      location,
      transportMode,
      transportLabel,
      alternativeTargetPlace: place,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={27} color="#6F7F95" />
          </TouchableOpacity>

          <Text style={styles.logoText}>Plan.B</Text>

          <View style={styles.headerRightSpace} />
        </View>

        <View style={styles.mapSection}>
          <MapView
            style={styles.map}
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            initialRegion={region}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass={false}
            rotateEnabled={false}
          >
            {places.map((place, index) => {
              if (!place.latitude || !place.longitude) return null;

              return (
                <Marker
                  key={`${place.id || place.name}-${index}`}
                  coordinate={{
                    latitude: place.latitude,
                    longitude: place.longitude,
                  }}
                  title={place.name || `장소 ${index + 1}`}
                  description={place.address}
                />
              );
            })}
          </MapView>

          <TouchableOpacity style={styles.expandMapButton} activeOpacity={0.8}>
            <Ionicons name="scan-outline" size={26} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>오늘 일정</Text>

            <TouchableOpacity activeOpacity={0.8} onPress={handleEdit}>
              <Text style={styles.editText}>수정</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.placeList}>
            {places.map((place, index) => {
              const focused = index === 0;

              return (
                <TouchableOpacity
                  key={`${place.id || place.name}-${index}`}
                  style={[styles.todayCard, focused && styles.todayCardActive]}
                  activeOpacity={0.85}
                >
                  <View style={styles.numberCircle}>
                    <Text style={styles.numberText}>1</Text>
                  </View>

                  <View style={styles.placeInfo}>
                    <Text style={styles.placeName} numberOfLines={1}>
                      {place.name || "강릉역"}
                    </Text>

                    <Text style={styles.placeAddress} numberOfLines={1}>
                      {place.address || location}
                    </Text>

                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={17} color="#94A3B8" />

                      <Text style={styles.timeText}>
                        {place.time || "10:00"}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.alternativeButton}
                    activeOpacity={0.85}
                    onPress={() => handleAlternative(place)}
                  >
                    <Text style={styles.alternativeButtonText}>대안찾기</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={15}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    height: 176,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    backgroundColor: "#FFFFFF",
  },

  backButton: {
    width: 42,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  logoText: {
    color: "#1C2534",
    fontSize: 45,
    fontWeight: "900",
    letterSpacing: -1.5,
    marginTop: 10,
  },

  headerRightSpace: {
    width: 42,
    height: 44,
  },

  mapSection: {
    height: 200,
    backgroundColor: "#E5ECF4",
    position: "relative",
    overflow: "hidden",
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  expandMapButton: {
    position: "absolute",
    right: 18,
    top: 17,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    alignItems: "center",
    justifyContent: "center",
  },

  contentScroll: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    paddingTop: 24,
    paddingHorizontal: 28,
    paddingBottom: 90,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  sectionTitle: {
    color: "#000000",
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  editText: {
    color: "#2158E8",
    fontSize: 18,
    fontWeight: "800",
  },

  placeList: {
    gap: 26,
  },

  todayCard: {
    minHeight: 118,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 20,
    paddingVertical: 16,
  },

  todayCardActive: {
    borderWidth: 1.5,
    borderColor: "#4D78FF",
    backgroundColor: "#FAFCFF",
  },

  numberCircle: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 20,
  },

  numberText: {
    color: "#2158E8",
    fontSize: 18,
    fontWeight: "900",
  },

  placeInfo: {
    flex: 1,
    paddingRight: 10,
  },

  placeName: {
    color: "#1C2534",
    fontSize: 21,
    fontWeight: "900",
    marginBottom: 8,
    letterSpacing: -0.3,
  },

  placeAddress: {
    color: "#8A9BB2",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: -0.2,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  timeText: {
    color: "#8A9BB2",
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 5,
  },

  alternativeButton: {
    height: 54,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: "#4E78EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },

  alternativeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    marginRight: 2,
  },
});
