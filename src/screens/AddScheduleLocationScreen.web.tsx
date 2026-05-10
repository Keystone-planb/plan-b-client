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
import { addTripLocation, createTrip } from "../../api/schedules/server";
import { reportPreferenceFeedback } from "../../api/preferences/preferences";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = {
  navigation: any;
  route: any;
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
  detail?: unknown;
  summary?: PlaceSummaryResponse;
  freshness?: PlaceFreshnessResponse;
};

type ReviewItem = {
  text: string;
  rating?: number;
  relativeTimeDescription?: string;
  authorName?: string;
};

// 데이터 파싱 헬퍼 함수들 (네이티브에서 추가된 고급 기능)
const unwrapApiData = (source: unknown) => {
  if (!source || typeof source !== "object") {
    return source;
  }

  const objectSource = source as Record<string, unknown>;

  return (
    objectSource.data ??
    objectSource.result ??
    objectSource.response ??
    objectSource.payload ??
    objectSource.body ??
    objectSource
  );
};

const getValueByPath = (source: unknown, path: string): unknown => {
  if (!source || typeof source !== "object") {
    return undefined;
  }

  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, source);
};

const normalizeTextValue = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeTextValue(item))
      .filter(Boolean)
      .join(" ");
  }

  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;

    const preferred =
      objectValue.text ??
      objectValue.summary ??
      objectValue.reviewSummary ??
      objectValue.content ??
      objectValue.review ??
      objectValue.message ??
      objectValue.description ??
      objectValue.aiSummary;

    return normalizeTextValue(preferred);
  }

  return "";
};

const getFirstText = (source: unknown, paths: string[]) => {
  for (const path of paths) {
    const value = normalizeTextValue(getValueByPath(source, path));

    if (value) {
      return value;
    }
  }

  return "";
};

const getFirstArray = (source: unknown, paths: string[]) => {
  for (const path of paths) {
    const value = getValueByPath(source, path);

    if (Array.isArray(value)) {
      const normalized = value
        .map((item) => normalizeTextValue(item))
        .filter(Boolean);

      if (normalized.length > 0) {
        return normalized;
      }
    }
  }

  return [];
};

const getNumberByPath = (source: unknown, paths: string[]) => {
  for (const path of paths) {
    const value = getValueByPath(source, path);

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
};

const truncateText = (text: string, maxLength = 120) => {
  const normalized = text.trim().replace(/\s+/g, " ");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
};

const getReviewArrayByPath = (source: unknown, path: string): ReviewItem[] => {
  const value = getValueByPath(source, path);

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const itemObject = item as Record<string, unknown>;

      const text = normalizeTextValue(
        itemObject.text ??
          itemObject.reviewText ??
          itemObject.content ??
          itemObject.review ??
          itemObject.comment ??
          itemObject.message,
      );

      if (!text) {
        return null;
      }

      const ratingRaw = itemObject.rating;
      const parsedRating =
        typeof ratingRaw === "number" ? ratingRaw
        : typeof ratingRaw === "string" ? Number(ratingRaw)
        : undefined;

      return {
        text,
        rating:
          typeof parsedRating === "number" && Number.isFinite(parsedRating) ?
            parsedRating
          : undefined,
        relativeTimeDescription: normalizeTextValue(
          itemObject.relativeTimeDescription ??
            itemObject.relativeTime ??
            itemObject.timeDescription ??
            itemObject.createdAt,
        ),
        authorName: normalizeTextValue(
          itemObject.authorName ??
            itemObject.userName ??
            itemObject.author ??
            itemObject.name,
        ),
      };
    })
    .filter(Boolean) as ReviewItem[];
};

const getDetailReviews = (detail: unknown): ReviewItem[] => {
  const unwrappedDetail = unwrapApiData(detail);

  const reviewPaths = [
    "reviews",
    "googleReviews",
    "reviewList",
    "data.reviews",
    "data.googleReviews",
    "result.reviews",
    "result.googleReviews",
    "payload.reviews",
    "payload.googleReviews",
  ];

  for (const path of reviewPaths) {
    const reviews = getReviewArrayByPath(unwrappedDetail, path);

    if (reviews.length > 0) {
      return reviews;
    }
  }

  return [];
};

