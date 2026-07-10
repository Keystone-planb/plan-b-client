/**
 * src/utils/amplitude.ts
 *
 * Amplitude 중앙 관리 유틸.
 * 모든 이벤트는 이 파일의 trackEvent / setAmplitudeUser 를 통해 전송한다.
 *
 * 초기화: App.tsx 의 useEffect 최상단에서 initAmplitude() 호출.
 */

import * as amplitude from "@amplitude/analytics-react-native";
import Constants from "expo-constants";
import { Platform } from "react-native";

let amplitudeInitialized = false;
let amplitudeMissingKeyWarned = false;
let amplitudeInvalidKeyWarned = false;

const isValidAmplitudeApiKey = (apiKey: string) => {
  return (
    /^[a-f0-9]{32}$/i.test(apiKey) &&
    !apiKey.includes("=") &&
    !apiKey.includes("EXPO_PUBLIC_")
  );
};

const getAmplitudeApiKey = () => {
  const publicEnvKey =
    process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY?.trim();
  const extraKey =
    Constants.expoConfig?.extra?.amplitudeApiKey;

  if (publicEnvKey) {
    return publicEnvKey;
  }

  if (
    typeof extraKey === "string" &&
    extraKey.trim().length > 0
  ) {
    return extraKey.trim();
  }

  return "";
};

// ─── 초기화 ────────────────────────────────────────────────────────────────

export const initAmplitude = () => {
  if (amplitudeInitialized) {
    return;
  }

  const amplitudeApiKey = getAmplitudeApiKey();

  if (!amplitudeApiKey) {
    if (__DEV__ && !amplitudeMissingKeyWarned) {
      console.warn(
        "[Amplitude] EXPO_PUBLIC_AMPLITUDE_API_KEY가 설정되지 않았습니다.",
      );
      amplitudeMissingKeyWarned = true;
    }

    return;
  }

  if (!isValidAmplitudeApiKey(amplitudeApiKey)) {
    if (__DEV__ && !amplitudeInvalidKeyWarned) {
      console.warn(
        "[Amplitude] API key 형식이 올바르지 않아 초기화를 건너뜁니다.",
      );
      amplitudeInvalidKeyWarned = true;
    }

    return;
  }

  amplitude.init(amplitudeApiKey, undefined, {
    minIdLength: 1,        // device_id / user_id 최소 길이 제한 해제 (짧은 숫자 ID 대응)
    logLevel: __DEV__ ? amplitude.Types.LogLevel.Warn : amplitude.Types.LogLevel.None,
  });

  amplitudeInitialized = true;
};

// ─── 유저 식별 ─────────────────────────────────────────────────────────────

export const setAmplitudeUser = (userId: string | number) => {
  if (!amplitudeInitialized) {
    return;
  }

  // Amplitude 최소 5자 요구 → "user_" prefix로 보장
  const idStr = String(userId);
  const safeId = idStr.length >= 5 ? idStr : `user_${idStr}`;
  amplitude.setUserId(safeId);
};

export const resetAmplitudeUser = () => {
  if (!amplitudeInitialized) {
    return;
  }

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
  if (!amplitudeInitialized) {
    if (__DEV__ && !amplitudeMissingKeyWarned) {
      console.warn(
        "[Amplitude] 초기화되지 않아 이벤트 전송을 건너뜁니다.",
      );
      amplitudeMissingKeyWarned = true;
    }

    return;
  }

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
