export type PreferenceFeedbackType =
  | "SELECT"
  | "LIKE"
  | "DISLIKE"
  | "REPLACE"
  | "DISMISS"
  | string;

export type PreferenceFeedbackRequest = {
  shownPlaceIds?: Array<number | string>;
  selectedPlaceId?: number | string;
  userId: number | string;
  placeId?: number | string;
  feedbackType?: PreferenceFeedbackType;
  tripId?: number | string;
  tripPlaceId?: number | string;
  reason?: string;
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
