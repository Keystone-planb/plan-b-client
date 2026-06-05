# Plan.B Amplitude 이벤트 명세서

> 작성일: 2026-06 · 작성: 박지호(PM)  
> 대상: FE 개발자, PM  
> 구현 파일: `src/utils/amplitude.ts`  
> API Key: `.env` → `EXPO_PUBLIC_AMPLITUDE_API_KEY`  
> 총 이벤트: **18개** (노이즈 12개 제거 후 핵심만 유지)

---

## 설계 원칙

> "클릭 수가 아니라 가치 전달 여부를 측정한다"

- **선택(selected) ≠ 채택(replaced)**: `alternative_selected`는 버튼 탭, `alternative_replaced`는 서버 저장 완료. NSM은 replaced 기준.
- **실패도 측정**: `sos_result_empty`로 AI 추천 실패율 추적 → 어떤 필터 조합이 결과 없는지 파악.
- **이탈 출처 구분**: `alternative_dismissed`의 `source` 파라미터로 날씨 이탈 vs 일반 이탈 분리.

---

## 공통 자동 주입값 (`getCommonProps`)

| 속성 | 타입 | 설명 |
|---|---|---|
| `platform` | `"ios" \| "android"` | 플랫폼 |
| `timestamp` | ISO 8601 string | 발생 시각 |
| `session_id` | string | Amplitude SDK 자동 관리 |

---

## 1. 활성화 지표

### `trip_created`
| 항목 | 내용 |
|---|---|
| **트리거** | 신규 여행 생성 API(`createTrip`) 성공 직후 |
| **발생 위치** | `AddScheduleLocationScreen.native.tsx` |

| 파라미터 | 타입 | 필수 | 예시 |
|---|---|---|---|
| `trip_id` | string | ✅ | `"42"` |
| `destination` | string | ✅ | `"강릉"` |
| `duration_days` | number | ✅ | `3` |
| `transport_mode` | `"WALK" \| "TRANSIT" \| "CAR"` | ✅ | `"TRANSIT"` |

---

### `place_added`
| 항목 | 내용 |
|---|---|
| **트리거** | 장소 추가 API(`addTripLocation`) 성공 직후 |
| **발생 위치** | `AddScheduleLocationScreen.native.tsx` |

| 파라미터 | 타입 | 필수 | 예시 |
|---|---|---|---|
| `trip_id` | string | ✅ | `"42"` |
| `trip_day` | number | ✅ | `2` |
| `place_id` | string | ✅ | `"ChIJ..."` |
| `place_name` | string | ✅ | `"강릉중앙시장"` |
| `place_category` | string | ✅ | `"MARKET"` |
| `source` | `"search"` | ✅ | `"search"` |

---

### `schedule_viewed`
| 항목 | 내용 |
|---|---|
| **트리거** | 진행 중 일정 화면 포커스 진입 시 (`useFocusEffect`) |
| **발생 위치** | `OngoingScheduleScreen.tsx` |

| 파라미터 | 타입 | 필수 | 예시 |
|---|---|---|---|
| `trip_id` | string | ✅ | `"42"` |
| `schedule_type` | `"ongoing"` | ✅ | `"ongoing"` |
| `trip_day` | number | ✅ | `1` |

---

## 2. 상세보기 (기능①)

### `review_card_opened`
| 항목 | 내용 |
|---|---|
| **트리거** | ① 장소 검색 결과 "상세 정보 보기" 탭 ② 대안찾기 결과 "리뷰 보기" 탭 (처음 열 때만) |
| **발생 위치** | `usePlaceReview.ts` + `RecommendationResultScreen.tsx` |

| 파라미터 | 타입 | 필수 | 예시 |
|---|---|---|---|
| `place_id` | string | ✅ | `"ChIJ..."` |
| `place_name` | string | ✅ | `"스타벅스 강릉점"` |
| `place_category` | string | — | `"CAFE"` |
| `sources_count` | number | ✅ | `2` (Google + Naver) |
| `summary_shown` | boolean | ✅ | `true` |
| `analysis_blocked` | boolean | ✅ | `false` |

> `analysis_blocked=true` 비율 추세 → AI 요약 품질 신뢰 지표

---

## 3. 대안찾기 플로우 (기능②)

