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

    const gaps = Array.isArray(response.data) ? response.data : [];


    return gaps;
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

let gapRefreshPromise: Promise<any> | null = null;

const runGapRefreshOnce = async (refreshToken: string) => {
  if (!gapRefreshPromise) {
    gapRefreshPromise = requestRefresh({
      refresh_token: refreshToken,
    }).finally(() => {
      gapRefreshPromise = null;
    });
  }

  return gapRefreshPromise;
};

type GapSseEvent =
  | { type: "progress"; message: string; total?: number }
  | { type: "place"; place: RecommendedPlace }
  | { type: "warning"; message: string }
  | { type: "done" };

const parseSseChunk = (chunk: string): {
  events: GapSseEvent[];
  remaining: string;
} => {
  const events: GapSseEvent[] = [];
  const normalizedChunk = chunk.replace(/\r\n/g, "\n");

  if (!normalizedChunk.includes("\n\n")) {
    return {
      events,
      remaining: normalizedChunk,
    };
  }

  const parts = normalizedChunk.split(/\n\n+/);
  const remaining = parts.pop() ?? "";

  for (const rawPart of parts) {
    const part = rawPart.trim();

    if (!part) {
      continue;
    }

    const lines = part
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const eventLine = lines.find((line) => line.startsWith("event:"));
    const dataLines = lines.filter((line) => line.startsWith("data:"));

    const eventName = eventLine?.replace(/^event:\s*/, "").trim() ?? "";
    const dataText = dataLines
      .map((line) => line.replace(/^data:\s*/, ""))
      .join("\n")
      .trim();

    if (eventName === "done" || dataText === "[DONE]") {
      events.push({ type: "done" });
      continue;
    }

    if (!dataText) {
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
        continue;
      }

      if (eventName === "place") {
        events.push({
          type: "place",
          place: parsed,
        });
        continue;
      }

      if (eventName === "warning") {
        events.push({
          type: "warning",
          message:
            typeof parsed === "string"
              ? parsed
              : parsed.message ?? "조건에 맞는 추천 장소가 없습니다.",
        });
      }
    } catch (error) {
      console.log("[gap recommendations/stream] SSE parse failed:", {
        eventName,
        dataText,
        error,
      });
    }
  }

  return {
    events,
    remaining,
  };
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
let receivedLength = 0;
  let pendingSseBuffer = "";
  let buffer = "";
  let doneCalled = false;
  let receivedPlaceCount = 0;

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

    const refreshed = await runGapRefreshOnce(refreshToken);

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


      buffer += chunk;
pendingSseBuffer += buffer;

      const parsedChunk = parseSseChunk(pendingSseBuffer);
      pendingSseBuffer = parsedChunk.remaining;

      const events = parsedChunk.events;

      if (buffer.includes("\n\n")) {
        const lastSeparator = buffer.lastIndexOf("\n\n");
        buffer = buffer.slice(lastSeparator + 2);
      }

      for (const event of events) {
        if (event.type === "progress") {
          handlers.onProgress?.(event.message, event.total);
        }

        if (event.type === "place") {
          receivedPlaceCount += 1;
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
if (xhr.status >= 200 && xhr.status < 300) {
        callDoneOnce();
        return;
      }

      if ((xhr.status === 401 || xhr.status === 403) && !hasRetried) {
        try {
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
      const finalParsedChunk = parseSseChunk(`${pendingSseBuffer}\n\n`);
      pendingSseBuffer = finalParsedChunk.remaining;

      for (const event of finalParsedChunk.events) {
        if (event.type === "progress") {
          handlers.onProgress?.(event.message, event.total);
        }

        if (event.type === "place") {
          handlers.onPlace?.(event.place);
        }

        if (event.type === "warning") {
          handlers.onWarning?.(event.message);
        }

        if (event.type === "done") {
          callDoneOnce();
        }
      }

      console.log("[gap recommendations/stream] xhr error:", {
        status: xhr.status,
        responseText: xhr.responseText,
        doneCalled,
      });

      if (doneCalled) {
        return;
      }

      handlers.onError?.(
        new Error("빈 시간 추천 스트림이 완료되기 전에 종료되었습니다."),
      );
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
