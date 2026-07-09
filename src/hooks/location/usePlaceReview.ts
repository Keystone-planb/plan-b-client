// src/hooks/location/usePlaceReview.ts

import { useRef, useState } from "react";
import { Alert } from "react-native";
import { trackEvent, AMP } from "../../utils/amplitude";

const COMPLETED_ANALYSIS_STATUSES = new Set([
  "COMPLETE",
  "COMPLETED",
  "DONE",
  "SUCCESS",
  "READY",
]);

const getReviewPayloadData = (payload: unknown) => {
  const record = payload as any;
  return (
    record?.data ??
    record?.result ??
    record?.payload ??
    record?.response ??
    record?.body ??
    record
  );
};

const getReviewField = (source: unknown, fieldNames: string[]) => {
  const data = getReviewPayloadData(source) as any;
  if (!data || typeof data !== "object") return undefined;

  for (const fieldName of fieldNames) {
    const value = data[fieldName];
    if (value !== undefined && value !== null) return value;
  }

  return undefined;
};

const hasReviewContent = (payload: unknown) => {
  const data = getReviewPayloadData(payload) as any;
  if (!data || typeof data !== "object") return false;

  const summaryLikeFields = [
    "aiSummary",
    "ai_summary",
    "reviewSummary",
    "review_summary",
    "summary",
  ];

  const rawReviewFields = [
    "googleReview",
    "google_review",
    "naverReview",
    "naver_review",
    "instaReview",
    "instagramReview",
    "instagram_review",
  ];

  const hasTextReview = [...summaryLikeFields, ...rawReviewFields].some(
    (fieldName) => {
      const value = data[fieldName];
      return typeof value === "string" && value.trim().length > 0;
    },
  );

  const hasReviewList = ["reviews", "googleReviews", "naverReviews"].some(
    (fieldName) => Array.isArray(data[fieldName]) && data[fieldName].length > 0,
  );

  return hasTextReview || hasReviewList;
};

const isLocalAnalysisStatusCompleted = (payload: unknown) => {
  const data = getReviewPayloadData(payload) as any;

  if (typeof data === "string") {
    return COMPLETED_ANALYSIS_STATUSES.has(data.toUpperCase());
  }

  if (!data || typeof data !== "object") return false;

  const status = String(
    getReviewField(data, ["status", "analysisStatus", "analysis_status"]) ??
      "",
  ).toUpperCase();

  return (
    COMPLETED_ANALYSIS_STATUSES.has(status) ||
    data.ready === true ||
    data.completed === true ||
    data.isCompleted === true ||
    data.isAnalyzed === true ||
    data.analyzed === true
  );
};

const isReviewAnalysisCompleted = (payload: unknown) => {
  const data = getReviewPayloadData(payload);
  if (!data || typeof data !== "object") return false;

  return isLocalAnalysisStatusCompleted(payload) || hasReviewContent(payload);
};