```
sos_triggered
  → sos_filter_applied
      → alternatives_shown (count > 0)
          → alternative_selected
              → alternative_replaced  ← NSM 카운트
          → alternative_dismissed (source: "manual")
      → sos_result_empty (count = 0)
  → alternative_flow_abandoned
```

### `sos_triggered`
| 항목 | 내용 |
|---|---|
| **트리거** | 진행 중 일정 장소 카드 "대안찾기" 버튼 탭 |
| **발생 위치** | `OngoingScheduleScreen.tsx` |

| 파라미터 | 타입 | 필수 | 예시 |
|---|---|---|---|
| `plan_id` | string | ✅ | `"99"` |
| `situation_type` | `"manual" \| "weather_alert" \| "gap_recommendation"` | ✅ | `"manual"` |
| `place_name` | string | ✅ | `"강릉중앙시장"` |
| `place_category` | string | ✅ | `"MARKET"` |
| `trip_id` | string | ✅ | `"42"` |
| `trip_day` | number | ✅ | `1` |

---

### `sos_filter_applied`
| 항목 | 내용 |
|---|---|
| **트리거** | 대안 설정 화면 "AI 분석 시작" 탭 (필터 확정 시점) |
| **발생 위치** | `AlternativeSettingsScreen.tsx` |
| **핵심 인사이트** | 파라미터 분포 → 어떤 필터 조합을 선호하는가 |

| 파라미터 | 타입 | 필수 | 예시 |
|---|---|---|---|
| `trip_id` | string | ✅ | `"42"` |
| `plan_id` | string | ✅ | `"99"` |
| `transport_mode` | `"WALK" \| "TRANSIT" \| "CAR"` | ✅ | `"TRANSIT"` |
| `radius_minute` | `"10" \| "20" \| "30" \| "ANY"` | ✅ | `"20"` |
| `space` | `"INDOOR" \| "OUTDOOR"` | ✅ | `"INDOOR"` |
| `place_type` | string | — | `"CAFE"` (카테고리 변경 시만) |
| `change_category` | boolean | ✅ | `true` |
| `consider_distance` | boolean | ✅ | `false` |
| `recommendation_type` | `"PLACE" \| "GAP"` | ✅ | `"PLACE"` |

---

### `alternative_flow_abandoned`
| 항목 | 내용 |
|---|---|
| **트리거** | 대안 설정 화면에서 취소 또는 뒤로가기 (AI 시작 전 이탈) |
| **발생 위치** | `AlternativeSettingsScreen.tsx` |

| 파라미터 | 타입 | 필수 | 예시 |
|---|---|---|---|
| `trip_id` | string | ✅ | `"42"` |
| `place_id` | string | ✅ | `"99"` |

---

### `alternatives_shown`
| 항목 | 내용 |
|---|---|
| **트리거** | AI 분석 완료 → 결과 화면 이동 직전 |
| **발생 위치** | `AIAnalysisLoadingScreen.tsx` |
| **핵심 지표** | `latency_ms` → H1(≤30초) 자동 산출 |

| 파라미터 | 타입 | 필수 | 예시 |
|---|---|---|---|
| `count` | number | ✅ | `5` |
| `latency_ms` | number | ✅ | `8420` |
| `recommendation_type` | `"PLACE" \| "GAP"` | ✅ | `"PLACE"` |
| `trip_id` | string | ✅ | `"42"` |
| `plan_id` | string | ✅ | `"99"` |

---

### `sos_result_empty` ★ 신규
| 항목 | 내용 |
|---|---|
| **트리거** | AI 분석 완료 후 추천 결과가 0개일 때 |
| **발생 위치** | `AIAnalysisLoadingScreen.tsx` |
| **핵심 인사이트** | 어떤 필터 조합이 결과 없는지 → 추천 모델 개선 방향 |

| 파라미터 | 타입 | 필수 | 예시 |
|---|---|---|---|
| `trip_id` | string | ✅ | `"42"` |
| `plan_id` | string | ✅ | `"99"` |
| `transport_mode` | string | ✅ | `"WALK"` |
| `radius_minute` | string | ✅ | `"10"` |
| `recommendation_type` | `"PLACE" \| "GAP"` | ✅ | `"PLACE"` |
| `latency_ms` | number | ✅ | `31200` |

