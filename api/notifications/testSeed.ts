import apiClient from "../client";

export const seedTestWeatherNotification = async (
  userId: number | string,
  tripPlaceId: number | string,
) => {
  try {
    const response = await apiClient.post(
      "/api/notifications/actions/seed-test",
      null,
      {
        params: {
          userId,
          tripPlaceId,
        },
      },
    );

    console.log("[seed-test weather notification] success:", {
      userId,
      tripPlaceId,
      data: response.data,
    });

    return response.data;
  } catch (error: any) {
    console.log("[seed-test weather notification] failed:", {
      userId,
      tripPlaceId,
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    throw error;
  }
};
