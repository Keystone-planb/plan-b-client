import { useMemo, useState } from "react";

import {
  getPreviewTimeText,
} from "../../utils/recommendation/recommendationFormatters";

type TransportMode = "WALK" | "TRANSIT" | "CAR";

type PreviewPlace = {
  name?: string | null;
  address?: string | null;
  time?: string | null;
  visitTime?: string | null;
  endTime?: string | null;
};

type Params = {
  moveTime?: string | null;
};

type UseRecommendationPreviewParams = {
  params: Params;
  previousPlace?: PreviewPlace | null;
  alternativePlace?: PreviewPlace | null;
  nextPlace?: PreviewPlace | null;
  initialTransportMode?: TransportMode;
};

export function useRecommendationPreview({
  params,
  previousPlace,
  alternativePlace,
  nextPlace,
  initialTransportMode = "WALK",
}: UseRecommendationPreviewParams) {
  const [previewTransportMode, setPreviewTransportMode] =
    useState<TransportMode>(initialTransportMode);

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

    previewMoveTimeText,
  };
}
