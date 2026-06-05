# Plan.B · 1차 고도화 | AARRR 측정 체계

> 작성: 박지호(PM) · 2026-06 · 지인 10명 주말 현장 베타  
> MVP 4기능(리뷰·SOS·날씨·갭)만 있고 수익화·공유 기능 없음 → Revenue·Referral 측정 안 함.

---

## AARRR 단계별 측정 범위

| 단계 | 사용자 행동 | 핵심 지표 | 대표 이벤트 | 이번 측정 |
|---|---|---|---|---|
| Acquisition | 앱 설치·실행 | 온보딩 진입 인원 | (직접 모집, Amplitude 미측정) | △ 인원 수동 집계 |
| Activation | 첫 일정 생성 → 첫 추천 → 첫 채택 | 첫 채택률, Time-to-Aha | `trip_created`, `alternative_replaced` | ✅ 핵심 |
| Retention | 주말 재실행·다음날 복귀 | Day2 복귀, 자발적 재실행 | `schedule_viewed` 반복 발생 | △ 프록시 |
| Revenue | (기능 없음) | — | — | ✗ |
| Referral | (기능 없음) | — | — | ✗ |

---

## Activation 상세 — Aha Moment 경로

```
trip_created (여행 생성)
  → schedule_viewed (일정 진입)
      → sos_triggered (대안찾기 시작)
          → sos_filter_applied (필터 확정)
              → alternatives_shown (AI 결과 노출)
                  → alternative_selected (선택 버튼 탭)
                      → alternative_replaced ← ✅ Aha Moment
```

**Aha Moment = '첫 세션에서 alternative_replaced 1회 발생'**  
이 순간이 제품 핵심 가치(무너진 계획 복구)를 처음 체감하는 지점.  
온보딩은 이 순간까지의 거리를 줄이는 방향으로 평가.

> ⚠️ 이전 정의(`alternative_selected`)에서 변경.  
> 선택 버튼 탭은 의도 표현일 뿐, 일정이 실제로 바뀌어야 가치 전달.

---

## Retention 프록시 (주말 한정)

직접적인 리텐션 측정은 D7/D30 출시 후 가능. 이번 주말은 아래 프록시로 관찰.

| 프록시 | 방법 | 이벤트 |
|---|---|---|
| **Day2 복귀** | 토요일에 `schedule_viewed` 찍힌 user_id가 일요일에도 발생하는가 | `schedule_viewed` |
| **자발적 재실행** | 과제 시나리오 외 시간에 스스로 앱을 다시 열었는가 | `schedule_viewed` 타임스탬프 |
| **재사용 의향** | 설문 "다음 여행에도 쓸 것 같다" (1~5점) | 설문 G항목 |

---

## 교차 해석 원칙

| 상황 | 해석 |
|---|---|
| `alternative_replaced` 낮고 설문 신뢰 높음 | 추천 품질은 OK, 노출·UX 문제 |
| `alternative_replaced` 낮고 설문 신뢰 낮음 | 추천 품질 자체 문제 |
| `sos_result_empty` 높음 | AI 모델 or 필터 조건 너무 좁음 |
| `alternative_selected` 높고 `alternative_replaced` 낮음 | 서버 오류 or 저장 실패 |
| `weather_recommend_tapped` 낮음 | 날씨 알림 자체를 못 보거나 신뢰 안 함 |
| `gap_recommendation_viewed.selected=false` 높음 | 갭 추천 품질 or 타이밍 문제 |
