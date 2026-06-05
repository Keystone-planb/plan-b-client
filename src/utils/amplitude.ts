/**
 * src/utils/amplitude.ts
 *
 * Amplitude 중앙 관리 유틸.
 * 모든 이벤트는 이 파일의 trackEvent / setAmplitudeUser 를 통해 전송한다.
 *
 * 초기화: App.tsx 의 useEffect 최상단에서 initAmplitude() 호출.
 */

import * as amplitude from "@amplitude/analytics-react-native";
import { Platform } from "react-native";

const amplitudeApiKey = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY ?? "";

// ─── 초기화 ────────────────────────────────────────────────────────────────

export const initAmplitude = () => {
  if (!amplitudeApiKey) {
    console.warn("[Amplitude] API key 없음 — 이벤트가 전송되지 않습니다.");
    return;
  }

  amplitude.init(amplitudeApiKey, undefined, {
    defaultTracking: {
      sessions: true,      // 세션 자동 트래킹 → session_id 공통 제공
      appLifecycles: false, // app_open 은 직접 심는다
      attribution: false,
    },
    minIdLength: 1,        // device_id / user_id 최소 길이 제한 해제 (짧은 숫자 ID 대응)
    logLevel: __DEV__ ? amplitude.Types.LogLevel.Warn : amplitude.Types.LogLevel.None,
  });
};

// ─── 유저 식별 ─────────────────────────────────────────────────────────────

export const setAmplitudeUser = (userId: string | number) => {
  // Amplitude 최소 5자 요구 → "user_" prefix로 보장
  const idStr = String(userId);
  const safeId = idStr.length >= 5 ? idStr : `user_${idStr}`;
  amplitude.setUserId(safeId);
};

export const resetAmplitudeUser = () => {
  amplitude.reset();
};

// ─── 공통 프로퍼티 헬퍼 ────────────────────────────────────────────────────

const getCommonProps = () => ({
  platform: Platform.OS,       // "ios" | "android"
  timestamp: new Date().toISOString(),
});

// ─── 이벤트 전송 ──────────────────────────────────────────────────────────

export const trackEvent = (
  eventName: string,
  properties?: Record<string, unknown>,
) => {
  amplitude.track(eventName, {
    ...getCommonProps(),
    ...properties,
  });

  if (__DEV__) {
    console.log(`[Amplitude] ${eventName}`, properties);
  }
};

// ─── 이벤트 상수 (오타 방지) ────────────────────────────────────────────────

export const AMP = {
  // 활성화 지표
  TRIP_CREATED:                "trip_created",
  PLACE_ADDED:                 "place_added",
  SCHEDULE_VIEWED:             "schedule_viewed",

  // 상세보기 (기능①)
  REVIEW_CARD_OPENED:          "review_card_opened",

  // 대안찾기 플로우 (기능②)
  SOS_TRIGGERED:               "sos_triggered",
  SOS_FILTER_APPLIED:          "sos_filter_applied",
  ALTERNATIVE_FLOW_ABANDONED:  "alternative_flow_abandoned",
  ALTERNATIVES_SHOWN:          "alternatives_shown",
  SOS_RESULT_EMPTY:            "sos_result_empty",       // 추천 결과 0개 (AI 실패/조건 불일치)
  ALTERNATIVE_SELECTED:        "alternative_selected",   // rank + time_to_select_ms
  ALTERNATIVE_REPLACED:        "alternative_replaced",   // 선택 → 서버 저장 완료 (진짜 채택)
  ALTERNATIVE_DISMISSED:       "alternative_dismissed",  // source: "weather" | "manual"

  // 틈새 대안 (기능③)
  GAP_RECOMMENDATION_VIEWED:   "gap_recommendation_viewed", // selected: true/false
  GAP_PLACE_SELECTED:          "gap_place_selected",

  // 날씨 대안 (기능④)
  WEATHER_NOTIFICATION_VIEWED:    "weather_notification_viewed",
  WEATHER_NOTIFICATION_DISMISSED: "weather_notification_dismissed",
  WEATHER_RECOMMEND_TAPPED:       "weather_recommend_tapped",
} as const;
