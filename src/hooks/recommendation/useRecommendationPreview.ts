import { useMemo, useState } from "react";

import {
  getPreviewTimeText,
} from "../../utils/recommendation/recommendationFormatters";

import type {
  RecommendationPreviewPlace,
  RecommendationTransportMode,
} from "../../types/recommendation/recommendationPreview";

type Params = {
  moveTime?: string | null;
};

type UseRecommendationPreviewParams = {
  params: Params;
  previousPlace?: RecommendationPreviewPlace | null;
  alternativePlace?: RecommendationPreviewPlace | null;
  nextPlace?: RecommendationPreviewPlace | null;
  initialTransportMode?: RecommendationTransportMode;
  previewVisitTime?: string | null;
  previewEndTime?: string | null;
};

export function useRecommendationPreview({
  params,
  previousPlace,
  alternativePlace,
  nextPlace,
  initialTransportMode = "WALK",
  previewVisitTime,
  previewEndTime,
}: UseRecommendationPreviewParams) {
  const [previewTransportMode, setPreviewTransportMode] =
    useState<RecommendationTransportMode>(initialTransportMode);

  const [previewTimePickerVisible, setPreviewTimePickerVisible] =
    useState(false);

  const previewPreviousName = useMemo(
    () => previousPlace?.name?.trim() || "장소 정보 없음",
    [previousPlace?.name],
  );

  const previewAlternativeName = useMemo(
    () => alternativePlace?.name?.trim() || "추천 장소",
    [alternativePlace?.name],
  );

  const previewNextName = useMemo(
    () => nextPlace?.name?.trim() || "장소 정보 없음",
    [nextPlace?.name],
  );

  const previewPreviousAddress = useMemo(
    () => previousPlace?.address?.trim() || "",
    [previousPlace?.address],
  );

  const previewAlternativeAddress = useMemo(
    () => alternativePlace?.address?.trim() || "",
    [alternativePlace?.address],
  );

  const previewNextAddress = useMemo(
    () => nextPlace?.address?.trim() || "",
    [nextPlace?.address],
  );

  const previewPreviousTime = useMemo(
    () => getPreviewTimeText(previousPlace) || "시간 미정",
    [previousPlace],
  );

  const previewAlternativeTime = useMemo(
    () => getPreviewTimeText(alternativePlace) || "시간 미정",
    [alternativePlace],
  );

  const previewNextTime = useMemo(
    () => getPreviewTimeText(nextPlace) || "시간 미정",
    [nextPlace],
  );

  const previewAppliedVisitTime =
    previewVisitTime ?? alternativePlace?.visitTime ?? null;

  const previewAppliedEndTime =
    previewEndTime ?? alternativePlace?.endTime ?? null;

  const previewAppliedTimeText =
    [previewAppliedVisitTime, previewAppliedEndTime].filter(Boolean).join(" - ") ||
    getPreviewTimeText(alternativePlace) ||
    "시간 미정";

  const previewMoveTimeText = useMemo(() => {
    if (!params.moveTime || params.moveTime === "ANY") return "";
    return `${params.moveTime}분`;
  }, [params.moveTime]);

  const openPreviewTimePicker = () => {
    setPreviewTimePickerVisible(true);
  };

  const closePreviewTimePicker = () => {
    setPreviewTimePickerVisible(false);
  };

  return {
    previewTransportMode,
    setPreviewTransportMode,

    previewTimePickerVisible,
    openPreviewTimePicker,
    closePreviewTimePicker,

    previewPreviousName,
    previewAlternativeName,
    previewNextName,

    previewPreviousAddress,
    previewAlternativeAddress,
    previewNextAddress,

    previewPreviousTime,
    previewAlternativeTime,
    previewNextTime,

    previewAppliedVisitTime,
    previewAppliedEndTime,
    previewAppliedTimeText,

    previewMoveTimeText,
  };
}
