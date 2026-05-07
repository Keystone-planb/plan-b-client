export type RecommendationStreamEventType = "progress" | "place" | "done";

export type TransportMode = "WALK" | "TRANSIT" | "CAR";

export type PlaceSpace = "INDOOR" | "OUTDOOR" | "MIX";

export type PlaceType =
  | "FOOD"
  | "CAFE"
  | "SIGHTS"
  | "SHOP"
  | "MARKET"
  | "THEME"
  | "CULTURE"
  | "PARK";

export type RecommendationProgressEvent = {
  type: "progress";
  message: string;
  total?: number;
};

export type RecommendedPlace = {
  /**
   * 서버 DB 내부 장소 PK
   */
  placeId: number | string;

  /**
   * Google Place ID
   */
  googlePlaceId?: string;

  name: string;
  address?: string;
  rating?: number;
  category?: string;
  reason?: string;
  latitude?: number;
  longitude?: number;

  space?: PlaceSpace;
  type?: PlaceType | string;
  mood?: string;
  reviewCount?: number;
  reviewSummary?: string;
  googleReview?: string;
  naverReview?: string;
  instaReview?: string;
  businessStatus?: string;
  openingHours?: string;
  phoneNumber?: string;
  website?: string;
  priceLevel?: number;
  photoUrl?: string;
  lastSyncedAt?: string;
};

export type RecommendationPlaceEvent = {
  type: "place";
  place: RecommendedPlace;
};

export type RecommendationDoneEvent = {
  type: "done";
};

export type RecommendationStreamEvent =
  | RecommendationProgressEvent
  | RecommendationPlaceEvent
  | RecommendationDoneEvent;

/**
 * 2026-05-06 명세 기준 추천 요청 Body
 *
 * POST /api/recommendations
 * POST /api/recommendations/stream
 */
export type RecommendRequest = {
  /**
   * 같은 여행 내 중복 제외 및 다음 일정 자동 추적용
   */
  tripId?: number | string;

  /**
   * 현재 대체하려는 원본 일정 ID
   * 프론트의 tripPlaceId/serverTripPlaceId를 이 필드로 매핑한다.
   */
  currentPlanId?: number | string;

  /**
   * 현재 장소 좌표
   * 추천 API의 위치 기반 탐색에 필요하다.
   */
  currentLat?: number;
  currentLng?: number;

  /**
   * 이동 허용 시간. 분 단위.
   */
  radiusMinute?: number;

  /**
   * 2026-05-06 기준 walk 삭제 후 transportMode 사용.
   */
  transportMode?: TransportMode;

  /**
   * 실내/실외 필터
   */
  selectedSpace?: PlaceSpace;

  /**
   * 장소 타입 필터
   */
  selectedType?: PlaceType | string;

  /**
   * 원본 카테고리 유지 여부
   */
  keepOriginalCategory?: boolean;

  /**
   * 다음 목적지 동선 고려 여부
   */
  considerNextPlan?: boolean;

  /**
   * 다음 목적지 좌표. 없으면 서버가 DB에서 자동 조회할 수 있음.
   */
  nextLat?: number | null;
  nextLng?: number | null;

  /**
   * 아래 필드는 프론트 호환/디버깅용.
   * 서버에서 무시 가능.
   */
  userId?: number | string;
  tripPlaceId?: number | string;
  placeId?: number | string;
  latitude?: number;
  longitude?: number;
  category?: string;
  limit?: number;
  reason?: string;
};
