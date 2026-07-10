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
import {
  SafeAreaView,
} from "react-native-safe-area-context";

import RecommendationPlaceList from "../../../components/recommendation/RecommendationPlaceList";
import RecommendationPreviewModal from "../../../components/recommendation/RecommendationPreviewModal";
import RecommendationResultPlaceCard from "../../../components/recommendation/RecommendationResultPlaceCard";
import {
  clearTripGapCache,
} from "../../../components/recommendations/GapRecommendationCard";

import {
  addTripLocation,
} from "../../../../api/schedules/server";

import {
  AMP,
  trackEvent,
} from "../../../utils/amplitude";

import {
  useRecommendationReviewDetails,
} from "../../../hooks/recommendation/useRecommendationReviewDetails";

import {
  useRecommendationReviewActions,
} from "../../../hooks/recommendation/useRecommendationReviewActions";

import {
  useRecommendationPreview,
} from "../../../hooks/recommendation/useRecommendationPreview";
import {
  useGapRecommendationImpact,
} from "../../../hooks/recommendation/useRecommendationImpact";

import {
  padPreviewTime,
} from "../../../utils/recommendation/recommendationFormatters";

import {
  styles,
} from "./RecommendationResultScreen.styles";

import type {
  GapRecommendationDisplayPlace as DisplayPlace,
  GapRecommendationResultScreenProps,
} from "../../../types/recommendation/gapRecommendationResult";

