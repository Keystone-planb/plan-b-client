// src/hooks/location/usePlaceReview.ts

import { useRef, useState } from "react";
import { Alert } from "react-native";

type PlaceLike = {
  name?: string;
  placeId?: string | number;
  googlePlaceId?: string | number;
};

type PlaceReviewInfo = {
  detail: unknown;
  summary: unknown;
  freshness: unknown;
};

const REANALYZE_MESSAGES = [
  "최신 리뷰를 확인하고 있어요...",
  "Google 리뷰를 분석하고 있어요...",
  "Naver 리뷰를 분석하고 있어요...",
  "장소 특징을 정리하고 있어요...",
  "AI 요약을 생성하고 있어요...",
];

type UsePlaceReviewParams<TPlace extends PlaceLike> = {
  getReviewPlaceKey: (place: TPlace) => string;
  getPlaceDetail: (placeKey: string) => Promise<unknown>;
  getPlaceSummary: (placeKey: string) => Promise<unknown>;
  getPlaceAnalysisStatus: (placeKey: string) => Promise<unknown>;
  reanalyzePlace: (placeKey: string) => Promise<unknown>;
  hasUsefulReviewPayload: (payload: unknown) => boolean;
  hasAnalyzedTagsInDetail: (detail: unknown) => boolean;
  isAnalysisStatusCompleted: (payload: unknown) => boolean;
  unwrapApiData: (source: unknown) => unknown;
  wait: (ms: number) => Promise<unknown>;
};

