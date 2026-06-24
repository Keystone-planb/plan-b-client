import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import GoogleReviewIcon from "../assets/google-review.svg";
import NaverIcon from "../assets/naver.png";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import MapView, { Marker } from "react-native-maps";

import { reportPreferenceFeedback } from "../../api/preferences/preferences";
import { replaceNotificationPlace } from "../../api/notifications/notifications";
import { replacePlanPlace, updatePlanSchedule } from "../../api/schedules/server";
import { trackEvent, AMP } from "../utils/amplitude";
import { clearTripGapCache } from "../components/recommendations/GapRecommendationCard";
import {
  getAnalyzedPlaceDetail,
  getPlaceSummary,
} from "../../api/places/place";
import {
  loadPlanASchedule,
  savePlanASchedule,
} from "../api/schedules/planAStorage";
import type { RecommendedPlace } from "../types/recommendation";
import { getPlaceCategoryIcon } from "../utils/placeCategoryIcon";
import VisitTimePickerPanel from "../components/common/VisitTimePickerPanel";
import { useRecommendationToast } from "../hooks/recommendation/useRecommendationToast";
import {
  formatDateRange,
  formatOpeningHoursText,
  formatPriceLevel,
  formatReviewDataText,
  formatTodayOpeningHoursText,
  getMoodLabel,
  getPreviewTimeMinutes,
  getPreviewTimeText,
  padPreviewTime,
  getSpaceLabel,
  getTypeLabel,
  makePreviewTime,
  pickText,
  safeParseJson,
  splitPreviewTime,
  toText,
  unwrapData,
} from "../utils/recommendation/recommendationFormatters";
import RecommendationHeader from "../components/recommendation/RecommendationHeader";
import RecommendationTimeline from "../components/recommendation/RecommendationTimeline";
import WhiteToast from "../components/recommendation/WhiteToast";
import type { RecommendationTransportMode } from "../components/recommendation/RecommendationTransportCard";

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

type PlaceExtraDetail = {
  loading?: boolean;
  aiSummary?: string;
  googleReview?: string;
  naverReview?: string;
  error?: string;
};
















const getPlatformReviewSummary = (
  value: unknown,
  platform: "Naver" | "Google",
) => {
  const parsed = safeParseJson(value);
  const summary = parsed?.platformSummaries?.[platform];

  return typeof summary === "string" ? summary.trim() : "";
};







