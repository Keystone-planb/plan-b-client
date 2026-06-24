import { useCallback } from "react";

import {
  getAnalyzedPlaceDetail,
  getPlaceSummary,
} from "../../../api/places/place";
import {
  pickText,
  unwrapData,
} from "../../utils/recommendation/recommendationFormatters";

type PlaceExtraDetail = {
  loading?: boolean;
  aiSummary?: string;
  googleReview?: string;
  naverReview?: string;
  error?: string;
};

type DisplayPlaceLike = {
  name?: string;
  placeId?: string | number;
  googlePlaceId?: string;
};

type Params = {
  placeExtraDetails: Record<string, PlaceExtraDetail>;
  setPlaceExtraDetails: React.Dispatch<
    React.SetStateAction<Record<string, PlaceExtraDetail>>
  >;
};

export function useRecommendationReviewActions({
  placeExtraDetails,
  setPlaceExtraDetails,
}: Params) {
  const fetchReviewDetail = useCallback(
    async (
      place: DisplayPlaceLike,
      placeId: string | number,
      force = false,
    ) => {
      const placeKey = String(placeId);
      const cachedDetail = placeExtraDetails[placeKey];

      if (
        !force &&
        cachedDetail &&
        !cachedDetail.loading &&
        (cachedDetail.aiSummary ||
          cachedDetail.googleReview ||
          cachedDetail.naverReview)
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
      } catch {
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
    },
    [placeExtraDetails, setPlaceExtraDetails],
  );

  return {
    fetchReviewDetail,
  };
}