const createKeywordsFromReviews = (reviews: ReviewItem[]) => {
  if (reviews.length === 0) {
    return [];
  }

  const reviewText = reviews.map((review) => review.text).join(" ");

  const keywordCandidates = [
    "분위기",
    "맛집",
    "친절",
    "커피",
    "디저트",
    "가성비",
    "웨이팅",
    "깔끔",
    "뷰",
    "사진",
    "데이트",
    "가족",
    "혼밥",
    "주차",
    "추천",
    "재방문",
    "양",
    "가격",
    "서비스",
  ];

  return keywordCandidates
    .filter((keyword) => reviewText.includes(keyword))
    .slice(0, 5);
};

const createReviewSummaryFromReviews = (reviews: ReviewItem[]) => {
  if (reviews.length === 0) {
    return "";
  }

  const validRatings = reviews
    .map((review) => review.rating)
    .filter(
      (rating): rating is number =>
        typeof rating === "number" && Number.isFinite(rating),
    );

  const averageRating =
    validRatings.length > 0 ?
      validRatings.reduce((sum, rating) => sum + rating, 0) /
      validRatings.length
    : undefined;

  const keywords = createKeywordsFromReviews(reviews);
  const keywordPart =
    keywords.length > 0 ?
      `${keywords.slice(0, 3).join(", ")} 관련 언급이 많습니다.`
    : "";

  const ratingPart =
    typeof averageRating === "number" ?
      `실제 리뷰 평균 평점은 ${averageRating.toFixed(1)}점입니다.`
    : `실제 리뷰 ${reviews.length}개를 기준으로 요약했습니다.`;

  const firstReview = truncateText(reviews[0].text, 52);

  return [ratingPart, keywordPart, `대표 리뷰: ${firstReview}`]
    .filter(Boolean)
    .join(" ");
};