export default function GapRecommendationResultScreen({
  navigation,
  route,
}: GapRecommendationResultScreenProps) {
  const params = route.params;

  const [
    selectedPlaceId,
    setSelectedPlaceId,
  ] = useState<
    string | number | null
  >(null);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    submitErrorMessage,
    setSubmitErrorMessage,
  ] = useState("");

  const [
    pendingSelection,
    setPendingSelection,
  ] = useState<{
    place: DisplayPlace;
    index: number;
  } | null>(null);

  const {
    expandedPlaceId,
    setExpandedPlaceId,
    expandedHoursPlaceId,
    setExpandedHoursPlaceId,
    placeExtraDetails,
    setPlaceExtraDetails,
  } = useRecommendationReviewDetails();

  const {
    fetchReviewDetail,
  } = useRecommendationReviewActions({
    placeExtraDetails,
    setPlaceExtraDetails,
  });

  const places =
    useMemo<DisplayPlace[]>(() => {
      try {
        if (!params.placesJson) {
          return [];
        }

        const parsed =
          JSON.parse(
            params.placesJson,
          );

        return Array.isArray(parsed)
          ? parsed
          : [];
      } catch (error) {
        
        return [];
      }
    }, [
      params.placesJson,
    ]);

  const previousPreviewPlace =
    useMemo(
      () => ({
        name: params.beforePlanTitle,
        visitTime:
          params.beforePlanStartTime ??
          null,
        endTime:
          params.beforePlanEndTime ??
          null,
      }),
      [
        params.beforePlanEndTime,
        params.beforePlanStartTime,
        params.beforePlanTitle,
      ],
    );

  const nextPreviewPlace =
    useMemo(
      () => ({
        name: params.afterPlanTitle,
        visitTime:
          params.afterPlanStartTime ??
          null,
        endTime:
          params.afterPlanEndTime ??
          null,
      }),
      [
        params.afterPlanEndTime,
        params.afterPlanStartTime,
        params.afterPlanTitle,
      ],
    );

  const gapOriginalPlaceName =
    params.beforePlanTitle?.trim() ??
    "";

  const pendingPlace =
    pendingSelection?.place ??
    null;

  const previewData =
    useRecommendationPreview({
      params: {
        moveTime:
          typeof params.availableMinutes ===
          "number"
            ? String(params.availableMinutes)
            : typeof params.gapMinutes ===
                "number"
              ? String(params.gapMinutes)
              : null,
      },
      previousPlace:
        previousPreviewPlace,
      alternativePlace:
        pendingPlace,
      nextPlace:
        nextPreviewPlace,
      initialTransportMode:
        params.transportMode,
      initialVisitTime:
        pendingPlace?.suggestedVisitTime ??
        null,
      initialEndTime:
        pendingPlace?.suggestedEndTime ??
        null,
    });

  const {
    changePreviewBeforeTransportMode,
    changePreviewNextTransportMode,
    previewVisitTime,
    previewEndTime,
    draftPreviewVisitTime,
    draftPreviewEndTime,
    previewTimePickerVisible,
    previewTimePickerTarget,
    previewTimePickerPlaceName,
    previewTimePickerHour,
    previewTimePickerMinute,
    previewAppliedVisitTime,
    previewAppliedEndTime,
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
    changePreviousImpactMode,
    changeNextImpactMode,
    closeImpactPreview,
  } = useGapRecommendationImpact({
    pendingPlace,
    beforePlanId: params.beforePlanId,
    afterPlanId: params.afterPlanId,
    initialTransportMode: params.transportMode,
    onChangePreviousTransportMode:
      changePreviewBeforeTransportMode,
    onChangeNextTransportMode:
      changePreviewNextTransportMode,
  });

  const handleBack = () => {
    if (
      navigation.canGoBack()
    ) {
      navigation.goBack();
      return;
    }

    navigation.navigate(
      params.returnScreen,
      {
        scheduleId:
          params.scheduleId,
        tripId:
          params.tripId,
        serverTripId:
          params.serverTripId ??
          params.tripId,
        tripName:
          params.tripName,
        startDate:
          params.startDate,
        endDate:
          params.endDate,
        location:
          params.location,
        selectedDay:
          params.selectedDay ??
          params.day,
      },
    );
  };

  const handleToggleDetail =
    async (
      place: DisplayPlace,
      placeId: string | number,
    ) => {
      const placeKey =
        String(placeId);

      const isClosing =
        String(expandedPlaceId) ===
        placeKey;

      setExpandedPlaceId(
        isClosing
          ? null
          : placeId,
      );

      if (isClosing) {
        return;
      }

      await fetchReviewDetail(
        place,
        placeId,
        false,
      );
    };

  const handleRetryReview =
    async (
      place: DisplayPlace,
      placeId: string | number,
    ) => {
      setExpandedPlaceId(
        placeId,
      );

      await fetchReviewDetail(
        place,
        placeId,
        true,
      );
    };

  const handleConfirmPlace =
    async (
      selectedPlace: DisplayPlace,
      index: number,
      selectedVisitTime?: string | null,
      selectedEndTime?: string | null,
    ) => {
      if (isSubmitting) {
        return;
      }

      setSubmitErrorMessage("");

      const selectedPlaceKey =
        selectedPlace.placeId ??
        selectedPlace.googlePlaceId ??
        `place-${index}`;

      setSelectedPlaceId(
        selectedPlaceKey,
      );

      const selectedDay =
        Number(
          params.selectedDay ??
            params.day,
        );

      if (
        !Number.isInteger(
          selectedDay,
        ) ||
        selectedDay < 1
      ) {
        setSubmitErrorMessage(
          "장소를 추가할 일정 날짜를 확인해주세요.",
        );

        return;
      }

      const googlePlaceId =
        selectedPlace.googlePlaceId ??
        selectedPlace.placeId;

      if (
        googlePlaceId === undefined ||
        googlePlaceId === null ||
        String(
          googlePlaceId,
        ).trim().length === 0
      ) {
        setSubmitErrorMessage(
          "장소 식별값이 없어 일정에 추가할 수 없어요.",
        );

        return;
      }

      setIsSubmitting(true);

      try {
        const addLocationPayload = {
          place_id: String(
            googlePlaceId,
          ),
          name: selectedPlace.name,
          category:
            selectedPlace.category,
          address:
            selectedPlace.address ??
            null,
          latitude:
            selectedPlace.latitude ??
            null,
          longitude:
            selectedPlace.longitude ??
            null,
          lat:
            selectedPlace.latitude ??
            null,
          lng:
            selectedPlace.longitude ??
            null,
          visitTime:
            selectedVisitTime ??
            selectedPlace.suggestedVisitTime ??
            null,
          endTime:
            selectedEndTime ??
            selectedPlace.suggestedEndTime ??
            null,
          memo: null,
          transportMode:
            nextImpactMode,
        };

        
        await addTripLocation(
          params.serverTripId ??
            params.tripId,
          selectedDay,
          addLocationPayload,
        );

        clearTripGapCache(
          params.serverTripId ??
            params.tripId,
        );

        const selectedRank =
          places.findIndex(
            (place) => {
              const placeId =
                place.googlePlaceId ??
                place.placeId;

              return (
                String(placeId) ===
                String(
                  googlePlaceId,
                )
              );
            },
          ) + 1;

        trackEvent(
          AMP.GAP_PLACE_SELECTED,
          {
            trip_id:
              String(
                params.serverTripId ??
                  params.tripId,
              ),
            place_id:
              String(
                googlePlaceId,
              ),
            place_name:
              selectedPlace.name,
            place_category:
              selectedPlace.category ??
              "",
            rank:
              selectedRank,
            day:
              selectedDay,
            before_plan_id:
              String(
                params.beforePlanId,
              ),
            after_plan_id:
              String(
                params.afterPlanId,
              ),
            transport_mode:
              nextImpactMode,
          },
        );

        navigation.replace(
          params.returnScreen,
          {
            scheduleId:
              params.scheduleId,
            tripId:
              params.tripId,
            serverTripId:
              params.serverTripId ??
              params.tripId,
            tripName:
              params.tripName,
            startDate:
              params.startDate,
            endDate:
              params.endDate,
            location:
              params.location,
            selectedDay,
            refreshPlanAAt:
              Date.now(),
            successToastMessage:
              `${selectedPlace.name}을(를) 일정에 추가했어요.`,
          },
        );
      } catch (error) {
        const axiosError = error as {
          message?: string;
          response?: {
            status?: number;
            data?: unknown;
          };
        };

        
        setSelectedPlaceId(null);

        setSubmitErrorMessage(
          error instanceof Error &&
            error.message.trim()
            ? error.message
            : "장소를 일정에 추가하지 못했어요. 잠시 후 다시 시도해주세요.",
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  const transportLabel =
    params.transportLabel ??
    (
      params.transportMode === "WALK"
        ? "도보"
        : params.transportMode === "CAR"
          ? "자동차"
          : "대중교통"
    );

  const availableTimeText =
    typeof params.availableMinutes ===
      "number"
      ? `${params.availableMinutes}분`
      : typeof params.gapMinutes ===
          "number"
        ? `${params.gapMinutes}분`
        : "시간 정보 없음";

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={[
        "top",
        "left",
        "right",
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.75}
          onPress={handleBack}
        >
          <Ionicons
            name="chevron-back"
            size={26}
            color="#6F7F95"
          />
        </TouchableOpacity>

        <Text style={styles.logoText}>
          Plan.B
        </Text>

        <View
          style={
            styles.headerRightSpace
          }
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={
            styles.titleSection
          }
        >
          <Text
            style={
              styles.screenTitle
            }
          >
            빈 시간 대안 추천
          </Text>

          <Text
            style={
              styles.screenSubtitle
            }
          >
            일정 사이의 빈 시간에
            방문하기 좋은 장소를
            추천했어요
          </Text>
        </View>

        <View
          style={
            styles.sectionBlock
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            추천 구간
          </Text>

          <View
            style={
              styles.currentScheduleCard
            }
          >
            <View
              style={
                styles.currentInfoBox
              }
            >
              <Text
                style={
                  styles.currentPlaceName
                }
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {params.beforePlanTitle}
              </Text>

              <View
                style={
                  styles.currentTimeRow
                }
              >
                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color="#2158E8"
                />

                <Text
                  style={
                    styles.currentTimeText
                  }
                >
                  {params.afterPlanTitle}
                </Text>
              </View>

              <View
                style={
                  styles.currentTimeRow
                }
              >
                <Ionicons
                  name="time-outline"
                  size={14}
                  color="#7C8CA3"
                />

                <Text
                  style={
                    styles.currentTimeText
                  }
                >
                  {availableTimeText}
                  {" · "}
                  {transportLabel}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View
          style={
            styles.sectionBlock
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            AI가 찾은 추천 장소{" "}
            {places.length}개
          </Text>

          <RecommendationPlaceList>
            {places.map(
              (
                place,
                index,
              ) => {
                const placeId =
                  place.placeId ??
                  place.googlePlaceId ??
                  `place-${index}`;

                const isExpanded =
                  String(
                    expandedPlaceId,
                  ) ===
                  String(placeId);

                const isHoursExpanded =
                  String(
                    expandedHoursPlaceId,
                  ) ===
                  String(placeId);

                const isSelected =
                  String(
                    selectedPlaceId,
                  ) ===
                  String(placeId);

                const extraDetail =
                  placeExtraDetails[
                    String(placeId)
                  ];

                return (
                  <RecommendationResultPlaceCard
                    key={
                      `gap-recommendation-` +
                      `${String(placeId)}-` +
                      `${index}`
                    }
                    place={place}
                    index={index}
                    isExpanded={
                      isExpanded
                    }
                    isHoursExpanded={
                      isHoursExpanded
                    }
                    isSelected={
                      isSelected
                    }
                    isSubmitting={
                      isSubmitting &&
                      isSelected
                    }
                    isWeatherRecommendation={
                      false
                    }
                    selectButtonLabel="선택하기"
                    extraDetail={
                      extraDetail
                    }
                    onToggleHours={(
                      targetPlaceId,
                    ) => {
                      setExpandedHoursPlaceId(
                        (
                          previous:
                            | string
                            | number
                            | null,
                        ) =>
                          String(
                            previous,
                          ) ===
                          String(
                            targetPlaceId,
                          )
                            ? null
                            : targetPlaceId,
                      );
                    }}
        onSelect={() => {
                      setSubmitErrorMessage("");
                      setPendingSelection({
                        place,
                        index,
                      });
                    }}
                    onRetryReview={(
                      targetPlace,
                      targetPlaceId,
                    ) => {
                      void handleRetryReview(
                        targetPlace as DisplayPlace,
                        targetPlaceId,
                      );
                    }}
                    onToggleDetail={(
                      targetPlace,
                      targetPlaceId,
                    ) => {
                      void handleToggleDetail(
                        targetPlace as DisplayPlace,
                        targetPlaceId,
                      );
                    }}
                  />
                );
              },
            )}
          </RecommendationPlaceList>
        </View>

        {places.length === 0 ? (
          <View
            style={
              styles.warningBox
            }
          >
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color="#F97316"
            />

            <Text
              style={
                styles.warningText
              }
            >
              표시할 추천 장소가
              없습니다.
            </Text>
          </View>
        ) : null}

      </ScrollView>

      <RecommendationPreviewModal
        visible={Boolean(pendingSelection)}
        pendingPlace={pendingPlace}
        originalPlace={previousPreviewPlace}
        nextPlace={nextPreviewPlace}
        hasPreviousSchedule
        hasNextSchedule
        previousName={previewData.previewPreviousName}
        previousTime={previewData.previewPreviousTime}
        previousAddress={previewData.previewPreviousAddress}
        alternativeName={previewData.previewAlternativeName}
        alternativeTime={previewData.previewAppliedTimeText}
        alternativeAddress={previewData.previewAlternativeAddress}
        originalPlaceName={gapOriginalPlaceName}
        nextName={previewData.previewNextName}
        nextTime={previewData.previewNextTime}
        nextAddress={previewData.previewNextAddress}
        transportMode={nextImpactMode}
        previousTransportMode={previousImpactMode}
        nextTransportMode={nextImpactMode}
        previousMoveTimeText={previousMoveTimeText}
        nextMoveTimeText={nextMoveTimeText}
        timePickerVisible={previewTimePickerVisible}
        timePickerPlaceName={previewTimePickerPlaceName}
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
          setPendingSelection(null);
          closePreviewTimePicker();
          closeImpactPreview();
        }}
        onChangeTransportMode={changeNextImpactMode}
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
        confirmErrorMessage={submitErrorMessage}
        confirming={isSubmitting}
        confirmLabel="선택하기"
        confirmingLabel="추가 중..."
        onConfirm={() => {
          if (!pendingSelection || isSubmitting) {
            return;
          }

          void handleConfirmPlace(
            pendingSelection.place,
            pendingSelection.index,
            previewVisitTime ??
              pendingSelection.place.suggestedVisitTime ??
              null,
            previewEndTime ??
              pendingSelection.place.suggestedEndTime ??
              null,
          );
        }}
      />
    </SafeAreaView>
  );
}
