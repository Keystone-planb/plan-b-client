import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { reportPreferenceFeedback } from "../../api/preferences/preferences";
import { replaceNotificationPlace } from "../../api/notifications/notifications";
import { replacePlanPlace } from "../../api/schedules/server";
import {
  getPlaceDetail,
  getPlaceSummary,
} from "../../api/places/place";
import {
  loadPlanASchedule,
  savePlanASchedule,
} from "../api/schedules/planAStorage";
import type { RecommendedPlace } from "../types/recommendation";

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
  latitude?: number;
  longitude?: number;
};

type RootStackParamList = {
  Main: undefined;
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
    refreshPlanAAt?: number;
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
    fromAIAnalysis?: boolean;
    hasError?: boolean;
    title?: string;
  };
};

type Props = NativeStackScreenProps<RootStackParamList, "RecommendationResult">;

type DisplayPlace = RecommendedPlace & {
  placeId?: string | number;
  name: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  reason?: string;
  sourceSummary?: {
    naver?: string;
    instagram?: string;
    google?: string;
  };
};

type PlaceExtraDetail = {
  loading?: boolean;
  aiSummary?: string;
  googleReview?: string;
  naverReview?: string;
  instagramReview?: string;
  error?: string;
};

const toText = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const pickText = (source: any, keys: string[]) => {
  for (const key of keys) {
    const value = toText(source?.[key]);
    if (value) return value;
  }

  return "";
};

const unwrapData = (value: any) => {
  return value?.data ?? value?.result ?? value?.payload ?? value;
};


const formatDateRange = (startDate?: string, endDate?: string) => {
  const start = startDate?.replace(/-/g, ".");
  const end = endDate?.replace(/-/g, ".");

  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;

  return "10:00 - 12:00";
};

