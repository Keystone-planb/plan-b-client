export type RecommendationTransportMode = "WALK" | "TRANSIT" | "CAR";

export type RecommendationPreviewPlace = {
  name?: string | null;
  address?: string | null;
  time?: string | null;
  visitTime?: string | null;
  endTime?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type RecommendationToastType = "success" | "error" | "info";