const updateStoredPlanAAfterReplace = async ({
  scheduleId,
  currentPlanId,
  place,
  replaceResult,
  previewVisitTime,
  previewEndTime,
  previewTransportMode,
}: {
  scheduleId?: string;
  currentPlanId: string | number;
  place: DisplayPlace;
  replaceResult: Awaited<ReturnType<typeof replacePlanPlace>>;
  previewVisitTime?: string | null;
  previewEndTime?: string | null;
  previewTransportMode?: "WALK" | "TRANSIT" | "CAR" | null;
}) => {
  if (!scheduleId) {
    console.log(
      "[RecommendationResult] scheduleId 없음 - 로컬 Plan.A 반영 생략",
    );
    return;
  }

  const savedSchedule = await loadPlanASchedule(scheduleId);

  if (!savedSchedule) {
    console.log("[RecommendationResult] 저장된 Plan.A 없음 - 로컬 반영 생략", {
      scheduleId,
    });
    return;
  }

  const now = new Date().toISOString();

  const nextSchedule = {
    ...savedSchedule,
    updatedAt: now,
    days: savedSchedule.days.map((day) => ({
      ...day,
      places: day.places.map((item) => {
        const isTarget = [
          item.id,
          item.tripPlaceId,
          item.serverTripPlaceId,
        ].some((id) => String(id) === String(currentPlanId));

        if (!isTarget) {
          return item;
        }

        const nextGooglePlaceId = String(
          place.googlePlaceId ??
            replaceResult.googlePlaceId ??
            place.placeId ??
            item.googlePlaceId ??
            item.placeId ??
            item.id,
        );

        return {
          ...item,
          tripPlaceId: replaceResult.tripPlaceId ?? item.tripPlaceId,
          serverTripPlaceId:
            replaceResult.tripPlaceId ?? item.serverTripPlaceId,
          placeId: nextGooglePlaceId,
          googlePlaceId: nextGooglePlaceId,
          name: place.name ?? replaceResult.name ?? item.name,
          address: place.address ?? item.address,
          category: place.category ?? item.category,
          latitude: place.latitude ?? item.latitude,
          longitude: place.longitude ?? item.longitude,
          visitTime: previewVisitTime ?? item.visitTime,
          endTime: previewEndTime ?? item.endTime,
          time:
            previewVisitTime && previewEndTime
              ? `${previewVisitTime} - ${previewEndTime}`
              : item.time,
          transportMode:
            previewTransportMode ?? item.transportMode,
          updatedAt: now,
        };
      }),
    })),
  };

  await savePlanASchedule(nextSchedule);

  console.log("[RecommendationResult] 로컬 Plan.A 교체 반영 완료", {
    scheduleId,
    currentPlanId,
    newPlaceName: place.name,
  });
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
  const [expandedPlaceId, setExpandedPlaceId] = useState<
    string | number | null
  >(null);
    const [expandedHoursPlaceId, setExpandedHoursPlaceId] = useState<
    string | number | null
  >(null);
const [placeExtraDetails, setPlaceExtraDetails] = useState<
    Record<string, PlaceExtraDetail>
  >({});

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
  const currentPlaceAddress =
    originalSchedulePlace?.address || params.location || "";
  const currentPlaceTime =
    originalSchedulePlace?.time?.trim() ||
    "시간 미정";

  const previewBeforeTime =
    currentPlaceTime;

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

  const previewAfterTime =
    [previewAppliedVisitTime, previewAppliedEndTime]
      .filter(Boolean)
      .join(" - ") ||
    currentPlaceTime;

  const previewPreviousName =
    savedPreviousSchedulePlace?.name?.trim() || "장소 정보 없음";

  const previewPreviousTime =
    getPreviewTimeText(savedPreviousSchedulePlace) || "시간 미정";

  const previewNextName =
    savedNextSchedulePlace?.name?.trim() || "장소 정보 없음";

  const previewNextTime =
    getPreviewTimeText(savedNextSchedulePlace) || "시간 미정";

  const previewPreviousAddress =
    savedPreviousSchedulePlace?.address?.trim() || "";

  const previewAlternativeAddress =
    pendingPlace?.address?.trim() || "";

  const previewNextAddress =
    savedNextSchedulePlace?.address?.trim() || "";
  const previewMoveTimeText =
    params.moveTime && params.moveTime !== "ANY"
      ? `${params.moveTime}분`
      : "";

  const originalLatitude = Number(
    originalSchedulePlace?.latitude,
  );

  const originalLongitude = Number(
    originalSchedulePlace?.longitude,
  );

  const replacementLatitude = Number(
    pendingPlace?.latitude,
  );
  const replacementLongitude = Number(
    pendingPlace?.longitude,
  );

  const hasOriginalCoordinate =
    Number.isFinite(originalLatitude) &&
    Number.isFinite(originalLongitude);

  const hasReplacementCoordinate =
    Number.isFinite(replacementLatitude) &&
    Number.isFinite(replacementLongitude);

  const hasPreviewMap =
    hasOriginalCoordinate ||
    hasReplacementCoordinate;

  const previewLatitude =
    hasOriginalCoordinate &&
    hasReplacementCoordinate
      ? (
          originalLatitude +
          replacementLatitude
        ) / 2
      : hasReplacementCoordinate
        ? replacementLatitude
        : originalLatitude;

  const previewLongitude =
    hasOriginalCoordinate &&
    hasReplacementCoordinate
      ? (
          originalLongitude +
          replacementLongitude
        ) / 2
      : hasReplacementCoordinate
        ? replacementLongitude
        : originalLongitude;

  const previewLatitudeDelta =
    hasOriginalCoordinate &&
    hasReplacementCoordinate
      ? Math.max(
          Math.abs(
            originalLatitude -
            replacementLatitude,
          ) * 2.2,
          0.012,
        )
      : 0.015;

  const previewLongitudeDelta =
    hasOriginalCoordinate &&
    hasReplacementCoordinate
      ? Math.max(
          Math.abs(
            originalLongitude -
            replacementLongitude,
          ) * 2.2,
          0.012,
        )
      : 0.015;

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

  const fetchReviewDetail = async (
    place: DisplayPlace,
    placeId: string | number,
    force = false,
  ) => {
    const placeKey = String(placeId);
    const cachedDetail = placeExtraDetails[placeKey];

    if (
      !force &&
      cachedDetail &&
      !cachedDetail.loading &&
      (
        cachedDetail.aiSummary ||
        cachedDetail.googleReview ||
        cachedDetail.naverReview
      )
    ) {
      return;
    }

    const googlePlaceId =
      typeof place.googlePlaceId === "string" &&
      place.googlePlaceId.trim().length > 0
        ? place.googlePlaceId.trim()
        : typeof place.placeId === "string" &&
            String(place.placeId).startsWith("ChIJ")
          ? String(place.placeId)
          : "";

    if (!googlePlaceId) {
      console.log("[RecommendationResult] review fetch skipped: no googlePlaceId", {
        placeId,
        placeName: place.name,
        rawPlaceId: place.placeId,
        rawGooglePlaceId: place.googlePlaceId,
      });

      setPlaceExtraDetails((prev) => ({
        ...prev,
        [placeKey]: {
          loading: false,
          aiSummary: "",
          googleReview: "",
          naverReview: "",
          error: "googlePlaceId 없음",
        },
      }));
      return;
    }

    setPlaceExtraDetails((prev) => ({
      ...prev,
      [placeKey]: {
        ...prev[placeKey],
        loading: true,
        error: undefined,
      },
    }));

    try {
      const [detailResponse, summaryResponse] = await Promise.allSettled([
        getAnalyzedPlaceDetail(googlePlaceId),
        getPlaceSummary(googlePlaceId),
      ]);

      const detail =
        detailResponse.status === "fulfilled"
          ? unwrapData(detailResponse.value)
          : null;

      const summary =
        summaryResponse.status === "fulfilled"
          ? unwrapData(summaryResponse.value)
          : null;

      const aiSummary =
        pickText(summary, [
          "aiSummary",
          "ai_summary",
          "summary",
          "reviewSummary",
        ]) ||
        pickText(detail, [
          "aiSummary",
          "ai_summary",
          "summary",
          "reviewSummary",
        ]) ||
        "";

      const googleReview =
        pickText(summary, [
          "googleReview",
          "googleReviewSummary",
          "google_review",
        ]) ||
        pickText(detail, [
          "googleReview",
          "googleReviewSummary",
          "google_review",
        ]) ||
        "";

      const naverReview =
        pickText(summary, [
          "naverReview",
          "naverReviewSummary",
          "naver_review",
        ]) ||
        pickText(detail, [
          "naverReview",
          "naverReviewSummary",
          "naver_review",
        ]) ||
        "";

      console.log("[RecommendationResult] review fetch success", {
        placeKey,
        googlePlaceId,
        aiSummary,
        googleReview,
        naverReview,
      });

      setPlaceExtraDetails((prev) => ({
        ...prev,
        [placeKey]: {
          loading: false,
          aiSummary,
          googleReview,
          naverReview,
          error: undefined,
        },
      }));
    } catch (error) {
      console.log("[RecommendationResult] review fetch failed:", error);

      setPlaceExtraDetails((prev) => ({
        ...prev,
        [placeKey]: {
          loading: false,
          aiSummary: "",
          googleReview: "",
          naverReview: "",
          error: "상세 정보를 불러오지 못했습니다.",
        },
      }));
    }
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

    const currentPlanIdCandidates: Array<string | number> = [
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
    const newGooglePlaceId = String(place.googlePlaceId ?? place.placeId ?? "");
    const newPlaceName = place.name;

    const isWeatherNotificationReplace =
      params.source === "weather-notification" ||
      params.fromWeatherNotification;

    if (isWeatherNotificationReplace) {
      const notificationId = params.notificationId;

      if (!notificationId) {
        showWhiteToast(
          "알림 교체 불가",
          "날씨 알림 ID가 없어 장소 교체를 진행할 수 없습니다.",
          "error",
        );
        return;
      }

      if (!newGooglePlaceId || !newPlaceName) {
        showWhiteToast(
          "장소 정보 부족",
          "추천 장소의 Google Place ID 또는 장소명이 없습니다.",
          "error",
        );
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
          () => {
            const replacedDay =
              Number((updatedTripPlace as { day?: number | string })?.day) > 0
                ? Number((updatedTripPlace as { day?: number }).day)
                : (params.day ?? params.selectedDay);

            navigation.replace("PlanA", {
              scheduleId: params.scheduleId,
              tripId: params.tripId,
              serverTripId: params.serverTripId ?? params.tripId,
              tripName: params.tripName,
              startDate: params.startDate,
              endDate: params.endDate,
              location: params.location,
              transportMode: params.transportMode,
              transportLabel: params.transportMode,
              day: replacedDay,
              selectedDay: replacedDay,
              isEditMode: true,
              refreshPlanAAt: Date.now(),
            } as any);
          },
        );

        return;
      } catch (error) {
        console.log(
          "[RecommendationResult] weather notification replace failed:",
          error,
        );

        showWhiteToast(
          "장소 교체 실패",
          error instanceof Error ?
            error.message
          : "날씨 알림 기반 장소 교체 중 오류가 발생했습니다.",
          "error",
        );
      } finally {
        setSubmittingPlaceId(null);
      }

      return;
    }

    if (currentPlanIdCandidates.length === 0) {
      showWhiteToast(
        "일정 교체 불가",
        "현재 일정의 planId가 없어 PLAN B 교체를 진행할 수 없습니다.",
        "error",
      );
      return;
    }

    if (!newGooglePlaceId || !newPlaceName) {
      showWhiteToast(
        "장소 정보 부족",
        "추천 장소의 Google Place ID 또는 장소명이 없습니다.",
        "error",
      );
      return;
    }

    try {
      setSubmittingPlaceId(placeId);

      console.log("[RecommendationResult] replace candidates:", {
        currentPlanIdCandidates,
        newGooglePlaceId,
        newPlaceName,
      });

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

      console.log("[RecommendationResult] replace success:", {
        usedCurrentPlanId,
        replaceResult,
      });

      const previewSchedulePayload: Record<string, unknown> = {};

      if (previewVisitTime) {
        previewSchedulePayload.visitTime = previewVisitTime;
      }

      if (previewEndTime) {
        previewSchedulePayload.endTime = previewEndTime;
      }

      if (previewTransportMode) {
        previewSchedulePayload.transportMode = previewTransportMode;
      }

      if (Object.keys(previewSchedulePayload).length > 0) {
        await updatePlanSchedule(
          replaceResult.tripPlaceId ?? usedCurrentPlanId,
          previewSchedulePayload as any,
        );
      }

      setSelectedPlaceId(placeId);

      // ✅ alternative_replaced: 선택 → 서버 저장 완료까지 성공한 진짜 채택
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

      // 일정이 바뀌었으니 빈시간 추천 갭 캐시를 즉시 비운다.
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

      const successMessage = `${place.name}으로 기존 일정이 교체되었습니다.`;

      const moveToPlanA = () => {
        const planAParams = {
          scheduleId: params.scheduleId,
          tripId: params.tripId,
          serverTripId: params.serverTripId ?? params.tripId,
          tripName: params.tripName,
          startDate: params.startDate,
          endDate: params.endDate,
          location: params.location,
          transportMode: params.transportMode,
          transportLabel: params.transportMode,
          selectedDay:
            (
              Number(
                (targetPlace as { day?: number | string } | undefined)?.day,
              ) > 0
            ) ?
              Number(
                (targetPlace as { day?: number | string } | undefined)?.day,
              )
            : undefined,
          selectedPlace: undefined,
          selectedPlaces: undefined,
          refreshPlanAAt: Date.now(),
          replacedTripPlaceId: usedCurrentPlanId,
          // 대안찾기로 진입해도 수정 페이지(시간/이동수단 편집 + 저장)와 동일하게 열리도록 한다.
          isEditMode: true,
        };

        navigation.replace("PlanA", planAParams as any);
      };

      showWhiteToast("PLAN B 교체 완료", successMessage, "success", moveToPlanA);
    } catch (error) {
      console.log("[RecommendationResult] replace failed:", error);

      const message =
        error instanceof Error ?
          error.message
        : "일정 교체 요청에 실패했습니다.";

      showWhiteToast("일정 교체 실패", message, "error");
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

          <View style={styles.resultList}>
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
              const displayAiSummary = extraDetail?.aiSummary ?? "";
              const displayNaverReview = extraDetail?.naverReview ?? "";
              const displayGoogleReview = extraDetail?.googleReview ?? "";
              const todayOpeningHoursText = formatTodayOpeningHoursText(
                place.openingHours,
              );
              const fullOpeningHoursText = formatOpeningHoursText(place.openingHours);

              const reviewCount =
                typeof place.userRatingsTotal === "number" ?
                  place.userRatingsTotal.toLocaleString()
                : typeof place.reviewCount === "number" ?
                  place.reviewCount.toLocaleString()
                : "0";

              return (
                <View
                  key={`recommendation-${String(placeId)}-${index}`}
                  style={[
                    styles.placeCard,
                    isExpanded && styles.expandedPlaceCard,
                    isSelected && styles.selectedCard,
                  ]}
                >
                  <View style={styles.placeTopRow}>
                    <Image
                        source={getPlaceCategoryIcon(
                          place.category ?? place.type,
                        )}
                        style={styles.categoryImageIcon}
                      />

                    <View style={styles.placeMainInfo}>
                      <View style={styles.placeNameRow}>
                        <Text style={styles.placeName} numberOfLines={1}>
                          {place.name || "에버랜드"}
                        </Text>
                      </View>

                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={14} color="#FFD400" />
                        <Text style={styles.ratingText}>
                          {typeof place.rating === "number" ?
                            place.rating.toFixed(2)
                          : "4.58"}
                        </Text>
                        <Text style={styles.reviewText}>({reviewCount})</Text>
                      </View>

                      <View style={styles.infoLine}>
                        <Ionicons
                          name="location-outline"
                          size={18}
                          color="#8EA0B7"
                        />
                        <Text style={styles.infoText} numberOfLines={1}>
                          {place.address ||
                            "경기도 용인시 처인구 포곡읍 에버랜드로 199"}
                        </Text>
                      </View>

                    </View>
                  </View>

                  <View style={styles.tagRow}>
                    {[
                      getSpaceLabel(place.space),
                      getTypeLabel(place.type),
                      getMoodLabel(place.mood),
                    ]
                      .filter(Boolean)
                      .slice(0, 3)
                      .map((tag) => (
                        <View key={tag} style={styles.categoryPill}>
                          <Text style={styles.categoryText}>{tag}</Text>
                        </View>
                      ))}
                  </View>

                  {todayOpeningHoursText ? (
                    <>
                      <View style={styles.hoursDivider} />

                      <TouchableOpacity
                        style={styles.hoursInfoRow}
                        activeOpacity={0.82}
                        onPress={() =>
                          setExpandedHoursPlaceId((prev: string | number | null) =>
                            String(prev) === String(placeId) ? null : placeId,
                          )
                        }
                      >
                        <View style={styles.hoursStatusDot} />
                        <Text style={styles.hoursStatusText} numberOfLines={1}>
                          {todayOpeningHoursText}
                        </Text>
                        <Ionicons
                          name={isHoursExpanded ? "chevron-up" : "chevron-down"}
                          size={18}
                          color="#64748B"
                          style={styles.hoursChevron}
                        />
                      </TouchableOpacity>

                      {isHoursExpanded && fullOpeningHoursText ? (
                        <View style={styles.fullHoursBox}>
                          <Text style={styles.fullHoursTitle}>전체 영업시간</Text>
                          {fullOpeningHoursText
                            .split("\n")
                            .filter(Boolean)
                            .map((row) => {
                              const [day, ...timeParts] = row.split(":");
                              const time = timeParts.join(":").trim();

                              return (
                                <View key={row} style={styles.fullHoursRow}>
                                  {(() => {
                                    const todayLabel = new Date().toLocaleDateString(
                                      "ko-KR",
                                      { weekday: "long" },
                                    );
                                    const isToday = day.trim() === todayLabel;

                                    return (
                                      <>
                                        <Text
                                          style={[
                                            styles.fullHoursDay,
                                            isToday && styles.todayFullHoursText,
                                          ]}
                                        >
                                          {day.trim()}
                                        </Text>
                                        <Text
                                          style={[
                                            styles.fullHoursTime,
                                            isToday && styles.todayFullHoursText,
                                          ]}
                                        >
                                          {time}
                                        </Text>
                                      </>
                                    );
                                  })()}
                                </View>
                              );
                            })}
                        </View>
                      ) : null}
                    </>
                  ) : null}

                  <View
                    style={[
                      styles.aiSummaryBox,
                      isExpanded && styles.expandedAiSummaryBox,
                    ]}
                  >

                    <Text style={styles.aiSummaryIcon}>📊</Text>

                    <Text style={styles.aiSummaryText}>
                      {displayAiSummary || "AI 요약을 불러오는 중이에요."}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.selectButton,
                      isSelected && styles.selectedButton,
                    ]}
                    activeOpacity={0.85}
                    disabled={isSubmitting || isSelected}
                    onPress={() => {
                      if (
                        isWeatherRecommendation
                      ) {
                        void handleSelectPlace(place);
                        return;
                      }

                      setPendingPlace(place);
                    }}
                  >
                    {isSubmitting ?
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    : <Text
                        style={[
                          styles.selectButtonText,
                          isSelected && styles.selectedButtonText,
                        ]}
                      >
                        {isSelected ?
                          "선택 완료"
                        : isWeatherRecommendation ?
                          "이 장소로 대체"
                        : "일정에 추가"}
                      </Text>
                    }
                  </TouchableOpacity>

                  {isExpanded ?
                    <View style={styles.detailBox}>
                      <View style={styles.verticalLine} />

                      <View style={styles.sourceList}>
                        <View style={styles.sourceCard}>
                          <View style={[styles.sourceIconBox, styles.naverBox]}>
                            <Image
                              source={NaverIcon}
                              style={styles.platformLogo}
                              resizeMode="contain"
                            />
                          </View>

                          <Text style={styles.sourceText}>
                            {extraDetail?.loading ?
                              "네이버 리뷰 요약을 불러오는 중이에요."
                            : displayNaverReview ||
                              "서버에서 네이버 리뷰 요약을 제공하지 않았습니다."
                            }
                          </Text>
                        </View>

                        <View style={styles.sourceCard}>
                          <View
                            style={[styles.sourceIconBox, styles.googleBox]}
                          >
                            <GoogleReviewIcon width={18} height={18} />
                          </View>

                          <Text style={styles.sourceText}>
                            {extraDetail?.loading ?
                              "구글 리뷰 요약을 불러오는 중이에요."
                            : displayGoogleReview ||
                              "서버에서 구글 리뷰 요약을 제공하지 않았습니다."
                            }
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.retryReviewButton}
                        activeOpacity={0.82}
                        onPress={() => handleRetryReview(place, placeId)}
                        disabled={Boolean(extraDetail?.loading)}
                      >
                        <Ionicons
                          name="refresh-outline"
                          size={18}
                          color={extraDetail?.loading ? "#94A3B8" : "#2158E8"}
                        />
                        <Text
                          style={[
                            styles.retryReviewButtonText,
                            extraDetail?.loading && styles.retryReviewButtonTextDisabled,
                          ]}
                        >
                          리뷰 다시 분석
                        </Text>
                      </TouchableOpacity>

                    </View>
                  : null}

                  <TouchableOpacity
                    style={styles.detailButton}
                    activeOpacity={0.8}
                    onPress={() => handleToggleDetail(place, placeId)}
                  >
                    <Text style={styles.detailButtonText}>
                      {isExpanded ? "리뷰 접기" : "AI 리뷰 요약 보기"}
                    </Text>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={16}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
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

      <Modal
        visible={Boolean(pendingPlace)}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setPendingPlace(null)
        }
      >
        <View style={styles.previewOverlay}>
          <View style={styles.previewModal}>
            <RecommendationHeader
              title="이렇게 바꿀까요?"
              onClose={() => setPendingPlace(null)}
            />

            {previewTimePickerVisible ? (
              <View style={styles.previewTimePickerPanelOverlay}>
                <VisitTimePickerPanel
                  placeName={pendingPlace?.name ?? "대안 장소"}
                  target={previewTimePickerTarget}
                  previewText={makePreviewTime(
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
                  onClose={closePreviewTimePicker}
                  onSwitchTarget={switchPreviewTimePickerTarget}
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
                  onSave={savePreviewTimePicker}
                />
              </View>
            ) : null}

            <View style={styles.previewMapBox}>
              {hasPreviewMap ? (
                <MapView
                  style={styles.previewMap}
                  region={{
                    latitude:
                      previewLatitude,
                    longitude:
                      previewLongitude,
                    latitudeDelta:
                      previewLatitudeDelta,
                    longitudeDelta:
                      previewLongitudeDelta,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                  toolbarEnabled={false}
                  pointerEvents="none"
                >
                  {hasOriginalCoordinate ? (
                    <Marker
                      coordinate={{
                        latitude:
                          originalLatitude,
                        longitude:
                          originalLongitude,
                      }}
                      title="기존 장소"
                      description={
                        currentPlaceName
                      }
                    >
                      <View style={styles.previewOriginalMarker}>
                        <Ionicons
                          name="close"
                          size={14}
                          color="#FFFFFF"
                        />
                      </View>
                    </Marker>
                  ) : null}

                  {hasReplacementCoordinate ? (
                    <Marker
                      coordinate={{
                        latitude:
                          replacementLatitude,
                        longitude:
                          replacementLongitude,
                      }}
                      title="대안 장소"
                      description={
                        pendingPlace?.name
                      }
                    >
                      <View style={styles.previewReplacementMarker}>
                        <Ionicons
                          name="location"
                          size={16}
                          color="#FFFFFF"
                        />
                      </View>
                    </Marker>
                  ) : null}
                </MapView>
              ) : (
                <View
                  style={
                    styles.previewMapFallback
                  }
                >
                  <Ionicons
                    name="map-outline"
                    size={34}
                    color="#2158E8"
                  />

                  <Text
                    style={
                      styles.previewMapFallbackText
                    }
                  >
                    장소 위치를 지도에서 확인할 수 없어요.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.previewMapLegend}>
              <View style={styles.previewLegendItem}>
                <View
                  style={[
                    styles.previewLegendMarker,
                    styles.previewLegendMarkerBefore,
                  ]}
                />

                <Text style={styles.previewLegendText}>
                  기존 장소
                </Text>
              </View>

              <View style={styles.previewLegendItem}>
                <View
                  style={[
                    styles.previewLegendMarker,
                    styles.previewLegendMarkerAfter,
                  ]}
                />

                <Text style={styles.previewLegendText}>
                  대안 장소
                </Text>
              </View>
            </View>

            <RecommendationTimeline
              previousName={previewPreviousName}
              previousTime={previewPreviousTime}
              previousAddress={previewPreviousAddress}
              alternativeName={pendingPlace?.name ?? "추천 장소"}
              alternativeTime={previewAfterTime}
              alternativeAddress={previewAlternativeAddress}
              originalPlaceName={currentPlaceName}
              nextName={previewNextName}
              nextTime={previewNextTime}
              nextAddress={previewNextAddress}
              transportMode={previewTransportMode as RecommendationTransportMode}
              moveTimeText={previewMoveTimeText}
              onChangeTransportMode={(mode) => setPreviewTransportMode(mode)}
              onPressTimeEdit={openPreviewTimePicker}
            />

            <TouchableOpacity
              style={
                styles.previewConfirmButton
              }
              activeOpacity={0.86}
              onPress={() => {
                const placeToApply =
                  pendingPlace;

                setPendingPlace(null);

                if (placeToApply) {
                  void handleSelectPlace(
                    placeToApply,
                  );
                }
              }}
            >
              <Text
                style={
                  styles.previewConfirmButtonText
                }
              >
                교체하기
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <WhiteToast toast={whiteToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  whiteToastWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 28,
    zIndex: 999,
    elevation: 999,
    alignItems: "center",
  },

  whiteToast: {
    width: "100%",
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
  },

  whiteToastTextBox: {
    flex: 1,
  },

  whiteToastTitle: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "900",
  },

  whiteToastMessage: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
  },


  categoryImageIcon: {
    width: 72,
    height: 72,
    resizeMode: "contain",
    marginRight: 24,
  },

  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  header: {
    height: 106,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  logoText: {
    flex: 1,
    color: "#1C2534",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
    textAlign: "center",
  },

  headerRightSpace: {
    width: 42,
  },

  scroll: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  scrollContent: {
    paddingBottom: 42,
  },

  titleSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 28,
    paddingBottom: 26,
  },

  screenTitle: {
    color: "#111827",
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: -0.7,
    marginBottom: 10,
  },

  screenSubtitle: {
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
  },

  sectionBlock: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },

  sectionTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginBottom: 16,
    marginTop: 0,
  },

  currentScheduleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DCE5F2",
    paddingHorizontal: 18,
    paddingVertical: 18,
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
  },

  currentInfoBox: {
    flex: 1,
  },

  currentPlaceName: {
    color: "#1C2534",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
  },

  currentAddress: {
    color: "#7C8CA3",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },

  currentTimeRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  currentTimeText: {
    color: "#7C8CA3",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 6,
  },

  badge: {
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2158E8",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  resultList: {
    gap: 18,
  },

  placeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#DCE5F2",
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 18,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },

  expandedPlaceCard: {
    paddingBottom: 22,
    borderRadius: 22,
    borderColor: "#BFD7FF",
  },

  selectedCard: {
    borderColor: "#2158E8",
    backgroundColor: "#F8FBFF",
  },

  placeTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  thumbnailCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#EAF6ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },

  thumbnailEmoji: {
    fontSize: 29,
  },

  placeMainInfo: {
    flex: 1,
  },

  placeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  placeName: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
    flexShrink: 1,
  },

  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 10,
    marginBottom: 0,
    marginLeft: 102,
    alignItems: "center",
  },

  categoryPill: {
    borderRadius: 8,
    backgroundColor: "#F3F6FA",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  categoryText: {
    color: "#7C8CA3",
    fontSize: 11,
    fontWeight: "800",
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  ratingText: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
  },

  reviewText: {
    color: "#7C8CA3",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 4,
  },

  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  infoText: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
    marginLeft: 7,
    flex: 1,
  },

  hoursDivider: {
    height: 1,
    backgroundColor: "#CBD5E1",
    marginTop: 16,
    marginBottom: 14,
  },

  hoursInfoRow: {
    marginTop: 0,
    marginBottom: 2,
    paddingHorizontal: 0,
    flexDirection: "row",
    alignItems: "center",
  },

  hoursStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#34C759",
    marginRight: 8,
  },

  hoursStatusText: {
    color: "#16A34A",
    fontSize: 16,
    fontWeight: "900",
    flex: 1,
  },

  hoursTimeText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
  },

  hoursChevron: {
    marginLeft: "auto",
  },

  fullHoursBox: {
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#DCE5F2",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  fullHoursTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 6,
  },

  fullHoursRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },

  fullHoursDay: {
    width: 62,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 22,
  },

  fullHoursTime: {
    flex: 1,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 22,
  },

  todayFullHoursText: {
    color: "#2158E8",
    fontWeight: "900",
  },

  fullHoursText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 23,
  },

  aiSummaryBox: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  expandedAiSummaryBox: {
    marginTop: 12,
  },



  aiSummaryIcon: {
    fontSize: 16,
    marginRight: 7,
    marginTop: 1,
  },

  aiSummaryText: {
    flex: 1,
    color: "#2158E8",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21,
  },

  retryReviewButton: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#C7D5FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  retryReviewButtonText: {
    color: "#2158E8",
    fontSize: 15,
    fontWeight: "900",
  },

  retryReviewButtonTextDisabled: {
    color: "#94A3B8",
  },

  detailButton: {
    marginTop: 14,
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  detailButtonText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "900",
  },

  detailBox: {
    marginTop: 12,
    position: "relative",
  },

  verticalLine: {
    display: "none",
  },

  sourceList: {
    gap: 12,
  },

  sourceCard: {
    minHeight: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDE5F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  sourceIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },

  naverBox: {
    backgroundColor: "#FFFFFF",
  },

  googleBox: {
    backgroundColor: "#FFFFFF",
  },

  platformLogo: {
    width: 30,
    height: 30,
  },

  naverIconText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  googleIconText: {
    color: "#4285F4",
    fontSize: 17,
    fontWeight: "900",
  },

  sourceText: {
    flex: 1,
    color: "#8A97AA",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },

  selectButton: {
    marginTop: 16,
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
  },

  selectedButton: {
    backgroundColor: "#2158E8",
  },

  selectButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  selectedButtonText: {
    color: "#FFFFFF",
  },

  previewOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(15, 23, 42, 0.48)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  previewModal: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    maxWidth: 390,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },

  previewHeader: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    position: "relative",
  },

  previewTitle: {
    flex: 1,
    color: "#1C2534",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },

  previewCloseButton: {
    position: "absolute",
    right: 0,
    top: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  previewMapBox: {
    height: 142,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D9E7FF",
    backgroundColor: "#EFF6FF",
  },

  previewMap: {
    flex: 1,
  },

  previewOriginalMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(100, 116, 139, 0.72)",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },

  previewReplacementMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2158E8",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  previewMapFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  previewMapFallbackText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },

  previewMapLegend: {
    minHeight: 26,
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },

  previewLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  previewLegendMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  previewLegendMarkerBefore: {
    backgroundColor: "#94A3B8",
    opacity: 0.75,
  },

  previewLegendMarkerAfter: {
    backgroundColor: "#2158E8",
  },

  previewLegendText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
  },

  previewTimelineWrap: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "stretch",
  },

  previewTimelineRail: {
    width: 34,
    alignItems: "center",
    position: "relative",
    marginRight: 10,
  },

  previewTimelineNodeA: {
    position: "absolute",
    top: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#475569",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  previewTimelineNodeB: {
    position: "absolute",
    top: 155,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  previewTimelineNodeC: {
    position: "absolute",
    bottom: 22,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#475569",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  previewTimelineNodeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  previewTimelineCards: {
    flex: 1,
    gap: 10,
  },

  previewFlowCard: {
    minHeight: 102,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#DCE5F2",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    paddingVertical: 12,
    justifyContent: "center",
  },

  previewCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },

  previewCardMetaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },


  previewAddressRow: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  previewTransportPanel: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  previewTransportPanelActive: {
    borderColor: "#D7E6FF",
    backgroundColor: "#F8FBFF",
  },

  previewAddressText: {
    marginTop: 6,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
  },

  previewMoveTimeRow: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  previewMoveTimeText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
  },

  previewMoveTimeValue: {
    color: "#2158E8",
    fontWeight: "900",
  },

  previewSmallBadge: {
    alignSelf: "flex-start",
    height: 23,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  previewSmallBadgeText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "900",
  },

  previewFlowTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },

  previewFlowTimeText: {
    color: "#1C2534",
    fontSize: 14,
    fontWeight: "900",
  },

  previewFlowPlaceText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
  },

  previewAlternativeCard: {
    minHeight: 138,
    borderColor: "#8CB5FF",
    backgroundColor: "#F8FBFF",
  },

  previewAlternativeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  previewAlternativeBadge: {
    height: 24,
    borderRadius: 999,
    backgroundColor: "#2158E8",
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  previewAlternativeBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  previewTimeEditButton: {
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#BFD7FF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    zIndex: 10,
    elevation: 10,
  },

  previewTimeEditText: {
    color: "#2158E8",
    fontSize: 11,
    fontWeight: "900",
  },

  previewAlternativeTimeText: {
    color: "#94A3B8",
  },

  previewAlternativePlaceText: {
    color: "#2158E8",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 8,
  },

  previewOriginalReferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },

  previewOriginalReferenceText: {
    flex: 1,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
  },

  previewTransportRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 0,
  },

  previewTransportChip: {
    flex: 1,
    height: 32,
    minHeight: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 6,
  },

  previewTransportChipActive: {
    borderColor: "#2158E8",
    backgroundColor: "#F8FBFF",
  },

  previewTransportChipText: {
    color: "#1C2534",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },

  previewTransportChipTextActive: {
    color: "#2158E8",
  },

  previewNoticeBox: {
    minHeight: 40,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "#F3F7FF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  previewNoticeTitle: {
    flex: 1,
    color: "#2158E8",
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 17,
  },

  previewConfirmButton: {
    minHeight: 52,
    marginTop: 12,
    borderRadius: 15,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },

  previewConfirmButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },


  previewTimePickerPanelOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 100,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    paddingHorizontal: 0,
  },

  warningBox: {
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    padding: 13,
    flexDirection: "row",
    gap: 8,
  },

  warningText: {
    flex: 1,
    color: "#C2410C",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
});
