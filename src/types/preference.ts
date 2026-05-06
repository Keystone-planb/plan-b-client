export type PreferenceFeedbackRequest = {
  userId: number | string;
  shownPlaceIds: Array<number | string>;
  selectedPlaceId: number | string;
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
