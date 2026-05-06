import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

import {
  getPlaceDetail,
  getPlaceFreshness,
  getPlaceSummary,
  searchPlaces,
} from "../../api/places/searchPlaces";
import {
  PlaceFreshnessResponse,
  PlaceSearchResult,
  PlaceSummaryResponse,
} from "../../api/places/place";
import { createTrip } from "../../api/schedules/server";
import { reportPreferenceFeedback } from "../../api/preferences/preferences";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

type PlaceReviewInfo = {
  summary?: PlaceSummaryResponse;
  freshness?: PlaceFreshnessResponse;
};


const INITIAL_REGION = {
  latitude: 37.7519,
  longitude: 128.8761,
};

const INITIAL_CENTER = {
  latitude: INITIAL_REGION.latitude,
  longitude: INITIAL_REGION.longitude,
};

const DEFAULT_ZOOM = 15;

const markerIcon = L.divIcon({
  className: "custom-place-marker",
  html: `
    <div style="
      width: 34px;
      height: 34px;
      border-radius: 17px;
      background: #2158E8;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.24);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 15px;
      font-weight: 800;
    ">
      📍
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

function MapFocus({ selectedPlace }: { selectedPlace: SelectedPlace | null }) {
  const map = useMap();

  React.useEffect(() => {
    map.invalidateSize();

    if (!selectedPlace) {
      return;
    }

    const nextCenter: [number, number] = [
      selectedPlace.latitude,
      selectedPlace.longitude,
    ];

    window.setTimeout(() => {
      map.invalidateSize();
      map.flyTo(nextCenter, DEFAULT_ZOOM, {
        animate: true,
        duration: 0.8,
      });
    }, 80);
  }, [map, selectedPlace]);

  return null;
}

export default function AddScheduleLocationScreen({
  navigation,
  route,
}: Props) {
  const inputRef = useRef<TextInput>(null);

  const [keyword, setKeyword] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [detailLoadingPlaceId, setDetailLoadingPlaceId] = useState<
    string | null
  >(null);
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [reviewLoadingPlaceId, setReviewLoadingPlaceId] = useState<
    string | null
  >(null);
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);
  const [placeReviewMap, setPlaceReviewMap] = useState<
    Record<string, PlaceReviewInfo>
  >({});
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(
    null,
  );

  const tripName = route?.params?.tripName ?? "";
  const startDate = route?.params?.startDate ?? "";
  const endDate = route?.params?.endDate ?? "";
  const transportMode = route?.params?.transportMode ?? "TRANSIT";
  const transportLabel = route?.params?.transportLabel ?? "대중교통";

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("Main");
  };


  const toNumericPlaceId = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && /^\d+$/.test(value)) {
      return Number(value);
    }

    return null;
  };


  const getFeedbackPlaceId = (value: unknown): number | null => {
    const target = value as {
      id?: unknown;
      placeId?: unknown;
      place_id?: unknown;
      dbPlaceId?: unknown;
      serverPlaceId?: unknown;
    };

    return (
      toNumericPlaceId(target?.id) ??
      toNumericPlaceId(target?.placeId) ??
      toNumericPlaceId(target?.place_id) ??
      toNumericPlaceId(target?.dbPlaceId) ??
      toNumericPlaceId(target?.serverPlaceId)
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

      setExpandedPlaceId(null);
      setReviewLoadingPlaceId(null);

      const places = await searchPlaces(trimmedKeyword);
      setSearchResults(places);

      Keyboard.dismiss();
    } catch {
      setSearchResults([]);
      setSelectedPlace(null);
      setExpandedPlaceId(null);
      setReviewLoadingPlaceId(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmitEditing = () => {
    handleSearch();
  };

  const handlePlaceDetail = async (place: PlaceSearchResult) => {
    try {
      setDetailLoadingPlaceId(String(place.placeId));

      const detail = await getPlaceDetail(place.googlePlaceId ?? String(place.placeId));

      const nextPlace: SelectedPlace = {
        placeId: String(place.placeId),
        name: place.name,
        address: place.address,
        rating: place.rating,
        category: place.category,
        latitude: detail.lat ?? place.latitude ?? INITIAL_REGION.latitude,
        longitude: detail.lng ?? place.longitude ?? INITIAL_REGION.longitude,
      };

      setSelectedPlace(nextPlace);
      setKeyword(place.name);

      const storedUserId = await AsyncStorage.getItem("user_id");

      if (!storedUserId) {
        console.warn("[preference feedback] user_id 없음. feedback 호출 생략");
        return;
      }

      const feedbackPlaceId = String(place.googlePlaceId ?? place.placeId);

      reportPreferenceFeedback({
        userId: storedUserId,
        placeId: feedbackPlaceId,
        feedbackType: "SELECT",
        reason: "ADD_SCHEDULE_LOCATION_SELECT",
      }).catch((error) => {
        console.log("[preference feedback] ignored:", error);
      });
    } catch {
      const fallbackPlace: SelectedPlace = {
        placeId: String(place.placeId),
        name: place.name,
        address: place.address,
        rating: place.rating,
        category: place.category,
        latitude: place.latitude ?? INITIAL_REGION.latitude,
        longitude: place.longitude ?? INITIAL_REGION.longitude,
      };

      setSelectedPlace(fallbackPlace);
      setKeyword(place.name);
    } finally {
      setDetailLoadingPlaceId(null);
    }
  };

  const handleTogglePlaceReview = async (placeId: string) => {
    if (reviewLoadingPlaceId) {
      return;
    }

    if (expandedPlaceId === placeId) {
      setExpandedPlaceId(null);
      return;
    }

    try {
      setReviewLoadingPlaceId(placeId);

      const [summary, freshness] = await Promise.all([
        getPlaceSummary(placeId),
        getPlaceFreshness(placeId),
      ]);

      setPlaceReviewMap((prev) => ({
        ...prev,
        [placeId]: {
          summary,
          freshness,
        },
      }));

      setExpandedPlaceId(placeId);
    } catch (error) {
      console.log("장소 요약 정보 조회 실패:", error);

      setPlaceReviewMap((prev) => ({
        ...prev,
        [placeId]: {
          summary: {
            placeId,
            aiSummary: "아직 요약 정보가 없습니다.",
          },
        },
      }));

      setExpandedPlaceId(placeId);
    } finally {
      setReviewLoadingPlaceId(null);
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

      navigation.navigate("PlanA", {
        tripName,
        startDate,
        endDate,
        location:
          selectedPlace.name ||
          selectedPlace.address ||
          "선택한 장소",
        transportMode,
        transportLabel,
        selectedPlace: {
          id: selectedPlace.placeId,
          name: selectedPlace.name,
          time: "",
          day: route?.params?.day ?? route?.params?.selectedDay ?? 1,
        },
      });
    } catch (error) {
      console.log("여행 생성 실패:", error);

      const message =
        error instanceof Error
          ? error.message
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
        <View style={styles.mapLayer}>
          <MapContainer
            center={[INITIAL_CENTER.latitude, INITIAL_CENTER.longitude]}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom
            zoomControl={false}
            style={{
              width: "100%",
              height: "100%",
            }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapFocus selectedPlace={selectedPlace} />

            {selectedPlace && (
              <Marker
                position={[selectedPlace.latitude, selectedPlace.longitude]}
                icon={markerIcon}
              />
            )}
          </MapContainer>
        </View>

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
            const isSelected = selectedPlace?.placeId === String(place.placeId);
            const isDetailLoading = detailLoadingPlaceId === String(place.placeId);
            const isReviewLoading = reviewLoadingPlaceId === place.placeId;
            const isExpanded = expandedPlaceId === place.placeId;
            const reviewInfo = placeReviewMap[place.placeId];
            const summary = reviewInfo?.summary;
            const freshness = reviewInfo?.freshness;
            const aiSummary =
              summary?.aiSummary ||
              summary?.reviewSummary ||
              "아직 요약 정보가 없습니다.";
            const keywords = summary?.keywords ?? [];

            const googleReview =
              summary?.googleReview ||
              summary?.googleReviewSummary ||
              summary?.platformSummaries?.google ||
              "구글 리뷰 요약을 준비 중입니다.";

            const naverReview =
              summary?.naverReview ||
              summary?.naverReviewSummary ||
              summary?.platformSummaries?.naver ||
              "네이버 리뷰 요약을 준비 중입니다.";

            const instaReview =
              summary?.instaReview ||
              summary?.instagramReviewSummary ||
              summary?.instaReviewSummary ||
              summary?.platformSummaries?.instagram ||
              summary?.platformSummaries?.insta ||
              "인스타그램 리뷰 요약을 준비 중입니다.";
            const freshnessText =
              freshness?.status === "FRESH" || freshness?.isFresh
                ? "최신 정보"
                : freshness?.lastSyncedAt || freshness?.last_updated
                  ? "최근 업데이트 확인"
                  : "최신성 확인 중";

            return (
              <View
                key={`place-${String(place.placeId)}`}
                style={[
                  styles.placeCard,
                  isExpanded && styles.expandedPlaceCard,
                  isReviewLoading && styles.reviewLoadingPlaceCard,
                  isSelected && styles.selectedPlaceCard,
                ]}
              >
                {!isExpanded && (
                  <>
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
                  </>
                )}

                <TouchableOpacity
                  style={[
                    styles.detailButton,
                    isPreview && styles.disabledDetailButton,
                    isExpanded && styles.compactButton,
                  ]}
                  activeOpacity={0.8}
                  disabled={isPreview || isReviewLoading}
                  onPress={() => handleTogglePlaceReview(place.googlePlaceId ?? String(place.placeId))}
                >
                  {isReviewLoading ?
                    <ActivityIndicator size="small" color="#6F7F95" />
                  : <>
                      <Text style={styles.detailButtonText}>
                        {isExpanded ? "간략히" : "상세 정보 보기"}
                      </Text>
                      <Ionicons
                        name={isExpanded ? "chevron-up-outline" : "eye-outline"}
                        size={15}
                        color="#6F7F95"
                      />
                    </>
                  }
                </TouchableOpacity>

                {isReviewLoading ?
                  <View style={styles.reviewLoadingPanel}>
                    <ActivityIndicator size="large" color="#2563EB" />

                    <Text style={styles.reviewLoadingText}>
                      리뷰 불러오는 중...
                    </Text>

                    <View style={styles.reviewProgressTrack}>
                      <View style={styles.reviewProgressFill} />
                    </View>
                  </View>
                : null}

                {isExpanded ?
                  <View style={styles.reviewPanel}>
                    <View style={styles.placeExpandedHeader}>
                      <View style={styles.placeIconCircle}>
                        <Text style={styles.placeIconEmoji}>🎡</Text>
                      </View>

                      <View style={styles.placeExpandedInfo}>
                        <Text style={styles.expandedPlaceName}>
                          {place.name}
                        </Text>

                        <Text style={styles.expandedAddress} numberOfLines={1}>
                          {place.address}
                        </Text>

                        <View style={styles.expandedMetaRow}>
                          <Ionicons name="star" size={13} color="#FACC15" />

                          <Text style={styles.expandedMetaText}>
                            {typeof place.rating === "number" ?
                              place.rating.toFixed(2)
                            : "4.58"}
                          </Text>

                          <Text style={styles.expandedDot}>·</Text>

                          <Ionicons
                            name="time-outline"
                            size={14}
                            color="#60A5FA"
                          />

                          <Text style={styles.expandedMetaText}>
                            {freshnessText}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.aiReviewBox}>
                      <Text style={styles.aiReviewText}>📊 {aiSummary}</Text>

                      <View style={styles.aiBadge}>
                        <Text style={styles.aiBadgeText}>AI</Text>
                      </View>
                    </View>

                    <View style={styles.reviewLineArea}>
                      <View style={styles.reviewVerticalLine} />

                      <View style={styles.platformReviewCard}>
                        <Text style={styles.platformReviewText}>
                          🟢 {googleReview}
                        </Text>
                      </View>

                      <View style={styles.platformReviewCard}>
                        <Text style={styles.platformReviewText}>
                          📸 {naverReview}
                        </Text>
                      </View>

                      <View style={styles.platformReviewCard}>
                        <Text style={styles.platformReviewText}>
                          🌈 {instaReview}
                        </Text>
                      </View>
                    </View>
                  </View>
                : null}

                {!isPreview && isExpanded && (
                  <TouchableOpacity
                    style={styles.expandedSelectButton}
                    activeOpacity={0.8}
                    disabled={isDetailLoading || submitLoading}
                    onPress={() => handlePlaceDetail(place)}
                  >
                    {isDetailLoading ?
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    : <Text style={styles.expandedSelectButtonText}>
                        {selectedPlace ? "선택 완료" : "이 장소 선택"}
                      </Text>
                    }
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {selectedPlace && (
        <TouchableOpacity
          style={[styles.nextButton, submitLoading && styles.disabledNextButton]}
          activeOpacity={0.85}
          onPress={handleNext}
          disabled={submitLoading}
        >
          {submitLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="checkmark" size={23} color="#FFFFFF" />
          )}
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

  mapLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },

  webMapMock: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#DDE7F2",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  mapGridLineHorizontal: {
    position: "absolute",
    top: 168,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#C9D6E5",
  },

  mapGridLineVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: 1,
    backgroundColor: "#C9D6E5",
  },

  markerBox: {
    alignItems: "center",
    justifyContent: "center",
  },

  markerLabel: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    color: "#172132",
    fontSize: 12,
    fontWeight: "800",
  },

  mapEmptyBox: {
    alignItems: "center",
    justifyContent: "center",
  },

  mapEmptyText: {
    marginTop: 8,
    color: "#74859B",
    fontSize: 14,
    fontWeight: "800",
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
    outlineStyle: "none" as any,
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
    paddingBottom: 24,
    marginBottom: 16,
  },

  expandedPlaceCard: {
    minHeight: 620,
  },

  reviewLoadingPlaceCard: {
    minHeight: 360,
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
    marginBottom: 18,
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
    marginBottom: 9,
  },

  compactButton: {
    marginTop: 4,
    marginBottom: 18,
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

  reviewLoadingPanel: {
    minHeight: 150,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 12,
  },

  reviewLoadingText: {
    marginTop: 12,
    color: "#617087",
    fontSize: 15,
    fontWeight: "900",
  },

  reviewProgressTrack: {
    width: "78%",
    height: 5,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    marginTop: 24,
    overflow: "hidden",
  },

  reviewProgressFill: {
    width: "74%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2563EB",
  },

  reviewPanel: {
    marginTop: 20,
    marginBottom: 12,
  },

  placeExpandedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  placeIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#F8C8F4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  placeIconEmoji: {
    fontSize: 30,
  },

  placeExpandedInfo: {
    flex: 1,
  },

  expandedPlaceName: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 6,
  },

  expandedAddress: {
    color: "#8A9BB2",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },

  expandedMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  expandedMetaText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 5,
  },

  expandedDot: {
    marginHorizontal: 8,
    color: "#8A9BB2",
    fontSize: 15,
    fontWeight: "700",
  },

  aiReviewBox: {
    position: "relative",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CFE0FF",
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 20,
  },

  aiReviewText: {
    color: "#2158E8",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 23,
  },

  aiBadge: {
    position: "absolute",
    right: -12,
    top: -12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#5B3DFF",
    alignItems: "center",
    justifyContent: "center",
  },

  aiBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  reviewLineArea: {
    position: "relative",
    paddingLeft: 36,
    gap: 12,
  },

  reviewVerticalLine: {
    position: "absolute",
    left: 8,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "#DDE5EF",
  },

  keywordWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },

  keywordChip: {
    borderRadius: 999,
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  keywordText: {
    color: "#2158E8",
    fontSize: 11,
    fontWeight: "800",
  },

  platformReviewCard: {
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#DDE5EF",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },

  platformReviewText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22,
  },

  expandedSelectButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },

  expandedSelectButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  disabledNextButton: {
    opacity: 0.75,
  },

  nextButton: {
    position: "absolute",
    right: 24,
    bottom: 120,
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
    zIndex: 9999,
  },
});
