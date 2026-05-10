import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_CONFIG } from "../config";
import apiClient from "../client";
import type {
  GapRecommendationRequest,
  GapRecommendationStreamHandlers,
  TripScheduleGap,
} from "../../src/types/gapRecommendation";
import type { RecommendedPlace } from "../../src/types/recommendation";

export const getTripGaps = async (
  tripId: number | string,
  mode?: string,
): Promise<TripScheduleGap[]> => {
  try {
    const response = await apiClient.get<TripScheduleGap[]>(
      `/api/trips/${tripId}/gaps`,
      {
        params: mode ? { mode } : undefined,
      },
    );

    return response.data;
  } catch (error) {
    console.log("[trip gaps] request failed:", error);
    return [];
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
          message: parsed.message ?? "빈 시간에 들를 수 있는 장소를 분석 중입니다...",
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
  try {
    const accessToken = await AsyncStorage.getItem("access_token");

    console.log("[gap recommendations/stream] request:", {
      tripId,
      payload,
      hasAccessToken: Boolean(accessToken),
      platform:
        typeof window !== "undefined" ? "web" : "native",
    });

    if (!accessToken) {
    const error = new Error("로그인 토큰이 없어 빈 시간 추천을 불러올 수 없습니다.");
    console.log("[gap recommendations/stream] no token");
    handlers.onError?.(error);
    return;
  }

    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/trips/${tripId}/gaps/recommend/stream`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(payload),
      },
    );

    console.log("[gap recommendations/stream] response:", {
      status: response.status,
      ok: response.ok,
      hasBody: Boolean(response.body),
    });

    if (!response.ok || !response.body) {
      throw new Error(`틈새 추천 스트리밍 요청 실패: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

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
          handlers.onDone?.();
          return;
        }
      }
    }

    handlers.onDone?.();
  } catch (error) {
    console.log("[gap recommendations/stream] request failed:", error);
    handlers.onError?.(error);
  }
};
