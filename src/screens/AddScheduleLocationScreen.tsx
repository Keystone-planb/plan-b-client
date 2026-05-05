import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  ScrollView,
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
import { createTrip } from "../../api/schedules/server";

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
  latitudeDelta: 0.014,
  longitudeDelta: 0.014,
};

export default function AddScheduleLocationScreen({
  navigation,
  route,
}: Props) {
  const inputRef = useRef<TextInput>(null);
  const mapRef = useRef<MapView>(null);

  const [keyword, setKeyword] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [detailLoadingPlaceId, setDetailLoadingPlaceId] = useState<
    string | null
  >(null);
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
        latitudeDelta: 0.014,
        longitudeDelta: 0.014,
      },
      350,
    );
  };

  const handleSearch = async () => {
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword || searchLoading || submitLoading) {
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

  const handlePlaceDetail = async (place: PlaceSearchResult) => {
    try {
      setDetailLoadingPlaceId(place.placeId);

      const detail = await getPlaceDetail(place.placeId);

      const nextPlace: SelectedPlace = {
        placeId: place.placeId,
        name: place.name,
        address: place.address,
        rating: place.rating,
        category: place.category,
        latitude:
          detail.lat ??
          detail.latitude ??
          place.latitude ??
          INITIAL_REGION.latitude,
        longitude:
          detail.lng ??
          detail.longitude ??
          place.longitude ??
          INITIAL_REGION.longitude,
      };

      setSelectedPlace(nextPlace);
      setKeyword(place.name);
      moveMapToPlace(nextPlace);
    } catch (error) {
      console.log("장소 상세 조회 실패:", error);

      const fallbackPlace: SelectedPlace = {
        placeId: place.placeId,
        name: place.name,
        address: place.address,
        rating: place.rating,
        category: place.category,
        latitude: place.latitude ?? INITIAL_REGION.latitude,
        longitude: place.longitude ?? INITIAL_REGION.longitude,
      };

      setSelectedPlace(fallbackPlace);
      setKeyword(place.name);
      moveMapToPlace(fallbackPlace);
    } finally {
      setDetailLoadingPlaceId(null);
    }
  };

  const handleNext = async () => {
    if (!selectedPlace || submitLoading) {
      return;
    }

    if (!tripName || !startDate || !endDate) {
      Alert.alert("알림", "여행 이름과 날짜 정보가 없습니다.");
      return;
    }

    try {
      setSubmitLoading(true);

      await createTrip({
        title: tripName,
        startDate,
        endDate,
        travelStyles: ["HEALING"],
      });

      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    } catch (error) {
      console.log("여행 생성 실패:", error);

      const message =
        error instanceof Error ?
          error.message
        : "여행 일정을 생성하지 못했습니다.";

      Alert.alert("일정 생성 실패", message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const placesToRender =
    searchResults.length > 0 ?
      searchResults
    : [
        {
          placeId: "empty-preview-1",
          name: "장소를 검색해주세요",
          address: "검색어를 입력하면 장소 후보가 표시됩니다.",
          rating: undefined,
          category: "preview",
        },
      ];

  return (
    <View style={styles.screen}>
      <View style={styles.mapSection}>
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

        <SafeAreaView pointerEvents="box-none" style={styles.searchOverlay}>
          <View style={styles.searchBar}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.75}
              onPress={handleBack}
              disabled={submitLoading}
            >
              <Ionicons name="chevron-back" size={25} color="#6F7F95" />
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              value={keyword}
              onChangeText={setKeyword}
              placeholder="어디로 떠나시나요?"
              placeholderTextColor="#8090A6"
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleSubmitEditing}
              editable={!submitLoading}
            />

            <TouchableOpacity
              style={styles.searchButton}
              activeOpacity={0.75}
              onPress={handleSearch}
              disabled={searchLoading || submitLoading}
            >
              {searchLoading ?
                <ActivityIndicator size="small" color="#5D6E86" />
              : <Ionicons name="search" size={25} color="#5D6E86" />}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.handleBar} />

        <ScrollView
          style={styles.resultScroll}
          contentContainerStyle={styles.resultContent}
          showsVerticalScrollIndicator={false}
        >
          {placesToRender.map((place) => {
            const isPreview = place.placeId === "empty-preview-1";
            const isSelected = selectedPlace?.placeId === place.placeId;
            const isDetailLoading = detailLoadingPlaceId === place.placeId;

            return (
              <View
                key={place.placeId}
                style={[
                  styles.placeCard,
                  isSelected && styles.selectedPlaceCard,
                ]}
              >
                <Text style={styles.placeName}>{place.name}</Text>

                <Text style={styles.placeAddress} numberOfLines={1}>
                  {place.address}
                </Text>

                {!isPreview && typeof place.rating === "number" && (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={13} color="#FACC15" />
                    <Text style={styles.ratingText}>
                      {place.rating.toFixed(2)}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.detailButton,
                    isPreview && styles.disabledDetailButton,
                  ]}
                  activeOpacity={0.8}
                  disabled={isPreview || isDetailLoading || submitLoading}
                  onPress={() => handlePlaceDetail(place)}
                >
                  {isDetailLoading ?
                    <ActivityIndicator size="small" color="#6F7F95" />
                  : <>
                      <Text style={styles.detailButtonText}>
                        상세 정보 보기
                      </Text>
                      <Ionicons name="eye-outline" size={15} color="#6F7F95" />
                    </>
                  }
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {selectedPlace && (
        <TouchableOpacity
          style={[
            styles.nextButton,
            submitLoading && styles.disabledNextButton,
          ]}
          activeOpacity={0.85}
          onPress={handleNext}
          disabled={submitLoading}
        >
          {submitLoading ?
            <ActivityIndicator size="small" color="#FFFFFF" />
          : <Ionicons name="checkmark" size={23} color="#FFFFFF" />}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },

  mapSection: {
    height: 335,
    backgroundColor: "#DDE7F2",
    position: "relative",
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  searchOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 15,
  },

  searchBar: {
    height: 51,
    marginTop: 31,
    borderRadius: 12,
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
    height: 51,
    alignItems: "center",
    justifyContent: "center",
  },

  searchInput: {
    flex: 1,
    height: 51,
    paddingTop: 1,
    color: "#263244",
    fontSize: 17,
    fontWeight: "700",
  },

  searchButton: {
    width: 50,
    height: 51,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomSheet: {
    flex: 1,
    marginTop: -4,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: "#F7F9FC",
    overflow: "hidden",
  },

  handleBar: {
    alignSelf: "center",
    width: 43,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#D6DDE8",
    marginTop: 10,
    marginBottom: 15,
  },

  resultScroll: {
    flex: 1,
  },

  resultContent: {
    paddingHorizontal: 16,
    paddingBottom: 190,
  },

  placeCard: {
    minHeight: 178,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE5F1",
    paddingHorizontal: 23,
    paddingTop: 25,
    paddingBottom: 28,
    marginBottom: 16,
  },

  selectedPlaceCard: {
    borderColor: "#2158E8",
  },

  placeName: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 8,
  },

  placeAddress: {
    color: "#8A9BB2",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 14,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  ratingText: {
    marginLeft: 5,
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
  },

  detailButton: {
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F1F4F8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  disabledDetailButton: {
    opacity: 0.65,
  },

  detailButtonText: {
    color: "#6F7F95",
    fontSize: 13,
    fontWeight: "700",
    marginRight: 5,
  },

  nextButton: {
    position: "absolute",
    right: 24,
    bottom: 112,
    width: 56,
    height: 56,
    borderRadius: 28,
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
    elevation: 20,
    zIndex: 999,
  },
  disabledNextButton: {
    opacity: 0.75,
  },
});
