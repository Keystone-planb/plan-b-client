import apiClient from "../client";
import type { TransportMode } from "../../src/types/recommendation";

const isTransportMode = (value: unknown): value is TransportMode => {
  return value === "WALK" || value === "TRANSIT" || value === "CAR";
};

export const getTripTransportMode = async (
  tripId: number | string,
): Promise<TransportMode | null> => {
  try {
    const response = await apiClient.get<TransportMode | null>(
      `/api/trips/${tripId}/transport-mode`,
      {
        timeout: 5000,
      },
    );


    return isTransportMode(response.data) ? response.data : null;
  } catch (error) {
    console.log("[trip transport-mode] failed:", error);
    return null;
  }
};

export const updateTripTransportMode = async (
  tripId: number | string,
  mode: TransportMode,
): Promise<boolean> => {
  try {
    const response = await apiClient.patch(
      `/api/trips/${tripId}/transport-mode`,
      null,
      {
        params: {
          mode,
        },
      },
    );


    return true;
  } catch (error) {
    console.log("[trip transport-mode/update] failed:", error);
    return false;
  }
};
