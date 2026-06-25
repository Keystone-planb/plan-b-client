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
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { reportPreferenceFeedback } from "../../api/preferences/preferences";
import { replaceNotificationPlace } from "../../api/notifications/notifications";
import { replacePlanPlace, updatePlanSchedule } from "../../api/schedules/server";
import { trackEvent, AMP } from "../utils/amplitude";
import { clearTripGapCache } from "../components/recommendations/GapRecommendationCard";
import { loadPlanASchedule } from "../api/schedules/planAStorage";
import type { RecommendedPlace } from "../types/recommendation";
import { getPlaceCategoryIcon } from "../utils/placeCategoryIcon";
import { useRecommendationToast } from "../hooks/recommendation/useRecommendationToast";
import { updateStoredPlanAAfterReplace } from "../hooks/recommendation/useRecommendationReplace";
import { useRecommendationPreview } from "../hooks/recommendation/useRecommendationPreview";
import { useRecommendationReviewDetails } from "../hooks/recommendation/useRecommendationReviewDetails";
import { useRecommendationReviewActions } from "../hooks/recommendation/useRecommendationReviewActions";
import {
  formatDateRange,
  formatOpeningHoursText,
  formatTodayOpeningHoursText,
  getMoodLabel,
  getPreviewTimeMinutes,
  getPreviewTimeText,
  padPreviewTime,
  getSpaceLabel,
  getTypeLabel,
  makePreviewTime,
  safeParseJson,
  splitPreviewTime,
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

type TransportMode = "WALK" | "TRANSIT" | "CAR";
type MoveTime = "10" | "20" | "30" | "ANY";
type PlaceScope = "INDOOR" | "OUTDOOR";

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
    previewTransportMode,
    setPreviewTransportMode,
  ] = useState<RecommendationTransportMode>("CAR");

  const [
    savedPreviousSchedulePlace,
    setSavedPreviousSchedulePlace,
  ] = useState<TodayPlace | null>(null);

  const [
    savedOriginalSchedulePlace,
    setSavedOriginalSchedulePlace,
  ] = useState<TodayPlace | null>(null);

  const [
    previewVisitTime,
    setPreviewVisitTime,
  ] = useState<string | null>(null);

  const [
    previewEndTime,
    setPreviewEndTime,
  ] = useState<string | null>(null);

  const [
    draftPreviewVisitTime,
    setDraftPreviewVisitTime,
  ] = useState<string | null>(null);

  const [
    draftPreviewEndTime,
    setDraftPreviewEndTime,
  ] = useState<string | null>(null);

  const [
    previewTimePickerVisible,
    setPreviewTimePickerVisible,
  ] = useState(false);

  const [
    previewTimePickerTarget,
    setPreviewTimePickerTarget,
  ] = useState<"visitTime" | "endTime">("visitTime");

  const [
    previewTimePickerHour,
    setPreviewTimePickerHour,
  ] = useState(0);

  const [
    previewTimePickerMinute,
    setPreviewTimePickerMinute,
  ] = useState(0);


  const [
    savedNextSchedulePlace,
    setSavedNextSchedulePlace,
  ] = useState<TodayPlace | null>(null);

  // time_to_select_ms: 결과 화면 진입 시각 기록
  const screenOpenedAtRef = useRef(Date.now());

  const params = route.params ?? {};

  const parsedPlaces = useMemo<DisplayPlace[]>(() => {
    try {
      if (!params.placesJson) return [];

      const parsed = JSON.parse(params.placesJson);

      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.log("[RecommendationResult] places parse failed:", error);
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

        for (const day of savedSchedule?.days ?? []) {
          const dayPlaces = day.places as TodayPlace[];

          const matchedIndex = dayPlaces.findIndex((place) =>
            [
              place.id,
              place.tripPlaceId,
              place.serverTripPlaceId,
            ].some(
              (id) =>
                id != null &&
                String(id) === String(currentPlanId),
            ),
          );

          if (matchedIndex >= 0) {
            matchedPlace = dayPlaces[matchedIndex];
            previousPlace = dayPlaces[matchedIndex - 1];
            nextPlace = dayPlaces[matchedIndex + 1];
            break;
          }
        }

        if (cancelled || !matchedPlace) {
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
          previousPlace
            ? {
                ...previousPlace,
                time: getPreviewTimeText(previousPlace),
              }
            : null,
        );

        setSavedOriginalSchedulePlace({
          ...matchedPlace,
          visitTime,
          endTime,
          time: combinedTime,
        });

        setPreviewVisitTime((prev) => prev ?? visitTime);
        setPreviewEndTime((prev) => prev ?? endTime);

        setSavedNextSchedulePlace(
          nextPlace
            ? {
                ...nextPlace,
                time: getPreviewTimeText(nextPlace),
              }
            : null,
        );

        console.log(
          "[RecommendationResult] 기존 일정 방문 시간 조회:",
          {
            currentPlanId,
            visitTime,
            endTime,
            time: combinedTime,
          },
        );
      } catch (error) {
        console.log(
          "[RecommendationResult] 기존 일정 방문 시간 조회 실패:",
          error,
        );
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


  const previewAppliedVisitTime =
    previewVisitTime ??
    savedOriginalSchedulePlace?.visitTime ??
    targetPlace?.visitTime ??
    null;

  const previewAppliedEndTime =
    previewEndTime ??
    savedOriginalSchedulePlace?.endTime ??
    targetPlace?.endTime ??
    null;

  const previewData = useRecommendationPreview({
    params,
    previousPlace: savedPreviousSchedulePlace,
    alternativePlace: {
      ...pendingPlace,
      visitTime: previewVisitTime,
      endTime: previewEndTime,
    },
    nextPlace: savedNextSchedulePlace,
    initialTransportMode: params.transportMode ?? "WALK",
    previewVisitTime,
    previewEndTime,
  });


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

  const openPreviewTimePicker = () => {
    const nextDraftVisitTime =
      previewAppliedVisitTime ?? null;

    const nextDraftEndTime =
      previewAppliedEndTime ?? null;

    setDraftPreviewVisitTime(nextDraftVisitTime);
    setDraftPreviewEndTime(nextDraftEndTime);

    const baseTime =
      previewTimePickerTarget === "visitTime"
        ? nextDraftVisitTime
        : nextDraftEndTime;

    const parsed = splitPreviewTime(baseTime);

    setPreviewTimePickerHour(parsed.hour);
    setPreviewTimePickerMinute(parsed.minute);
    setPreviewTimePickerVisible(true);
  };

  const closePreviewTimePicker = () => {
    setPreviewTimePickerVisible(false);
  };

  const getCurrentPickerTime = () =>
    makePreviewTime(
      previewTimePickerHour,
      previewTimePickerMinute,
    );

  const switchPreviewTimePickerTarget = (
    target:
      | "visitTime"
      | "endTime"
      | "transportStartTime"
      | "transportEndTime",
  ) => {
    if (
      target !== "visitTime" &&
      target !== "endTime"
    ) {
      return;
    }

    const currentPickerTime = getCurrentPickerTime();

    const nextDraftVisitTime =
      previewTimePickerTarget === "visitTime"
        ? currentPickerTime
        : draftPreviewVisitTime ??
          previewAppliedVisitTime ??
          null;

    const nextDraftEndTime =
      previewTimePickerTarget === "endTime"
        ? currentPickerTime
        : draftPreviewEndTime ??
          previewAppliedEndTime ??
          null;

    setDraftPreviewVisitTime(nextDraftVisitTime);
    setDraftPreviewEndTime(nextDraftEndTime);
    setPreviewTimePickerTarget(target);

    const parsed = splitPreviewTime(
      target === "visitTime"
        ? nextDraftVisitTime
        : nextDraftEndTime,
    );

    setPreviewTimePickerHour(parsed.hour);
    setPreviewTimePickerMinute(parsed.minute);
  };

  const savePreviewTimePicker = () => {
    const currentPickerTime = getCurrentPickerTime();

    const nextVisitTime =
      previewTimePickerTarget === "visitTime"
        ? currentPickerTime
        : draftPreviewVisitTime ??
          previewAppliedVisitTime ??
          null;

    const nextEndTime =
      previewTimePickerTarget === "endTime"
        ? currentPickerTime
        : draftPreviewEndTime ??
          previewAppliedEndTime ??
          null;

    const nextVisitMinutes =
      getPreviewTimeMinutes(nextVisitTime);

    const nextEndMinutes =
      getPreviewTimeMinutes(nextEndTime);

    if (
      nextVisitMinutes == null ||
      nextEndMinutes == null ||
      nextVisitMinutes >= nextEndMinutes
    ) {
      showWhiteToast(
        "시간 설정 확인",
        "시작 시간은 종료 시간보다 빨라야 합니다.",
        "error",
      );
      return;
    }

    setDraftPreviewVisitTime(nextVisitTime);
    setDraftPreviewEndTime(nextEndTime);
    setPreviewVisitTime(nextVisitTime);
    setPreviewEndTime(nextEndTime);
    setPreviewTimePickerVisible(false);
  };

  const showWeatherReplaceErrorToast = (error: unknown) => {
    showWhiteToast(
      "장소 교체 실패",
      error instanceof Error
        ? error.message
        : "날씨 알림 기반 장소 교체 중 오류가 발생했습니다.",
      "error",
    );
  };

  const showReplaceErrorToast = (error: unknown) => {
    const message =
      error instanceof Error
        ? error.message
        : "일정 교체 요청에 실패했습니다.";

    showWhiteToast("일정 교체 실패", message, "error");
  };

  const showReplaceSuccessToast = (
    placeName: string,
    usedCurrentPlanId: string | number,
  ) => {
    showWhiteToast(
      "PLAN B 교체 완료",
      `${placeName}으로 기존 일정이 교체되었습니다.`,
      "success",
      () => moveToPlanAAfterReplace(usedCurrentPlanId),
    );
  };

  const updateReplacedScheduleMeta = async ({
    replaceResult,
    usedCurrentPlanId,
  }: {
    replaceResult: Awaited<ReturnType<typeof replacePlanPlace>>;
    usedCurrentPlanId: string | number;
  }) => {
    const previewSchedulePayload = getPreviewSchedulePayload();

    if (Object.keys(previewSchedulePayload).length > 0) {
      await updatePlanSchedule(
        replaceResult.tripPlaceId ?? usedCurrentPlanId,
        previewSchedulePayload as any,
      );
    }
  };

  const requestPlanPlaceReplace = async ({
    currentPlanIdCandidates,
    newGooglePlaceId,
    newPlaceName,
  }: {
    currentPlanIdCandidates: Array<string | number>;
    newGooglePlaceId: string;
    newPlaceName: string;
  }) => {
    let replaceResult: Awaited<ReturnType<typeof replacePlanPlace>> | null =
      null;
    let lastReplaceError: unknown = null;
    let usedCurrentPlanId: string | number | null = null;

    for (const candidatePlanId of currentPlanIdCandidates) {
      try {
        console.log("[RecommendationResult] replace request:", {
          candidatePlanId,
          newGooglePlaceId,
          newPlaceName,
        });

        replaceResult = await replacePlanPlace(candidatePlanId, {
          newGooglePlaceId,
          newPlaceName,
        });

        usedCurrentPlanId = candidatePlanId;
        break;
      } catch (replaceError: any) {
        lastReplaceError = replaceError;

        console.log("[RecommendationResult] replace candidate failed:", {
          candidatePlanId,
          status: replaceError?.response?.status,
          data: replaceError?.response?.data,
          message: replaceError?.message,
        });

        if (replaceError?.response?.status !== 404) {
          throw replaceError;
        }
      }
    }

    if (!replaceResult || !usedCurrentPlanId) {
      throw lastReplaceError ?? new Error("일정 교체에 실패했습니다.");
    }

    return {
      replaceResult,
      usedCurrentPlanId,
    };
  };

  const validatePlanReplaceInput = ({
    currentPlanIdCandidates,
    newGooglePlaceId,
    newPlaceName,
  }: {
    currentPlanIdCandidates: Array<string | number>;
    newGooglePlaceId: string;
    newPlaceName: string;
  }) => {
    if (currentPlanIdCandidates.length === 0) {
      showWhiteToast(
        "일정 교체 불가",
        "현재 일정의 planId가 없어 PLAN B 교체를 진행할 수 없습니다.",
        "error",
      );
      return false;
    }

    if (!newGooglePlaceId || !newPlaceName) {
      showWhiteToast(
        "장소 정보 부족",
        "추천 장소의 Google Place ID 또는 장소명이 없습니다.",
        "error",
      );
      return false;
    }

    return true;
  };

  const validateWeatherReplaceInput = ({
    notificationId,
    newGooglePlaceId,
    newPlaceName,
  }: {
    notificationId?: string | number;
    newGooglePlaceId: string;
    newPlaceName: string;
  }) => {
    if (!notificationId) {
      showWhiteToast(
        "알림 교체 불가",
        "날씨 알림 ID가 없어 장소 교체를 진행할 수 없습니다.",
        "error",
      );
      return false;
    }

    if (!newGooglePlaceId || !newPlaceName) {
      showWhiteToast(
        "장소 정보 부족",
        "추천 장소의 Google Place ID 또는 장소명이 없습니다.",
        "error",
      );
      return false;
    }

    return true;
  };

  const handleReplaceSuccessSideEffects = async ({
    place,
    placeId,
    usedCurrentPlanId,
    replaceResult,
    selectedRank,
  }: {
    place: DisplayPlace;
    placeId: string | number;
    usedCurrentPlanId: string | number;
    replaceResult: Awaited<ReturnType<typeof replacePlanPlace>>;
    selectedRank: number;
  }) => {
    setSelectedPlaceId(placeId);

    trackEvent(AMP.ALTERNATIVE_REPLACED, {
      trip_id: params.tripId ? String(params.tripId) : undefined,
      old_place_id: String(usedCurrentPlanId),
      old_place_name: targetPlace?.name ?? "",
      new_place_id: String(place.googlePlaceId ?? place.placeId ?? ""),
      new_place_name: place.name ?? "",
      new_place_category: place.category ?? "",
      rank: selectedRank,
      recommendation_type: params.recommendationType ?? "PLACE",
      source:
        (params as any).source === "weather-notification" ||
        (params as any).fromWeatherNotification
          ? "weather"
          : "manual",
    });

    clearTripGapCache(params.tripId ?? params.serverTripId);

    await updateStoredPlanAAfterReplace({
      scheduleId: params.scheduleId,
      currentPlanId: usedCurrentPlanId,
      place,
      replaceResult,
      previewVisitTime,
      previewEndTime,
      previewTransportMode,
    });

    const storedUserId = await AsyncStorage.getItem("user_id");

    if (storedUserId) {
      reportPreferenceFeedback({
        userId: storedUserId,
        shownPlaceIds: Array.isArray(shownPlaceIds) ? shownPlaceIds : [],
        selectedPlaceId: placeId ?? "",
      }).catch((feedbackError) => {
        console.log("[RecommendationResult] feedback failed:", feedbackError);
      });
    }
  };

  const getPreviewSchedulePayload = () => {
    const payload: Record<string, unknown> = {};

    if (previewVisitTime) {
      payload.visitTime = previewVisitTime;
    }

    if (previewEndTime) {
      payload.endTime = previewEndTime;
    }

    if (previewTransportMode) {
      payload.transportMode = previewTransportMode;
    }

    return payload;
  };

  const getCurrentPlanIdCandidates = () => {
    return [
      params.currentPlanId,
      params.tripPlaceId,
      params.serverTripPlaceId,
      targetPlace?.tripPlaceId,
      targetPlace?.serverTripPlaceId,
      targetPlace?.id,
    ]
      .filter((value): value is string | number => {
        return value !== undefined && value !== null && value !== "";
      })
      .filter((value, index, array) => {
        return (
          array.findIndex((item) => String(item) === String(value)) === index
        );
      });
  };

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

    // 대안 선택 이벤트
    const selectedRank = places.findIndex(
      (p) => (p.placeId ?? p.name) === placeId,
    ) + 1;
    trackEvent(AMP.ALTERNATIVE_SELECTED, {
      rank: selectedRank,
      place_id: String(place.googlePlaceId ?? place.placeId ?? ""),
      place_name: place.name ?? "",
      place_category: place.category ?? "",
      recommendation_type: params.recommendationType ?? "PLACE",
      trip_id: params.tripId ? String(params.tripId) : undefined,
      time_to_select_ms: Date.now() - screenOpenedAtRef.current,
    });

    const currentPlanIdCandidates = getCurrentPlanIdCandidates();
    const newGooglePlaceId = String(place.googlePlaceId ?? place.placeId ?? "");
    const newPlaceName = place.name;

    const isWeatherNotificationReplace =
      params.source === "weather-notification" ||
      params.fromWeatherNotification;

    if (isWeatherNotificationReplace) {
      const notificationId = params.notificationId;

      if (
        !validateWeatherReplaceInput({
          notificationId,
          newGooglePlaceId,
          newPlaceName,
        })
      ) {
        return;
      }

      try {
        setSubmittingPlaceId(placeId);

        console.log(
          "[RecommendationResult] weather notification replace request:",
          {
            notificationId,
            newGooglePlaceId,
            newPlaceName,
          },
        );

        const updatedTripPlace = await replaceNotificationPlace(
          notificationId,
          place.placeId,
        );

        if (!updatedTripPlace) {
          throw new Error("날씨 알림 대안 장소 교체에 실패했습니다.");
        }

        console.log(
          "[RecommendationResult] weather notification replace success:",
          {
            notificationId,
            selectedPlaceId: place.placeId,
            updatedTripPlace,
          },
        );

        setSelectedPlaceId(placeId);

        // 일정이 바뀌었으니 빈시간 추천 갭 캐시를 즉시 비워 새로 계산되게 한다.
        clearTripGapCache(params.tripId ?? params.serverTripId);

        showWhiteToast(
          "장소 선택 완료",
          "대안 장소를 반영했어요. 시간과 이동수단을 설정해주세요.",
          "success",
          () =>
            moveToPlanAAfterWeatherReplace(
              updatedTripPlace as { day?: number | string },
            ),
        );

        return;
      } catch (error) {
        console.log(
          "[RecommendationResult] weather notification replace failed:",
          error,
        );

        showWeatherReplaceErrorToast(error);
      } finally {
        setSubmittingPlaceId(null);
      }

      return;
    }

    if (
      !validatePlanReplaceInput({
        currentPlanIdCandidates,
        newGooglePlaceId,
        newPlaceName,
      })
    ) {
      return;
    }

    try {
      setSubmittingPlaceId(placeId);

      console.log("[RecommendationResult] replace candidates:", {
        currentPlanIdCandidates,
        newGooglePlaceId,
        newPlaceName,
      });

      const { replaceResult, usedCurrentPlanId } =
        await requestPlanPlaceReplace({
          currentPlanIdCandidates,
          newGooglePlaceId,
          newPlaceName,
        });

      console.log("[RecommendationResult] replace success:", {
        usedCurrentPlanId,
        replaceResult,
      });

      await updateReplacedScheduleMeta({
        replaceResult,
        usedCurrentPlanId,
      });

      await handleReplaceSuccessSideEffects({
        place,
        placeId,
        usedCurrentPlanId,
        replaceResult,
        selectedRank,
      });

      showReplaceSuccessToast(place.name, usedCurrentPlanId);
    } catch (error) {
      console.log("[RecommendationResult] replace failed:", error);

      showReplaceErrorToast(error);
    } finally {
      setSubmittingPlaceId(null);
    }
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
                    if (isWeatherRecommendation) {
                      void handleSelectPlace(selectedPlace as DisplayPlace);
                      return;
                    }

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
        nextTime={previewData.previewNextTime}
        nextAddress={previewData.previewNextAddress}
        transportMode={previewTransportMode as RecommendationTransportMode}
        moveTimeText={previewData.previewMoveTimeText}
        timePickerVisible={previewTimePickerVisible}
        timePickerPlaceName={pendingPlace?.name ?? "대안 장소"}
        timePickerTarget={previewTimePickerTarget}
        timePickerPreviewText={makePreviewTime(
          previewTimePickerHour,
          previewTimePickerMinute,
        )}
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
        onClose={() => setPendingPlace(null)}
        onChangeTransportMode={(mode) => setPreviewTransportMode(mode)}
        onPressTimeEdit={openPreviewTimePicker}
        onTimePickerClose={closePreviewTimePicker}
        onSwitchTimeTarget={switchPreviewTimePickerTarget}
        onDecreaseHour={() =>
          setPreviewTimePickerHour((prev) =>
            prev <= 0 ? 23 : prev - 1,
          )
        }
        onIncreaseHour={() =>
          setPreviewTimePickerHour((prev) =>
            prev >= 23 ? 0 : prev + 1,
          )
        }
        onDecreaseMinute={() =>
          setPreviewTimePickerMinute((prev) =>
            prev <= 0 ? 59 : prev - 1,
          )
        }
        onIncreaseMinute={() =>
          setPreviewTimePickerMinute((prev) =>
            prev >= 59 ? 0 : prev + 1,
          )
        }
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
