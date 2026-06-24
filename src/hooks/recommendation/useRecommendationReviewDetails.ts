import { useState } from "react";

export type RecommendationPlaceExtraDetail = {
  loading?: boolean;
  aiSummary?: string;
  googleReview?: string;
  naverReview?: string;
  error?: string;
};

export function useRecommendationReviewDetails() {
  const [expandedPlaceId, setExpandedPlaceId] =
    useState<string | number | null>(null);

  const [expandedHoursPlaceId, setExpandedHoursPlaceId] =
    useState<string | number | null>(null);

  const [placeExtraDetails, setPlaceExtraDetails] =
    useState<Record<string, RecommendationPlaceExtraDetail>>({});

  return {
    expandedPlaceId,
    setExpandedPlaceId,
    expandedHoursPlaceId,
    setExpandedHoursPlaceId,
    placeExtraDetails,
    setPlaceExtraDetails,
  };
}