const isReviewEmptyAfterAnalysis = (payload: unknown) => {
  const data = getReviewPayloadData(payload);
  if (!data || typeof data !== "object") return false;

  return isLocalAnalysisStatusCompleted(payload) && !hasReviewContent(payload);
};

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

    
    if (reviewLoadingPlaceId || reanalyzeLoadingPlaceId === placeKey) {
      return;
    }

    if (expandedPlaceId === placeKey) {
      setExpandedPlaceId(null);
      return;
    }

    // 상세 정보 보기 — 처음 열 때만 이벤트 발사
    trackEvent(AMP.REVIEW_CARD_OPENED, {
      place_id: String(place.googlePlaceId ?? place.placeId ?? ""),
      place_name: place.name ?? "",
      sources_count: 2, // Google + Naver
      summary_shown: false, // 로딩 전이므로 false, 실제 노출은 로드 후
      analysis_blocked: false,
    });

    const detailLoadingStartedAt = Date.now();

    const MAX_POLL_ATTEMPTS = 6;
    const POLL_INTERVAL_MS = 2000;

    try {
      setReviewLoadingPlaceId(placeKey);

      let detail: unknown = null;
      let summary: unknown = null;
      let freshness: unknown = null;
      let analysisCompleted = false;
      let analysisStatusCompleted = false;

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
          isReviewAnalysisCompleted(summary) || hasUsefulReviewPayload(summary) || hasUsefulReviewPayload(detail);
        const hasTags = hasAnalyzedTagsInDetail(detail);
        const statusCompleted =
          isAnalysisStatusCompleted(analysisStatus) ||
          isLocalAnalysisStatusCompleted(analysisStatus);

        
        if (statusCompleted || hasTags || hasUsefulReview) {
          analysisCompleted = true;
          analysisStatusCompleted = analysisStatusCompleted || statusCompleted;

          if (statusCompleted && !hasUsefulReview) {
            const [detailRefresh, summaryRefresh] = await Promise.allSettled([
              getPlaceDetail(placeKey),
              getPlaceSummary(placeKey),
            ]);

            if (detailRefresh.status === "fulfilled")
              detail = detailRefresh.value;
            if (summaryRefresh.status === "fulfilled")
              summary = summaryRefresh.value;
          }

          break;
        }

        if (attempt < MAX_POLL_ATTEMPTS - 1) {
          await wait(POLL_INTERVAL_MS);
        }
      }

      // 백엔드가 fallback(space=MIX 등)으로 COMPLETE를 반환하지만 리뷰 요약(reviewData)이
      // 비어 있는 경우가 있다. 이때는 자동으로 1회 재분석 후 다시 조회해 제대로 된 리뷰를 채운다.
      const usefulReviewReady =
        isReviewAnalysisCompleted(summary) || hasUsefulReviewPayload(summary) || hasUsefulReviewPayload(detail);

      if (analysisCompleted && !usefulReviewReady && !analysisStatusCompleted) {
        try {
          setReanalyzeLoadingPlaceId(placeKey);
          setReanalyzeMessageIndex(0);
          reanalyzeMessageTimerRef.current = setInterval(() => {
            setReanalyzeMessageIndex(
              (prev) => (prev + 1) % REANALYZE_MESSAGES.length,
            );
          }, 2000);

          await reanalyzePlace(placeKey);

          for (let retry = 0; retry < MAX_POLL_ATTEMPTS; retry += 1) {
            const [detailRetry, summaryRetry] = await Promise.allSettled([
              getPlaceDetail(placeKey),
              getPlaceSummary(placeKey),
            ]);

            if (detailRetry.status === "fulfilled") detail = detailRetry.value;
            if (summaryRetry.status === "fulfilled")
              summary = summaryRetry.value;

            if (
              isReviewAnalysisCompleted(summary) || hasUsefulReviewPayload(summary) ||
              hasUsefulReviewPayload(detail)
            ) {
              break;
            }

            if (retry < MAX_POLL_ATTEMPTS - 1) {
              await wait(POLL_INTERVAL_MS);
            }
          }
        } catch (reanalyzeError) {
                  } finally {
          if (reanalyzeMessageTimerRef.current) {
            clearInterval(reanalyzeMessageTimerRef.current);
            reanalyzeMessageTimerRef.current = null;
          }
          setReanalyzeLoadingPlaceId(null);
          setReanalyzeMessageIndex(0);
        }
      }

      
      
      
      
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
          summary: isReviewEmptyAfterAnalysis(summary) ||
            (analysisStatusCompleted && !usefulReviewReady)
            ? {
                ...(getReviewPayloadData(summary) as object),
                analyzed: true,
                aiSummary: "아직 리뷰 데이터가 없어요.",
              }
            : summary,
          freshness,
        },
      }));

      setReviewLoadingPlaceId(null);
      setExpandedPlaceId(placeKey);
    } catch (error) {
      
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
