import apiClient from "../client";
import type { TransportMode } from "../../src/types/recommendation";

export const getTripTransportMode = async (
  tripId: number | string,
): Promise<TransportMode | null> => {
  try {
    const response = await apiClient.get<TransportMode | null>(
      `/api/trips/${tripId}/transport-mode`,
    );

    return response.data;
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
