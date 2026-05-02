export type PlaceSearchResult = {
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
  name: string;
  address: string;
  rating?: number;
  openingHours?: string;
  lat?: number;
  lng?: number;
  category?: string;
  phoneNumber?: string;
  website?: string;
  priceLevel?: number;
  photoUrl?: string;
  lastSyncedAt?: string;
  reviews?: PlaceDetailReview[];
};

export type PlaceSearchResponse = {
  places: PlaceSearchResult[];
};

export type PlaceDetailResponse = PlaceDetail;
