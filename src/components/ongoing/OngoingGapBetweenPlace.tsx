// src/components/ongoing/OngoingGapBetweenPlace.tsx

import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import GapRecommendationCard from "../recommendations/GapRecommendationCard";

type Props = {
  place: any;
  nextPlace: any;
  index: number;
  placeKey: string;
  gapBeforePlanId: string | number | undefined;
  gapAfterPlanId: string | number | undefined;
  currentGapPlanPairs: { beforePlanId: any; afterPlanId: any }[];
  resolvedTripId?: string | number;
  scheduleId?: string;
  selectedDay: number;
  localStyles: any;
  transportModesByPair: Record<string, any>;
  transportPickerTarget: {
    pairKey: string;
    beforePlaceName?: string;
    afterPlaceName?: string;
  } | null;
  getTransportOption: (mode: any) => {
    key?: string;
    label: string;
    icon: any;
  };
  getPlaceEndTimeValueForGap: (place: any) => number;
  getPlaceStartTimeValueForGap: (place: any) => number;
  handleOpenTransportPicker: (params: {
    pairKey: string;
    beforePlaceName?: string;
    afterPlaceName?: string;
  }) => void;
  handleSelectTransportMode: (mode: any) => void;
  handleConfirmTransportMode: () => void;
  transportOptions: { key: any; label: string }[];
  onSelectGapPlace?: (place: any, gap: any) => void;
};

export default function OngoingGapBetweenPlace({
  place,
  nextPlace,
  index,
  placeKey,
  gapBeforePlanId,
  gapAfterPlanId,
  currentGapPlanPairs,
  resolvedTripId,
  scheduleId,
  selectedDay,
  localStyles,
  transportModesByPair,
  transportPickerTarget,
  getTransportOption,
  getPlaceEndTimeValueForGap,
  getPlaceStartTimeValueForGap,
  handleOpenTransportPicker,
  handleSelectTransportMode,
  handleConfirmTransportMode,
  transportOptions,
  onSelectGapPlace,
}: Props) {
  const pairKey = `${String(gapBeforePlanId ?? placeKey)}-${String(
    gapAfterPlanId ?? index + 1,
  )}`;

  const selectedTransportMode =
    transportModesByPair[pairKey] ?? place.transportMode ?? null;

  const selectedTransportOption = getTransportOption(selectedTransportMode);

  const currentEndMinutes = getPlaceEndTimeValueForGap(place);
  const nextStartMinutes = getPlaceStartTimeValueForGap(nextPlace);

  const hasMoveSlot =
    Number.isFinite(currentEndMinutes) &&
    Number.isFinite(nextStartMinutes) &&
    nextStartMinutes > currentEndMinutes;

  const hasGapCandidate =
    currentGapPlanPairs.length > 0;

  const [
    isGapCardVisible,
    setIsGapCardVisible,
  ] = React.useState<boolean | null>(
    null,
  );

  if (!hasMoveSlot && !hasGapCandidate) {
    return null;
  }

  const isTransportExpanded =
    transportPickerTarget?.pairKey ===
    pairKey;

  if (
    hasGapCandidate &&
    isGapCardVisible === false
  ) {
    return (
      <View
        style={
          localStyles.transportCompactConnector
        }
      >
        <View
          style={
            localStyles.transportCompactIconColumn
          }
        >
          <View
            style={
              localStyles.transportCompactLine
            }
          />
        </View>
      </View>
    );
  }

  if (hasGapCandidate) {
    return (
      <View style={localStyles.transportBetweenWrapper}>
        <View style={localStyles.transportIconColumn}>
          <View style={localStyles.transportSolidLineTop} />

          <Ionicons
            name={selectedTransportOption.icon}
            size={18}
            color="#94A3B8"
            style={localStyles.transportIcon}
          />

          <View style={localStyles.transportDotLine}>
            {Array.from({ length: 4 }).map((_, dotIndex) => (
              <View key={dotIndex} style={localStyles.transportDot} />
            ))}
          </View>

          <View style={localStyles.transportSolidLineBottom} />
        </View>

        <View style={localStyles.transportCardColumn}>
          <GapRecommendationCard
            tripId={resolvedTripId ?? scheduleId}
            selectedDay={selectedDay}
            allowedPlanPairs={currentGapPlanPairs}
            onVisibilityChange={
              setIsGapCardVisible
            }
          />
        </View>
      </View>
    );
  }

  return (
    <View style={localStyles.transportEmptyRow}>
      <Ionicons
        name={selectedTransportOption.icon}
        size={18}
        color="#94A3B8"
        style={localStyles.transportIconCompact}
      />

      <View style={localStyles.transportEmptyCardWrapper}>
        <View style={localStyles.transportAccordionCard}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={localStyles.transportAccordionHeader}
            onPress={() =>
              handleOpenTransportPicker({
                pairKey,
                beforePlaceName: place.name,
                afterPlaceName: nextPlace.name,
              })
            }
          >
            <View style={localStyles.transportAddTextGroup}>
              <Text style={localStyles.transportAddTitle}>
                {selectedTransportMode ?
                  `${selectedTransportOption.label} 이동`
                : "이동수단 추가하기"}
              </Text>

              <Text style={localStyles.transportAddDescription}>
                {selectedTransportMode ?
                  "장소 사이 이동수단이 설정되었어요"
                : "이동수단을 추가해주세요"}
              </Text>
            </View>

            <Ionicons
              name={isTransportExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color="#CBD5E1"
            />
          </TouchableOpacity>

          {isTransportExpanded ?
            <View style={localStyles.transportAccordionBody}>
              <View style={localStyles.transportInlineOptionRow}>
                {transportOptions.map((option) => {
                  const selected = transportModesByPair[pairKey] === option.key;

                  return (
                    <TouchableOpacity
                      key={option.key}
                      activeOpacity={0.85}
                      style={[
                        localStyles.transportInlineOptionButton,
                        selected ?
                          localStyles.transportInlineOptionButtonSelected
                        : null,
                      ]}
                      onPress={() => handleSelectTransportMode(option.key)}
                    >
                      <Text
                        style={[
                          localStyles.transportInlineOptionText,
                          selected ?
                            localStyles.transportInlineOptionTextSelected
                          : null,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={localStyles.transportInlineConfirmButton}
                onPress={handleConfirmTransportMode}
              >
                <Text style={localStyles.transportInlineConfirmText}>확인</Text>
              </TouchableOpacity>
            </View>
          : null}
        </View>
      </View>
    </View>
  );
}