---

### `alternative_selected`
| 항목 | 내용 |
|---|---|
| **트리거** | 추천 결과 카드 "선택" 버튼 탭 (서버 저장 시작 전) |
| **발생 위치** | `RecommendationResultScreen.tsx` |
| **핵심 지표** | `rank` 분포 → H2(TOP3 채택률 ≥50%) 산출 |

| 파라미터 | 타입 | 필수 | 예시 |
|---|---|---|---|
| `rank` | number (1~5) | ✅ | `1` |
| `place_id` | string | ✅ | `"ChIJ..."` |
| `place_name` | string | ✅ | `"스타벅스 강릉점"` |
| `place_category` | string | ✅ | `"CAFE"` |
| `recommendation_type` | `"PLACE" \| "GAP"` | ✅ | `"PLACE"` |
| `trip_id` | string | ✅ | `"42"` |
| `time_to_select_ms` | number | ✅ | `4200` |

---

### `alternative_replaced` ★ 신규 (NSM 기준 이벤트)
| 항목 | 내용 |
|---|---|
| **트리거** | `replacePlanPlace` API 성공 → 일정이 실제로 바뀐 순간 |
| **발생 위치** | `RecommendationResultScreen.tsx` |
| **NSM 직결** | 이 이벤트 수 = 주간 대안 채택 수 (Weekly Adopted Recoveries) |

| 파라미터 | 타입 | 필수 | 예시 |
|---|---|---|---|
| `trip_id` | string | ✅ | `"42"` |
| `old_place_id` | string | ✅ | `"99"` |
| `old_place_name` | string | ✅ | `"강릉중앙시장"` |
| `new_place_id` | string | ✅ | `"ChIJ..."` |
| `new_place_name` | string | ✅ | `"스타벅스 강릉점"` |
| `new_place_category` | string | ✅ | `"CAFE"` |
| `rank` | number | ✅ | `1` |
| `recommendation_type` | `"PLACE" \| "GAP"` | ✅ | `"PLACE"` |
| `source` | `"manual" \| "weather"` | ✅ | `"manual"` |

---

### `alternative_dismissed`
| 항목 | 내용 |
|---|---|
| **트리거** | 결과 화면에서 아무것도 선택 안 하고 뒤로가기 |
| **발생 위치** | `RecommendationResultScreen.tsx` |

| 파라미터 | 타입 | 필수 | 예시 |
|---|---|---|---|
| `trip_id` | string | ✅ | `"42"` |
| `alternatives_count` | number | ✅ | `5` |
| `recommendation_type` | `"PLACE" \| "GAP"` | ✅ | `"PLACE"` |
| `source` | `"manual" \| "weather"` | ✅ | `"manual"` |

---

## 4. 틈새 대안 (기능③)

### `gap_recommendation_viewed`
| 항목 | 내용 |
|---|---|
| **트리거** | 갭 추천 스트리밍 완료 → 카드 노출 시. 언마운트 시 `selected: false`로도 발사 |
| **발생 위치** | `GapRecommendationCard.tsx` |
| **전환율** | `selected=true` 수 ÷ 전체 viewed 수 |

| 파라미터 | 타입 | 필수 | 예시 |
|---|---|---|---|
| `trip_id` | string | ✅ | `"42"` |
| `recommendation_count` | number | ✅ | `3` |
| `selected` | boolean | ✅ | `false` |

---

### `gap_place_selected`
| 항목 | 내용 |
|---|---|
| **트리거** | 갭 추천 장소 선택 후 서버 저장 성공 |
| **발생 위치** | `OngoingScheduleScreen.tsx` |

| 파라미터 | 타입 | 필수 | 예시 |
|---|---|---|---|
| `trip_id` | string | ✅ | `"42"` |
| `trip_day` | number | ✅ | `1` |
| `place_id` | string | ✅ | `"ChIJ..."` |
| `place_name` | string | ✅ | `"카페 보헤미안"` |
| `detour_minutes` | number \| null | — | `15` |

---

## 5. 날씨 대안 (기능④)

### `weather_notification_viewed`
| 항목 | 내용 |
|---|---|
| **트리거** | 날씨 경보 카드 마운트 시 |
| **발생 위치** | `WeatherNotificationCard.tsx` |