export function usePlaceReview<TPlace extends PlaceLike>({
  getReviewPlaceKey,
  getPlaceDetail,
  getPlaceSummary,
  getPlaceAnalysisStatus,
  reanalyzePlace,
  hasUsefulReviewPayload,
  hasAnalyzedTagsInDetail,
  isAnalysisStatusCompleted,
  unwrapApiData,
  wait,
}: UsePlaceReviewParams<TPlace>) {
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);
  const [reviewLoadingPlaceId, setReviewLoadingPlaceId] = useState<
    string | null
  >(null);
  const [placeReviewMap, setPlaceReviewMap] = useState<
    Record<string, PlaceReviewInfo>
  >({});
  const [reanalyzeSuccessMessage, setReanalyzeSuccessMessage] = useState("");
  const [reanalyzeLoadingPlaceId, setReanalyzeLoadingPlaceId] = useState<
    string | null
  >(null);
  const [reanalyzeMessageIndex, setReanalyzeMessageIndex] = useState(0);
  const reanalyzeMessageTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const handleTogglePlaceReview = async (place: TPlace) => {
    const placeKey = getReviewPlaceKey(place);

    console.log("[AddScheduleLocation] review button clicked:", {
      placeName: place.name,
      placeId: place.placeId,
      googlePlaceId: place.googlePlaceId,
      placeKey,
    });

    if (reviewLoadingPlaceId || reanalyzeLoadingPlaceId === placeKey) {
      return;
    }

    if (expandedPlaceId === placeKey) {
      setExpandedPlaceId(null);
      return;
    }

    const detailLoadingStartedAt = Date.now();

    const MAX_POLL_ATTEMPTS = 6;
    const POLL_INTERVAL_MS = 2000;

    try {
      setReviewLoadingPlaceId(placeKey);

      let detail: unknown = null;
      let summary: unknown = null;
      let freshness: unknown = null;
      let analysisCompleted = false;

      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
        const [detailResult, summaryResult, analysisStatusResult] =
          await Promise.allSettled([
            getPlaceDetail(placeKey),
            getPlaceSummary(placeKey),
            getPlaceAnalysisStatus(placeKey),
          ]);

        detail =
          detailResult.status === "fulfilled" ? detailResult.value : detail;
        summary =
          summaryResult.status === "fulfilled" ? summaryResult.value : summary;

        const analysisStatus =
          analysisStatusResult.status === "fulfilled" ?
            analysisStatusResult.value
          : null;

        const hasUsefulReview =
          hasUsefulReviewPayload(summary) || hasUsefulReviewPayload(detail);
        const hasTags = hasAnalyzedTagsInDetail(detail);
        const statusCompleted = isAnalysisStatusCompleted(analysisStatus);

        console.log("[AddScheduleLocation] analysis polling:", {
          placeKey,
          attempt: attempt + 1,
          hasUsefulReview,
          hasTags,
          statusCompleted,
          analysisStatus,
        });

        if (statusCompleted || hasTags || hasUsefulReview) {
          analysisCompleted = true;
          break;
        }

        if (attempt < MAX_POLL_ATTEMPTS - 1) {
          await wait(POLL_INTERVAL_MS);
        }
      }

      console.log("[AddScheduleLocation] review response:", {
        placeKey,
        analysisCompleted,
        detail,
        summary,
        freshness,
      });

      console.log("[AddScheduleLocation] review response keys:", {
        detailKeys:
          detail && typeof detail === "object" ?
            Object.keys(detail as object)
          : [],
        summaryKeys:
          summary && typeof summary === "object" ?
            Object.keys(summary as object)
          : [],
        freshnessKeys:
          freshness && typeof freshness === "object" ?
            Object.keys(freshness as object)
          : [],
      });

      console.log(
        "[AddScheduleLocation] detail full json:",
        JSON.stringify(detail, null, 2),
      );

      console.log(
        "[AddScheduleLocation] summary full json:",
        JSON.stringify(summary, null, 2),
      );

      if (!analysisCompleted) {
        const elapsed = Date.now() - detailLoadingStartedAt;

        if (elapsed < 1000) {
          await wait(1000 - elapsed);
        }

        Alert.alert(
          "분석 진행 중",
          "리뷰 분석이 아직 완료되지 않았습니다. 잠시 후 다시 시도해주세요.",
        );
        return;
      }

      setPlaceReviewMap((prev) => ({
        ...prev,
        [placeKey]: {
          detail,
          summary,
          freshness,
        },
      }));

      setReviewLoadingPlaceId(null);
      setExpandedPlaceId(placeKey);
    } catch (error) {
      console.log("장소 상세 정보 조회 실패:", error);

      const elapsed = Date.now() - detailLoadingStartedAt;

      if (elapsed < 1000) {
        await wait(1000 - elapsed);
      }

      Alert.alert(
        "상세 정보 조회 실패",
        "리뷰 요약을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      if (reanalyzeMessageTimerRef.current) {
        clearInterval(reanalyzeMessageTimerRef.current);
        reanalyzeMessageTimerRef.current = null;
      }

      setReanalyzeLoadingPlaceId(null);
      setReanalyzeMessageIndex(0);
      setReviewLoadingPlaceId(null);
    }
  };

  const handleReanalyzePlace = async (place: TPlace) => {
    const placeKey = getReviewPlaceKey(place);

    if (reanalyzeLoadingPlaceId === placeKey || reviewLoadingPlaceId === placeKey) {
      return;
    }

    try {
      setReanalyzeLoadingPlaceId(placeKey);
      setReanalyzeMessageIndex(0);

      reanalyzeMessageTimerRef.current = setInterval(() => {
        setReanalyzeMessageIndex(
          (prev) => (prev + 1) % REANALYZE_MESSAGES.length,
        );
      }, 2000);

      await reanalyzePlace(placeKey);

      setReanalyzeSuccessMessage("");

      const previousReviewInfo = placeReviewMap[placeKey];

      setExpandedPlaceId(placeKey);

      await handleTogglePlaceReview(place);

      setExpandedPlaceId(placeKey);

      const nextReviewInfo = placeReviewMap[placeKey];
      const nextDetail = unwrapApiData(nextReviewInfo?.detail);
      const nextSummary = unwrapApiData(nextReviewInfo?.summary);

      const hasUsefulReview =
        hasUsefulReviewPayload(nextDetail) ||
        hasUsefulReviewPayload(nextSummary);

      if (!hasUsefulReview && previousReviewInfo) {
        setPlaceReviewMap((prev) => ({
          ...prev,
          [placeKey]: previousReviewInfo,
        }));
      }

      setReanalyzeSuccessMessage(
        hasUsefulReview ?
          "최신 리뷰 분석이 반영되었습니다."
        : "분석 결과에서 표시 가능한 리뷰를 찾지 못했습니다.",
      );

      setTimeout(() => {
        setReanalyzeSuccessMessage("");
      }, 3200);
    } catch (error) {
      console.log("[AddScheduleLocation] reanalyze failed:", error);

      Alert.alert("재분석 실패", "잠시 후 다시 시도해주세요.");
    } finally {
      if (reanalyzeMessageTimerRef.current) {
        clearInterval(reanalyzeMessageTimerRef.current);
        reanalyzeMessageTimerRef.current = null;
      }

      setReanalyzeLoadingPlaceId(null);
      setReanalyzeMessageIndex(0);
      setReviewLoadingPlaceId(null);
    }
  };

  return {
    expandedPlaceId,
    setExpandedPlaceId,
    reviewLoadingPlaceId,
    placeReviewMap,
    reanalyzeSuccessMessage,
    reanalyzeLoadingPlaceId,
    reanalyzeLoadingMessage:
      reanalyzeLoadingPlaceId ?
        REANALYZE_MESSAGES[reanalyzeMessageIndex]
      : "",
    handleTogglePlaceReview,
    handleReanalyzePlace,
  };
}
