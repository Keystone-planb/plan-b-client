import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

import { getPlaceDetail, searchPlaces } from "../../api/places/searchPlaces";
import { PlaceSearchResult } from "../../api/places/place";

type Props = {
  navigation: any;
  route: any;
};

type SelectedPlace = {
  placeId: string;
  name: string;
  address?: string;
  rating?: number;
  category?: string;
  latitude: number;
  longitude: number;
};

const INITIAL_REGION = {
  latitude: 37.7519,
  longitude: 128.8761,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

export default function AddScheduleLocationScreen({
  navigation,
  route,
}: Props) {
  const inputRef = useRef<TextInput>(null);
  const mapRef = useRef<MapView>(null);

  const [keyword, setKeyword] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(
    null,
  );

  const tripName = route?.params?.tripName ?? "";
  const startDate = route?.params?.startDate ?? "";
  const endDate = route?.params?.endDate ?? "";

  const handleBack = () => {
    navigation.goBack();
  };

  const moveMapToPlace = (place: SelectedPlace) => {
    mapRef.current?.animateToRegion(
      {
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      350,
    );
  };

  const selectPlace = async (place: PlaceSearchResult) => {
    try {
      setSearchLoading(true);

      const detail = await getPlaceDetail(place.placeId);

      const nextPlace: SelectedPlace = {
        placeId: place.placeId,
        name: place.name,
        address: place.address,
        rating: place.rating,
        category: place.category,
        latitude: detail.lat ?? INITIAL_REGION.latitude,
        longitude: detail.lng ?? INITIAL_REGION.longitude,
      };

      setSelectedPlace(nextPlace);
      setKeyword(place.name);
      moveMapToPlace(nextPlace);
      Keyboard.dismiss();
    } catch (error) {
      console.log("장소 상세 조회 실패:", error);

      const fallbackPlace: SelectedPlace = {
        placeId: place.placeId,
        name: place.name,
        address: place.address,
        rating: place.rating,
        category: place.category,
        latitude: INITIAL_REGION.latitude,
        longitude: INITIAL_REGION.longitude,
      };

      setSelectedPlace(fallbackPlace);
      setKeyword(place.name);
      moveMapToPlace(fallbackPlace);
      Keyboard.dismiss();
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = async () => {
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword || searchLoading) {
      return;
    }

    try {
      setSearchLoading(true);
      setSelectedPlace(null);

      const places = await searchPlaces(trimmedKeyword);
      setSearchResults(places);

      Keyboard.dismiss();
    } catch (error) {
      console.log("장소 검색 실패:", error);
      setSearchResults([]);
      setSelectedPlace(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmitEditing = () => {
    handleSearch();
  };

  const handleNext = () => {
    if (!selectedPlace) {
      return;
    }

    navigation.navigate("PlanA", {
      tripName,
      startDate,
      endDate,
      location: selectedPlace.name,
    });
  };

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={false}
      >
        {selectedPlace && (
          <Marker
            coordinate={{
              latitude: selectedPlace.latitude,
              longitude: selectedPlace.longitude,
            }}
            title={selectedPlace.name}
            description={selectedPlace.address}
          />
        )}
      </MapView>

      <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
        <View style={styles.searchBar}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.75}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={25} color="#6F7F95" />
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={keyword}
            onChangeText={setKeyword}
            placeholder="어디로 떠나시나요? ✈️"
            placeholderTextColor="#8090A6"
            autoFocus
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleSubmitEditing}
          />

          <TouchableOpacity
            style={styles.searchButton}
            activeOpacity={0.75}
            onPress={handleSearch}
            disabled={searchLoading}
          >
            {searchLoading ?
              <ActivityIndicator size="small" color="#5D6E86" />
            : <Ionicons name="search" size={24} color="#5D6E86" />}
          </TouchableOpacity>
        </View>

        {searchResults.length > 0 && (
          <View style={styles.resultList}>
            {searchResults.slice(0, 5).map((place) => (
              <TouchableOpacity
                key={place.placeId}
                style={styles.resultItem}
                activeOpacity={0.8}
                onPress={() => selectPlace(place)}
              >
                <View style={styles.resultIconBox}>
                  <Ionicons name="location" size={15} color="#2158E8" />
                </View>

                <View style={styles.resultTextBox}>
                  <Text style={styles.resultName} numberOfLines={1}>
                    {place.name}
                  </Text>

                  {!!place.address && (
                    <Text style={styles.resultAddress} numberOfLines={1}>
                      {place.address}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedPlace && (
          <View style={styles.selectedPlaceCard}>
            <View style={styles.selectedPlaceTop}>
              <View style={styles.selectedPlaceIcon}>
                <Ionicons name="location" size={18} color="#FFFFFF" />
              </View>

              <View style={styles.selectedPlaceInfo}>
                <Text style={styles.selectedPlaceName} numberOfLines={1}>
                  {selectedPlace.name}
                </Text>

                {!!selectedPlace.address && (
                  <Text style={styles.selectedPlaceAddress} numberOfLines={1}>
                    {selectedPlace.address}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.selectedMetaRow}>
              {!!selectedPlace.category && (
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>
                    {selectedPlace.category}
                  </Text>
                </View>
              )}

              {typeof selectedPlace.rating === "number" && (
                <View style={styles.metaChip}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.metaChipText}>
                    {selectedPlace.rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {selectedPlace && (
          <TouchableOpacity
            style={styles.nextButton}
            activeOpacity={0.85}
            onPress={handleNext}
          >
            <Ionicons name="checkmark" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 13,
  },

  searchBar: {
    height: 50,
    marginTop: 28,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#1E293B",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  backButton: {
    width: 43,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  searchInput: {
    flex: 1,
    height: 50,
    paddingTop: 1,
    color: "#263244",
    fontSize: 15,
    fontWeight: "600",
  },

  searchButton: {
    width: 48,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  resultList: {
    marginTop: 10,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#1E293B",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  resultItem: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },

  resultIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EAF1FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  resultTextBox: {
    flex: 1,
  },

  resultName: {
    color: "#263244",
    fontSize: 14,
    fontWeight: "800",
  },

  resultAddress: {
    marginTop: 4,
    color: "#7B8BA3",
    fontSize: 12,
    fontWeight: "500",
  },

  selectedPlaceCard: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 88,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 15,
    shadowColor: "#1E293B",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },

  selectedPlaceTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  selectedPlaceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  selectedPlaceInfo: {
    flex: 1,
  },

  selectedPlaceName: {
    color: "#263244",
    fontSize: 15,
    fontWeight: "900",
  },

  selectedPlaceAddress: {
    marginTop: 4,
    color: "#7B8BA3",
    fontSize: 12,
    fontWeight: "500",
  },

  selectedMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 12,
  },

  metaChip: {
    minHeight: 26,
    borderRadius: 13,
    backgroundColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 4,
  },

  metaChipText: {
    color: "#526173",
    fontSize: 11,
    fontWeight: "700",
  },

  nextButton: {
    position: "absolute",
    right: 20,
    bottom: 26,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#273142",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1E293B",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
