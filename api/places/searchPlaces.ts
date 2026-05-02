import apiClient from "../client";
import { PlaceDetail, PlaceSearchResponse, PlaceSearchResult } from "./place";

const USE_PLACE_MOCK = true;

const MOCK_PLACES: PlaceSearchResult[] = [
  {
    placeId: "mock-gangneung-station",
    name: "강릉역",
    address: "강원특별자치도 강릉시 용지로 176",
    rating: 4.3,
    category: "train_station",
    latitude: 37.7644,
    longitude: 128.8995,
  },
  {
    placeId: "mock-gangneung-cafe",
    name: "강릉 안목해변 카페거리",
    address: "강원특별자치도 강릉시 창해로14번길",
    rating: 4.5,
    category: "cafe",
    latitude: 37.7715,
    longitude: 128.9476,
  },
  {
    placeId: "mock-gyeongpo-beach",
    name: "경포해변",
    address: "강원특별자치도 강릉시 강문동",
    rating: 4.6,
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
    rating: 4.3,
    openingHours: "매일 00:00~24:00",
    lat: 37.7644,
    lng: 128.8995,
    category: "train_station",
    reviews: [
      {
        text: "강릉 여행 시작점으로 좋아요.",
        rating: 5,
        relativeTimeDescription: "1개월 전",
      },
    ],
  },
  "mock-gangneung-cafe": {
    placeId: "mock-gangneung-cafe",
    name: "강릉 안목해변 카페거리",
    address: "강원특별자치도 강릉시 창해로14번길",
    rating: 4.5,
    openingHours: "매일 09:00~22:00",
    lat: 37.7715,
    lng: 128.9476,
    category: "cafe",
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
    rating: 4.6,
    openingHours: "매일 00:00~24:00",
    lat: 37.8056,
    lng: 128.9089,
    category: "tourist_attraction",
    reviews: [
      {
        text: "산책하기 좋고 바다가 예뻐요.",
        rating: 5,
        relativeTimeDescription: "3개월 전",
      },
    ],
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

export const searchPlaces = async (
  query: string,
): Promise<PlaceSearchResult[]> => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  if (USE_PLACE_MOCK) {
    return (
        MOCK_PLACES.filter((place) => {
          const target = `${place.name} ${place.address} ${place.category ?? ""}`;
          return target.toLowerCase().includes(trimmedQuery.toLowerCase());
        }).length > 0
      ) ?
        MOCK_PLACES.filter((place) => {
          const target = `${place.name} ${place.address} ${place.category ?? ""}`;
          return target.toLowerCase().includes(trimmedQuery.toLowerCase());
        })
      : MOCK_PLACES;
  }

  const response = await apiClient.get<PlaceSearchResponse>(
    "/api/places/search",
    {
      params: {
        query: trimmedQuery,
      },
    },
  );

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

  return response.data;
};