| 파라미터 | 타입 | 필수 | 예시 |
|---|---|---|---|
| `plan_id` | string | ✅ | `"99"` |
| `trip_id` | string | ✅ | `"42"` |
| `weather_type` | string | ✅ | `"비 예보"` |
| `precip_prob` | number | — | `85` |

---

### `weather_recommend_tapped`
| 항목 | 내용 |
|---|---|
| **트리거** | 날씨 카드 "대안 추천받기" 버튼 탭 |
| **발생 위치** | `WeatherNotificationCard.tsx` |

| 파라미터 | 타입 | 필수 | 예시 |
|---|---|---|---|
| `plan_id` | string | ✅ | `"99"` |
| `trip_id` | string | ✅ | `"42"` |
| `weather_type` | string | ✅ | `"비 예보"` |

---

### `weather_notification_dismissed`
| 항목 | 내용 |
|---|---|
| **트리거** | 날씨 카드 X 버튼 탭 |
| **발생 위치** | `WeatherNotificationCard.tsx` |

| 파라미터 | 타입 | 필수 | 예시 |
|---|---|---|---|
| `plan_id` | string | ✅ | `"99"` |
| `trip_id` | string | ✅ | `"42"` |
| `weather_type` | string | ✅ | `"비 예보"` |

---

## 이벤트 수 요약

| 카테고리 | 이벤트 | 개수 |
|---|---|---|
| 활성화 | `trip_created`, `place_added`, `schedule_viewed` | 3 |
| 상세보기 (기능①) | `review_card_opened` | 1 |
| 대안찾기 (기능②) | `sos_triggered`, `sos_filter_applied`, `alternative_flow_abandoned`, `alternatives_shown`, `sos_result_empty`, `alternative_selected`, `alternative_replaced`, `alternative_dismissed` | 8 |
| 틈새 대안 (기능③) | `gap_recommendation_viewed`, `gap_place_selected` | 2 |
| 날씨 대안 (기능④) | `weather_notification_viewed`, `weather_recommend_tapped`, `weather_notification_dismissed` | 3 |
| Amplitude SDK 자동 | `session_start`, `session_end` | — |
| **합계** | | **17** |

---

## 핵심 지표 산출 방법

| 지표 | 계산식 | 이벤트 |
|---|---|---|
| NSM (주간 대안 채택 수) | `alternative_replaced` 주간 합계 | `alternative_replaced` |
| H1 — SOS 응답 30초 이내율 | `alternatives_shown.latency_ms ≤ 30000` 비율 | `alternatives_shown` |
| H2 — TOP3 채택률 | `alternative_replaced.rank ≤ 3` ÷ 전체 replaced | `alternative_replaced` |
| AI 추천 실패율 | `sos_result_empty` ÷ (`alternatives_shown` + `sos_result_empty`) | 두 이벤트 |
| 대안찾기 진짜 전환율 | `alternative_replaced` ÷ `sos_triggered` | 두 이벤트 |
| 날씨 기능 CTR | `weather_recommend_tapped` ÷ `weather_notification_viewed` | 두 이벤트 |
| 갭 추천 전환율 | `gap_place_selected` ÷ `gap_recommendation_viewed` | 두 이벤트 |
| 필터 선호도 | `sos_filter_applied` 프로퍼티 그룹화 | `sos_filter_applied` |
| 선택 → 채택 완료율 | `alternative_replaced` ÷ `alternative_selected` | 두 이벤트 |

---

## QA 체크리스트 (Amplitude 라이브 이벤트)

1. 여행 생성 → `trip_created` + `place_added` 수신
2. 일정 화면 진입 → `schedule_viewed` 수신
3. "상세 정보 보기" 탭 → `review_card_opened` 수신
4. 대안찾기 전체 플로우 → `sos_triggered` → `sos_filter_applied` → `alternatives_shown`(latency_ms 확인) → `alternative_selected`(rank 확인) → `alternative_replaced` 수신
5. 결과 없을 때 → `sos_result_empty` 수신 확인
6. 날씨 카드 → `weather_notification_viewed` → `weather_recommend_tapped` 수신
7. 갭 추천 → `gap_recommendation_viewed`(selected 파라미터 확인) 수신
