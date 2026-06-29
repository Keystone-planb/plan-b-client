import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { trackEvent, AMP } from "../utils/amplitude";
import { loadPlanASchedule } from "../api/schedules/planAStorage";
import type { RecommendedPlace } from "../types/recommendation";
import { getPlaceCategoryIcon } from "../utils/placeCategoryIcon";
import { useRecommendationToast } from "../hooks/recommendation/useRecommendationToast";
import {
  getCurrentPlanIdCandidates as getCurrentPlanIdCandidatesFromHook,
  getPreviewSchedulePayload as getPreviewSchedulePayloadFromHook,
  executePlanRecommendationReplace,
  executeWeatherRecommendationReplace,
} from "../hooks/recommendation/useRecommendationReplace";
import { useRecommendationPreview } from "../hooks/recommendation/useRecommendationPreview";
import { useRecommendationReviewDetails } from "../hooks/recommendation/useRecommendationReviewDetails";
import { useRecommendationReviewActions } from "../hooks/recommendation/useRecommendationReviewActions";
import {
  formatDateRange,
  formatOpeningHoursText,
  formatTodayOpeningHoursText,
  getMoodLabel,
  getPreviewTimeText,
  padPreviewTime,
  getSpaceLabel,
  getTypeLabel,
  safeParseJson,
} from "../utils/recommendation/recommendationFormatters";
import RecommendationPreviewModal from "../components/recommendation/RecommendationPreviewModal";
import RecommendationPlaceList from "../components/recommendation/RecommendationPlaceList";
import RecommendationResultPlaceCard from "../components/recommendation/RecommendationResultPlaceCard";
import RecommendationPlaceMainInfo from "../components/recommendation/RecommendationPlaceMainInfo";
import RecommendationTagRow from "../components/recommendation/RecommendationTagRow";
import RecommendationOpeningHours from "../components/recommendation/RecommendationOpeningHours";
import RecommendationAiSummaryBox from "../components/recommendation/RecommendationAiSummaryBox";
import RecommendationReviewDetailBox from "../components/recommendation/RecommendationReviewDetailBox";
import RecommendationSelectButton from "../components/recommendation/RecommendationSelectButton";
import WhiteToast from "../components/recommendation/WhiteToast";
import type { RecommendationTransportMode } from "../components/recommendation/RecommendationTransportCard";
import { styles } from "./RecommendationResultScreen.styles";
import {
  getAlternativeImpact,
  type AlternativeImpactResponse,
} from "../../api/schedules/server";

type TransportMode = "WALK" | "TRANSIT" | "CAR";
type MoveTime = "10" | "20" | "30" | "ANY";
type PlaceScope = "INDOOR" | "OUTDOOR";

const alternativeImpactCache = new Map<
  string,
  AlternativeImpactResponse
>();

type TodayPlace = {
  id?: string | number;
  tripPlaceId?: string | number;
  serverTripPlaceId?: string | number;
  placeId?: string;
  googlePlaceId?: string;
  name?: string;
  address?: string;
  time?: string;
  visitTime?: string | null;
  endTime?: string | null;
  latitude?: number;
  longitude?: number;
};

type RootStackParamList = {
  Main:
    | {
        refreshMainAt?: number;
        replacedTripId?: string | number;
        replacedTripPlaceId?: string | number;
      }
    | undefined;
  PlanA: {
    scheduleId?: string;
    tripId?: string | number;
    serverTripId?: string | number;
    tripName?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    transportMode?: TransportMode;
    transportLabel?: string;
    selectedDay?: number;
    selectedPlace?: undefined;
    selectedPlaces?: undefined;
  };
  OngoingSchedule: {
    scheduleId?: string;
    tripId?: string | number;
    serverTripId?: string | number;
    tripName?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    transportMode?: TransportMode;
    transportLabel?: string;
  };
  RecommendationResult: {
    scheduleId?: string;
    tripId?: string | number;
    serverTripId?: string | number;
    tripName?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    transportMode?: TransportMode;
    transportLabel?: string;
    moveTime?: MoveTime;
    considerDistance?: boolean;
    changeCategory?: boolean;
    placeScope?: PlaceScope;
    targetPlace?: TodayPlace;
    currentPlanId?: string | number;
    tripPlaceId?: string | number;
    serverTripPlaceId?: string | number;

    placesJson?: string;
    source?: "weather-notification" | string;
    fromWeatherNotification?: boolean;
    notificationId?: string | number;
    day?: number;
    selectedDay?: number;
    fromAIAnalysis?: boolean;
    hasError?: boolean;
    title?: string;
    recommendationType?: "PLACE" | "GAP" | "WEATHER" | "alternative" | "gap" | "weather";
  };
};

