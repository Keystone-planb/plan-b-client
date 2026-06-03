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
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { getAnalyzedPlaceDetail } from "../../api/places/place";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getPlaceDetail,
  getPlaceFreshness,
  getPlaceSummary,
  searchPlaces,
  getPlaceAnalysisStatus,
} from "../../api/places/searchPlaces";
import { reanalyzePlace } from "../../api/places/place";
import {
  PlaceFreshnessResponse,
  PlaceSearchResult,
  PlaceSummaryResponse,
} from "../../api/places/place";
import { reportPreferenceFeedback } from "../../api/preferences/preferences";
import { addTripLocation, createTrip } from "../../api/schedules/server";
import SearchResultCard from "../components/location/SearchResultCard";
import PlaceDetailBottomSheet from "../components/location/PlaceDetailBottomSheet";
import { usePlaceReview } from "../hooks/location/usePlaceReview";
import {
  createKeywordsFromReviews,
  createReviewSummaryFromReviews,
  formatConfidenceScore,
  getDetailReviews,
  getFreshnessLabel,
  getMoodLabel,
  getPlaceTypeLabel,
  getSpaceLabel,
  isMockLikeSummary,
  isUsefulReviewText,
  shortenAddress,
} from "../utils/location/reviewUtils";

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
  latitude?: number;
  longitude?: number;
};

type PlaceReviewInfo = {
  detail?: unknown;
  summary?: PlaceSummaryResponse;
  freshness?: PlaceFreshnessResponse;
};

const getUniquePlaces = <T extends { placeId: string; googlePlaceId?: string }>(
  places: T[],
) => {
  const seen = new Set<string>();

  return places.filter((place) => {
    const key = String(place.googlePlaceId ?? place.placeId);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const INITIAL_REGION = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.014,
  longitudeDelta: 0.014,
};

const REVIEW_TEXT_MAX_LENGTH = 80;

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


const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const hasUsefulReviewPayload = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return false;

  const target = payload as Record<string, any>;

  return [
    target.reviewSummary,
    target.aiSummary,
    target.summary,
    target.googleReview,
    target.naverReview,
    target.data?.reviewSummary,
    target.data?.aiSummary,
    target.data?.googleReview,
    target.data?.naverReview,
    target.result?.reviewSummary,
    target.result?.aiSummary,
    target.result?.googleReview,
    target.result?.naverReview,
  ].some(isUsefulReviewText);
};

const isAnalysisStatusCompleted = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return false;

  const statusObject = payload as Record<string, any>;
  const status = String(
    statusObject.status ??
      statusObject.analysisStatus ??
      statusObject.data?.status ??
      statusObject.result?.status ??
      "",
  ).toUpperCase();

  return (
    status === "COMPLETE" ||
    status === "COMPLETED" ||
    status === "DONE" ||
    status === "SUCCESS" ||
    status === "READY" ||
    statusObject.ready === true ||
    statusObject.completed === true ||
    statusObject.isCompleted === true ||
    statusObject.isAnalyzed === true
  );
};

