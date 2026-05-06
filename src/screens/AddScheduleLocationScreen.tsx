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
import { createTrip } from "../../api/schedules/server";
import { saveSchedule } from "../../api/schedules/storage";
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
  const existingLocation = route?.params?.location ?? "";
  const day = route?.params?.day;
  const selectedDay = route?.params?.selectedDay ?? day ?? 1;
  const transportMode = route?.params?.transportMode ?? "WALK";
  const transportLabel = route?.params?.transportLabel ?? "도보";

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

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("PlanA", {
      scheduleId,
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
      setSelectedPlace(null);
      setExpandedPlaceId(null);
      setReviewLoadingPlaceId(null);

      const places = await searchPlaces(trimmedKeyword);

      console.log("[AddScheduleLocation] searchPlaces result:", places);

      setSearchResults(places);
      Keyboard.dismiss();
    } catch (error) {
      console.log("[AddScheduleLocation] searchPlaces failed:", error);

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

      setSelectedPlace(nextPlace);
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
        console.warn("[preferences/feedback] mock fallback", error);
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

      setSelectedPlace(fallbackPlace);
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

      try {
        const createdTrip = await createTrip({
          title: tripName,
          startDate,
          endDate,
          travelStyles: ["HEALING"],
        });

        console.log("[AddScheduleLocation] 여행 생성 완료:", createdTrip);
      } catch (error) {
        console.log(
          "[AddScheduleLocation] 서버 여행 생성 실패, Plan.A 복귀 계속 진행:",
          error,
        );
      }

      const savedSchedule = await saveSchedule({
        tripName,
        startDate,
        endDate,
        location: selectedPlace.name || selectedPlace.address || "선택한 장소",
      });

      console.log(
        "[AddScheduleLocation] 메인 카드용 일정 저장 완료:",
        savedSchedule,
      );

      navigation.navigate("PlanA", {
        scheduleId: scheduleId ?? savedSchedule.id,
        tripName,
        startDate,
        endDate,
        location: selectedPlace.name || selectedPlace.address || "선택한 장소",
        transportMode,
        transportLabel,
        selectedPlace: {
          id: selectedPlace.placeId,
          placeId: selectedPlace.placeId,
          googlePlaceId: selectedPlace.googlePlaceId ?? selectedPlace.placeId,
          name: selectedPlace.name,
          address: selectedPlace.address,
          category: selectedPlace.category,
          latitude: selectedPlace.latitude,
          longitude: selectedPlace.longitude,
          day: selectedDay,
          time: "",
        },
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
  const detailModalFreshness = detailModalReviewInfo?.freshness as any;

  const detailModalAiSummary =
    detailModalSummary?.aiSummary ||
    detailModalSummary?.reviewSummary ||
    "아직 요약 정보가 없습니다.";

  const detailModalGoogleReview =
    detailModalSummary?.googleReview ||
    detailModalSummary?.googleReviewSummary ||
    detailModalSummary?.platformSummaries?.google ||
    "구글 리뷰 요약을 준비 중입니다.";

  const detailModalNaverReview =
    detailModalSummary?.naverReview ||
    detailModalSummary?.naverReviewSummary ||
    detailModalSummary?.platformSummaries?.naver ||
    "네이버 리뷰 요약을 준비 중입니다.";

  const detailModalInstaReview =
    detailModalSummary?.instaReview ||
    detailModalSummary?.instagramReviewSummary ||
    detailModalSummary?.instaReviewSummary ||
    detailModalSummary?.platformSummaries?.instagram ||
    detailModalSummary?.platformSummaries?.insta ||
    "인스타그램 리뷰 요약을 준비 중입니다.";

  const detailModalFreshnessText =
    detailModalFreshness?.status === "FRESH" || detailModalFreshness?.isFresh ?
      "최신 정보"
    : detailModalFreshness?.lastSyncedAt || detailModalFreshness?.last_updated ?
      "최근 업데이트 확인"
    : "최신성 확인 중";

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
            const placeId = String(place.placeId);
            const googlePlaceId = String(place.googlePlaceId ?? place.placeId);

            const isPreview = placeId === "empty-preview-1";
            const isSelected = selectedPlace?.placeId === placeId;
            const isDetailLoading = detailLoadingPlaceId === placeId;
            const isReviewLoading = reviewLoadingPlaceId === googlePlaceId;
            const isExpanded = false;
            const reviewInfo = placeReviewMap[googlePlaceId];
            const summary = reviewInfo?.summary;
            const freshness = reviewInfo?.freshness;
            const summaryAny = summary as any;

            const aiSummary =
              summaryAny?.aiSummary ||
              summaryAny?.reviewSummary ||
              "아직 요약 정보가 없습니다.";

            const googleReview =
              summaryAny?.googleReview ||
              summaryAny?.googleReviewSummary ||
              summaryAny?.platformSummaries?.google ||
              "구글 리뷰 요약을 준비 중입니다.";

            const naverReview =
              summaryAny?.naverReview ||
              summaryAny?.naverReviewSummary ||
              summaryAny?.platformSummaries?.naver ||
              "네이버 리뷰 요약을 준비 중입니다.";

            const instaReview =
              summaryAny?.instaReview ||
              summaryAny?.instagramReviewSummary ||
              summaryAny?.instaReviewSummary ||
              summaryAny?.platformSummaries?.instagram ||
              summaryAny?.platformSummaries?.insta ||
              "인스타그램 리뷰 요약을 준비 중입니다.";

            const freshnessAny = freshness as any;

            const freshnessText =
              freshnessAny?.status === "FRESH" || freshnessAny?.isFresh ?
                "최신 정보"
              : freshnessAny?.lastSyncedAt || freshnessAny?.last_updated ?
                "최근 업데이트 확인"
              : "최신성 확인 중";

            return (
              <View
                key={`place-${placeId}`}
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
                  onPress={() => handleTogglePlaceReview(googlePlaceId)}
                >
                  {isReviewLoading ?
                    <ActivityIndicator size="small" color="#6F7F95" />
                  : <>
                      <Text style={styles.detailButtonText}>
                        상세 정보 보기
                      </Text>
                      <Ionicons
                        name="eye-outline"
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
                        {isSelected ? "선택 완료" : "이 장소 선택"}
                      </Text>
                    }
                  </TouchableOpacity>
                )}
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
            <View style={styles.detailModalHeader}>
              <View style={styles.detailModalIconCircle}>
                <Text style={styles.detailModalEmoji}>🎡</Text>
              </View>

              <View style={styles.detailModalTitleBox}>
                <Text style={styles.detailModalTitle} numberOfLines={2}>
                  {detailModalPlace?.name ?? "장소 상세 정보"}
                </Text>

                <Text style={styles.detailModalAddress} numberOfLines={1}>
                  {detailModalPlace?.address ?? "주소 정보 없음"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.detailModalCloseButton}
                activeOpacity={0.75}
                onPress={() => setExpandedPlaceId(null)}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.detailModalMetaRow}>
              <Ionicons name="star" size={14} color="#FACC15" />

              <Text style={styles.detailModalMetaText}>
                {typeof detailModalPlace?.rating === "number" ?
                  detailModalPlace.rating.toFixed(2)
                : "평점 정보 없음"}
              </Text>

              <Text style={styles.detailModalDot}>·</Text>

              <Ionicons name="time-outline" size={14} color="#60A5FA" />

              <Text style={styles.detailModalMetaText}>
                {detailModalFreshnessText}
              </Text>
            </View>

            {reviewLoadingPlaceId === detailModalPlaceId ?
              <View style={styles.detailModalLoadingBox}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.detailModalLoadingText}>
                  리뷰 불러오는 중...
                </Text>
              </View>
            : <>
                <View style={styles.detailAiReviewBox}>
                  <Text style={styles.detailAiReviewText}>
                    📊 {detailModalAiSummary}
                  </Text>

                  <View style={styles.detailAiBadge}>
                    <Text style={styles.detailAiBadgeText}>AI</Text>
                  </View>
                </View>

                <View style={styles.detailPlatformList}>
                  <View style={styles.detailPlatformCard}>
                    <Text style={styles.detailPlatformText}>
                      🟢 {detailModalGoogleReview}
                    </Text>
                  </View>

                  <View style={styles.detailPlatformCard}>
                    <Text style={styles.detailPlatformText}>
                      📸 {detailModalNaverReview}
                    </Text>
                  </View>

                  <View style={styles.detailPlatformCard}>
                    <Text style={styles.detailPlatformText}>
                      🌈 {detailModalInstaReview}
                    </Text>
                  </View>
                </View>
              </>
            }

            {detailModalPlace ?
              <TouchableOpacity
                style={styles.detailModalSelectButton}
                activeOpacity={0.85}
                disabled={
                  detailLoadingPlaceId === String(detailModalPlace.placeId) ||
                  submitLoading
                }
                onPress={async () => {
                  await handlePlaceDetail(detailModalPlace);
                  setExpandedPlaceId(null);
                }}
              >
                {detailLoadingPlaceId === String(detailModalPlace.placeId) ?
                  <ActivityIndicator size="small" color="#FFFFFF" />
                : <Text style={styles.detailModalSelectButtonText}>
                    {selectedPlace?.placeId === String(detailModalPlace.placeId) ?
                      "선택 완료"
                    : "이 장소 선택"}
                  </Text>
                }
              </TouchableOpacity>
            : null}
          </View>
        </View>
      </Modal>

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
  detailModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.48)",
    justifyContent: "center",
    paddingHorizontal: 22,
  },

  detailModalCard: {
    maxHeight: "82%",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 24,
  },

  detailModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  detailModalIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#F8C8F4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  detailModalEmoji: {
    fontSize: 28,
  },

  detailModalTitleBox: {
    flex: 1,
  },

  detailModalTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 5,
  },

  detailModalAddress: {
    color: "#8A9BB2",
    fontSize: 13,
    fontWeight: "700",
  },

  detailModalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  detailModalMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  detailModalMetaText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 5,
  },

  detailModalDot: {
    marginHorizontal: 8,
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "800",
  },

  detailModalLoadingBox: {
    minHeight: 210,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  detailModalLoadingText: {
    marginTop: 12,
    color: "#617087",
    fontSize: 14,
    fontWeight: "900",
  },

  detailAiReviewBox: {
    position: "relative",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CFE0FF",
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },

  detailAiReviewText: {
    color: "#2158E8",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 22,
  },

  detailAiBadge: {
    position: "absolute",
    right: -10,
    top: -10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#5B3DFF",
    alignItems: "center",
    justifyContent: "center",
  },

  detailAiBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  detailPlatformList: {
    gap: 10,
    marginBottom: 16,
  },

  detailPlatformCard: {
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#DDE5EF",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  detailPlatformText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
  },

  detailModalSelectButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
  },

  detailModalSelectButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

});
