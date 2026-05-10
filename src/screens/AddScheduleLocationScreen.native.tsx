import React, { useMemo, useRef, useState } from "react";
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
import { addTripLocation, createTrip } from "../../api/schedules/server";

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

const INITIAL_REGION = {
  latitude: 37.7519,
  longitude: 128.8761,
  latitudeDelta: 0.014,
  longitudeDelta: 0.014,
};

const MOCK_LIKE_SUMMARY_PATTERNS = [
  "분위기 있는 인테리어",
  "친절한 직원으로 유명한 카페",
  "커피 퀄리티가 높고",
  "디저트도 맛있습니다",
  "힐링 분위기와 잘 맞는 조용한 카페",
  "오후 방문을 추천합니다",
];

const REVIEW_TEXT_MAX_LENGTH = 120;

const getReviewPlaceKey = (place: PlaceSearchResult) => {
  return String(place.googlePlaceId ?? place.placeId);
};

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

const truncateText = (text: string, maxLength = REVIEW_TEXT_MAX_LENGTH) => {
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

const getDetailReviews = (detail: unknown) => {
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

const isMockLikeSummary = (summary: string) => {
  const normalized = summary.trim();

  if (!normalized) {
    return false;
  }

  return MOCK_LIKE_SUMMARY_PATTERNS.some((pattern) =>
    normalized.includes(pattern),
  );
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

const formatConfidenceScore = (score?: number) => {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return "";
  }

  if (score <= 1) {
    return `${Math.round(score * 100)}%`;
  }

  return `${Math.round(score)}%`;
};

const getFreshnessLabel = (status: string) => {
  if (!status) return "";

  const normalized = status.toUpperCase();

  if (normalized === "FRESH") return "FRESH";
  if (normalized === "STALE") return "STALE";
  if (normalized === "UNKNOWN") return "UNKNOWN";

  return status;
};

const shortenAddress = (address?: string) => {
  if (!address) return "주소 정보 없음";

  return address
    .replace(/^대한민국\s*/, "")
    .replace(/^서울특별시\s*/, "서울 ")
    .replace(/^부산광역시\s*/, "부산 ")
    .replace(/^경기도\s*/, "경기 ")
    .replace(/^전북특별자치도\s*/, "전북 ")
    .replace(/^전라북도\s*/, "전북 ")
    .trim();
};

export default function AddScheduleLocationScreen({
  navigation,
  route,
}: Props) {
  const inputRef = useRef<TextInput>(null);
  const mapRef = useRef<MapView>(null);

  console.log("[AddScheduleLocation] route params:", route?.params);

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

  const handleTogglePlaceReview = async (place: PlaceSearchResult) => {
    const placeKey = getReviewPlaceKey(place);

    console.log("[AddScheduleLocation] review button clicked:", {
      placeName: place.name,
      placeId: place.placeId,
      googlePlaceId: place.googlePlaceId,
      placeKey,
    });

    if (reviewLoadingPlaceId) {
      return;
    }

    if (expandedPlaceId === placeKey) {
      setExpandedPlaceId(null);
      return;
    }

    try {
      setReviewLoadingPlaceId(placeKey);

      const [detail, summary, freshness] = await Promise.all([
        getPlaceDetail(placeKey),
        getPlaceSummary(placeKey),
        getPlaceFreshness(placeKey),
      ]);

      console.log("[AddScheduleLocation] review response:", {
        placeKey,
        detail,
        summary,
        freshness,
      });

      console.log("[AddScheduleLocation] review response keys:", {
        detailKeys:
          detail && typeof detail === "object" ?
            Object.keys(detail as object)
          : [],
        summaryKeys:
          summary && typeof summary === "object" ?
            Object.keys(summary as object)
          : [],
        freshnessKeys:
          freshness && typeof freshness === "object" ?
            Object.keys(freshness as object)
          : [],
      });

      setPlaceReviewMap((prev) => ({
        ...prev,
        [placeKey]: {
          detail,
          summary,
          freshness,
        },
      }));

      setExpandedPlaceId(placeKey);
    } catch (error) {
      console.log("장소 상세 정보 조회 실패:", error);

      setPlaceReviewMap((prev) => ({
        ...prev,
        [placeKey]: {},
      }));

      setExpandedPlaceId(placeKey);
    } finally {
      setReviewLoadingPlaceId(null);
    }
  };

  const navigateToPlanAWithPlaces = ({
    targetScheduleId,
    targetTripId,
    targetServerTripId,
    targetLocation,
    serverPlaceMap,
    placesToNavigate,
  }: {
    targetScheduleId?: string;
    targetTripId?: number | string;
    targetServerTripId?: number | string;
    targetLocation: string;
    serverPlaceMap?: Record<string, { tripPlaceId?: number | string }>;
    placesToNavigate?: SelectedPlace[];
  }) => {
    const navigationPlaces = placesToNavigate ?? selectedPlaces;

    if (navigationPlaces.length === 0) {
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
      selectedPlaces: navigationPlaces.map((place) => {
        const serverPlace = serverPlaceMap?.[place.placeId];

        return {
          id: place.placeId,
          placeId: place.placeId,
          googlePlaceId: place.googlePlaceId ?? place.placeId,
          tripPlaceId: serverPlace?.tripPlaceId,
          serverTripPlaceId: serverPlace?.tripPlaceId,
          name: place.name,
          address: place.address,
          category: place.category,
          latitude: place.latitude,
          longitude: place.longitude,
          day: selectedDay,
          time: "",
        };
      }),
    });
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

    const primaryPlace = placesToSubmit[0];

    const nextLocation =
      primaryPlace?.name ||
      primaryPlace?.address ||
      existingLocation ||
      "선택한 장소";

    let targetTripId = resolvedExistingTripId;
    let targetServerTripId = resolvedExistingTripId;
    const serverPlaceMap: Record<string, { tripPlaceId?: number | string }> = {};

    try {
      setSubmitLoading(true);

      try {
        if (!targetServerTripId) {
          const tripResponse = await createTrip({
            title: tripName,
            startDate,
            endDate,
            travelStyles: ["HEALING"],
          });

          targetTripId = tripResponse.tripId;
          targetServerTripId = tripResponse.tripId;
        }

        if (targetServerTripId) {
          for (const place of placesToSubmit) {
            const response = await addTripLocation(targetServerTripId, selectedDay, {
              place_id: place.googlePlaceId ?? place.placeId,
              name: place.name,
              visitTime: null,
              endTime: null,
              memo: null,
            });

            serverPlaceMap[place.placeId] = {
              tripPlaceId: response.tripPlaceId,
            };
          }
        }

        console.log("[AddScheduleLocation] 서버 일정/장소 저장 완료:", {
          targetTripId,
          targetServerTripId,
          selectedDay,
          count: placesToSubmit.length,
          serverPlaceMap,
          placesToNavigate: placesToSubmit,
        });
      } catch (serverError) {
        console.log(
          "[AddScheduleLocation] 서버 저장 실패. 로컬 Plan.A 흐름으로 계속 진행:",
          serverError,
        );
      }

      navigateToPlanAWithPlaces({
        targetScheduleId: scheduleId,
        targetTripId,
        targetServerTripId,
        targetLocation: existingLocation || nextLocation,
        serverPlaceMap,
      });
    } catch (error) {
      console.log("일정 저장 실패:", error);

      const message =
        error instanceof Error
          ? error.message
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
    return getReviewPlaceKey(place) === expandedPlaceId;
  });

  const detailModalPlaceId =
    detailModalPlace ? getReviewPlaceKey(detailModalPlace) : "";

  const detailModalReviewInfo =
    detailModalPlaceId ? placeReviewMap[detailModalPlaceId] : undefined;

  const rawDetailModalDetail = detailModalReviewInfo?.detail as unknown;
  const rawDetailModalSummary = detailModalReviewInfo?.summary as unknown;
  const rawDetailModalFreshness = detailModalReviewInfo?.freshness as unknown;

  const detailModalDetail = unwrapApiData(rawDetailModalDetail);
  const detailModalSummary = unwrapApiData(rawDetailModalSummary);
  const detailModalFreshness = unwrapApiData(rawDetailModalFreshness);

  const rawAiSummary = getFirstText(detailModalSummary, [
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

  const detailModalReviews = useMemo(() => {
    return getDetailReviews(detailModalDetail).slice(0, 2);
  }, [detailModalDetail]);

  const reviewBasedSummary = useMemo(() => {
    return createReviewSummaryFromReviews(detailModalReviews);
  }, [detailModalReviews]);

  const detailModalAiSummary =
    rawAiSummary && !isMockLikeSummary(rawAiSummary) ?
      truncateText(rawAiSummary, 120)
    : reviewBasedSummary;

  const detailModalKeywords = useMemo(() => {
    const serverKeywords = getFirstArray(detailModalSummary, [
      "keywords",
      "keywordList",
      "tags",
      "data.keywords",
      "data.keywordList",
      "result.keywords",
      "payload.keywords",
    ]);

    if (serverKeywords.length > 0 && !isMockLikeSummary(rawAiSummary)) {
      return serverKeywords.slice(0, 4);
    }

    const reviewKeywords = createKeywordsFromReviews(detailModalReviews);

    return reviewKeywords.length > 0 ?
        reviewKeywords.slice(0, 4)
      : serverKeywords.slice(0, 4);
  }, [detailModalSummary, rawAiSummary, detailModalReviews]);

  const detailModalFreshnessStatus = getFirstText(detailModalFreshness, [
    "status",
    "freshnessStatus",
    "data.status",
    "result.status",
  ]);

  const detailModalFreshnessLabel = getFreshnessLabel(
    detailModalFreshnessStatus,
  );

  const detailModalLastUpdated = getFirstText(detailModalFreshness, [
    "lastUpdated",
    "updatedAt",
    "lastSyncedAt",
    "data.lastUpdated",
    "data.updatedAt",
    "data.lastSyncedAt",
    "result.lastUpdated",
    "result.updatedAt",
    "result.lastSyncedAt",
  ]);

  const detailModalConfidenceScore = formatConfidenceScore(
    getNumberByPath(detailModalFreshness, [
      "confidenceScore",
      "score",
      "data.confidenceScore",
      "result.confidenceScore",
    ]),
  );

  const hasFreshnessInfo = Boolean(
    detailModalFreshnessLabel ||
    detailModalLastUpdated ||
    detailModalConfidenceScore,
  );

  const detailModalOpeningHours =
    getFirstText(detailModalDetail, [
      "openingHours",
      "businessHours",
      "hours",
      "openHours",
      "operatingHours",
      "data.openingHours",
      "data.businessHours",
      "result.openingHours",
      "result.businessHours",
    ]) ||
    getFirstText(detailModalSummary, [
      "openingHours",
      "businessHours",
      "hours",
      "openHours",
      "operatingHours",
      "data.openingHours",
      "data.businessHours",
      "result.openingHours",
      "result.businessHours",
    ]) ||
    getFirstText(detailModalFreshness, [
      "openingHours",
      "businessHours",
      "hours",
      "openHours",
      "operatingHours",
      "data.openingHours",
      "data.businessHours",
      "result.openingHours",
      "result.businessHours",
    ]) ||
    getFirstText(detailModalPlace, [
      "openingHours",
      "businessHours",
      "hours",
    ]) ||
    "운영 시간 정보 없음";

  const modalAddress = shortenAddress(
    getFirstText(detailModalDetail, [
      "address",
      "formattedAddress",
      "data.address",
      "result.address",
    ]) || detailModalPlace?.address,
  );

  const modalRating =
    getNumberByPath(detailModalDetail, [
      "rating",
      "data.rating",
      "result.rating",
    ]) ?? detailModalPlace?.rating;

  const hasAnyRealDetailContent = Boolean(
    detailModalAiSummary ||
    detailModalKeywords.length > 0 ||
    detailModalReviews.length > 0 ||
    hasFreshnessInfo,
  );

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
            const reviewPlaceKey = getReviewPlaceKey(place);

            const isPreview = placeId === "empty-preview-1";
            const isSelected = selectedPlaces.some(
              (item) => item.placeId === placeId,
            );
            const isDetailLoading = detailLoadingPlaceId === placeId;
            const isReviewLoading = reviewLoadingPlaceId === reviewPlaceKey;

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
                  onPress={() => handleTogglePlaceReview(place)}
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
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.detailModalScrollContent}
            >
              <View style={styles.detailHeaderRow}>
                <View style={styles.detailIconCircle}>
                  <Text style={styles.detailIconEmoji}>🎡</Text>
                </View>

                <View style={styles.detailTitleArea}>
                  <Text style={styles.detailTitle} numberOfLines={1}>
                    {detailModalPlace?.name ?? "장소 상세 정보"}
                  </Text>

                  <Text style={styles.detailAddress} numberOfLines={1}>
                    {modalAddress}
                  </Text>

                  <View style={styles.detailMetaRow}>
                    <Ionicons name="star" size={14} color="#FFD600" />

                    <Text style={styles.detailMetaText}>
                      {typeof modalRating === "number" ?
                        modalRating.toFixed(2)
                      : "평점 정보 없음"}
                    </Text>

                    <Text style={styles.detailMetaDot}>·</Text>

                    <Ionicons name="time-outline" size={15} color="#8DC7FF" />

                    <Text style={styles.detailMetaText} numberOfLines={1}>
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
                  {detailModalAiSummary ?
                    <View style={styles.aiSummaryCard}>
                      <Text style={styles.aiSummaryText} numberOfLines={4}>
                        📊 {detailModalAiSummary}
                      </Text>

                      <View style={styles.aiCircleBadge}>
                        <Text style={styles.aiCircleText}>AI</Text>
                      </View>
                    </View>
                  : null}

                  {detailModalKeywords.length > 0 ?
                    <View style={styles.keywordSection}>
                      <View style={styles.keywordWrap}>
                        {detailModalKeywords.map((keywordItem) => (
                          <View
                            key={`keyword-${keywordItem}`}
                            style={styles.keywordChip}
                          >
                            <Text style={styles.keywordChipText}>
                              #{keywordItem}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  : null}

                  {detailModalReviews.length > 0 ?
                    <View style={styles.reviewSection}>
                      <View style={styles.reviewSectionHeader}>
                        <Text style={styles.reviewSectionTitle}>실제 리뷰</Text>
                        <Text style={styles.reviewSectionSubtitle}>
                          Google 기반
                        </Text>
                      </View>

                      <View style={styles.reviewList}>
                        {detailModalReviews.map((review, index) => (
                          <View
                            key={`detail-review-${index}-${review.text}`}
                            style={styles.reviewCard}
                          >
                            <View style={styles.reviewIconCircle}>
                              <Text style={styles.googleIcon}>G</Text>
                            </View>

                            <View style={styles.platformTextBox}>
                              <View style={styles.reviewMetaRow}>
                                {typeof review.rating === "number" ?
                                  <>
                                    <Ionicons
                                      name="star"
                                      size={12}
                                      color="#FFD600"
                                    />
                                    <Text style={styles.reviewRatingText}>
                                      {review.rating.toFixed(1)}
                                    </Text>
                                  </>
                                : null}

                                {review.relativeTimeDescription ?
                                  <Text style={styles.reviewTimeText}>
                                    {review.relativeTimeDescription}
                                  </Text>
                                : null}
                              </View>

                              <Text
                                style={styles.platformText}
                                numberOfLines={3}
                              >
                                {truncateText(review.text)}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  : null}

                  {hasFreshnessInfo ?
                    <View style={styles.freshnessCard}>
                      <View style={styles.freshnessIconBox}>
                        <Ionicons
                          name="shield-checkmark-outline"
                          size={18}
                          color="#2158E8"
                        />
                      </View>

                      <View style={styles.freshnessContent}>
                        <Text style={styles.freshnessTitle}>정보 최신성</Text>

                        <Text style={styles.freshnessText} numberOfLines={2}>
                          {detailModalFreshnessLabel}
                          {detailModalConfidenceScore ?
                            ` · 신뢰도 ${detailModalConfidenceScore}`
                          : ""}
                          {detailModalLastUpdated ?
                            ` · ${detailModalLastUpdated} 기준`
                          : ""}
                        </Text>
                      </View>
                    </View>
                  : null}

                  {!hasAnyRealDetailContent ?
                    <View style={styles.emptyDetailBox}>
                      <Ionicons
                        name="information-circle-outline"
                        size={24}
                        color="#94A3B8"
                      />
                      <Text style={styles.emptyDetailText}>
                        표시할 상세 정보가 없습니다.
                      </Text>
                    </View>
                  : null}
                </>
              }

              <TouchableOpacity
                style={styles.compactButton}
                activeOpacity={0.85}
                onPress={() => setExpandedPlaceId(null)}
              >
                <Text style={styles.compactButtonText}>간략히</Text>
                <Ionicons name="chevron-up" size={18} color="#7A889B" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    backgroundColor: "rgba(15, 23, 42, 0.24)",
    justifyContent: "center",
    paddingHorizontal: 26,
  },

  detailModalCard: {
    maxHeight: "78%",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: "#DDE6F1",
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 14,
  },

  detailModalScrollContent: {
    paddingBottom: 2,
  },

  detailHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  detailIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFD0F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  detailIconEmoji: {
    fontSize: 26,
  },

  detailTitleArea: {
    flex: 1,
    paddingTop: 1,
  },

  detailTitle: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 6,
  },

  detailAddress: {
    color: "#A7B2C3",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 9,
  },

  detailMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  detailMetaText: {
    flexShrink: 1,
    color: "#111827",
    fontSize: 13,
    fontWeight: "900",
    marginLeft: 4,
  },

  detailMetaDot: {
    color: "#A7B2C3",
    fontSize: 13,
    fontWeight: "900",
    marginHorizontal: 7,
  },

  detailLoadingBox: {
    minHeight: 180,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  detailLoadingText: {
    marginTop: 12,
    color: "#617087",
    fontSize: 14,
    fontWeight: "900",
  },

  aiSummaryCard: {
    position: "relative",
    minHeight: 78,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C7DCFF",
    backgroundColor: "#EEF5FF",
    paddingLeft: 15,
    paddingRight: 52,
    paddingVertical: 13,
    justifyContent: "center",
    marginBottom: 11,
    overflow: "visible",
  },

  aiSummaryText: {
    color: "#2F6BFF",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 21,
  },

  aiCircleBadge: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },

  aiCircleText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  keywordSection: {
    marginBottom: 12,
  },

  keywordWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  keywordChip: {
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  keywordChipText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "900",
  },

  reviewSection: {
    marginBottom: 2,
  },

  reviewSectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  reviewSectionTitle: {
    color: "#1E293B",
    fontSize: 13,
    fontWeight: "900",
  },

  reviewSectionSubtitle: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "800",
  },

  reviewList: {
    gap: 9,
    marginBottom: 12,
  },

  reviewCard: {
    minHeight: 72,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#DDE6F1",
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  reviewIconCircle: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },

  platformTextBox: {
    flex: 1,
    marginLeft: 9,
  },

  reviewMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 3,
  },

  reviewRatingText: {
    color: "#1E293B",
    fontSize: 11,
    fontWeight: "900",
  },

  reviewTimeText: {
    marginLeft: 5,
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "800",
  },

  platformText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },

  googleIcon: {
    color: "#4285F4",
    fontSize: 16,
    fontWeight: "900",
  },

  freshnessCard: {
    minHeight: 58,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#DDE6F1",
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  freshnessIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  freshnessContent: {
    flex: 1,
  },

  freshnessTitle: {
    color: "#1E293B",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 3,
  },

  freshnessText: {
    color: "#8A97A8",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 16,
  },

  emptyDetailBox: {
    minHeight: 96,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    gap: 8,
  },

  emptyDetailText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "800",
  },

  compactButton: {
    alignSelf: "center",
    width: "92%",
    height: 46,
    borderRadius: 13,
    backgroundColor: "#F4F7FA",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 1,
  },

  compactButtonText: {
    color: "#8A97A8",
    fontSize: 17,
    fontWeight: "900",
  },
});
