import apiClient from "../client";
export type PlaceSearchResult = {
  /**
   * 검색 응답의 placeId는 Google Place ID 문자열로 사용한다.
   * 이후 GET /api/places/{googlePlaceId} 호출에 그대로 전달한다.
   */
  placeId: number | string;
  googlePlaceId?: string;
  name: string;
  address: string;
  rating?: number;
  category?: string;
  latitude?: number;
  longitude?: number;
};

export type PlaceDetailReview = {
  text: string;
  rating: number;
  relativeTimeDescription: string;
};

export type PlaceDetail = {
  placeId: number | string;
  googlePlaceId?: string;
  name: string;
  address: string;
  rating?: number;
  reviewCount?: number;
  openingHours?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  category?: string;
  space?: "INDOOR" | "OUTDOOR" | "MIX" | string;
  type?: string;
  mood?: string;
  phoneNumber?: string;
  website?: string;
  priceLevel?: number;
  photoUrl?: string;
  lastSyncedAt?: string;
  reviews?: PlaceDetailReview[];
};

export type PlaceSummary = {
  placeId: number | string;
  aiSummary?: string;
  reviewSummary?: string;

  googleReview?: string;
  naverReview?: string;
  instaReview?: string;

  googleReviewSummary?: string;
  naverReviewSummary?: string;
  instagramReviewSummary?: string;
  instaReviewSummary?: string;

  platformSummaries?: {
    google?: string;
    naver?: string;
    instagram?: string;
    insta?: string;
  };

  keywords?: string[];
};

export type PlaceFreshness = {
  placeId: number | string;
  lastSyncedAt?: string;
  last_updated?: string;
  isFresh?: boolean;
  status?: "FRESH" | "VERIFIED" | "UPDATED_REQUIRED" | string;
  confidence_score?: number;
};

export type PlaceSearchResponse = {
  places: PlaceSearchResult[];
};

export type PlaceDetailResponse = PlaceDetail;

export type PlaceSummaryResponse = PlaceSummary;

export type PlaceFreshnessResponse = PlaceFreshness;

/**
 * 장소 상세 정보
 * GET /api/places/{place_id}
 *
 * - place_id는 Google Place ID 기준
 * - Space / Type / Mood 태그가 서버 응답에 포함될 수 있음
 */
export type PlaceDetailTagGroup = {
  space?: string[];
  type?: string[];
  mood?: string[];
};

export type PlaceDetailResponse = {
  placeId?: string;
  googlePlaceId?: string;
  id?: string | number;

  name?: string;
  address?: string;
  formattedAddress?: string;
  phoneNumber?: string;
  website?: string;
  rating?: number;
  userRatingsTotal?: number;

  latitude?: number;
  longitude?: number;

  tags?: PlaceDetailTagGroup | string[];
  spaceTags?: string[];
  typeTags?: string[];
  moodTags?: string[];

  openingHours?: string[] | string;
  photoUrl?: string;
  imageUrl?: string;

  [key: string]: unknown;
};

/**
 * 장소 리뷰 요약
 * GET /api/places/{place_id}/summary
 *
 * - aiSummary를 우선 표시
 * - googleReview/naverReview/instaReview는 서버가 내려줄 경우에만 보조적으로 사용
 * - freshnessBadge / freshnessScore 등은 신선도 배지 UI에 사용
 */
export type PlaceReviewSummaryResponse = {
  placeId?: string;
  googlePlaceId?: string;

  aiSummary?: string;
  summary?: string;
  reviewSummary?: string;

  googleReview?: string;
  naverReview?: string;
  instaReview?: string;
  instagramReview?: string;

  freshnessBadge?: string;
  freshnessLevel?: string;
  freshnessScore?: number;
  freshnessReason?: string;
  updatedAt?: string;

  [key: string]: unknown;
};

const normalizePlaceId = (placeId: string | number) => {
  const normalized = String(placeId).trim();

  if (!normalized) {
    throw new Error("place_id가 없습니다.");
  }

  return encodeURIComponent(normalized);
};

const unwrapPlaceData = <T>(data: unknown): T => {
  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    (data as { data?: unknown }).data
  ) {
    return (data as { data: T }).data;
  }

  return data as T;
};

export const getPlaceDetail = async (
  placeId: string | number,
): Promise<PlaceDetailResponse> => {
  const encodedPlaceId = normalizePlaceId(placeId);

  const response = await apiClient.get<PlaceDetailResponse | { data: PlaceDetailResponse }>(
    `/api/places/${encodedPlaceId}`,
  );

  return unwrapPlaceData<PlaceDetailResponse>(response.data);
};

export const getPlaceReviewSummary = async (
  placeId: string | number,
): Promise<PlaceReviewSummaryResponse> => {
  const encodedPlaceId = normalizePlaceId(placeId);

  const response = await apiClient.get<
    PlaceReviewSummaryResponse | { data: PlaceReviewSummaryResponse }
  >(`/api/places/${encodedPlaceId}/summary`);

  return unwrapPlaceData<PlaceReviewSummaryResponse>(response.data);
};

/**
 * 기존 코드에서 getPlaceSummary 이름을 쓰고 있을 수 있어 alias 유지
 */
export const getPlaceSummary = getPlaceReviewSummary;

export const getPrimaryReviewSummaryText = (
  summary?: PlaceReviewSummaryResponse | null,
) => {
  if (!summary) {
    return "서버에서 리뷰 요약을 제공하지 않았습니다.";
  }

  return (
    summary.aiSummary ||
    summary.summary ||
    summary.reviewSummary ||
    "서버에서 리뷰 요약을 제공하지 않았습니다."
  );
};

export const getPlaceTagGroups = (detail?: PlaceDetailResponse | null) => {
  const tags = detail?.tags;

  if (tags && !Array.isArray(tags)) {
    return {
      space: tags.space ?? detail?.spaceTags ?? [],
      type: tags.type ?? detail?.typeTags ?? [],
      mood: tags.mood ?? detail?.moodTags ?? [],
    };
  }

  return {
    space: detail?.spaceTags ?? [],
    type: detail?.typeTags ?? [],
    mood: detail?.moodTags ?? [],
  };
};

