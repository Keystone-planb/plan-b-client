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
    longitude: 126.98,
  },
];

const parseSseBlock = (block: string): RecommendationStreamEvent | null => {
  const lines = block.split(/\r?\n/).map((line) => line.trimEnd());

  let eventName = "";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  }

  const dataText = dataLines.join("\n").trim();

  if (eventName === "done" || dataText === "[DONE]") {
    return { type: "done" };
  }

  if (!dataText) {
    return null;
  }

  try {
    const parsed = JSON.parse(dataText);

    const inferredEventName =
      eventName ||
      parsed.type ||
      parsed.event ||
      (parsed.place || parsed.placeId || parsed.googlePlaceId || parsed.name ?
        "place"
      : parsed.message || parsed.total ? "progress"
      : "");

    if (inferredEventName === "progress") {
      return {
        type: "progress",
        message: parsed.message ?? "AI가 주변 장소를 분석 중입니다...",
        total: parsed.total,
      };
    }

    if (inferredEventName === "place") {
      return {
        type: "place",
        place: parsed.place ?? parsed,
      };
    }

    if (inferredEventName === "done") {
      return { type: "done" };
    }
  } catch (error) {
    console.log("[recommendations/stream] SSE parse failed:", {
      block,
      error,
    });
  }

  return null;
};

const dispatchStreamEvent = (
  event: RecommendationStreamEvent,
  handlers: StreamHandlers,
): boolean => {
  if (event.type === "progress") {
    handlers.onProgress?.(event.message, event.total);
    return false;
  }

  if (event.type === "place") {
    handlers.onPlace?.(event.place);
    return false;
  }

  if (event.type === "done") {
    handlers.onDone?.();
    return true;
  }

  return false;
};

export const streamRecommendations = async (
  payload: RecommendRequest,
  handlers: StreamHandlers,
) => {
  try {
    const accessToken = await AsyncStorage.getItem("access_token");

    if (!accessToken) {
      throw new Error("access_token이 없습니다.");
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

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() ?? "";

      for (const block of blocks) {
        const event = parseSseBlock(block);

        if (!event) {
          continue;
        }

        const shouldStop = dispatchStreamEvent(event, handlers);

        if (shouldStop) {
          return;
        }
      }
    }

    if (buffer.trim()) {
      const event = parseSseBlock(buffer);

      if (event) {
        const shouldStop = dispatchStreamEvent(event, handlers);

        if (shouldStop) {
          return;
        }
      }
    }

    handlers.onDone?.();
  } catch (error) {
    console.log("[recommendations/stream] failed:", error);

    if (error instanceof Error) {
      console.log("[recommendations/stream] error message:", error.message);
    }

    handlers.onError?.(error);
  }
};
