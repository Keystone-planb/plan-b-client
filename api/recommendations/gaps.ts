import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_CONFIG } from "../config";
import apiClient from "../client";
import type {
  GapRecommendationRequest,
  GapRecommendationStreamHandlers,
  TripScheduleGap,
} from "../../src/types/gapRecommendation";
import type { RecommendedPlace } from "../../src/types/recommendation";

export const MOCK_TRIP_GAPS: TripScheduleGap[] = [
  {
    beforePlanId: 11,
    beforePlanTitle: "투썸플레이스 부평역점",
    beforePlanEndTime: "2026-07-03T11:00:00",
    beforePlaceLat: 37.4919,
    beforePlaceLng: 126.7245,
    afterPlanId: 12,
    afterPlanTitle: "스타벅스 부평역점",
    afterPlanStartTime: "2026-07-03T12:00:00",
    afterPlaceLat: 37.4951,
    afterPlaceLng: 126.7223,
    gapMinutes: 60,
    estimatedTravelMinutes: 5,
    availableMinutes: 45,
    transportMode: "WALK",
  },
];

export const MOCK_GAP_RECOMMENDED_PLACES: RecommendedPlace[] = [
  {
    placeId: 401,
    googlePlaceId: "mock-gap-bookstore-401",
    name: "부평 감성 서점",
    address: "인천 부평구 부평대로",
    rating: 4.4,
    category: "문화시설",
    reason: "다음 일정 전 45분 정도 가볍게 들르기 좋은 장소예요.",
    latitude: 37.4931,
    longitude: 126.7232,
  },
  {
    placeId: 402,
    googlePlaceId: "mock-gap-dessert-402",
    name: "부평 디저트 카페",
    address: "인천 부평구 시장로",
    rating: 4.3,
    category: "카페",
    reason: "이동 동선 안에서 짧게 쉬어가기 좋은 카페예요.",
    latitude: 37.4942,
    longitude: 126.7228,
  },
];

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

    return response.data.length > 0 ? response.data : MOCK_TRIP_GAPS;
  } catch (error) {
    console.log("[trip gaps] mock fallback:", error);
    return MOCK_TRIP_GAPS;
  }
};

const emitMockGapStream = async (
  handlers: GapRecommendationStreamHandlers,
) => {
  handlers.onProgress?.("빈 시간에 들를 수 있는 장소를 분석 중입니다...", 2);

  for (const place of MOCK_GAP_RECOMMENDED_PLACES) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    handlers.onPlace?.(place);
  }

  handlers.onDone?.();
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
    if (typeof window !== "undefined") {
      await emitMockGapStream(handlers);
      return;
    }

    const accessToken = await AsyncStorage.getItem("access_token");

    if (!accessToken) {
      await emitMockGapStream(handlers);
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
    console.log("[gap recommendations/stream] mock fallback:", error);
    handlers.onError?.(error);
    await emitMockGapStream(handlers);
  }
};
