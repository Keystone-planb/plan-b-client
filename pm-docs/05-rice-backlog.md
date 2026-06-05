# Plan.B · 1차 고도화 | 베타 후 VOC → RICE 백로그

> 작성: 박지호(PM) · 2026-06  
> 수집(설문 F항목·Amplitude 이상치·Discord) → 테마 묶기 → RICE 스코어 → 스프린트 반영

---

## 1. 프로세스

```
수집 → 테마 묶기 → RICE 스코어링 → 백로그 정렬 → 스프린트 반영 → Before/After 검증
```

---

## 2. RICE 정의

```
RICE = (Reach × Impact × Confidence) ÷ Effort
```

| 변수 | 정의 |
|---|---|
| **Reach** | 영향받는 사용자 수 (10명 베타 기준 1~10) |
| **Impact** | 가치 영향 (0.25 최소 / 0.5 낮음 / 1 중간 / 2 높음 / 3 매우 높음) |
| **Confidence** | 확신도 (%) — 데이터·설문 근거 있으면 높게 |
| **Effort** | 공수 (인·주) |

---

## 3. RICE 스코어링 (MVP 맥락 · 베타 후 업데이트)

| VOC / 개선안 | Amplitude 근거 | R | I | C | E | RICE | 우선 |
|---|---|---|---|---|---|---|---|
| 대안 선택→교체 실패 → 오류 처리 | `alternative_selected` 대비 `alternative_replaced` 갭 | 8 | 3 | 85% | 1 | **20.4** | 1 |
| 인증 불안정 → SecurityConfig 개선 | `schedule_viewed` 없이 세션 종료 케이스 | 10 | 3 | 90% | 2 | **13.5** | 2 |
| 리뷰 분석불가 잦음 → 소스 보강·캐싱 | `review_card_opened.analysis_blocked=true` 비율 | 8 | 2 | 80% | 2 | **6.4** | 3 |
| AI 추천 실패율 높음 → 모델 튜닝 | `sos_result_empty` ÷ 전체 요청 비율 | 9 | 2 | 70% | 2 | **6.3** | 4 |
| 추천 결과 캐싱 부재 → Valkey 적용 | `alternatives_shown.latency_ms` p50 측정값 | 10 | 2 | 70% | 3 | **4.7** | 5 |
| 날씨 알림 지연 → 스캔 주기 튜닝 | `weather_notification_viewed` 타임스탬프 지연 | 6 | 2 | 70% | 2 | **4.2** | 6 |
| 현지 위치 정확도 → GPS 보정 | Discord VOC 위치 관련 | 7 | 2 | 60% | 2 | **4.2** | 6 |
| 온보딩 단계 축소 → Time-to-Aha 단축 | `trip_created` → `alternative_replaced` 시간 | 9 | 1.5 | 60% | 2 | **4.1** | 7 |

> 숫자는 베타 데이터 후 팀이 합의해 조정. 지금은 예시 기준값.

---

## 4. Before / After 검증 템플릿

| 개선안 | 가설 | 지표 | Before | After 목표 |
|---|---|---|---|---|
| Valkey 추천 캐싱 | 재요청 지연 감소 | `alternatives_shown.latency_ms` p50 | 측정값 | −30% |
| AI 모델 튜닝 | 실패율 감소 | `sos_result_empty` 비율 | 측정값 | −50% |
| 온보딩 단계 축소 | Aha Moment 단축 | `trip_created` → `alternative_replaced` 시간 | 측정값 | −20% |
| 인증 안정화 | 이탈 감소 | Day2 복귀율 (`schedule_viewed` 반복) | 측정값 | +5%p |
| 선택→교체 오류 수정 | 전환율 개선 | `alternative_replaced` ÷ `alternative_selected` | 측정값 | ≥ 90% |
| 날씨 알림 튜닝 | CTR 개선 | `weather_recommend_tapped` ÷ `weather_notification_viewed` | 측정값 | +10%p |

---

## 5. 베타 후 인사이트 체크리스트

Amplitude 데이터 + 설문 교차 확인 순서:

1. `alternative_replaced` 주간 합계 → NSM 베이스라인 확정
2. `alternatives_shown.latency_ms` p50/p90 → H1 달성 여부
3. `alternative_replaced.rank` 분포 → H2 달성 여부
4. `sos_result_empty` 비율 + 필터 조합 → AI 개선 방향
5. `alternative_selected` vs `alternative_replaced` 갭 → 서버 오류 존재 여부
6. `sos_filter_applied` 파라미터 분포 → 가장 많이 쓰는 필터
7. `gap_recommendation_viewed.selected=false` 비율 → 갭 기능 가치
8. `weather_recommend_tapped` ÷ `weather_notification_viewed` → 날씨 기능 반응률
9. 설문 D4 "실제로 일정 바꿨다" vs `alternative_replaced` 수 → 기억 편향 확인