const updateStoredPlanAAfterReplace = async ({
  scheduleId,
  currentPlanId,
  place,
  replaceResult,
}: {
  scheduleId?: string;
  currentPlanId: string | number;
  place: DisplayPlace;
  replaceResult: Awaited<ReturnType<typeof replacePlanPlace>>;
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
  const [expandedPlaceId, setExpandedPlaceId] = useState<
    string | number | null
  >(null);
  const [placeExtraDetails, setPlaceExtraDetails] = useState<
    Record<string, PlaceExtraDetail>
  >({});

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
  const currentPlaceName = targetPlace?.name || "강릉역";
  const currentPlaceAddress =
    targetPlace?.address || params.location || "강원도 강릉시";
  const currentPlaceTime =
    targetPlace?.time || formatDateRange(params.startDate, params.endDate);

  const handleBack = () => {
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

    if (isClosing || placeExtraDetails[placeKey]?.aiSummary) {
      return;
    }

    const googlePlaceId = String(place.googlePlaceId ?? place.placeId ?? "");

    if (!googlePlaceId) {
      setPlaceExtraDetails((prev) => ({
        ...prev,
        [placeKey]: {
          error: "장소 ID가 없어 상세 정보를 불러올 수 없습니다.",
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
        getPlaceDetail(googlePlaceId),
        getPlaceSummary(googlePlaceId),
      ]);

      const detail =
        detailResponse.status === "fulfilled" ?
          unwrapData(detailResponse.value)
        : null;

      const summary =
        summaryResponse.status === "fulfilled" ?
          unwrapData(summaryResponse.value)
        : null;

      const aiSummary =
        pickText(summary, ["aiSummary", "ai_summary", "summary", "reviewSummary"]) ||
        pickText(detail, ["aiSummary", "ai_summary", "summary", "reviewSummary"]);

      const googleReview =
        pickText(summary, ["googleReview", "googleReviewSummary", "google_review"]) ||
        pickText(detail, ["googleReview", "googleReviewSummary", "google_review"]);

      const naverReview =
        pickText(summary, ["naverReview", "naverReviewSummary", "naver_review"]) ||
        pickText(detail, ["naverReview", "naverReviewSummary", "naver_review"]);

      const instagramReview =
        pickText(summary, [
          "instaReview",
          "instagramReview",
          "instaReviewSummary",
          "instagramReviewSummary",
          "insta_review",
        ]) ||
        pickText(detail, [
          "instaReview",
          "instagramReview",
          "instaReviewSummary",
          "instagramReviewSummary",
          "insta_review",
        ]);

      setPlaceExtraDetails((prev) => ({
        ...prev,
        [placeKey]: {
          loading: false,
          aiSummary,
          googleReview,
          naverReview,
          instagramReview,
        },
      }));
    } catch (error) {
      console.log("[RecommendationResult] place detail/summary failed:", error);

      setPlaceExtraDetails((prev) => ({
        ...prev,
        [placeKey]: {
          loading: false,
          error: "상세 정보를 불러오지 못했습니다.",
        },
      }));
    }
  };

  const handleSelectPlace = async (place: DisplayPlace) => {
    const placeId = place.placeId ?? place.name;
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
        Alert.alert(
          "알림 교체 불가",
          "날씨 알림 ID가 없어 장소 교체를 진행할 수 없습니다.",
        );
        return;
      }

      if (!newGooglePlaceId || !newPlaceName) {
        Alert.alert(
          "장소 정보 부족",
          "추천 장소의 Google Place ID 또는 장소명이 없습니다.",
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

        await replaceNotificationPlace(notificationId, newGooglePlaceId);

        setSelectedPlaceId(placeId);

        Alert.alert(
          "장소 선택 완료",
          "진행중인 일정에 대안 장소를 반영했습니다.",
          [
            {
              text: "확인",
              onPress: () => {
                navigation.navigate("OngoingSchedule", {
                  scheduleId: params.scheduleId,
                  tripId: params.tripId ?? params.serverTripId,
                  serverTripId: params.serverTripId ?? params.tripId,
                  tripName: params.tripName,
                  startDate: params.startDate,
                  endDate: params.endDate,
                  location: params.location,
                  transportMode: params.transportMode,
                  transportLabel: params.transportLabel,
                });
              },
            },
          ],
        );

        return;
      } catch (error) {
        console.log(
          "[RecommendationResult] weather notification replace failed:",
          error,
        );

        Alert.alert(
          "장소 교체 실패",
          error instanceof Error ?
            error.message
          : "날씨 알림 기반 장소 교체 중 오류가 발생했습니다.",
        );
      } finally {
        setSubmittingPlaceId(null);
      }

      return;
    }

    if (currentPlanIdCandidates.length === 0) {
      Alert.alert(
        "일정 교체 불가",
        "현재 일정의 planId가 없어 PLAN B 교체를 진행할 수 없습니다.",
      );
      return;
    }

    if (!newGooglePlaceId || !newPlaceName) {
      Alert.alert(
        "장소 정보 부족",
        "추천 장소의 Google Place ID 또는 장소명이 없습니다.",
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

      setSelectedPlaceId(placeId);

      await updateStoredPlanAAfterReplace({
        scheduleId: params.scheduleId,
        currentPlanId: usedCurrentPlanId,
        place,
        replaceResult,
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
          refreshPlanAAt: Date.now(),
          selectedPlace: undefined,
          selectedPlaces: undefined,
        });
      };

      if (typeof window !== "undefined") {
        window.alert(`PLAN B 교체 완료\n${successMessage}`);
        moveToPlanA();
      } else {
        Alert.alert("PLAN B 교체 완료", successMessage, [
          {
            text: "확인",
            onPress: moveToPlanA,
          },
        ]);
      }
    } catch (error) {
      console.log("[RecommendationResult] replace failed:", error);

      const message =
        error instanceof Error ?
          error.message
        : "일정 교체 요청에 실패했습니다.";

      if (typeof window !== "undefined") {
        window.alert(`일정 교체 실패\n${message}`);
      } else {
        Alert.alert("일정 교체 실패", message);
      }
    } finally {
      setSubmittingPlaceId(null);
    }
  };

  const title = params.title ?? "AI 대안 추천";

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
          <Text style={styles.screenSubtitle}>
            거리와 리뷰를 기반으로 추천된 top5예요
          </Text>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>기존 일정</Text>

          <View style={styles.currentScheduleCard}>
            <View style={styles.currentInfoBox}>
              <Text style={styles.currentPlaceName}>{currentPlaceName}</Text>
              <Text style={styles.currentAddress}>{currentPlaceAddress}</Text>

              <View style={styles.currentTimeRow}>
                <Ionicons name="time-outline" size={14} color="#7C8CA3" />
                <Text style={styles.currentTimeText}>{currentPlaceTime}</Text>
              </View>
            </View>

            <View style={styles.badge}>
              <Ionicons name="rainy-outline" size={12} color="#FFFFFF" />
              <Text style={styles.badgeText}>비예보</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>추천 대안</Text>

          <View style={styles.resultList}>
            {places.map((place, index) => {
              const placeId = place.placeId ?? `place-${index}`;
              const isExpanded = String(expandedPlaceId) === String(placeId);
              const isSelected = String(selectedPlaceId) === String(placeId);
              const isSubmitting =
                String(submittingPlaceId) === String(placeId);
              const placeKey = String(placeId);
              const extraDetail = placeExtraDetails[placeKey];
              const displayAiSummary =
                extraDetail?.aiSummary || place.reason || "";
              const displayNaverReview =
                extraDetail?.naverReview || place.sourceSummary?.naver || "";
              const displayInstagramReview =
                extraDetail?.instagramReview ||
                place.sourceSummary?.instagram ||
                "";
              const displayGoogleReview =
                extraDetail?.googleReview || place.sourceSummary?.google || "";

              const reviewCount =
                typeof place.reviewCount === "number" ?
                  place.reviewCount.toLocaleString()
                : "2,239";

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
                    <View style={styles.thumbnailCircle}>
                      <Text style={styles.thumbnailEmoji}>🎡</Text>
                    </View>

                    <View style={styles.placeMainInfo}>
                      <View style={styles.placeNameRow}>
                        <Text style={styles.placeName} numberOfLines={1}>
                          {place.name || "에버랜드"}
                        </Text>

                        <View style={styles.categoryPill}>
                          <Text style={styles.categoryText}>
                            {place.category || "아웃도어"}
                          </Text>
                        </View>
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

                      {isExpanded ?
                        <>
                          <View style={styles.infoLine}>
                            <Ionicons
                              name="call-outline"
                              size={18}
                              color="#8EA0B7"
                            />
                            <Text style={styles.infoText}>
                              {place.phone || "053-123-1234"}
                            </Text>
                          </View>

                          <View style={styles.infoLine}>
                            <Ionicons
                              name="globe-outline"
                              size={18}
                              color="#8EA0B7"
                            />
                            <Text style={styles.infoText}>
                              {place.website || "www.planb.com"}
                            </Text>
                          </View>

                          <View style={styles.infoLine}>
                            <Ionicons
                              name="storefront-outline"
                              size={18}
                              color="#8EA0B7"
                            />
                            <Text style={styles.infoText}>
                              {place.openingHours || "10:00 - 20:00"}
                            </Text>
                          </View>
                        </>
                      : null}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.aiSummaryBox,
                      isExpanded && styles.expandedAiSummaryBox,
                    ]}
                  >
                    <View style={styles.aiBadge}>
                      <Text style={styles.aiBadgeText}>AI</Text>
                    </View>

                    <Text style={styles.aiSummaryIcon}>📊</Text>

                    <Text style={styles.aiSummaryText}>
                      {displayAiSummary || "AI 요약을 불러오는 중이에요."}
                    </Text>
                  </View>

                  {isExpanded ?
                    <View style={styles.detailBox}>
                      <View style={styles.verticalLine} />

                      <View style={styles.sourceList}>
                        <View style={styles.sourceCard}>
                          <View style={[styles.sourceIconBox, styles.naverBox]}>
                            <Text style={styles.naverIconText}>N</Text>
                          </View>

                          <Text style={styles.sourceText}>
                            {extraDetail?.loading ?
                              "네이버 리뷰 요약을 불러오는 중이에요."
                            : displayNaverReview ||
                              "서버에서 네이버 리뷰 요약을 제공하지 않았습니다."}
                          </Text>
                        </View>

                        <View style={styles.sourceCard}>
                          <View
                            style={[styles.sourceIconBox, styles.instagramBox]}
                          >
                            <Text style={styles.instagramIconText}>◎</Text>
                          </View>

                          <Text style={styles.sourceText}>
                            {extraDetail?.loading ?
                              "인스타그램 리뷰 요약을 불러오는 중이에요."
                            : displayInstagramReview ||
                              "서버에서 인스타그램 리뷰 요약을 제공하지 않았습니다."}
                          </Text>
                        </View>

                        <View style={styles.sourceCard}>
                          <View
                            style={[styles.sourceIconBox, styles.googleBox]}
                          >
                            <Text style={styles.googleIconText}>G</Text>
                          </View>

                          <Text style={styles.sourceText}>
                            {extraDetail?.loading ?
                              "구글 리뷰 요약을 불러오는 중이에요."
                            : displayGoogleReview ||
                              "서버에서 구글 리뷰 요약을 제공하지 않았습니다."}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.selectButton,
                          isSelected && styles.selectedButton,
                        ]}
                        activeOpacity={0.85}
                        disabled={isSubmitting || isSelected}
                        onPress={() => handleSelectPlace(place)}
                      >
                        {isSubmitting ?
                          <ActivityIndicator size="small" color="#2158E8" />
                        : <Text
                            style={[
                              styles.selectButtonText,
                              isSelected && styles.selectedButtonText,
                            ]}
                          >
                            {isSelected ? "선택 완료" : "이 장소 선택"}
                          </Text>
                        }
                      </TouchableOpacity>
                    </View>
                  : null}

                  <TouchableOpacity
                    style={styles.detailButton}
                    activeOpacity={0.8}
                    onPress={() => handleToggleDetail(place, placeId)}
                  >
                    <Text style={styles.detailButtonText}>
                      {isExpanded ? "간략히" : "자세히"}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: 30,
    paddingBottom: 24,
  },

  screenTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginBottom: 8,
  },

  screenSubtitle: {
    color: "#9AA8BA",
    fontSize: 14,
    fontWeight: "700",
  },

  sectionBlock: {
    paddingHorizontal: 18,
    paddingTop: 24,
  },

  sectionTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 14,
    marginLeft: 8,
  },

  currentScheduleCard: {
    minHeight: 84,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE5F0",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  currentInfoBox: {
    flex: 1,
  },

  currentPlaceName: {
    color: "#1C2534",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
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
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 5,
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
    gap: 16,
  },

  placeCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE5F0",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
  },

  expandedPlaceCard: {
    paddingTop: 70,
    paddingBottom: 26,
    borderRadius: 24,
    borderColor: "#DDE5F0",
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
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFD0F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
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
    color: "#000000",
    fontSize: 18,
    fontWeight: "900",
    marginRight: 8,
    maxWidth: 150,
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
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 3,
  },

  reviewText: {
    color: "#7C8CA3",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 3,
  },

  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  infoText: {
    flex: 1,
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },

  aiSummaryBox: {
    position: "relative",
    marginTop: 20,
    marginLeft: 28,
    width: "78%",
    minHeight: 58,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#C7DCFF",
    backgroundColor: "#EEF6FF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  expandedAiSummaryBox: {
    width: "78%",
    marginLeft: 74,
    marginTop: 30,
  },

  aiBadge: {
    position: "absolute",
    right: -13,
    top: -13,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#5B3DFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#5B3DFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 6,
  },

  aiBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  aiSummaryIcon: {
    fontSize: 16,
    marginRight: 7,
    marginTop: 1,
  },

  aiSummaryText: {
    flex: 1,
    color: "#2158E8",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },

  detailButton: {
    marginTop: 22,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F5F7FA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  detailButtonText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "900",
  },

  detailBox: {
    marginTop: 26,
    paddingLeft: 58,
    position: "relative",
  },

  verticalLine: {
    position: "absolute",
    left: 45,
    top: 0,
    bottom: 52,
    width: 2,
    backgroundColor: "#E1E8F2",
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
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  naverBox: {
    backgroundColor: "#03C75A",
  },

  instagramBox: {
    backgroundColor: "#F35A9C",
  },

  googleBox: {
    backgroundColor: "#FFFFFF",
  },

  naverIconText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  instagramIconText: {
    color: "#FFFFFF",
    fontSize: 17,
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
    marginTop: 18,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EAF1FF",
    alignItems: "center",
    justifyContent: "center",
  },

  selectedButton: {
    backgroundColor: "#2158E8",
  },

  selectButtonText: {
    color: "#2158E8",
    fontSize: 14,
    fontWeight: "900",
  },

  selectedButtonText: {
    color: "#FFFFFF",
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
