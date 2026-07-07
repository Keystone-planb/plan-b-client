import apiClient from "../client";
import type {
  PreferenceFeedbackRequest,
  PreferenceSummary,
} from "../../src/types/preference";

export const reportPreferenceFeedback = async (
  payload: PreferenceFeedbackRequest,
): Promise<boolean> => {
  try {
    await apiClient.post("/api/preferences/feedback", payload);
    return true;
  } catch (error) {
    if (__DEV__) console.warn("[preferences/feedback] mock fallback");
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
    if (__DEV__) console.warn("[preferences/summary] mock fallback");
    return {
      userId,
    };
  }
};
