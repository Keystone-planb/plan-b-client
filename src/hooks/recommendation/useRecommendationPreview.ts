import { useMemo, useState } from "react";

import {
  getPreviewTimeMinutes,
  getPreviewTimeParts,
  getPreviewTimeText,
  makePreviewTime,
  normalizeDisplayTime,
  normalizeDisplayTimeRange,
  splitPreviewTime,
} from "../../utils/recommendation/recommendationFormatters";

import type {
  RecommendationPreviewPlace,
  RecommendationTransportMode,
} from "../../types/recommendation/recommendationPreview";

type Params = {
  moveTime?: string | null;
};

type PreviewTimePickerTarget = "visitTime" | "endTime";
export type PreviewScheduleTimeTarget =
  | "previous"
  | "alternative"
  | "next";

type UseRecommendationPreviewParams = {
  params: Params;
  previousPlace?: RecommendationPreviewPlace | null;
  alternativePlace?: RecommendationPreviewPlace | null;
  nextPlace?: RecommendationPreviewPlace | null;
  initialTransportMode?: RecommendationTransportMode;
  initialVisitTime?: string | null;
  initialEndTime?: string | null;
  onTimeValidationError?: () => void;
};

const getPreviewPlaceTimeParts = (
  place?: RecommendationPreviewPlace | null,
) => getPreviewTimeParts(place);

