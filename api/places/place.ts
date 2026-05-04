export type PlaceSearchResult = {
  /**
   * 검색 응답의 placeId는 Google Place ID 문자열로 사용한다.
   * 이후 GET /api/places/{googlePlaceId} 호출에 그대로 전달한다.
   */
  placeId: string;
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
  placeId: string;
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
  placeId: string;
  aiSummary?: string;
  reviewSummary?: string;
  googleReview?: string;
  naverReview?: string;
  instaReview?: string;
  keywords?: string[];
};

export type PlaceFreshness = {
  placeId: string;
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