type Props = NativeStackScreenProps<RootStackParamList, "RecommendationResult">;

type DisplayPlace = RecommendedPlace & {
  placeId?: string | number;
  name: string;
  category?: string;
  type?: string;
  mood?: string;
  space?: string;
  rating?: number;
  reviewCount?: number;
  userRatingsTotal?: number;
  address?: string;
  reviewSummary?: string;
  googleReview?: string;
  naverReview?: string;
  phone?: string;
  phoneNumber?: string;
  website?: string;
  openingHours?: string | null;
  reviewData?: string | null;
  priceLevel?: number;
  reason?: string;
  suggestedVisitTime?: string | null;
  suggestedEndTime?: string | null;
  sourceSummary?: {
    naver?: string;
    google?: string;
  };
};

















const getPlatformReviewSummary = (
  value: unknown,
  platform: "Naver" | "Google",
) => {
  const parsed = safeParseJson(value);
  const summary = parsed?.platformSummaries?.[platform];

  return typeof summary === "string" ? summary.trim() : "";
};







export default function RecommendationResultScreen({
  navigation,
  route,
}: Props) {
  const [selectedPlaceId, setSelectedPlaceId] = useState<
    string | number | null
  >(null);
  const [submittingPlaceId, setSubmittingPlaceId] = useState<
    string | number | null
  >(null);

  const [pendingPlace, setPendingPlace] =
    useState<DisplayPlace | null>(null);

  const [impactResult, setImpactResult] =
    useState<AlternativeImpactResponse | null>(null);
  const [previousImpactMode, setPreviousImpactMode] =
    useState<RecommendationTransportMode>("WALK");
  const [nextImpactMode, setNextImpactMode] =
    useState<RecommendationTransportMode>("WALK");
  const [impactLoading, setImpactLoading] = useState(false);
  const impactRequestIdRef = useRef(0);

  const { whiteToast, showWhiteToast } = useRecommendationToast();

  const {
    expandedPlaceId,
    setExpandedPlaceId,
    expandedHoursPlaceId,
    setExpandedHoursPlaceId,
    placeExtraDetails,
    setPlaceExtraDetails,
  } = useRecommendationReviewDetails();

  const { fetchReviewDetail } = useRecommendationReviewActions({
    placeExtraDetails,
    setPlaceExtraDetails,
  });


  const [
    savedPreviousSchedulePlace,
    setSavedPreviousSchedulePlace,
  ] = useState<TodayPlace | null>(null);

  const [
    savedOriginalSchedulePlace,
    setSavedOriginalSchedulePlace,
  ] = useState<TodayPlace | null>(null);



  const [
    savedNextSchedulePlace,
    setSavedNextSchedulePlace,
  ] = useState<TodayPlace | null>(null);

  // time_to_select_ms: 결과 화면 진입 시각 기록
  const screenOpenedAtRef = useRef(Date.now());

  const params = route.params ?? {};

  useEffect(() => {
    const initialMode = params.transportMode ?? "WALK";

    setPreviousImpactMode(initialMode);
    setNextImpactMode(initialMode);
  }, [params.transportMode]);

  const parsedPlaces = useMemo<DisplayPlace[]>(() => {
    try {
      if (!params.placesJson) return [];

      const parsed = JSON.parse(params.placesJson);

      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }, [params.placesJson]);

  const places = parsedPlaces;
  const shownPlaceIds = useMemo(() => {
    return places
      .map((place, index) => place.placeId ?? `place-${index}`)
      .filter((id) => id !== undefined && id !== null && id !== "");
  }, [places]);

  const getReplaceNavigationParams = () => ({
    scheduleId: params.scheduleId,
    tripId: params.tripId,
    serverTripId: params.serverTripId ?? params.tripId,
    tripName: params.tripName,
    startDate: params.startDate,
    endDate: params.endDate,
    location: params.location,
    transportMode: params.transportMode,
    transportLabel: params.transportMode,
  });

  const targetPlace = params.targetPlace;

  const previewData = useRecommendationPreview({
    params,
    previousPlace: savedPreviousSchedulePlace,
    alternativePlace: pendingPlace,
    nextPlace: savedNextSchedulePlace,
    initialTransportMode: params.transportMode ?? "WALK",
    initialVisitTime:
      savedOriginalSchedulePlace?.visitTime ?? targetPlace?.visitTime ?? null,
    initialEndTime:
      savedOriginalSchedulePlace?.endTime ?? targetPlace?.endTime ?? null,
    onTimeValidationError: () => {
      showWhiteToast(
        "시간 설정 확인",
        "시작 시간은 종료 시간보다 빨라야 합니다.",
        "error",
      );
    },
  });

  const {
    previewBeforeTransportMode,
    previewTransportMode,
    changePreviewTransportMode,
    changePreviewBeforeTransportMode,
    changePreviewNextTransportMode,
    previewVisitTime,
    previewEndTime,
    draftPreviewVisitTime,
    draftPreviewEndTime,
    previewTimePickerVisible,
    previewTimePickerTarget,
    previewTimePickerHour,
    previewTimePickerMinute,
    previewAppliedVisitTime,
    previewAppliedEndTime,
    initializePreviewTimes,
    openPreviewTimePicker,
    closePreviewTimePicker,
    switchPreviewTimePickerTarget,
    savePreviewTimePicker,
    decreasePreviewTimePickerHour,
    increasePreviewTimePickerHour,
    decreasePreviewTimePickerMinute,
    increasePreviewTimePickerMinute,
  } = previewData;

  useEffect(() => {
    let cancelled = false;

    const loadOriginalSchedulePlace = async () => {
      const routeParams =
        params as Record<string, unknown>;

      const currentPlanId =
        routeParams.currentPlanId ??
        routeParams.tripPlaceId ??
        routeParams.serverTripPlaceId ??
        targetPlace?.serverTripPlaceId ??
        targetPlace?.tripPlaceId ??
        targetPlace?.id;

      const scheduleId =
        typeof routeParams.scheduleId === "string"
          ? routeParams.scheduleId
          : undefined;

      if (!scheduleId || currentPlanId == null) {
        return;
      }

      try {
        const savedSchedule =
          await loadPlanASchedule(scheduleId);

        let matchedPlace: TodayPlace | undefined;
        let previousPlace: TodayPlace | undefined;
        let nextPlace: TodayPlace | undefined;

        const targetIds = [
          currentPlanId,
          routeParams.currentPlanId,
          routeParams.tripPlaceId,
          routeParams.serverTripPlaceId,
          targetPlace?.id,
          targetPlace?.tripPlaceId,
          targetPlace?.serverTripPlaceId,
          targetPlace?.placeId,
          targetPlace?.googlePlaceId,
        ]
          .filter((id) => id !== undefined && id !== null && id !== "")
          .map((id) => String(id));

        const targetName = targetPlace?.name?.trim();
        const targetAddress = targetPlace?.address?.trim();

        for (const day of savedSchedule?.days ?? []) {
          const dayPlaces = day.places as TodayPlace[];

          const matchedIndex = dayPlaces.findIndex((place) => {
            const placeIds = [
              place.id,
              place.tripPlaceId,
              place.serverTripPlaceId,
              place.placeId,
              place.googlePlaceId,
            ]
              .filter((id) => id !== undefined && id !== null && id !== "")
              .map((id) => String(id));

            const matchedById = placeIds.some((id) => targetIds.includes(id));

            if (matchedById) {
              return true;
            }

            const matchedByNameAndAddress =
              Boolean(targetName) &&
              place.name?.trim() === targetName &&
              (
                !targetAddress ||
                place.address?.trim() === targetAddress
              );

            return matchedByNameAndAddress;
          });

          if (matchedIndex >= 0) {
            matchedPlace = dayPlaces[matchedIndex];
            previousPlace = dayPlaces[matchedIndex - 1];
            nextPlace = dayPlaces[matchedIndex + 1];
            break;
          }
        }

        const normalizeSchedulePlace = (
          place?: TodayPlace,
        ): TodayPlace | null => {
          if (!place) return null;

          return {
            ...place,
            name: place.name?.trim() || "장소명 없음",
            address: place.address?.trim() || "",
            time: getPreviewTimeText(place),
          };
        };

        if (cancelled || !matchedPlace) {
          showWhiteToast(
            "일정 정보 확인 필요",
            "기존 일정 데이터를 찾지 못했습니다. 일정을 다시 불러온 뒤 시도해주세요.",
            "error",
          );
          return;
        }

        const visitTime =
          matchedPlace.visitTime ?? null;

        const endTime =
          matchedPlace.endTime ?? null;

        const combinedTime =
          getPreviewTimeText({
            ...matchedPlace,
            visitTime,
            endTime,
          });

        setSavedPreviousSchedulePlace(
          normalizeSchedulePlace(previousPlace),
        );

        setSavedOriginalSchedulePlace({
          ...matchedPlace,
          visitTime,
          endTime,
          time: combinedTime,
        });

        initializePreviewTimes(visitTime, endTime);

        setSavedNextSchedulePlace(
          normalizeSchedulePlace(nextPlace),
        );
      } catch (error) {
      }
    };

    void loadOriginalSchedulePlace();

    return () => {
      cancelled = true;
    };
  }, [
    params,
    targetPlace,
  ]);

  const originalSchedulePlace = useMemo(() => {
    const routePlace =
      targetPlace as TodayPlace | undefined;

    const sourcePlace =
      savedOriginalSchedulePlace ??
      routePlace;

    if (!sourcePlace) {
      return null;
    }

    const visitTime =
      savedOriginalSchedulePlace?.visitTime ??
      routePlace?.visitTime ??
      null;

    const endTime =
      savedOriginalSchedulePlace?.endTime ??
      routePlace?.endTime ??
      null;

    const time =
      savedOriginalSchedulePlace?.time?.trim() ||
      routePlace?.time?.trim() ||
      [visitTime, endTime]
        .filter(Boolean)
        .join(" - ");

    return {
      ...routePlace,
      ...savedOriginalSchedulePlace,
      name:
        savedOriginalSchedulePlace?.name ||
        routePlace?.name ||
        params.title ||
        "현재 진행 중인 일정",
      address:
        savedOriginalSchedulePlace?.address ||
        routePlace?.address ||
        params.location ||
        "",
      visitTime,
      endTime,
      time,
    };
  }, [
    params.location,
    params.title,
    savedOriginalSchedulePlace,
    targetPlace,
  ]);

  const currentPlaceName =
    originalSchedulePlace?.name || params.title || "현재 진행 중인 일정";
  const currentPlaceTime =
    originalSchedulePlace?.time?.trim() ||
    "시간 미정";




  const handleBack = () => {
    // 선택 없이 이탈 시 alternative_dismissed
    if (!selectedPlaceId) {
      const isWeather =
        (params as any).source === "weather-notification" ||
        (params as any).fromWeatherNotification;

      trackEvent(AMP.ALTERNATIVE_DISMISSED, {
        trip_id: params.tripId ? String(params.tripId) : undefined,
        alternatives_count: places.length,
        recommendation_type: params.recommendationType ?? "PLACE",
        source: isWeather ? "weather" : "manual",
      });
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("Main");
  };

  const handleToggleDetail = async (
    place: DisplayPlace,
    placeId: string | number,
  ) => {
    const placeKey = String(placeId);
    const isClosing = String(expandedPlaceId) === placeKey;

    setExpandedPlaceId(isClosing ? null : placeId);

    if (isClosing) return;

    trackEvent(AMP.REVIEW_CARD_OPENED, {
      place_id: String(placeId),
      place_name: place.name ?? "",
      place_category: place.category ?? "",
      sources_count: 2,
      summary_shown: Boolean(placeExtraDetails[placeKey]?.aiSummary),
      analysis_blocked: Boolean(placeExtraDetails[placeKey]?.error),
    });

    await fetchReviewDetail(place, placeId, false);
  };

  const handleRetryReview = async (
    place: DisplayPlace,
    placeId: string | number,
  ) => {
    setExpandedPlaceId(placeId);
    await fetchReviewDetail(place, placeId, true);
  };



  const getImpactPlanId = () => {
    const candidates = [
      params.currentPlanId,
      params.tripPlaceId,
      params.serverTripPlaceId,
      targetPlace?.serverTripPlaceId,
      targetPlace?.tripPlaceId,
      targetPlace?.id,
    ];

    return candidates.find(
      (value) =>
        value !== undefined &&
        value !== null &&
        String(value).trim().length > 0,
    );
  };

  const requestImpact = async (
    place: DisplayPlace,
  ) => {
    const tripPlaceId = getImpactPlanId();
    const newPlaceId = String(
      place.googlePlaceId ?? place.placeId ?? "",
    );
    const latitude = Number(place.latitude);
    const longitude = Number(place.longitude);

    if (!tripPlaceId || !newPlaceId) {
      setImpactResult(null);
      return;
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setImpactResult(null);
      showWhiteToast(
        "이동시간 계산 불가",
        "추천 장소의 좌표 정보가 없습니다.",
        "error",
      );
      return;
    }

    const cacheKey = [
      String(tripPlaceId),
      newPlaceId,
      String(latitude),
      String(longitude),
    ].join(":");

    const cachedResult = alternativeImpactCache.get(cacheKey);

    if (cachedResult) {
      setImpactResult(cachedResult);

      const cachedInitialMode =
        cachedResult.travelInMode ??
        cachedResult.travelOutMode ??
        params.transportMode ??
        "WALK";

      setPreviousImpactMode(cachedInitialMode);
      setNextImpactMode(cachedInitialMode);
      setImpactLoading(false);
      return;
    }

    const requestId = impactRequestIdRef.current + 1;
    impactRequestIdRef.current = requestId;

    try {
      setImpactLoading(true);

      const result = await getAlternativeImpact(tripPlaceId, {
        newPlaceId,
        newPlaceName: place.name,
        newLatitude: latitude,
        newLongitude: longitude,
      });

      if (requestId !== impactRequestIdRef.current) {
        return;
      }

      if (result.calcStatus === "NO_COORD") {
        setImpactResult(null);
        showWhiteToast(
          "이동시간 계산 불가",
          "추천 장소의 좌표 정보를 확인해주세요.",
          "error",
        );
        return;
      }

      alternativeImpactCache.set(cacheKey, result);
      setImpactResult(result);

      const initialMode =
        result.travelInMode ??
        result.travelOutMode ??
        params.transportMode ??
        "WALK";

      setPreviousImpactMode(initialMode);
      setNextImpactMode(initialMode);
    } catch (error) {
      if (requestId !== impactRequestIdRef.current) {
        return;
      }

      setImpactResult(null);

      showWhiteToast(
        "이동시간 조회 실패",
        error instanceof Error
          ? error.message
          : "이동시간을 계산하지 못했습니다.",
        "error",
      );
    } finally {
      if (requestId === impactRequestIdRef.current) {
        setImpactLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!pendingPlace) {
      impactRequestIdRef.current += 1;
      setImpactResult(null);
      setImpactLoading(false);
      return;
    }

    const initialMode = params.transportMode ?? "WALK";

    setPreviousImpactMode(initialMode);
    setNextImpactMode(initialMode);
    void requestImpact(pendingPlace);
  }, [pendingPlace]);

  const getImpactMinutes = (
    options:
      | AlternativeImpactResponse["travelInOptions"]
      | AlternativeImpactResponse["travelOutOptions"]
      | undefined,
    mode: RecommendationTransportMode,
  ) => {
    const matched = options?.find(
      (option) => option.mode === mode,
    );

    return matched?.minutes;
  };

  const handlePreviousImpactModeChange = (
    mode: RecommendationTransportMode,
  ) => {
    setPreviousImpactMode(mode);
    changePreviewBeforeTransportMode(mode);
  };

  const handleNextImpactModeChange = (
    mode: RecommendationTransportMode,
  ) => {
    setNextImpactMode(mode);
    changePreviewTransportMode(mode);
    changePreviewNextTransportMode(mode);
  };

  const previousImpactMinutes = getImpactMinutes(
    impactResult?.travelInOptions,
    previousImpactMode,
  );

  const nextImpactMinutes = getImpactMinutes(
    impactResult?.travelOutOptions,
    nextImpactMode,
  );

  const impactPreviousMoveTimeText =
    impactLoading && !impactResult
      ? "계산 중..."
      : previousImpactMinutes != null
        ? `${previousImpactMinutes}분`
        : "시간 정보 없음";

  const impactNextMoveTimeText =
    impactLoading && !impactResult
      ? "계산 중..."
      : nextImpactMinutes != null
        ? `${nextImpactMinutes}분`
        : "시간 정보 없음";

  const impactNextTime = (() => {
    const nextImpactPlace = impactResult?.nextPlace;

    if (!nextImpactPlace?.newVisitTime) {
      return previewData.previewNextTime;
    }

    return [
      nextImpactPlace.newVisitTime,
      nextImpactPlace.endTime,
    ]
      .filter(Boolean)
      .join(" - ");
  })();

  const getPreviewSchedulePayload = () =>
    getPreviewSchedulePayloadFromHook({
      previewVisitTime,
      previewEndTime,
      previewTransportMode,
    });

  const getCurrentPlanIdCandidates = () =>
    getCurrentPlanIdCandidatesFromHook({
      params,
      targetPlace,
    });

  const moveToPlanAAfterWeatherReplace = (
    updatedTripPlace: { day?: number | string },
  ) => {
    const replacedDay =
      Number(updatedTripPlace?.day) > 0
        ? Number(updatedTripPlace.day)
        : (params.day ?? params.selectedDay);

    navigation.replace("PlanA", {
      ...getReplaceNavigationParams(),
      day: replacedDay,
      selectedDay: replacedDay,
      isEditMode: true,
      refreshPlanAAt: Date.now(),
    } as any);
  };

  const moveToPlanAAfterReplace = (
    usedCurrentPlanId?: string | number | null,
  ) => {
    const selectedDay =
      Number((targetPlace as { day?: number | string } | undefined)?.day) > 0
        ? Number((targetPlace as { day?: number | string } | undefined)?.day)
        : undefined;

    navigation.replace("PlanA", {
      ...getReplaceNavigationParams(),
      selectedDay,
      selectedPlace: undefined,
      selectedPlaces: undefined,
      refreshPlanAAt: Date.now(),
      replacedTripPlaceId: usedCurrentPlanId,
      isEditMode: true,
    } as any);
  };

  const handleSelectPlace = async (place: DisplayPlace) => {
    const placeId = place.placeId ?? place.name;
    const selectedRank =
      places.findIndex((item) => (item.placeId ?? item.name) === placeId) + 1;

    trackEvent(AMP.ALTERNATIVE_SELECTED, {
      rank: selectedRank,
      place_id: String(place.googlePlaceId ?? place.placeId ?? ""),
      place_name: place.name ?? "",
      place_category: place.category ?? "",
      recommendation_type: params.recommendationType ?? "PLACE",
      trip_id: params.tripId ? String(params.tripId) : undefined,
      time_to_select_ms: Date.now() - screenOpenedAtRef.current,
    });

    const newGooglePlaceId = String(place.googlePlaceId ?? place.placeId ?? "");
    const isWeatherNotificationReplace =
      params.source === "weather-notification" ||
      params.fromWeatherNotification;

    if (isWeatherNotificationReplace) {
      await executeWeatherRecommendationReplace({
        placeId,
        notificationId: params.notificationId,
        newGooglePlaceId,
        newPlaceName: place.name,
        newPlaceId: place.placeId,
        previewSchedulePayload: getPreviewSchedulePayload(),
        tripId: params.tripId,
        serverTripId: params.serverTripId,
        showToast: showWhiteToast,
        setSubmittingPlaceId,
        setSelectedPlaceId,
        onSuccess: (updatedTripPlace) =>
          moveToPlanAAfterWeatherReplace(
            updatedTripPlace as { day?: number | string },
          ),
      });
      return;
    }

    await executePlanRecommendationReplace({
      place,
      placeId,
      selectedRank,
      currentPlanIdCandidates: getCurrentPlanIdCandidates(),
      newGooglePlaceId,
      newPlaceName: place.name,
      previewSchedulePayload: getPreviewSchedulePayload(),
      tripId: params.tripId,
      serverTripId: params.serverTripId,
      scheduleId: params.scheduleId,
      recommendationType: params.recommendationType,
      source: "manual",
      targetPlaceName: targetPlace?.name,
      shownPlaceIds: Array.isArray(shownPlaceIds) ? shownPlaceIds : [],
      previewVisitTime,
      previewEndTime,
      previewTransportMode,
      showToast: showWhiteToast,
      setSubmittingPlaceId,
      setSelectedPlaceId,
      onSuccess: moveToPlanAAfterReplace,
    });
  };

  const title = params.title ?? "AI 대안 추천";
  const isWeatherRecommendation =
    params.source === "weather-notification" || params.fromWeatherNotification;

  const subtitle =
    isWeatherRecommendation ?
      "날씨에 맞춰 방문하기 좋은 대안을 추천했어요"
    : "현재 일정과 조건을 기준으로 추천했어요";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.75}
          onPress={handleBack}
        >
          <Ionicons name="chevron-back" size={26} color="#6F7F95" />
        </TouchableOpacity>

        <Text style={styles.logoText}>Plan.B</Text>

        <View style={styles.headerRightSpace} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>{title}</Text>
          <Text style={styles.screenSubtitle}>{subtitle}</Text>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>기존 일정</Text>

          <View style={styles.currentScheduleCard}>
            <View style={styles.currentInfoBox}>
              <Text style={styles.currentPlaceName}>{currentPlaceName}</Text>

              <View style={styles.currentTimeRow}>
                <Ionicons name="time-outline" size={14} color="#7C8CA3" />
                <Text style={styles.currentTimeText}>{currentPlaceTime}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>AI가 찾은 대안 5개</Text>

          <RecommendationPlaceList>
            {places.map((place, index) => {
              const placeId = place.placeId ?? `place-${index}`;
              const isExpanded = String(expandedPlaceId) === String(placeId);
              const isHoursExpanded =
                String(expandedHoursPlaceId) === String(placeId);
              const isSelected = String(selectedPlaceId) === String(placeId);
              const isSubmitting =
                String(submittingPlaceId) === String(placeId);
              const placeKey = String(placeId);
              const extraDetail = placeExtraDetails[placeKey];

              return (
                <RecommendationResultPlaceCard
                  key={`recommendation-${String(placeId)}-${index}`}
                  place={place}
                  index={index}
                  isExpanded={isExpanded}
                  isHoursExpanded={isHoursExpanded}
                  isSelected={isSelected}
                  isSubmitting={isSubmitting}
                  isWeatherRecommendation={Boolean(isWeatherRecommendation)}
                  extraDetail={extraDetail}
                  onToggleHours={(targetPlaceId) =>
                    setExpandedHoursPlaceId((prev: string | number | null) =>
                      String(prev) === String(targetPlaceId)
                        ? null
                        : targetPlaceId,
                    )
                  }
                  onSelect={(selectedPlace) => {
                    setPendingPlace(selectedPlace as DisplayPlace);
                  }}
                  onRetryReview={(targetPlace, targetPlaceId) =>
                    handleRetryReview(targetPlace as DisplayPlace, targetPlaceId)
                  }
                  onToggleDetail={(targetPlace, targetPlaceId) =>
                    handleToggleDetail(targetPlace as DisplayPlace, targetPlaceId)
                  }
                />
              );
            })}
          </RecommendationPlaceList>
        </View>

        {params.hasError ?
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle-outline" size={18} color="#F97316" />
            <Text style={styles.warningText}>
              추천 스트림 연결이 불안정해 일부 결과만 표시될 수 있어요.
            </Text>
          </View>
        : null}
      </ScrollView>

      <RecommendationPreviewModal
        visible={Boolean(pendingPlace)}
        pendingPlace={pendingPlace}
        originalPlace={originalSchedulePlace}
        nextPlace={savedNextSchedulePlace}
        previousName={previewData.previewPreviousName}
        previousTime={previewData.previewPreviousTime}
        previousAddress={previewData.previewPreviousAddress}
        alternativeName={previewData.previewAlternativeName}
        alternativeTime={previewData.previewAppliedTimeText}
        alternativeAddress={previewData.previewAlternativeAddress}
        originalPlaceName={currentPlaceName}
        nextName={previewData.previewNextName}
        nextTime={impactNextTime}
        nextAddress={previewData.previewNextAddress}
        transportMode={nextImpactMode}
        previousTransportMode={previousImpactMode}
        nextTransportMode={nextImpactMode}
        previousMoveTimeText={impactPreviousMoveTimeText}
        nextMoveTimeText={impactNextMoveTimeText}
        timePickerVisible={previewTimePickerVisible}
        timePickerPlaceName={pendingPlace?.name ?? "대안 장소"}
        timePickerTarget={previewTimePickerTarget}
        timePickerPreviewText={`${String(previewTimePickerHour).padStart(2, "0")}:${String(
          previewTimePickerMinute,
        ).padStart(2, "0")}`}
        visitTimeText={
          draftPreviewVisitTime ??
          previewAppliedVisitTime ??
          "00:00"
        }
        endTimeText={
          draftPreviewEndTime ??
          previewAppliedEndTime ??
          "00:00"
        }
        hourText={padPreviewTime(previewTimePickerHour)}
        minuteText={padPreviewTime(previewTimePickerMinute)}
        onClose={() => {
          impactRequestIdRef.current += 1;
          setPendingPlace(null);
          setImpactResult(null);
          setImpactLoading(false);
        }}
        onChangeTransportMode={handleNextImpactModeChange}
        onChangePreviousTransportMode={handlePreviousImpactModeChange}
        onChangeNextTransportMode={handleNextImpactModeChange}
        onPressTimeEdit={openPreviewTimePicker}
        onTimePickerClose={closePreviewTimePicker}
        onSwitchTimeTarget={switchPreviewTimePickerTarget}
        onDecreaseHour={decreasePreviewTimePickerHour}
        onIncreaseHour={increasePreviewTimePickerHour}
        onDecreaseMinute={decreasePreviewTimePickerMinute}
        onIncreaseMinute={increasePreviewTimePickerMinute}
        onSaveTime={savePreviewTimePicker}
        onConfirm={() => {
          const placeToApply = pendingPlace;

          setPendingPlace(null);

          if (placeToApply) {
            void handleSelectPlace(placeToApply);
          }
        }}
      />
      <WhiteToast toast={whiteToast} />
    </SafeAreaView>
  );
}