export function useRecommendationPreview({
  params,
  previousPlace,
  alternativePlace,
  nextPlace,
  initialTransportMode = "WALK",
  initialVisitTime,
  initialEndTime,
  onTimeValidationError,
}: UseRecommendationPreviewParams) {
  const [previewBeforeTransportMode, setPreviewBeforeTransportMode] =
    useState<RecommendationTransportMode>(initialTransportMode);

  const [previewTransportMode, setPreviewTransportMode] =
    useState<RecommendationTransportMode>(initialTransportMode);

  const [previewVisitTime, setPreviewVisitTime] =
    useState<string | null>(null);
  const [previewEndTime, setPreviewEndTime] =
    useState<string | null>(null);
  const [previewPreviousVisitTime, setPreviewPreviousVisitTime] =
    useState<string | null>(null);
  const [previewPreviousEndTime, setPreviewPreviousEndTime] =
    useState<string | null>(null);
  const [previewNextVisitTime, setPreviewNextVisitTime] =
    useState<string | null>(null);
  const [previewNextEndTime, setPreviewNextEndTime] =
    useState<string | null>(null);
  const [draftPreviewVisitTime, setDraftPreviewVisitTime] =
    useState<string | null>(null);
  const [draftPreviewEndTime, setDraftPreviewEndTime] =
    useState<string | null>(null);
  const [previewTimePickerVisible, setPreviewTimePickerVisible] =
    useState(false);
  const [previewTimePickerTarget, setPreviewTimePickerTarget] =
    useState<PreviewTimePickerTarget>("visitTime");
  const [previewScheduleTimeTarget, setPreviewScheduleTimeTarget] =
    useState<PreviewScheduleTimeTarget>("alternative");
  const [previewTimePickerHour, setPreviewTimePickerHour] = useState(0);
  const [previewTimePickerMinute, setPreviewTimePickerMinute] = useState(0);

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

  const previewPreviousTime = useMemo(() => {
    const overrideTime = [
      normalizeDisplayTime(previewPreviousVisitTime),
      normalizeDisplayTime(previewPreviousEndTime),
    ]
      .filter(Boolean)
      .join(" - ");

    return overrideTime || getPreviewTimeText(previousPlace) || "시간 미정";
  }, [previousPlace, previewPreviousEndTime, previewPreviousVisitTime]);

  const previewAlternativeTime = useMemo(
    () => getPreviewTimeText(alternativePlace) || "시간 미정",
    [alternativePlace],
  );

  const previewNextTime = useMemo(() => {
    const overrideTime = [
      normalizeDisplayTime(previewNextVisitTime),
      normalizeDisplayTime(previewNextEndTime),
    ]
      .filter(Boolean)
      .join(" - ");

    return overrideTime || getPreviewTimeText(nextPlace) || "시간 미정";
  }, [nextPlace, previewNextEndTime, previewNextVisitTime]);

  const previewAppliedVisitTime =
    previewVisitTime ?? initialVisitTime ?? alternativePlace?.visitTime ?? null;

  const previewAppliedEndTime =
    previewEndTime ?? initialEndTime ?? alternativePlace?.endTime ?? null;

  const previewAppliedTimeText =
    [
      normalizeDisplayTime(previewAppliedVisitTime),
      normalizeDisplayTime(previewAppliedEndTime),
    ].filter(Boolean).join(" - ") ||
    getPreviewTimeText(alternativePlace) ||
    "시간 미정";

  const getTargetTimeValues = (
    target: PreviewScheduleTimeTarget,
  ) => {
    if (target === "previous") {
      const fallbackTimes =
        getPreviewPlaceTimeParts(previousPlace);

      return {
        visitTime:
          previewPreviousVisitTime ??
          fallbackTimes.visitTime,
        endTime:
          previewPreviousEndTime ??
          fallbackTimes.endTime,
      };
    }

    if (target === "next") {
      const fallbackTimes =
        getPreviewPlaceTimeParts(nextPlace);

      return {
        visitTime:
          previewNextVisitTime ??
          fallbackTimes.visitTime,
        endTime:
          previewNextEndTime ??
          fallbackTimes.endTime,
      };
    }

    return {
      visitTime: previewAppliedVisitTime,
      endTime: previewAppliedEndTime,
    };
  };

  const previewTimePickerPlaceName = useMemo(() => {
    if (previewScheduleTimeTarget === "previous") {
      return previousPlace?.name?.trim() || "이전 일정";
    }

    if (previewScheduleTimeTarget === "next") {
      return nextPlace?.name?.trim() || "다음 일정";
    }

    return alternativePlace?.name?.trim() || "대안 장소";
  }, [
    alternativePlace?.name,
    nextPlace?.name,
    previousPlace?.name,
    previewScheduleTimeTarget,
  ]);

  const previewMoveTimeText = useMemo(() => {
    if (!params.moveTime || params.moveTime === "ANY") return "";
    return `${params.moveTime}분`;
  }, [params.moveTime]);

  const initializePreviewTimes = (
    visitTime?: string | null,
    endTime?: string | null,
  ) => {
    setPreviewVisitTime((current) => current ?? visitTime ?? null);
    setPreviewEndTime((current) => current ?? endTime ?? null);
  };

  const getCurrentPickerTime = () =>
    makePreviewTime(previewTimePickerHour, previewTimePickerMinute);

  const openPreviewTimePicker = (
    target: PreviewScheduleTimeTarget = "alternative",
  ) => {
    setPreviewScheduleTimeTarget(target);

    const targetTimes = getTargetTimeValues(target);
    const nextDraftVisitTime = targetTimes.visitTime ?? null;
    const nextDraftEndTime = targetTimes.endTime ?? null;

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

  const switchPreviewTimePickerTarget = (
    target:
      | PreviewTimePickerTarget
      | "transportStartTime"
      | "transportEndTime",
  ) => {
    if (target !== "visitTime" && target !== "endTime") return;

    const currentPickerTime = getCurrentPickerTime();
    const targetTimes = getTargetTimeValues(
      previewScheduleTimeTarget,
    );
    const nextDraftVisitTime =
      previewTimePickerTarget === "visitTime"
        ? currentPickerTime
        : draftPreviewVisitTime ?? targetTimes.visitTime ?? null;
    const nextDraftEndTime =
      previewTimePickerTarget === "endTime"
        ? currentPickerTime
        : draftPreviewEndTime ?? targetTimes.endTime ?? null;

    setDraftPreviewVisitTime(nextDraftVisitTime);
    setDraftPreviewEndTime(nextDraftEndTime);
    setPreviewTimePickerTarget(target);

    const parsed = splitPreviewTime(
      target === "visitTime" ? nextDraftVisitTime : nextDraftEndTime,
    );
    setPreviewTimePickerHour(parsed.hour);
    setPreviewTimePickerMinute(parsed.minute);
  };

  const savePreviewTimePicker = () => {
    const currentPickerTime = getCurrentPickerTime();
    const targetTimes = getTargetTimeValues(
      previewScheduleTimeTarget,
    );
    const nextVisitTime =
      previewTimePickerTarget === "visitTime"
        ? currentPickerTime
        : draftPreviewVisitTime ?? targetTimes.visitTime ?? null;
    const nextEndTime =
      previewTimePickerTarget === "endTime"
        ? currentPickerTime
        : draftPreviewEndTime ?? targetTimes.endTime ?? null;

    const nextVisitMinutes = getPreviewTimeMinutes(nextVisitTime);
    const nextEndMinutes = getPreviewTimeMinutes(nextEndTime);

    if (
      nextVisitMinutes == null ||
      nextEndMinutes == null ||
      nextVisitMinutes >= nextEndMinutes
    ) {
      onTimeValidationError?.();
      return false;
    }

    setDraftPreviewVisitTime(nextVisitTime);
    setDraftPreviewEndTime(nextEndTime);

    if (previewScheduleTimeTarget === "previous") {
      setPreviewPreviousVisitTime(nextVisitTime);
      setPreviewPreviousEndTime(nextEndTime);
    } else if (previewScheduleTimeTarget === "next") {
      setPreviewNextVisitTime(nextVisitTime);
      setPreviewNextEndTime(nextEndTime);
    } else {
      setPreviewVisitTime(nextVisitTime);
      setPreviewEndTime(nextEndTime);
    }

    setPreviewTimePickerVisible(false);
    return true;
  };

  const decreasePreviewTimePickerHour = () => {
    setPreviewTimePickerHour((current) => (current <= 0 ? 23 : current - 1));
  };

  const increasePreviewTimePickerHour = () => {
    setPreviewTimePickerHour((current) => (current >= 23 ? 0 : current + 1));
  };

  const decreasePreviewTimePickerMinute = () => {
    setPreviewTimePickerMinute((current) =>
      current <= 0 ? 59 : current - 1,
    );
  };

  const increasePreviewTimePickerMinute = () => {
    setPreviewTimePickerMinute((current) =>
      current >= 59 ? 0 : current + 1,
    );
  };

  const changePreviewTransportMode = (mode: RecommendationTransportMode) => {
    setPreviewTransportMode(mode);
  };

  const changePreviewBeforeTransportMode = (
    mode: RecommendationTransportMode,
  ) => {
    setPreviewBeforeTransportMode(mode);
  };

  const changePreviewNextTransportMode = (
    mode: RecommendationTransportMode,
  ) => {
    setPreviewTransportMode(mode);
  };

  return {
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
    previewScheduleTimeTarget,
    previewTimePickerPlaceName,
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

    previewPreviousName,
    previewAlternativeName,
    previewNextName,
    previewPreviousAddress,
    previewAlternativeAddress,
    previewNextAddress,
    previewPreviousTime,
    previewAlternativeTime,
    previewNextTime,
    previewAppliedTimeText,
    previewMoveTimeText,
  };
}
