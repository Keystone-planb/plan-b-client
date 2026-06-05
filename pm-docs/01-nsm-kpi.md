# Plan.B · 1차 고도화 | NSM & KPI 체계

> 작성: 박지호(PM) · 2026-06 · 지인 10명 주말 현장 베타

---

## 1. 노스스타 지표 (NSM)

**NSM = 주간 대안 채택 수 (Weekly Adopted Recoveries)**

SOS·날씨·갭 상황에서 AI 대안을 **실제로 일정에 교체 완료한** 횟수의 합.

> Amplitude 기준: `alternative_replaced` 이벤트 주간 합계  
> ⚠️ `alternative_selected`(버튼 탭)이 아니라 `alternative_replaced`(서버 저장 완료)로 카운트.  
> 선택했지만 서버 오류로 저장 실패한 경우는 제외된다.

---

## 2. KPI 트리

```
NSM: 주간 대안 채택 수 (alternative_replaced)
│
├── Activation (활성화)
│   ├── 첫 일정 생성률          trip_created
│   ├── 첫 추천 노출까지 시간    sos_triggered → alternatives_shown
│   └── 첫 대안 채택률          ← Aha Moment (세션 내 첫 alternative_replaced)
│
├── Core Value (핵심가치)
│   ├── 기능① 리뷰카드 사용률   review_card_opened ÷ schedule_viewed
│   ├── 기능② SOS 전환율        alternative_replaced ÷ sos_triggered
│   ├── 기능②  H1 응답속도       alternatives_shown.latency_ms ≤ 30초 비율
│   ├── 기능② H2 TOP3 채택률    alternative_replaced.rank ≤ 3 비율 ≥ 50%
│   ├── 기능② AI 실패율         sos_result_empty ÷ (alternatives_shown + sos_result_empty)
│   ├── 기능② 필터 선호도        sos_filter_applied 파라미터 분포
│   ├── 기능③ 갭 추천 전환율     gap_place_selected ÷ gap_recommendation_viewed
│   └── 기능④ 날씨 CTR          weather_recommend_tapped ÷ weather_notification_viewed
│
└── Retention (유지)
    ├── Day2 복귀율             토→일 schedule_viewed 재발생 비율
    └── 자발적 재실행           과제 외 시간 schedule_viewed 발생 여부
```

---

## 3. 지표 정의표

| 단계 | 지표 | 정의 | 계산 이벤트 | 목표 |
|---|---|---|---|---|
| Activation | 첫 대안 채택률 | 첫 세션 내 `alternative_replaced` 발생 비율 | `alternative_replaced` | ≥ 40% |
| Activation | Time-to-Aha | 앱 첫 실행 → 첫 `alternative_replaced` | `trip_created` → `alternative_replaced` | 당일 |
| Core (H1) | SOS 응답 속도 | `alternatives_shown.latency_ms` ≤ 30,000ms 비율 | `alternatives_shown` | ≥ 80% |
| Core (H2) | TOP3 채택률 | `alternative_replaced.rank` 1~3인 비율 | `alternative_replaced` | ≥ 50% |
| Core | 진짜 전환율 | `alternative_replaced` ÷ `sos_triggered` | 두 이벤트 비교 | 추세 |
| Core | AI 실패율 | `sos_result_empty` ÷ 전체 요청 | `sos_result_empty` | 추세 모니터 |
| Core | 리뷰 분석불가율 | `review_card_opened.analysis_blocked=true` 비율 | `review_card_opened` | 추세 모니터 |
| Retention | Day2 복귀율 | 토요일 유저가 일요일에도 `schedule_viewed` | `schedule_viewed` 반복 | 측정·관찰 |

---

## 4. NSM 해석 기준

10명·주말 표본은 통계가 아닌 **방향 + 동반 지표(채택률 + 설문 신뢰점수)**로 해석.

| 구간 | 신호 | 해석 |
|---|---|---|
| 가치 미검증 | 인당 < 1회 · 채택률 < 30% | 핵심 루프 안 돎 → 추천 품질·노출 점검 |
| 가치 신호 | 인당 1~2회 · 채택률 30~50% | 일부 검증 → 막히는 단계 개선 |
| 가치 검증 | 인당 ≥ 2회 · 채택률 ≥ 50% (H2) | 복구 루프 작동 |

> **선택률(alternative_selected)과 채택률(alternative_replaced)을 같이 볼 것.**  
> 선택률이 높은데 채택률이 낮으면 → 서버 오류 또는 UX 이탈 문제.
