import apiClient from "../client";
import {
  PlaceDetail,
  PlaceFreshnessResponse,
  PlaceSearchResponse,
  PlaceSearchResult,
  PlaceSummaryResponse,
} from "./place";

// true  = mock 데이터 사용, 실제 장소 API 호출 안 함
// false = 실제 장소 API 호출
const USE_PLACE_MOCK = true;

const MOCK_PLACES: PlaceSearchResult[] = [
  {
    placeId: "mock-gangneung-station",
    name: "강릉역",
    address: "강원특별자치도 강릉시 용지로 176",
    rating: 4.58,
    category: "train_station",
    latitude: 37.7644,
    longitude: 128.8995,
  },
  {
    placeId: "mock-gangneung-cafe-street",
    name: "강릉 안목해변 카페거리",
    address: "강원특별자치도 강릉시 창해로14번길",
    rating: 4.58,
    category: "cafe",
    latitude: 37.7715,
    longitude: 128.9476,
  },
  {
    placeId: "mock-gyeongpo-beach",
    name: "경포해변",
    address: "강원특별자치도 강릉시 강문동",
    rating: 4.58,
    category: "tourist_attraction",
    latitude: 37.8056,
    longitude: 128.9089,
  },
];

const MOCK_PLACE_DETAIL_MAP: Record<string, PlaceDetail> = {
  "mock-gangneung-station": {
    placeId: "mock-gangneung-station",
    name: "강릉역",
    address: "강원특별자치도 강릉시 용지로 176",
    rating: 4.58,
    category: "train_station",
    openingHours: "매일 00:00~24:00",
    lat: 37.7644,
    lng: 128.8995,
    reviews: [
      {
        text: "강릉 여행의 시작점으로 좋아요.",
        rating: 5,
        relativeTimeDescription: "1개월 전",
      },
    ],
  },
  "mock-gangneung-cafe-street": {
    placeId: "mock-gangneung-cafe-street",
    name: "강릉 안목해변 카페거리",
    address: "강원특별자치도 강릉시 창해로14번길",
    rating: 4.58,
    category: "cafe",
    openingHours: "매일 09:00~22:00",
    lat: 37.7715,
    lng: 128.9476,
    reviews: [
      {
        text: "바다 보면서 커피 마시기 좋아요.",
        rating: 5,
        relativeTimeDescription: "2개월 전",
      },
    ],
  },
  "mock-gyeongpo-beach": {
    placeId: "mock-gyeongpo-beach",
    name: "경포해변",
    address: "강원특별자치도 강릉시 강문동",
    rating: 4.58,
    category: "tourist_attraction",
    openingHours: "매일 00:00~24:00",
    lat: 37.8056,
    lng: 128.9089,
    reviews: [
      {
        text: "산책하기 좋고 바다가 예뻐요.",
        rating: 5,
        relativeTimeDescription: "3개월 전",
      },
    ],
  },
};

const MOCK_PLACE_SUMMARY_MAP: Record<string, PlaceSummaryResponse> = {
  "mock-gangneung-station": {
    placeId: "mock-gangneung-station",
    aiSummary: "강릉 여행의 시작점으로 접근성이 좋은 장소입니다.",
    keywords: ["교통", "기차역", "접근성"],
  },
  "mock-gangneung-cafe-street": {
    placeId: "mock-gangneung-cafe-street",
    aiSummary: "바다를 보며 카페를 즐기기 좋은 감성적인 장소입니다.",
    keywords: ["카페", "바다", "감성"],
  },
  "mock-gyeongpo-beach": {
    placeId: "mock-gyeongpo-beach",
    aiSummary: "산책과 바다 감상을 함께 즐기기 좋은 대표 해변입니다.",
    keywords: ["해변", "산책", "자연"],
  },
};

type RawPlaceSearchResult = {
  placeId?: string;
  name?: string;
  address?: string;
  rating?: number;
  category?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
};

const isHtmlResponse = (data: unknown) => {
  if (typeof data !== "string") return false;

  const trimmed = data.trim().toLowerCase();

  return trimmed.startsWith("<!doctype html>") || trimmed.startsWith("<html");
};

const assertNotHtmlResponse = (data: unknown, apiName: string) => {
  if (isHtmlResponse(data)) {
    throw new Error(
      `${apiName} API가 HTML을 반환했습니다. BASE_URL과 백엔드 서버 상태를 확인해주세요.`,
    );
  }
};

const normalizePlace = (place: RawPlaceSearchResult): PlaceSearchResult => {
  return {
    placeId: place.placeId ?? "",
    name: place.name ?? "이름 없는 장소",
    address: place.address ?? "",
    rating: place.rating,
    category: place.category,
    latitude: place.latitude ?? place.lat,
    longitude: place.longitude ?? place.lng,
  };
};

const getMockPlaces = (query: string) => {
  const normalizedQuery = query.toLowerCase();

  const filteredPlaces = MOCK_PLACES.filter((place) => {
    const target = `${place.name} ${place.address} ${place.category ?? ""}`;
    return target.toLowerCase().includes(normalizedQuery);
  });

  return filteredPlaces.length > 0 ? filteredPlaces : MOCK_PLACES;
};

export const searchPlaces = async (
  query: string,
): Promise<PlaceSearchResult[]> => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  if (USE_PLACE_MOCK) {
    return getMockPlaces(trimmedQuery);
  }

  const response = await apiClient.get<PlaceSearchResponse>(
    "/api/places/search",
    {
      params: {
        query: trimmedQuery,
      },
    },
  );

  assertNotHtmlResponse(response.data, "장소 검색");

  const places = response.data?.places ?? [];

  return places.map(normalizePlace).filter((place) => place.placeId);
};

export const getPlaceDetail = async (
  googlePlaceId: string,
): Promise<PlaceDetail> => {
  if (USE_PLACE_MOCK) {
    return (
      MOCK_PLACE_DETAIL_MAP[googlePlaceId] ?? {
        placeId: googlePlaceId,
        name: "임시 장소",
        address: "주소 정보 없음",
        rating: 0,
        openingHours: "운영시간 정보 없음",
        lat: 37.7519,
        lng: 128.8761,
        category: "place",
        reviews: [],
      }
    );
  }

  const response = await apiClient.get<PlaceDetail>(
    `/api/places/${googlePlaceId}`,
  );

  assertNotHtmlResponse(response.data, "장소 상세");

  return response.data;
};

export const getPlaceSummary = async (
  googlePlaceId: string,
): Promise<PlaceSummaryResponse> => {
  if (USE_PLACE_MOCK) {
    return (
      MOCK_PLACE_SUMMARY_MAP[googlePlaceId] ?? {
        placeId: googlePlaceId,
        aiSummary: "아직 요약 정보가 없습니다.",
        keywords: [],
      }
    );
  }

  const response = await apiClient.get<PlaceSummaryResponse>(
    `/api/places/${googlePlaceId}/summary`,
  );

  assertNotHtmlResponse(response.data, "장소 AI 요약");

  return response.data;
};

export const getPlaceFreshness = async (
  googlePlaceId: string,
): Promise<PlaceFreshnessResponse> => {
  if (USE_PLACE_MOCK) {
    return {
      placeId: googlePlaceId,
      lastSyncedAt: new Date().toISOString(),
      isFresh: true,
    };
  }

  const response = await apiClient.get<PlaceFreshnessResponse>(
    `/api/places/${googlePlaceId}/freshness`,
  );

  assertNotHtmlResponse(response.data, "장소 정보 최신성");

  return response.data;
};
