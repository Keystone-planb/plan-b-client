export type PreferenceFeedbackType =
  | "SELECT"
  | "LIKE"
  | "DISLIKE"
  | "REPLACE"
  | "DISMISS"
  | string;

export type PreferenceFeedbackRequest = {
  userId: number | string;

  // 기존 선호도 피드백 API용
  placeId?: number | string;
  feedbackType?: PreferenceFeedbackType;
  tripId?: number | string;
  tripPlaceId?: number | string;
  reason?: string;

  // 추천 결과 선택 피드백용
  shownPlaceIds?: Array<number | string>;
  selectedPlaceId?: number | string;
};

export type PreferenceSummary = {
  userId: number | string;
  hasEnoughData?: boolean;
  message?: string | null;
  summary?: string;
  keywords?: string[];
  preferredCategories?: string[];
  updatedAt?: string;
};
