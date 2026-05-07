import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
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
import AsyncStorage from "@react-native-async-storage/async-storage";

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
import { reportPreferenceFeedback } from "../../api/preferences/preferences";

type Props = {
  navigation: any;
  route: {
    params?: {
      scheduleId?: string;
      day?: number;
      selectedDay?: number;
      tripName?: string;
      startDate?: string;
      endDate?: string;
      location?: string;
      tripId?: number | string;
      serverTripId?: number | string;
      transportMode?: "WALK" | "TRANSIT" | "CAR";
      transportLabel?: string;
    };
  };
};

type SelectedPlace = {
  placeId: string;
  googlePlaceId?: string;
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
  latitudeDelta: 0.014,
  longitudeDelta: 0.014,
};

export default function AddScheduleLocationScreen({
  navigation,
  route,
}: Props) {
  const inputRef = useRef<TextInput>(null);
  const mapRef = useRef<MapView>(null);

  const tripName = route?.params?.tripName ?? "";
  const startDate = route?.params?.startDate ?? "";
  const endDate = route?.params?.endDate ?? "";
  const scheduleId = route?.params?.scheduleId;
  const existingTripId = route?.params?.tripId;
  const existingServerTripId = route?.params?.serverTripId;
  const existingLocation = route?.params?.location ?? "";
  const day = route?.params?.day;
  const selectedDay = route?.params?.selectedDay ?? day ?? 1;
  const transportMode = route?.params?.transportMode ?? "WALK";
  const transportLabel = route?.params?.transportLabel ?? "도보";

  const hasExistingSchedule = Boolean(
    scheduleId || existingTripId || existingServerTripId,
  );

  const resolvedExistingTripId = existingServerTripId ?? existingTripId;

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
  const [selectedPlaces, setSelectedPlaces] = useState<SelectedPlace[]>([]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("PlanA", {
      scheduleId,
      tripId: resolvedExistingTripId,
      serverTripId: resolvedExistingTripId,
      tripName,
      startDate,
      endDate,
      location: existingLocation,
      transportMode,
      transportLabel,
    });
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

  const toggleSelectedPlace = (place: SelectedPlace) => {
    setSelectedPlaces((prev) => {
      const alreadySelected = prev.some(
        (item) => item.placeId === place.placeId,
      );

      if (alreadySelected) {
        return prev.filter((item) => item.placeId !== place.placeId);
      }

      return [...prev, place];
    });
  };

  const handleSearch = async () => {
    const trimmedKeyword = keyword.trim();

    console.log("[AddScheduleLocation] handleSearch start:", {
      keyword,
      trimmedKeyword,
      searchLoading,
      submitLoading,
    });

    if (!trimmedKeyword || searchLoading || submitLoading) {
      return;
    }

    try {
      setSearchLoading(true);

      // 여러 장소를 누적 선택해야 하므로 검색할 때 selectedPlaces는 초기화하지 않는다.
      setExpandedPlaceId(null);
      setReviewLoadingPlaceId(null);

      const places = await searchPlaces(trimmedKeyword);

      console.log("[AddScheduleLocation] searchPlaces result:", places);

      setSearchResults(places);
      Keyboard.dismiss();
    } catch (error) {
      console.log("[AddScheduleLocation] searchPlaces failed:", error);

      setSearchResults([]);
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
    const placeId = String(place.placeId);
    const googlePlaceId = String(place.googlePlaceId ?? place.placeId);

    try {
      setDetailLoadingPlaceId(placeId);

      const detail = await getPlaceDetail(googlePlaceId);

      const nextPlace: SelectedPlace = {
        placeId,
        googlePlaceId,
        name: place.name,
        address: place.address,
        rating: place.rating,
        category: place.category,
        latitude: detail.lat ?? place.latitude ?? INITIAL_REGION.latitude,
        longitude: detail.lng ?? place.longitude ?? INITIAL_REGION.longitude,
      };

      toggleSelectedPlace(nextPlace);
      setKeyword(place.name);
      moveMapToPlace(nextPlace);

      const storedUserId = await AsyncStorage.getItem("user_id");

      if (!storedUserId) {
        console.warn("[preference feedback] user_id 없음. feedback 호출 생략");
        return;
      }

      reportPreferenceFeedback({
        userId: storedUserId,
        placeId: googlePlaceId,
        feedbackType: "SELECT",
        reason: "ADD_SCHEDULE_LOCATION_SELECT",
      }).catch((error) => {
        console.warn("[preferences/feedback] 호출 실패", error);
      });
    } catch (error) {
      console.log("[AddScheduleLocation] getPlaceDetail failed:", error);

      const fallbackPlace: SelectedPlace = {
        placeId,
        googlePlaceId,
        name: place.name,
        address: place.address,
        rating: place.rating,
        category: place.category,
        latitude: place.latitude ?? INITIAL_REGION.latitude,
        longitude: place.longitude ?? INITIAL_REGION.longitude,
      };

      toggleSelectedPlace(fallbackPlace);
      setKeyword(place.name);
      moveMapToPlace(fallbackPlace);
    } finally {
      setDetailLoadingPlaceId(null);
    }
  };

  const handleTogglePlaceReview = async (rawPlaceId: string | number) => {
    const placeId = String(rawPlaceId);

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
            aiSummary: "요약 정보를 불러오지 못했습니다.",
          },
        },
      }));

      setExpandedPlaceId(placeId);
    } finally {
      setReviewLoadingPlaceId(null);
    }
  };

  const navigateToPlanAWithPlaces = ({
    targetScheduleId,
    targetTripId,
    targetServerTripId,
    targetLocation,
  }: {
    targetScheduleId?: string;
    targetTripId?: number | string;
    targetServerTripId?: number | string;
    targetLocation: string;
  }) => {
    if (selectedPlaces.length === 0) {
      return;
    }

    navigation.navigate("PlanA", {
      scheduleId: targetScheduleId,
      tripId: targetTripId,
      serverTripId: targetServerTripId,
      tripName,
      startDate,
      endDate,
      location: targetLocation,
      transportMode,
      transportLabel,
      selectedPlaces: selectedPlaces.map((place) => ({
        id: place.placeId,
        placeId: place.placeId,
        googlePlaceId: place.googlePlaceId ?? place.placeId,
        name: place.name,
        address: place.address,
        category: place.category,
        latitude: place.latitude,
        longitude: place.longitude,
        day: selectedDay,
        time: "",
      })),
    });
  };

  const handleNext = async () => {
    if (selectedPlaces.length === 0 || submitLoading) {
      return;
    }

    if (!tripName || !startDate || !endDate) {
      Alert.alert("알림", "여행 이름과 날짜 정보가 없습니다.");
      return;
    }

    const primaryPlace = selectedPlaces[0];

    const nextLocation =
      primaryPlace?.name ||
      primaryPlace?.address ||
      existingLocation ||
      "선택한 장소";

    try {
      setSubmitLoading(true);

      if (hasExistingSchedule) {
        console.log("[AddScheduleLocation] 기존 일정에 장소 여러 개 추가:", {
          scheduleId,
          tripId: existingTripId,
          serverTripId: existingServerTripId,
          selectedDay,
          count: selectedPlaces.length,
          places: selectedPlaces.map((place) => place.name),
        });

        navigateToPlanAWithPlaces({
          targetScheduleId: scheduleId,
          targetTripId: resolvedExistingTripId,
          targetServerTripId: resolvedExistingTripId,
          targetLocation: existingLocation || nextLocation,
        });

        return;
      }

      console.log("[AddScheduleLocation] 새 일정 장소 선택 완료:", {
        selectedDay,
        count: selectedPlaces.length,
        places: selectedPlaces.map((place) => place.name),
      });

      navigateToPlanAWithPlaces({
        targetScheduleId: scheduleId,
        targetTripId: resolvedExistingTripId,
        targetServerTripId: resolvedExistingTripId,
        targetLocation: nextLocation,
      });
    } catch (error) {
      console.log("일정 저장 실패:", error);

      const message =
        error instanceof Error ?
          error.message
        : "여행 일정을 저장하지 못했습니다.";

      Alert.alert("일정 저장 실패", message);
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
        } as PlaceSearchResult,
      ];

  const detailModalPlace = searchResults.find((place) => {
    const googlePlaceId = String(place.googlePlaceId ?? place.placeId);

    return googlePlaceId === expandedPlaceId;
  });

  const detailModalPlaceId =
    detailModalPlace ?
      String(detailModalPlace.googlePlaceId ?? detailModalPlace.placeId)
    : "";

  const detailModalReviewInfo =
    detailModalPlaceId ? placeReviewMap[detailModalPlaceId] : undefined;

  const detailModalSummary = detailModalReviewInfo?.summary as any;

  const detailModalAiSummary =
    detailModalSummary?.aiSummary ||
    detailModalSummary?.reviewSummary ||
    "요약 정보가 없습니다.";

  const detailModalGoogleReview =
    detailModalSummary?.googleReview ||
    detailModalSummary?.googleReviewSummary ||
    detailModalSummary?.platformSummaries?.google ||
    "Google 리뷰 요약 정보가 없습니다.";

  const detailModalNaverReview =
    detailModalSummary?.naverReview ||
    detailModalSummary?.naverReviewSummary ||
    detailModalSummary?.platformSummaries?.naver ||
    "Naver 리뷰 요약 정보가 없습니다.";

  const detailModalInstaReview =
    detailModalSummary?.instaReview ||
    detailModalSummary?.instagramReviewSummary ||
    detailModalSummary?.instaReviewSummary ||
    detailModalSummary?.platformSummaries?.instagram ||
    detailModalSummary?.platformSummaries?.insta ||
    "Instagram 리뷰 요약 정보가 없습니다.";

  const detailModalOpeningHours =
    detailModalSummary?.openingHours ||
    detailModalSummary?.businessHours ||
    detailModalSummary?.hours ||
    (detailModalPlace as any)?.openingHours ||
    (detailModalPlace as any)?.businessHours ||
    "운영 시간 정보 없음";

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
          {selectedPlaces.map((place) => (
            <Marker
              key={`marker-${place.placeId}`}
              coordinate={{
                latitude: place.latitude,
                longitude: place.longitude,
              }}
              title={place.name}
              description={place.address}
            />
          ))}
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
          {selectedPlaces.length > 0 ?
            <View style={styles.selectedSummaryBox}>
              <Text style={styles.selectedSummaryTitle}>
                선택한 장소 {selectedPlaces.length}개
              </Text>

              <Text style={styles.selectedSummaryText} numberOfLines={2}>
                {selectedPlaces.map((place) => place.name).join(" · ")}
              </Text>
            </View>
          : null}

          {placesToRender.map((place) => {
            const placeId = String(place.placeId);
            const googlePlaceId = String(place.googlePlaceId ?? place.placeId);

            const isPreview = placeId === "empty-preview-1";
            const isSelected = selectedPlaces.some(
              (item) => item.placeId === placeId,
            );
            const isDetailLoading = detailLoadingPlaceId === placeId;
            const isReviewLoading = reviewLoadingPlaceId === googlePlaceId;

            return (
              <View
                key={`place-${placeId}`}
                style={[
                  styles.placeCard,
                  isReviewLoading && styles.reviewLoadingPlaceCard,
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
                  disabled={isPreview || isReviewLoading}
                  onPress={() => handleTogglePlaceReview(googlePlaceId)}
                >
                  {isReviewLoading ?
                    <ActivityIndicator size="small" color="#6F7F95" />
                  : <>
                      <Text style={styles.detailButtonText}>
                        상세 정보 보기
                      </Text>
                      <Ionicons name="eye-outline" size={15} color="#6F7F95" />
                    </>
                  }
                </TouchableOpacity>

                {!isPreview ?
                  <TouchableOpacity
                    style={[
                      styles.selectPlaceButton,
                      isSelected && styles.selectPlaceButtonActive,
                    ]}
                    activeOpacity={0.85}
                    disabled={isDetailLoading || submitLoading}
                    onPress={() => handlePlaceDetail(place)}
                  >
                    {isDetailLoading ?
                      <ActivityIndicator
                        size="small"
                        color={isSelected ? "#FFFFFF" : "#2158E8"}
                      />
                    : <Text
                        style={[
                          styles.selectPlaceButtonText,
                          isSelected && styles.selectPlaceButtonTextActive,
                        ]}
                      >
                        {isSelected ? "선택 완료" : "이 장소 선택"}
                      </Text>
                    }
                  </TouchableOpacity>
                : null}

                {isReviewLoading ?
                  <View style={styles.reviewLoadingPanel}>
                    <ActivityIndicator size="large" color="#2158E8" />

                    <Text style={styles.reviewLoadingText}>
                      리뷰 불러오는 중...
                    </Text>

                    <View style={styles.reviewProgressTrack}>
                      <View style={styles.reviewProgressFill} />
                    </View>
                  </View>
                : null}
              </View>
            );
          })}
        </ScrollView>
      </View>

      <Modal
        visible={Boolean(detailModalPlace)}
        transparent
        animationType="fade"
        onRequestClose={() => setExpandedPlaceId(null)}
      >
        <View style={styles.detailModalBackdrop}>
          <View style={styles.detailModalCard}>
            <View style={styles.detailHeaderRow}>
              <View style={styles.detailIconCircle}>
                <Text style={styles.detailIconEmoji}>🎡</Text>
              </View>

              <View style={styles.detailTitleArea}>
                <Text style={styles.detailTitle} numberOfLines={1}>
                  {detailModalPlace?.name ?? "장소 상세 정보"}
                </Text>

                <Text style={styles.detailAddress} numberOfLines={1}>
                  {detailModalPlace?.address ?? "주소 정보 없음"}
                </Text>

                <View style={styles.detailMetaRow}>
                  <Ionicons name="star" size={15} color="#FFD600" />

                  <Text style={styles.detailMetaText}>
                    {typeof detailModalPlace?.rating === "number" ?
                      detailModalPlace.rating.toFixed(2)
                    : "평점 정보 없음"}
                  </Text>

                  <Text style={styles.detailMetaDot}>·</Text>

                  <Ionicons name="time-outline" size={16} color="#8DC7FF" />

                  <Text style={styles.detailMetaText}>
                    {detailModalOpeningHours}
                  </Text>
                </View>
              </View>
            </View>

            {reviewLoadingPlaceId === detailModalPlaceId ?
              <View style={styles.detailLoadingBox}>
                <ActivityIndicator size="large" color="#2158E8" />
                <Text style={styles.detailLoadingText}>
                  리뷰 불러오는 중...
                </Text>
              </View>
            : <>
                <View style={styles.aiSummaryCard}>
                  <Text style={styles.aiSummaryText}>
                    📊 {detailModalAiSummary}
                  </Text>

                  <View style={styles.aiCircleBadge}>
                    <Text style={styles.aiCircleText}>AI</Text>
                  </View>
                </View>

                <View style={styles.platformArea}>
                  <View style={styles.platformLine} />

                  <View style={styles.platformCard}>
                    <View style={styles.platformIconNaver}>
                      <Text style={styles.platformIconText}>N</Text>
                    </View>

                    <Text style={styles.platformText}>
                      {detailModalNaverReview}
                    </Text>
                  </View>

                  <View style={styles.platformCard}>
                    <Text style={styles.instagramIcon}>▣</Text>

                    <Text style={styles.platformText}>
                      {detailModalInstaReview}
                    </Text>
                  </View>

                  <View style={styles.platformCard}>
                    <Text style={styles.googleIcon}>G</Text>

                    <Text style={styles.platformText}>
                      {detailModalGoogleReview}
                    </Text>
                  </View>
                </View>
              </>
            }

            <TouchableOpacity
              style={styles.compactButton}
              activeOpacity={0.85}
              onPress={() => setExpandedPlaceId(null)}
            >
              <Text style={styles.compactButtonText}>간략히</Text>
              <Ionicons name="chevron-up" size={20} color="#7A889B" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {selectedPlaces.length > 0 && (
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

  selectedSummaryBox: {
    borderRadius: 15,
    backgroundColor: "#EAF3FF",
    borderWidth: 1,
    borderColor: "#CFE3FF",
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 14,
  },

  selectedSummaryTitle: {
    color: "#2158E8",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 5,
  },

  selectedSummaryText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },

  placeCard: {
    minHeight: 178,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE5F1",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },

  reviewLoadingPlaceCard: {
    minHeight: 360,
  },

  selectedPlaceCard: {
    borderColor: "#2158E8",
    backgroundColor: "#F8FBFF",
  },

  placeName: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 8,
  },

  placeAddress: {
    color: "#8A9BB2",
    fontSize: 13,
    fontWeight: "700",
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
    fontWeight: "800",
  },

  detailButton: {
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F1F4F8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  disabledDetailButton: {
    opacity: 0.65,
  },

  detailButtonText: {
    color: "#6F7F95",
    fontSize: 13,
    fontWeight: "800",
    marginRight: 5,
  },

  selectPlaceButton: {
    height: 42,
    borderRadius: 13,
    backgroundColor: "#ECF5FF",
    borderWidth: 1,
    borderColor: "#D7E9FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },

  selectPlaceButtonActive: {
    backgroundColor: "#2158E8",
    borderColor: "#2158E8",
    shadowOpacity: 0.18,
    elevation: 4,
  },

  selectPlaceButtonText: {
    color: "#2158E8",
    fontSize: 13,
    fontWeight: "900",
  },

  selectPlaceButtonTextActive: {
    color: "#FFFFFF",
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
    backgroundColor: "#2158E8",
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
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 9999,
  },

  detailModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.16)",
    justifyContent: "center",
    paddingHorizontal: 22,
  },

  detailModalCard: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: "#E1E7EF",
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 10,
  },

  detailHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 22,
  },

  detailIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFD0F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },

  detailIconEmoji: {
    fontSize: 34,
  },

  detailTitleArea: {
    flex: 1,
  },

  detailTitle: {
    color: "#000000",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 8,
  },

  detailAddress: {
    color: "#A7B2C3",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },

  detailMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  detailMetaText: {
    color: "#1F2937",
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 5,
  },

  detailMetaDot: {
    color: "#A7B2C3",
    fontSize: 18,
    fontWeight: "900",
    marginHorizontal: 8,
  },

  detailLoadingBox: {
    minHeight: 220,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  detailLoadingText: {
    marginTop: 12,
    color: "#617087",
    fontSize: 15,
    fontWeight: "900",
  },

  aiSummaryCard: {
    position: "relative",
    minHeight: 92,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#C7DCFF",
    backgroundColor: "#EEF5FF",
    paddingHorizontal: 20,
    paddingVertical: 17,
    justifyContent: "center",
    marginBottom: 28,
  },

  aiSummaryText: {
    color: "#2F6BFF",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 30,
    paddingRight: 18,
  },

  aiCircleBadge: {
    position: "absolute",
    right: -13,
    top: -15,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#3B73F6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },

  aiCircleText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  platformArea: {
    position: "relative",
    paddingLeft: 44,
    gap: 14,
    marginBottom: 28,
  },

  platformLine: {
    position: "absolute",
    left: 8,
    top: 0,
    bottom: 0,
    width: 2,
    borderRadius: 999,
    backgroundColor: "#E7EDF5",
  },

  platformCard: {
    minHeight: 78,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#DDE6F1",
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  platformText: {
    flex: 1,
    color: "#8A97A8",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 28,
    marginLeft: 10,
  },

  platformIconNaver: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#03C75A",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  platformIconText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  instagramIcon: {
    color: "#F43F8C",
    fontSize: 21,
    fontWeight: "900",
    marginTop: 1,
  },

  googleIcon: {
    color: "#4285F4",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },

  compactButton: {
    alignSelf: "center",
    width: 220,
    height: 54,
    borderRadius: 14,
    backgroundColor: "#F4F7FA",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  compactButtonText: {
    color: "#8A97A8",
    fontSize: 22,
    fontWeight: "900",
  },
});
