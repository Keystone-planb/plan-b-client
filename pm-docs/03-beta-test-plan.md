# Plan.B · 1차 고도화 | 주말 현장 베타 테스트 운영 계획

> 작성: 박지호(PM) · 2026-06 · 지인 10명 주말 현장 테스트

---

## 1. 개요

| 항목 | 내용 |
|---|---|
| **대상** | 지인 약 10명. 주말에 실제 나들이·여행 계획이 있는 사람 위주 |
| **방식** | 주말 동안 실제 계획 짜고 돌아다니며 앱 사용 — 실데이터·실위치 기반 (더미 금지) |
| **목표** | 4기능 현장 작동 여부 + 막히는 지점 + 추천 신뢰도 확인 |
| **트래킹 기준** | Amplitude `alternative_replaced` 발생 여부가 핵심 |

---

## 2. 사전 준비 (금요일)

- Amplitude 라이브 이벤트에서 핵심 5개 이벤트 수신 확인
  - `trip_created` → `sos_triggered` → `alternatives_shown` → `alternative_selected` → `alternative_replaced`
- 테스터 계정 생성·온보딩 안내, iOS/Android 분포 확인 (각각 `expo run:ios`, `expo run:android` 빌드)
- Discord 전용 채널 개설 (실시간 버그·VOC)
- 과제 시나리오·위치·데이터 수집 동의 안내, 설문 링크 사전 공유

---

## 3. 주말 진행 시나리오

**토요일**
1. 앱 설치 → `trip_created` 발생 확인
2. 나들이·여행 이동 중 자연스럽게 사용
3. 상황 발생 시: SOS 대안·날씨 대체·갭 추천·리뷰 카드 사용 유도
4. `alternative_replaced` 발생 시 → 성공 케이스

**일요일**
1. 계속 사용 + 종료 후 설문 회수
2. Day2 복귀: `schedule_viewed`가 일요일에도 찍히는 유저 수 집계

---

## 4. PM 관찰 체크리스트

| 항목 | 무엇을 본다 | Amplitude 확인 |
|---|---|---|
| **핵심 루프** | `sos_triggered` → `alternative_replaced` 완성되는가 | 퍼널 이벤트 순서 |
| **H1 응답속도** | `alternatives_shown.latency_ms` ≤ 30초인가 | latency_ms 파라미터 |
| **H2 TOP3 채택** | `alternative_replaced.rank` 1~3 비율 ≥ 50%인가 | rank 파라미터 |
| **AI 실패** | `sos_result_empty` 발생 빈도 + 어떤 필터 조합인가 | transport_mode, radius_minute |
| **필터 선호** | `sos_filter_applied` 파라미터 분포 | 프로퍼티 그룹화 |
| **날씨 반응** | `weather_recommend_tapped` ÷ `weather_notification_viewed` | 두 이벤트 비율 |
| **갭 전환** | `gap_place_selected` ÷ `gap_recommendation_viewed` | selected 파라미터 |
| **이탈 출처** | `alternative_dismissed.source` — weather vs manual | source 파라미터 |
| **안정성** | 크래시·에러·로딩 지연 | Discord VOC + 로그 |

---

## 5. 실시간 모니터링 기준

| 상황 | 조치 |
|---|---|
| `alternatives_shown.latency_ms` > 30초 케이스 다수 | 즉시 BE 확인 |
| `sos_result_empty` 50% 이상 | 추천 모델 파라미터 확인 |
| `alternative_selected`는 있는데 `alternative_replaced` 없음 | `replacePlanPlace` API 오류 확인 |
| 크래시 Discord 3건 이상 | 핫픽스 요청 |

---

## 6. 종료 후

- 설문 회수 → 로그 교차 해석 (채택률 ↔ 신뢰점수)
- VOC Discord 태깅 → RICE 스코어링
- `alternative_replaced` 주간 합계 → NSM 첫 베이스라인 확정

> ⚠️ 실제 사용자·실데이터로 진행 (더미 금지). 위치·개인정보 수집 동의 필수.
