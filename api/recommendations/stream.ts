import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_CONFIG } from "../config";
import type {
  RecommendRequest,
  RecommendationStreamEvent,
  RecommendedPlace,
} from "../../src/types/recommendation";

type StreamHandlers = {
  onProgress?: (message: string, total?: number) => void;
  onPlace?: (place: RecommendedPlace) => void;
  onDone?: () => void;
  onError?: (error: unknown) => void;
};

export const MOCK_RECOMMENDED_PLACES: RecommendedPlace[] = [
  {
    placeId: 301,
    googlePlaceId: "mock-recommend-cafe-301",
    name: "비 오는 날 가기 좋은 실내 카페",
    address: "서울 종로구 사직로",
    rating: 4.5,
    category: "카페",
    reason: "야외 일정 대체에 적합한 실내 장소예요.",
    latitude: 37.5759,
    longitude: 126.9768,
  },
  {
    placeId: 302,
    googlePlaceId: "mock-recommend-museum-302",
    name: "국립현대미술관 서울",
    address: "서울 종로구 삼청로",
    rating: 4.6,
    category: "실내 관광지",
    reason: "날씨 영향을 적게 받는 대체 관광지예요.",
    latitude: 37.5788,
    longitude: 126.9800,
  },
];

const emitMockStream = async (handlers: StreamHandlers) => {
  handlers.onProgress?.("AI가 주변 장소를 분석 중입니다...", 2);

  for (const place of MOCK_RECOMMENDED_PLACES) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    handlers.onPlace?.(place);
  }

  handlers.onDone?.();
};

const parseSseChunk = (chunk: string): RecommendationStreamEvent[] => {
  const events: RecommendationStreamEvent[] = [];
  const blocks = chunk.split("\n\n").filter(Boolean);

  for (const block of blocks) {
    const lines = block.split("\n");
    const eventLine = lines.find((line) => line.startsWith("event:"));
    const dataLine = lines.find((line) => line.startsWith("data:"));

    if (!eventLine || !dataLine) continue;

    const eventName = eventLine.replace("event:", "").trim();
    const dataText = dataLine.replace("data:", "").trim();

    if (eventName === "done") {
      events.push({ type: "done" });
      continue;
    }

    if (dataText === "[DONE]") {
      events.push({ type: "done" });
      continue;
    }

    try {
      const parsed = JSON.parse(dataText);

      if (eventName === "progress") {
        events.push({
          type: "progress",
          message: parsed.message ?? "AI가 주변 장소를 분석 중입니다...",
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

export const streamRecommendations = async (
  payload: RecommendRequest,
  handlers: StreamHandlers,
) => {
  try {
    const accessToken = await AsyncStorage.getItem("access_token");

    if (!accessToken) {
      await emitMockStream(handlers);
      return;
    }

    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/recommendations/stream`,
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

    if (!response.ok || !response.body) {
      throw new Error(`추천 스트리밍 요청 실패: ${response.status}`);
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
    console.log("[recommendations/stream] mock fallback:", error);
    handlers.onError?.(error);
    await emitMockStream(handlers);
  }
};
