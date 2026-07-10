import type { RecommendedPlace, TransportMode } from "./recommendation";

export type TripScheduleGap = {
  day?: number;
  beforePlanId: number;
  beforePlanTitle: string;
  beforePlanStartTime?: string;
  beforePlanEndTime: string;
  beforePlaceLat: number;
  beforePlaceLng: number;
  afterPlanId: number;
  afterPlanTitle: string;
  afterPlanStartTime: string;
  afterPlanEndTime?: string;
  afterPlaceLat: number;
  afterPlaceLng: number;
  gapMinutes: number;
  estimatedTravelMinutes: number;
  availableMinutes: number;
  transportMode: TransportMode;
};

export type GapRecommendationRequest = {
  beforePlanId: number;
  afterPlanId: number;
  transportMode?: TransportMode;
  radiusMinute?: number;
};

export type GapRecommendationStreamHandlers = {
  onProgress?: (message: string, total?: number) => void;
  onPlace?: (place: RecommendedPlace) => void;
  onDone?: () => void;
  onWarning?: (message: string) => void;
  onError?: (error: unknown) => void;
};