export default function AddScheduleLocationScreen({
  navigation,
  route,
}: Props) {
  const inputRef = useRef<TextInput>(null);
  const submitLockRef = useRef(false);
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
  const [focusedCoord, setFocusedCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<SelectedPlace[]>([]);
  const [businessHoursExpanded, setBusinessHoursExpanded] = useState(false);

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
        latitude: place.latitude ?? INITIAL_REGION.latitude,
        longitude: place.longitude ?? INITIAL_REGION.longitude,
        latitudeDelta: 0.014,
        longitudeDelta: 0.014,
      },
      350,
    );
  };

  // 검색 결과에는 좌표가 없으므로, 좌표가 없으면 상세조회(getPlaceDetail)로 가져와 지도를 이동한다.
  // getPlaceDetail은 내부 캐시가 있어 같은 장소 재조회 시 추가 네트워크 호출이 없다.
  const focusMapOnPlace = async (place: {
    placeId?: string | number;
    googlePlaceId?: string;
    latitude?: number | null;
    longitude?: number | null;
  }) => {
    const moveTo = (latitude: number, longitude: number) => {
      setFocusedCoord({ latitude, longitude });
      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.014,
          longitudeDelta: 0.014,
        },
        350,
      );
    };

    if (
      typeof place.latitude === "number" &&
      typeof place.longitude === "number"
    ) {
      moveTo(place.latitude, place.longitude);
      return;
    }

    const detailId = place.googlePlaceId ?? place.placeId;
    if (!detailId) return;

    try {
      const detail = await getPlaceDetail(detailId);
      const lat =
        typeof detail.latitude === "number" ? detail.latitude : detail.lat;
      const lng =
        typeof detail.longitude === "number" ? detail.longitude : detail.lng;

      if (typeof lat === "number" && typeof lng === "number") {
        moveTo(lat, lng);
      } else if (__DEV__) {
        console.log("[MAP MOVE] detail에 좌표 없음:", { detailId, lat, lng });
      }
    } catch (error) {
      if (__DEV__) {
        console.log("[MAP MOVE] getPlaceDetail 실패:", error);
      }
    }
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

      const places = await searchPlaces(trimmedKeyword);

      console.log("[AddScheduleLocation] searchPlaces result:", {
        count: places.length,
      });

      setSearchResults(places);
      Keyboard.dismiss();

      // 검색 후 가장 위에 뜨는 장소로 지도를 자동 이동한다(좌표는 상세조회로 보강).
      if (places[0]) {
        focusMapOnPlace(places[0]);
      }
    } catch (error) {
      console.log("[AddScheduleLocation] searchPlaces failed:", error);

      setSearchResults([]);
      setExpandedPlaceId(null);
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
    const hasSearchCoordinate =
      typeof place.latitude === "number" && typeof place.longitude === "number";

    try {
      setDetailLoadingPlaceId(placeId);

      const detail =
        hasSearchCoordinate ? null : (
          await getAnalyzedPlaceDetail(googlePlaceId)
        );

      const nextPlace: SelectedPlace = {
        placeId,
        googlePlaceId,
        name: place.name,
        address: place.address,
        rating: place.rating,
        category: place.category,
        latitude: detail?.lat ?? place.latitude,
        longitude: detail?.lng ?? place.longitude,
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
        latitude: place.latitude,
        longitude: place.longitude,
      };

      toggleSelectedPlace(fallbackPlace);
      setKeyword(place.name);
      moveMapToPlace(fallbackPlace);
    } finally {
      setDetailLoadingPlaceId(null);
    }
  };

  const hasAnalyzedTagsInDetail = (detail: unknown) => {
    if (!detail || typeof detail !== "object") return false;
    const target = detail as Record<string, any>;
    const tags = target.tags;

    if (tags && typeof tags === "object" && !Array.isArray(tags)) {
      if (
        (Array.isArray(tags.space) && tags.space.length > 0) ||
        (Array.isArray(tags.type) && tags.type.length > 0) ||
        (Array.isArray(tags.mood) && tags.mood.length > 0)
      ) {
        return true;
      }
    }

    return Boolean(
      target.spaceTags?.length ||
      target.typeTags?.length ||
      target.moodTags?.length ||
      target.space ||
      target.type ||
      target.mood,
    );
  };

  const {
    expandedPlaceId,
    setExpandedPlaceId,
    reviewLoadingPlaceId,
    placeReviewMap,
    reanalyzeSuccessMessage,
    reanalyzeLoadingPlaceId,
    reanalyzeLoadingMessage,
    handleTogglePlaceReview,
    handleReanalyzePlace,
  } = usePlaceReview<PlaceSearchResult>({
    getReviewPlaceKey,
    getPlaceDetail,
    getPlaceSummary,
    getPlaceAnalysisStatus,
    reanalyzePlace,
    hasUsefulReviewPayload,
    hasAnalyzedTagsInDetail,
    isAnalysisStatusCompleted,
    unwrapApiData,
    wait,
  });

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
      selectedDay,
      day: selectedDay,
      isEditMode: true,
      refreshPlanAAt: Date.now(),
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

  const handleNext = async (overridePlaces?: SelectedPlace[]) => {
    if (submitLoading || submitLockRef.current) {
      console.log("[AddScheduleLocation] 중복 저장 실행 차단:", {
        submitLoading,
        locked: submitLockRef.current,
      });
      return;
    }

    submitLockRef.current = true;

    const placesToSubmit = getUniquePlaces(overridePlaces ?? selectedPlaces);

    const duplicatePlaceIds = new Set<string>();

    const filteredPlacesToSubmit = placesToSubmit.filter((place) => {
      const key = String(
        place.placeId ??
        place.googlePlaceId ??
        "",
      );

      if (!key) return true;

      if (duplicatePlaceIds.has(key)) {
        console.log("[QA_DUPLICATE] blocked duplicate submit:", {
          placeId: key,
          name: place.name,
        });

        return false;
      }

      duplicatePlaceIds.add(key);
      return true;
    });
    if (placesToSubmit.length === 0) {
      submitLockRef.current = false;
      return;
    }

    if (!tripName || !startDate || !endDate) {
      submitLockRef.current = false;
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
    const serverPlaceMap: Record<string, { tripPlaceId?: number | string }> =
      {};

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
          for (const place of filteredPlacesToSubmit) {
            console.log("[QA_DUPLICATE] before addTripLocation:", {
              file: "AddScheduleLocationScreen.native.tsx",
              tripId: targetServerTripId,
              selectedDay,
              placeId: place.placeId,
              googlePlaceId: place.googlePlaceId,
              name: place.name,
            });

            const response = await addTripLocation(
              targetServerTripId,
              selectedDay,
              {
                place_id: place.googlePlaceId ?? place.placeId,
                name: place.name,
                category: place.category,
                visitTime: null,
                endTime: null,
                memo: null,
                transportMode,
              },
            );

            console.log("[QA_DUPLICATE] after addTripLocation:", {
              file: "AddScheduleLocationScreen.native.tsx",
              tripPlaceId: response.tripPlaceId,
              placeId: place.placeId,
              googlePlaceId: place.googlePlaceId,
              name: place.name,
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
        placesToNavigate: placesToSubmit,
      });
    } catch (error) {
      console.log("일정 저장 실패:", error);

      const message =
        error instanceof Error ?
          error.message
        : "여행 일정을 저장하지 못했습니다.";

      Alert.alert("일정 저장 실패", message);
    } finally {
      submitLockRef.current = false;
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
    "ai_summary",
    "ai_summary",
    "ai_summary",
    "ai_summary",
    "aiSummary",
    "summary",
    "reviewSummary",
    "placeSummary",
    "content",
    "message",
    "description",
    "overallSummary",
    "totalSummary",
    "data.ai_summary",
    "data.ai_summary",
    "data.ai_summary",
    "data.ai_summary",
    "data.aiSummary",
    "data.summary",
    "data.reviewSummary",
    "data.placeSummary",
    "result.ai_summary",
    "result.ai_summary",
    "result.ai_summary",
    "result.ai_summary",
    "result.aiSummary",
    "result.summary",
    "payload.ai_summary",
    "payload.ai_summary",
    "payload.ai_summary",
    "payload.ai_summary",
    "payload.aiSummary",
    "payload.summary",
  ]);

  const detailModalRawGoogleReviews = useMemo(() => {
    return getDetailReviews(detailModalDetail).slice(0, 5);
  }, [detailModalDetail]);

  const detailModalReviews = useMemo(() => {
    const getPlatformReviewText = (paths: string[]) => {
      const summaryText = getFirstText(detailModalSummary, paths).trim();
      const detailText = getFirstText(detailModalDetail, paths).trim();

      return summaryText || detailText;
    };

    const googleAiReviewText = getPlatformReviewText([
      "googleReview",
      "data.googleReview",
      "result.googleReview",
      "payload.googleReview",
    ]);

    const googleRawReviewText = detailModalRawGoogleReviews
      .map((review) => {
        const ratingText =
          typeof review.rating === "number" ?
            `평점 ${review.rating.toFixed(1)}`
          : "리뷰";

        const timeText =
          review.relativeTimeDescription ?
            ` · ${review.relativeTimeDescription}`
          : "";

        return `${ratingText}${timeText}\n${truncateText(
          review.text,
          REVIEW_TEXT_MAX_LENGTH,
        )}`;
      })
      .filter(Boolean)
      .join("\n\n");

    const googleReviewText =
      isUsefulReviewText(googleAiReviewText) ? googleAiReviewText
      : isUsefulReviewText(googleRawReviewText) ? googleRawReviewText
      : "Google 리뷰 정보가 없습니다.";

    const naverReviewText = getPlatformReviewText([
      "naverReview",
      "data.naverReview",
      "result.naverReview",
      "payload.naverReview",
    ]);

    return [
      {
        id: "googleReview",
        platform: "Google",
        logoType: "google",
        text: truncateText(googleReviewText, REVIEW_TEXT_MAX_LENGTH),
      },
      {
        id: "naverReview",
        platform: "Naver",
        logoType: "naver",
        text:
          isUsefulReviewText(naverReviewText) ?
            truncateText(naverReviewText, REVIEW_TEXT_MAX_LENGTH)
          : "Naver 리뷰 정보가 없습니다.",
      },
    ];
  }, [detailModalDetail, detailModalRawGoogleReviews, detailModalSummary]);

  const reviewBasedSummary = createReviewSummaryFromReviews(
    detailModalRawGoogleReviews,
  );

  const rawDetailReviewSummary = getFirstText(detailModalDetail, [
    "reviewSummary",
    "data.reviewSummary",
    "result.reviewSummary",
    "payload.reviewSummary",
  ]);

  const detailModalAiSummary =
    ((
      rawAiSummary.includes("분석된 리뷰 정보가 없습니다") ||
      rawAiSummary.includes("데이터 부족") ||
      isMockLikeSummary(rawAiSummary)
    ) ?
      ""
    : rawAiSummary.trim()) ||
    ((
      rawDetailReviewSummary.includes("분석된 리뷰 정보가 없습니다") ||
      rawDetailReviewSummary.includes("데이터 부족") ||
      isMockLikeSummary(rawDetailReviewSummary)
    ) ?
      ""
    : rawDetailReviewSummary.trim()) ||
    reviewBasedSummary ||
    "리뷰 정보가 없습니다.";

  const detailModalKeywords = useMemo(() => {
    return createKeywordsFromReviews(detailModalRawGoogleReviews);
  }, [detailModalRawGoogleReviews]);

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

  const formattedOpeningHours =
    (
      detailModalOpeningHours &&
      detailModalOpeningHours !== "운영 시간 정보 없음"
    ) ?
      detailModalOpeningHours
        .split(" / ")
        .map((item) => item.trim())
        .filter(Boolean)
        .join("\n")
    : "";

  const detailRaw = detailModalDetail as any;
  const summaryRaw = detailModalSummary as any;

  const serverDetailTags = [
    getSpaceLabel(
      detailRaw?.tags?.space ??
        detailRaw?.data?.tags?.space ??
        detailRaw?.result?.tags?.space ??
        detailRaw?.payload?.tags?.space ??
        detailRaw?.space ??
        detailRaw?.spaceType ??
        summaryRaw?.tags?.space ??
        summaryRaw?.data?.tags?.space ??
        summaryRaw?.result?.tags?.space ??
        summaryRaw?.payload?.tags?.space ??
        summaryRaw?.space ??
        summaryRaw?.spaceType,
    ),
    getPlaceTypeLabel(
      detailRaw?.tags?.type ??
        detailRaw?.data?.tags?.type ??
        detailRaw?.result?.tags?.type ??
        detailRaw?.payload?.tags?.type ??
        detailRaw?.type ??
        detailRaw?.placeType ??
        detailRaw?.category ??
        summaryRaw?.tags?.type ??
        summaryRaw?.data?.tags?.type ??
        summaryRaw?.result?.tags?.type ??
        summaryRaw?.payload?.tags?.type ??
        summaryRaw?.type ??
        summaryRaw?.placeType ??
        summaryRaw?.category,
    ),
    getMoodLabel(
      detailRaw?.tags?.mood ??
        detailRaw?.data?.tags?.mood ??
        detailRaw?.result?.tags?.mood ??
        detailRaw?.payload?.tags?.mood ??
        detailRaw?.mood ??
        detailRaw?.placeMood ??
        summaryRaw?.tags?.mood ??
        summaryRaw?.data?.tags?.mood ??
        summaryRaw?.result?.tags?.mood ??
        summaryRaw?.payload?.tags?.mood ??
        summaryRaw?.mood ??
        summaryRaw?.placeMood,
    ),
  ].filter(Boolean);

  const detailTags = serverDetailTags.slice(0, 3);

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
          provider={PROVIDER_GOOGLE}
          initialRegion={INITIAL_REGION}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          rotateEnabled={false}
        >
          {searchResults
            .filter(
              (place) =>
                typeof place.latitude === "number" &&
                typeof place.longitude === "number",
            )
            .map((place, index) => {
              const placeId = String(place.placeId);
              const isSelected = selectedPlaces.some(
                (selectedPlace) => String(selectedPlace.placeId) === placeId,
              );

              return (
                <Marker
                  key={`search-marker-${placeId}`}
                  coordinate={{
                    latitude: place.latitude as number,
                    longitude: place.longitude as number,
                  }}
                  title={place.name}
                  description={place.address}
                  tracksViewChanges={true}
                >
                  <View
                    style={[
                      styles.markerBadge,
                      isSelected && styles.selectedMarkerBadge,
                    ]}
                  >
                    <Text style={styles.markerBadgeText}>{index + 1}</Text>
                  </View>
                </Marker>
              );
            })}

          {focusedCoord ? (
            <Marker
              key="focused-place-marker"
              coordinate={focusedCoord}
              tracksViewChanges={false}
            />
          ) : null}
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

              <Text style={styles.selectedSummaryText}>
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
            const isReviewLoading =
              reviewLoadingPlaceId === reviewPlaceKey &&
              expandedPlaceId !== reviewPlaceKey;

            return (
              <SearchResultCard
                key={`place-${placeId}`}
                place={place}
                isPreview={isPreview}
                isSelected={isSelected}
                isDetailLoading={isDetailLoading}
                isReviewLoading={isReviewLoading}
                onCardPress={() => focusMapOnPlace(place)}
                onDetailPress={() => {
                  if (
                    typeof place.latitude === "number" &&
                    typeof place.longitude === "number"
                  ) {
                    mapRef.current?.animateToRegion(
                      {
                        latitude: place.latitude,
                        longitude: place.longitude,
                        latitudeDelta: 0.014,
                        longitudeDelta: 0.014,
                      },
                      350,
                    );
                  }

                  handleTogglePlaceReview(place);
                }}
                onSelectPress={() =>
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
              />
            );
          })}
        </ScrollView>
      </View>

      <PlaceDetailBottomSheet
        visible={Boolean(detailModalPlace)}
        place={detailModalPlace}
        address={modalAddress}
        rating={modalRating}
        tags={detailTags}
        formattedOpeningHours={formattedOpeningHours}
        businessHoursExpanded={businessHoursExpanded}
        isLoading={
          reviewLoadingPlaceId === detailModalPlaceId && !detailModalReviewInfo
        }
        reanalyzeDisabled={reanalyzeLoadingPlaceId === detailModalPlaceId}
        aiSummary={detailModalAiSummary}
        reviews={detailModalReviews}
        hasAnyRealDetailContent={hasAnyRealDetailContent}
        onClose={() => setExpandedPlaceId(null)}
        onToggleBusinessHours={() =>
          setBusinessHoursExpanded((prev) => !prev)
        }
        onReanalyze={() => {
          if (detailModalPlace) {
            handleReanalyzePlace(detailModalPlace);
          }
        }}
      />
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

  // 지도 위에 검색바 오버레이(절대배치)가 떠 있으므로 지도도 절대배치 레이어로 유지하되,
  // Android에서 stretch(bottom:0) 높이가 0으로 측정되는 버그를 피하려고 명시적 height를 준다.
  map: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 335,
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

  selectedMarkerBadge: {
    backgroundColor: "#EF4444",
    borderColor: "#FFFFFF",
    transform: [{ scale: 1.12 }],
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
    height: 52,
    paddingVertical: 0,
    textAlignVertical: "center",
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








  detailTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginBottom: 18,
  },

  detailTagPill: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  detailTagText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "800",
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


















});
