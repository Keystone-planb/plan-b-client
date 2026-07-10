import React, {
  useMemo,
  useState,
} from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { trackEvent, AMP } from "../../../utils/amplitude";
import { useRecommendationToast } from "../../../hooks/recommendation/useRecommendationToast";
import { useRecommendationReviewDetails } from "../../../hooks/recommendation/useRecommendationReviewDetails";
import { useRecommendationReviewActions } from "../../../hooks/recommendation/useRecommendationReviewActions";
import { useRecommendationScheduleContext } from "../../../hooks/recommendation/useRecommendationScheduleContext";
import { useRecommendationPreview } from "../../../hooks/recommendation/useRecommendationPreview";
import { useRecommendationImpact } from "../../../hooks/recommendation/useRecommendationImpact";
import { useRecommendationReplaceFlow } from "../../../hooks/recommendation/useRecommendationReplaceFlow";
import RecommendationPlaceList from "../../../components/recommendation/RecommendationPlaceList";
import RecommendationPreviewModal from "../../../components/recommendation/RecommendationPreviewModal";
import RecommendationResultPlaceCard from "../../../components/recommendation/RecommendationResultPlaceCard";
import WhiteToast from "../../../components/recommendation/WhiteToast";
import {
  padPreviewTime,
} from "../../../utils/recommendation/recommendationFormatters";
import { styles } from "./RecommendationResultScreen.styles";
import type {
  RecommendationResultDisplayPlace as DisplayPlace,
  RecommendationResultScreenProps as Props,
} from "../../../types/recommendation/recommendationResult";


export default function RecommendationResultScreen({
  navigation,
  route,
}: Props) {
  const { whiteToast, showWhiteToast } = useRecommendationToast();
  const [pendingPlace, setPendingPlace] =
    useState<DisplayPlace | null>(null);

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


  const params = route.params ?? {};

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

  const targetPlace = params.targetPlace;


  const {
    previousSchedulePlace: savedPreviousSchedulePlace,
    originalSchedulePlace,
    nextSchedulePlace,
  } = useRecommendationScheduleContext({
    params,
    targetPlace,
    showToast: showWhiteToast,
  });

  const currentPlaceName =
    originalSchedulePlace?.name || params.title || "현재 진행 중인 일정";
  const currentPlaceTime =
    originalSchedulePlace?.time?.trim() ||
    "시간 미정";

  const previewData = useRecommendationPreview({
    params,
    previousPlace: savedPreviousSchedulePlace,
    alternativePlace: pendingPlace,
    nextPlace: nextSchedulePlace,
    initialTransportMode: params.transportMode ?? "WALK",
    initialVisitTime:
      originalSchedulePlace?.visitTime ??
      targetPlace?.visitTime ??
      null,
    initialEndTime:
      originalSchedulePlace?.endTime ??
      targetPlace?.endTime ??
      null,
  });

  const {
    changePreviewTransportMode,
    changePreviewBeforeTransportMode,
    changePreviewNextTransportMode,
    previewTimePickerVisible,
    previewTimePickerTarget,
    previewTimePickerHour,
    previewTimePickerMinute,
    previewAppliedVisitTime,
    previewAppliedEndTime,
    draftPreviewVisitTime,
    draftPreviewEndTime,
    openPreviewTimePicker,
    closePreviewTimePicker,
    switchPreviewTimePickerTarget,
    savePreviewTimePicker,
    decreasePreviewTimePickerHour,
    increasePreviewTimePickerHour,
    decreasePreviewTimePickerMinute,
    increasePreviewTimePickerMinute,
  } = previewData;

  const {
    previousImpactMode,
    nextImpactMode,
    previousMoveTimeText,
    nextMoveTimeText,
    nextTime: impactNextTime,
    changePreviousImpactMode,
    changeNextImpactMode,
    closeImpactPreview,
  } = useRecommendationImpact({
    pendingPlace,
    routeParams: params,
    targetPlace,
    fallbackNextTime: previewData.previewNextTime,
    showToast: showWhiteToast,
    onChangePreviousTransportMode:
      changePreviewBeforeTransportMode,
    onChangeNextTransportMode:
      changePreviewNextTransportMode,
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


  const {
    selectedPlaceId,
    submittingPlaceId,
    replaceErrorMessage,
    clearReplaceError,
    handleSelectPlace,
  } = useRecommendationReplaceFlow({
    navigation,
    params,
    places,
    shownPlaceIds,
    targetPlace,
    previousSchedulePlace:
      savedPreviousSchedulePlace,
    previewVisitTime: previewAppliedVisitTime,
    previewEndTime: previewAppliedEndTime,
    previousImpactMode,
    nextImpactMode,
    showToast: showWhiteToast,
  });

  const handleClosePreview = () => {
    setPendingPlace(null);
    clearReplaceError();
    closePreviewTimePicker();
    closeImpactPreview();
  };

  const title = params.title ?? "AI 대안 추천";
  const isWeatherRecommendation =
    params.source === "weather-notification" || params.fromWeatherNotification;

  const subtitle =
    isWeatherRecommendation ?
      "날씨에 맞춰 방문하기 좋은 대안을 추천했어요"
    : "현재 일정과 조건을 기준으로 추천했어요";

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
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
                  selectButtonLabel="이 장소로 대체"
                  extraDetail={extraDetail}
                  onToggleHours={(targetPlaceId) =>
                    setExpandedHoursPlaceId((prev: string | number | null) =>
                      String(prev) === String(targetPlaceId)
                        ? null
                        : targetPlaceId,
                    )
                  }
                  onSelect={(selectedPlace) => {
                    clearReplaceError();
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
        nextPlace={nextSchedulePlace}
        hasPreviousSchedule={Boolean(savedPreviousSchedulePlace)}
        hasNextSchedule={Boolean(nextSchedulePlace)}
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
        previousMoveTimeText={previousMoveTimeText}
        nextMoveTimeText={nextMoveTimeText}
        timePickerVisible={previewTimePickerVisible}
        timePickerPlaceName={pendingPlace?.name ?? "추천 장소"}
        timePickerTarget={previewTimePickerTarget}
        timePickerPreviewText={`${padPreviewTime(
          previewTimePickerHour,
        )}:${padPreviewTime(previewTimePickerMinute)}`}
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
        confirmErrorMessage={replaceErrorMessage}
        confirming={Boolean(submittingPlaceId)}
        onClose={handleClosePreview}
        onChangeTransportMode={changePreviewTransportMode}
        onChangePreviousTransportMode={changePreviousImpactMode}
        onChangeNextTransportMode={changeNextImpactMode}
        onPressTimeEdit={openPreviewTimePicker}
        onTimePickerClose={closePreviewTimePicker}
        onSwitchTimeTarget={switchPreviewTimePickerTarget}
        onDecreaseHour={decreasePreviewTimePickerHour}
        onIncreaseHour={increasePreviewTimePickerHour}
        onDecreaseMinute={decreasePreviewTimePickerMinute}
        onIncreaseMinute={increasePreviewTimePickerMinute}
        onSaveTime={savePreviewTimePicker}
        onConfirm={() => {
          if (!pendingPlace || submittingPlaceId) {
            return;
          }

          void handleSelectPlace(pendingPlace);
        }}
      />

      <WhiteToast toast={whiteToast} />
    </SafeAreaView>
  );
}
