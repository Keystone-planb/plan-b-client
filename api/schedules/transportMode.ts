import apiClient from "../client";
import type { TransportMode } from "../../src/types/recommendation";

export const getTripTransportMode = async (
  tripId: number | string,
): Promise<TransportMode | null> => {
  try {
    const response = await apiClient.get<TransportMode | null>(
      `/api/trips/${tripId}/transport-mode`,
    );

    console.log(
      "[transport-mode/get] response:",
      response.status,
      response.data,
    );

    const mode =
      response.data === "WALK" ||
      response.data === "TRANSIT" ||
      response.data === "CAR"
        ? response.data
        : "WALK";

    return mode;
  } catch (error) {
    console.log("[trip transport-mode] mock fallback:", error);
    return "WALK";
  }
};

export const updateTripTransportMode = async (
  tripId: number | string,
  mode: TransportMode,
): Promise<boolean> => {
  try {
    await apiClient.patch(`/api/trips/${tripId}/transport-mode`, null, {
      params: {
        mode,
      },
    });

    return true;
  } catch (error) {
    console.log("[trip transport-mode/update] mock fallback:", error);
    return true;
  }
};
