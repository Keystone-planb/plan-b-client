export type RecommendationStreamEventType = "progress" | "place" | "done";

export type RecommendationProgressEvent = {
  type: "progress";
  message: string;
  total?: number;
};

export type RecommendedPlace = {
  placeId: number | string;
  googlePlaceId?: string;
  name: string;
  address?: string;
  rating?: number;
  category?: string;
  reason?: string;
  latitude?: number;
  longitude?: number;
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

export type RecommendRequest = {
  userId: number | string;
  tripId?: number | string;
  tripPlaceId?: number | string;
  placeId?: number | string;
  latitude?: number;
  longitude?: number;
  category?: string;
  limit?: number;
  reason?: string;
};
