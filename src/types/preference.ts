export type PreferenceFeedbackType =
  | "SELECT"
  | "LIKE"
  | "DISLIKE"
  | "REPLACE"
  | "DISMISS"
  | string;

export type PreferenceFeedbackRequest = {
  userId: number | string;
  placeId: number | string;
  feedbackType: PreferenceFeedbackType;
  tripId?: number | string;
  tripPlaceId?: number | string;
  reason?: string;
};

export type PreferenceSummary = {
  userId: number | string;
  summary?: string;
  keywords?: string[];
  preferredCategories?: string[];
  updatedAt?: string;
};
