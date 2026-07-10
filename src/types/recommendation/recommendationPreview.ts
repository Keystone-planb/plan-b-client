export type RecommendationTransportMode = "WALK" | "TRANSIT" | "CAR";

export type RecommendationPreviewPlace = {
  name?: string | null;
  address?: string | null;
  time?: string | null;
  visitTime?: string | null;
  startTime?: string | null;
  previousVisitTime?: string | null;
  beforePlanStartTime?: string | null;
  nextVisitTime?: string | null;
  afterPlanStartTime?: string | null;
  newVisitTime?: string | null;
  endTime?: string | null;
  previousEndTime?: string | null;
  beforePlanEndTime?: string | null;
  nextEndTime?: string | null;
  afterPlanEndTime?: string | null;
  newEndTime?: string | null;
  finishTime?: string | null;
  toTime?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type RecommendationToastType = "success" | "error" | "info";
