import apiClient from "../client";
import type {
  PreferenceFeedbackRequest,
  PreferenceSummary,
} from "../../src/types/preference";

export const MOCK_PREFERENCE_SUMMARY: PreferenceSummary = {
  userId: 1,
  summary: "카페, 실내 장소, 평점 높은 장소를 선호하는 편이에요.",
  keywords: ["카페", "실내", "평점 높은 장소"],
  preferredCategories: ["카페", "실내 관광지", "맛집"],
  updatedAt: new Date().toISOString(),
};

export const reportPreferenceFeedback = async (
  payload: PreferenceFeedbackRequest,
): Promise<boolean> => {
  try {
    await apiClient.post("/api/preferences/feedback", payload);
    return true;
  } catch (error) {
    console.log("[preferences/feedback] mock fallback:", error);
    return true;
  }
};

export const getPreferenceSummary = async (
  userId: number | string,
): Promise<PreferenceSummary> => {
  try {
    const response = await apiClient.get(`/api/preferences/${userId}/summary`);

    if (response.data?.data) {
      return response.data.data as PreferenceSummary;
    }

    return response.data as PreferenceSummary;
  } catch (error) {
    console.log("[preferences/summary] mock fallback:", error);
    return {
      ...MOCK_PREFERENCE_SUMMARY,
      userId,
    };
  }
};
