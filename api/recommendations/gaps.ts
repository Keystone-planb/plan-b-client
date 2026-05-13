import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_CONFIG } from "../config";
import apiClient from "../client";
import { requestRefresh } from "../auth/refresh";
import type {
  GapRecommendationRequest,
  GapRecommendationStreamHandlers,
  TripScheduleGap,
} from "../../src/types/gapRecommendation";
import type { RecommendedPlace } from "../../src/types/recommendation";

export const getTripGaps = async (
  tripId: number | string,
): Promise<TripScheduleGap[]> => {
  try {
    const response = await apiClient.get<TripScheduleGap[]>(
      `/api/trips/${tripId}/gaps`,
      {
        timeout: 90000,
      },
    );

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.log("[trip gaps] request failed:", error);
    return [];
  }
};

const getErrorMessageFromResponse = async (response: Response) => {
  try {
    const text = await response.text();

    if (!text.trim()) {
      return `갭 추천 요청에 실패했습니다. (${response.status})`;
    }

    try {
      const parsed = JSON.parse(text) as {
        error?: string;
        message?: string;
      };

      return parsed.error ?? parsed.message ?? text;
    } catch {
      return text;
    }
  } catch {
    return `갭 추천 요청에 실패했습니다. (${response.status})`;
  }
};

const parseSseChunk = (chunk: string) => {
  const events: Array<
    | { type: "progress"; message: string; total?: number }
    | { type: "place"; place: RecommendedPlace }
    | { type: "done" }
  > = [];

  const blocks = chunk.split("\n\n").filter(Boolean);

  for (const block of blocks) {
    const lines = block.split("\n");
    const eventLine = lines.find((line) => line.startsWith("event:"));
    const dataLine = lines.find((line) => line.startsWith("data:"));

    if (!eventLine || !dataLine) continue;

    const eventName = eventLine.replace("event:", "").trim();
    const dataText = dataLine.replace("data:", "").trim();

    if (eventName === "done" || dataText === "[DONE]") {
      events.push({ type: "done" });
      continue;
    }

    try {
      const parsed = JSON.parse(dataText);

      if (eventName === "progress") {
        events.push({
          type: "progress",
          message: parsed.message ?? "갭 추천 장소를 분석 중입니다...",
          total: parsed.total,
        });
      }

      if (eventName === "place") {
        events.push({
          type: "place",
          place: parsed,
        });
      }
    } catch {
      // ignore malformed SSE block
    }
  }

  return events;
};

export const streamGapRecommendations = async (
  tripId: number | string,
  payload: GapRecommendationRequest,
  handlers: GapRecommendationStreamHandlers,
) => {
  const accessToken = await AsyncStorage.getItem("access_token");

  if (!accessToken) {
    handlers.onError?.(
      new Error("로그인 토큰이 없어 갭 추천을 불러올 수 없습니다."),
    );
    return;
  }

  const url = `${API_CONFIG.BASE_URL}/api/trips/${tripId}/gaps/recommend/stream`;

  console.log("[gap recommendations/stream] xhr request:", {
    tripId,
    payload,
    url,
    hasAccessToken: Boolean(accessToken),
  });

  let receivedLength = 0;
  let buffer = "";
  let doneCalled = false;

  const callDoneOnce = () => {
    if (doneCalled) return;
    doneCalled = true;
    handlers.onDone?.();
  };

  const refreshAccessToken = async () => {
    const refreshToken = await AsyncStorage.getItem("refresh_token");

    if (!refreshToken) {
      throw new Error("refresh_token이 없습니다.");
    }

    const refreshed = await requestRefresh({
      refresh_token: refreshToken,
    });

    await AsyncStorage.setItem("access_token", refreshed.access_token);

    if (refreshed.refresh_token) {
      await AsyncStorage.setItem("refresh_token", refreshed.refresh_token);
    }

    if (refreshed.user_id) {
      await AsyncStorage.setItem("user_id", String(refreshed.user_id));
    }

    if (refreshed.nickname) {
      await AsyncStorage.setItem("nickname", refreshed.nickname);
    }

    return refreshed.access_token;
  };

  const sendRequest = (nextAccessToken: string, hasRetried = false) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${nextAccessToken}`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "text/event-stream");
    xhr.timeout = 90000;

    xhr.onreadystatechange = () => {
      if (
        xhr.readyState !== XMLHttpRequest.LOADING &&
        xhr.readyState !== XMLHttpRequest.DONE
      ) {
        return;
      }

      const responseText = xhr.responseText ?? "";
      const chunk = responseText.slice(receivedLength);
      receivedLength = responseText.length;

      if (!chunk) return;

      console.log("[gap recommendations/stream] xhr chunk:", {
        chunk,
        status: xhr.status,
      });

      buffer += chunk;

      const events = parseSseChunk(buffer);

      if (buffer.includes("\n\n")) {
        const lastSeparator = buffer.lastIndexOf("\n\n");
        buffer = buffer.slice(lastSeparator + 2);
      }

      for (const event of events) {
        if (event.type === "progress") {
          handlers.onProgress?.(event.message, event.total);
        }

        if (event.type === "place") {
          handlers.onPlace?.(event.place);
        }

        if (event.type === "done") {
          callDoneOnce();
          xhr.abort();
          return;
        }
      }
    };

    xhr.onload = async () => {
      console.log("[gap recommendations/stream] xhr done:", {
        status: xhr.status,
        receivedLength,
      });

      if (xhr.status >= 200 && xhr.status < 300) {
        callDoneOnce();
        return;
      }

      if ((xhr.status === 401 || xhr.status === 403) && !hasRetried) {
        try {
          console.log("[gap recommendations/stream] auth retry:", {
            status: xhr.status,
          });

          receivedLength = 0;
          buffer = "";
          const refreshedAccessToken = await refreshAccessToken();
          sendRequest(refreshedAccessToken, true);
          return;
        } catch (refreshError) {
          console.log(
            "[gap recommendations/stream] auth retry failed:",
            refreshError,
          );
        }
      }

      handlers.onError?.(
        new Error(`갭 추천 요청에 실패했습니다. (${xhr.status})`),
      );
    };

    xhr.onerror = () => {
      console.log("[gap recommendations/stream] xhr error:", {
        status: xhr.status,
        responseText: xhr.responseText,
      });

      handlers.onError?.(new Error("갭 추천 네트워크 요청에 실패했습니다."));
    };

    xhr.ontimeout = () => {
      console.log("[gap recommendations/stream] xhr timeout:", {
        timeout: xhr.timeout,
      });

      handlers.onError?.(new Error("갭 추천 응답 시간이 초과되었습니다."));
    };

    xhr.send(JSON.stringify(payload));
  };

  try {
    sendRequest(accessToken);
  } catch (error: any) {
    console.log("[gap recommendations/stream] xhr request failed:", {
      tripId,
      payload,
      name: error?.name,
      message: error?.message,
    });

    handlers.onError?.(error);
  }
};