const isMockLikeSummary = (summary: string) => {
  const MOCK_LIKE_SUMMARY_PATTERNS = [
    "분위기 있는 인테리어",
    "친절한 직원으로 유명한 카페",
    "커피 퀄리티가 높고",
    "디저트도 맛있습니다",
    "힐링 분위기와 잘 맞는 조용한 카페",
    "오후 방문을 추천합니다",
  ];

  const normalized = summary.trim();

  if (!normalized) {
    return false;
  }

  return MOCK_LIKE_SUMMARY_PATTERNS.some((pattern) =>
    normalized.includes(pattern),
  );
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
  const [selectedPlaces, setSelectedPlaces] = useState<SelectedPlace[]>([]);
  const selectedPlace = selectedPlaces[selectedPlaces.length - 1] ?? null;

  const toggleSelectedPlace = (place: SelectedPlace) => {
    setSelectedPlaces((prev) => {
      const alreadySelected = prev.some(
        (item) => item.placeId === place.placeId,
      );

      if (alreadySelected) {
        return prev;
      }

      return [...prev, place];
    });
  };

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

  const handleSearch = async () => {
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword || searchLoading || submitLoading) {
      return;
    }

    try {
      setSearchLoading(true);
      setExpandedPlaceId(null);
      setReviewLoadingPlaceId(null);

      const places = await searchPlaces(trimmedKeyword);
      setSearchResults(places);

      Keyboard.dismiss();
    } catch {
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
    try {
      setDetailLoadingPlaceId(String(place.placeId));

      const detail = await getPlaceDetail(
        place.googlePlaceId ?? String(place.placeId),
      );

      const nextPlace: SelectedPlace = {
        placeId: String(place.placeId),
        googlePlaceId: place.googlePlaceId ?? String(place.placeId),
        name: place.name,
        address: place.address,
        rating: place.rating,
        category: place.category,
        latitude: detail.lat ?? place.latitude ?? INITIAL_REGION.latitude,
        longitude: detail.lng ?? place.longitude ?? INITIAL_REGION.longitude,
      };

      toggleSelectedPlace(nextPlace);
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
        googlePlaceId: place.googlePlaceId ?? String(place.placeId),
        name: place.name,
        address: place.address,
        rating: place.rating,
        category: place.category,
        latitude: place.latitude ?? INITIAL_REGION.latitude,
        longitude: place.longitude ?? INITIAL_REGION.longitude,
      };

      toggleSelectedPlace(fallbackPlace);
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

      const [detail, summary, freshness] = await Promise.all([
        getPlaceDetail(placeId),
        getPlaceSummary(placeId),
        getPlaceFreshness(placeId),
      ]);

      console.log("[AddScheduleLocation.web] place detail/summary/freshness:", {
        placeId,
        detail,
        summary,
        freshness,
      });

      setPlaceReviewMap((prev) => ({
        ...prev,
        [placeId]: {
          detail,
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

  const handleNext = async (
    overridePlaces?: SelectedPlace[],
  ) => {
    const placesToSubmit = overridePlaces ?? selectedPlaces;
    if (placesToSubmit.length === 0 || submitLoading) {
      return;
    }

    if (!tripName || !startDate || !endDate) {
      Alert.alert("알림", "여행 이름과 날짜 정보가 없습니다.");
      return;
    }

    const selectedDay = route?.params?.day ?? route?.params?.selectedDay ?? 1;
    console.log("[AddScheduleLocation] 선택 장소 목록:", {
      count: placesToSubmit.length,
      places: placesToSubmit.map((place) => ({
        placeId: place.placeId,
        googlePlaceId: place.googlePlaceId,
        name: place.name,
      })),
    });

    const primaryPlace = placesToSubmit[0];

    const nextLocation =
      primaryPlace?.name || primaryPlace?.address || "선택한 장소";

    let serverTripId: number | string | undefined;
    const serverPlaceMap: Record<string, { tripPlaceId?: number | string }> = {};

    try {
      setSubmitLoading(true);

      try {
        const tripResponse = await createTrip({
          title: tripName,
          startDate,
          endDate,
          travelStyles: ["HEALING"],
        });

        serverTripId = tripResponse.tripId;

        if (serverTripId) {
          for (const place of placesToSubmit) {
            console.log("[addTripLocation request]", {
              tripId: serverTripId,
              day: selectedDay,
              body: {
                place_id: place.googlePlaceId ?? place.placeId,
                name: place.name,
              },
            });

            const locationResponse = await addTripLocation(
              serverTripId,
              selectedDay,
              {
                place_id: place.googlePlaceId ?? place.placeId,
                name: place.name,
                visitTime: null,
                endTime: null,
                memo: null,
              },
            );

            serverPlaceMap[place.placeId] = {
              tripPlaceId: locationResponse.tripPlaceId,
            };
          }
        }

        console.log("[AddScheduleLocation] 서버 일정/장소 생성 완료:", {
          serverTripId,
          selectedDay,
          count: placesToSubmit.length,
          serverPlaceMap,
          placeNames: placesToSubmit.map((place) => place.name),
        });
      } catch (serverError) {
        console.log(
          "[AddScheduleLocation] 서버 저장 실패. 로컬 Plan.A 흐름으로 계속 진행:",
          serverError,
        );
      }

      navigation.navigate("PlanA", {
        scheduleId:
          route.params?.scheduleId ??
          route.params?.serverTripId ??
          serverTripId,
        initialSchedule: route.params?.initialSchedule,
        existingPlaces:
          route.params?.existingPlaces ??
          route.params?.places ??
          [],
        tripName,
        startDate,
        endDate,
        location: nextLocation,
        tripId: serverTripId,
        serverTripId,
        transportMode,
        transportLabel,
        selectedPlaces: placesToSubmit.map((place) => ({
          id: place.placeId,
          placeId: place.placeId,
          googlePlaceId: place.googlePlaceId ?? place.placeId,
          tripPlaceId: serverPlaceMap[place.placeId]?.tripPlaceId,
          serverTripPlaceId: serverPlaceMap[place.placeId]?.tripPlaceId,
          name: place.name,
          address: place.address,
          category: place.category,
          latitude: place.latitude,
          longitude: place.longitude,
          time: "",
          day: selectedDay,
        })),
      });
    } catch (error) {
      console.log("일정 생성 실패:", error);

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

            {selectedPlaces.length > 0 && (
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
            const isSelected = selectedPlaces.some(
              (item) => item.placeId === String(place.placeId),
            );
            const isDetailLoading =
              detailLoadingPlaceId === String(place.placeId);
            const isReviewLoading = reviewLoadingPlaceId === place.placeId;
            const isExpanded = expandedPlaceId === place.placeId;
            const reviewInfo = placeReviewMap[place.placeId];
            const detail = reviewInfo?.detail;
            const summary = reviewInfo?.summary;
            const freshness = reviewInfo?.freshness;

            // 고급 파싱으로 AI 요약 폴백 구현
            const unwrappedDetail = unwrapApiData(detail);
            const unwrappedSummary = unwrapApiData(summary);
            const unwrappedFreshness = unwrapApiData(freshness);

            const rawAiSummary = getFirstText(unwrappedSummary, [
              "aiSummary",
              "summary",
              "reviewSummary",
              "placeSummary",
              "content",
              "message",
              "description",
              "overallSummary",
              "totalSummary",
              "data.aiSummary",
              "data.summary",
              "data.reviewSummary",
              "data.placeSummary",
              "result.aiSummary",
              "result.summary",
              "payload.aiSummary",
              "payload.summary",
            ]);

            const detailReviews = getDetailReviews(unwrappedDetail).slice(0, 2);

            const reviewBasedSummary =
              createReviewSummaryFromReviews(detailReviews);

            const aiSummary =
              rawAiSummary && !isMockLikeSummary(rawAiSummary) ?
                truncateText(rawAiSummary, 120)
              : reviewBasedSummary || "아직 요약 정보가 없습니다.";

            const keywords = getFirstArray(unwrappedSummary, [
              "keywords",
              "keywordList",
              "tags",
              "data.keywords",
              "data.keywordList",
              "result.keywords",
              "payload.keywords",
            ]);

             const freshnessStatus = getFirstText(unwrappedFreshness, [
              "status",
              "freshnessStatus",
              "data.status",
              "result.status",
            ]);

            const freshnessText =
              freshnessStatus === "FRESH" ? "최신 정보"
              : (
                getFirstText(unwrappedFreshness, [
                  "lastSyncedAt",
                  "last_updated",
                  "lastUpdated",
                  "data.lastSyncedAt",
                  "result.lastSyncedAt",
                ])
              ) ?
                "최근 업데이트 확인"
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
                  onPress={() =>
                    handleTogglePlaceReview(
                      place.googlePlaceId ?? String(place.placeId),
                    )
                  }
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
                      <View style={styles.aiReviewHeader}>
                        <Text style={styles.aiReviewTitle}>AI 리뷰 요약</Text>

                        <View style={styles.aiBadge}>
                          <Text style={styles.aiBadgeText}>AI</Text>
                        </View>
                      </View>

                      <Text style={styles.aiReviewText}>{aiSummary}</Text>
                    </View>

                    {keywords.length > 0 && (
                      <View style={styles.keywordWrap}>
                        {keywords.map((keyword) => (
                          <View
                            key={`keyword-${keyword}`}
                            style={styles.keywordChip}
                          >
                            <Text style={styles.keywordText}>#{keyword}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                : null}

                {!isPreview && isExpanded && (
                  <TouchableOpacity
                    style={styles.expandedSelectButton}
                    activeOpacity={0.8}
                    disabled={isDetailLoading || submitLoading}
                    onPress={() =>
                      handleNext([
                        {
                          ...place,
                          placeId: String(place.placeId),
                          googlePlaceId: String(
                            place.googlePlaceId ?? place.placeId,
                          ),
                          latitude: place.latitude ?? INITIAL_REGION.latitude,
                          longitude: place.longitude ?? INITIAL_REGION.longitude,
                        },
                      ])
                    }
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CFE0FF",
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 20,
  },

  aiReviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  aiReviewTitle: {
    color: "#2158E8",
    fontSize: 14,
    fontWeight: "900",
  },

  aiReviewText: {
    color: "#2158E8",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 23,
  },

  aiBadge: {
    width: 34,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#5B3DFF",
    alignItems: "center",
    justifyContent: "center",
  },

  aiBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  keywordWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
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


  reviewSummaryCard: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  reviewSummaryTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },
  reviewSummaryText: {
    color: "#334155",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
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
