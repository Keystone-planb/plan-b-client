# Plan.B · iOS Amplitude 검증 가이드

> 작성: 박지호(PM) · 2026-06  
> Android 검증 완료 → iOS 동일 이벤트 수신 확인용  
> 담당: FE 개발자

---

## 1. 빌드 전 필수 작업

Android와 달리 iOS는 네이티브 모듈 추가 시 **반드시 pod install이 필요**합니다.  
`@amplitude/analytics-react-native`는 네이티브 모듈을 포함하므로 이 과정 없이 빌드하면 크래시납니다.

```bash
# 프로젝트 루트에서
cd ios
pod install
cd ..
```

> pod install 중 오류 나면 아래 시도:
> ```bash
> cd ios
> pod deintegrate
> pod install
> cd ..
> ```

---

## 2. iOS 빌드 & 실행

```bash
# 시뮬레이터
npx expo run:ios

# 실기기 (베타 테스트는 실기기 필수)
npx expo run:ios --device
```

> 실기기 연결 시 Xcode → Signing & Capabilities → Team 설정 필요할 수 있음

---

## 3. iOS에서만 확인해야 할 것

Android에서 됐어도 iOS에서 별도로 체크해야 하는 항목들입니다.

### 3-1. Amplitude 초기화 확인
Metro 콘솔에서 아래 로그 없으면 초기화 실패:
```
[Amplitude] app_open  (또는 첫 이벤트 로그)
```
오류 없이 조용히 넘어가는 것도 확인. `[Amplitude] API key 없음` 경고 뜨면 `.env` 파일 확인.

### 3-2. `minIdLength: 1` 적용 확인
Android에서 발생했던 `Invalid id length for user_id or device_id` 에러가 iOS에서도 동일하게 발생할 수 있음. 콘솔에서 확인.

### 3-3. 로그인 후 userId 세팅
로그인 완료 후 Amplitude 라이브 이벤트에서 `user_23` 같은 형식으로 사용자 ID가 표시되는지 확인. Android와 동일한 `user_` prefix 형식이어야 함.

### 3-4. iOS 권한 (선택)
현재 앱에 ATT(앱 추적 투명성) 팝업은 없음. Amplitude는 ATT 없이도 작동하나, 추후 IDFA 활용 시 필요. 지금은 무시.

---

## 4. 이벤트별 iOS 검증 체크리스트

Amplitude 대시보드 → **라이브 이벤트** → Platform 필터: `iOS` 설정 후 아래 순서로 확인.

| # | 이벤트 | iOS에서 해야 할 행동 | 확인 |
|---|---|---|---|
| 1 | `trip_created` | 새 여행 생성 (장소 검색 → 선택 완료) | ☐ |
| 2 | `place_added` | 장소 추가 후 PlanA 화면 이동 | ☐ |
| 3 | `schedule_viewed` | 홈 → 진행 중 일정 탭 | ☐ |
| 4 | `review_card_opened` | 장소 검색 결과 → "상세 정보 보기" 탭 | ☐ |
| 5 | `sos_triggered` | 진행 중 일정 → 장소 카드 "대안찾기" 탭 | ☐ |
| 6 | `sos_filter_applied` | 필터 설정 후 "AI 분석 시작" 탭 | ☐ |
| 7 | `alternatives_shown` | AI 분석 완료 후 결과 화면 진입 | ☐ |
| 8 | `sos_result_empty` | 결과 0개 케이스 (좁은 필터 조합으로 시도) | ☐ |
| 9 | `alternative_selected` | 결과 카드 "선택" 탭 | ☐ |
| 10 | `alternative_replaced` | 선택 후 PlanA로 이동 완료 | ☐ |
| 11 | `alternative_dismissed` | 결과 화면에서 선택 없이 뒤로가기 | ☐ |
| 12 | `alternative_flow_abandoned` | 대안 설정 화면에서 취소 탭 | ☐ |
| 13 | `gap_recommendation_viewed` | 일정 사이 갭 추천 카드 로드 완료 | ☐ |
| 14 | `gap_place_selected` | 갭 추천 장소 선택 | ☐ |
| 15 | `weather_notification_viewed` | 홈 화면 날씨 카드 노출 | ☐ |
| 16 | `weather_recommend_tapped` | 날씨 카드 "대안 추천받기" 탭 | ☐ |
| 17 | `weather_notification_dismissed` | 날씨 카드 X 버튼 탭 | ☐ |

---

## 5. Android vs iOS 파라미터 비교

라이브 이벤트에서 동일 이벤트를 Android / iOS 각각 발생시켜 파라미터가 동일한지 확인.

| 확인 항목 | Android | iOS | 일치 여부 |
|---|---|---|---|
| `platform` 값 | `"android"` | `"ios"` | ✅ 다른 게 정상 |
| `trip_id` 형식 | `"42"` | `"42"` | 동일해야 함 |
| `latency_ms` 발생 여부 | ✅ | ☐ 확인 필요 | |
| `time_to_select_ms` 발생 여부 | ✅ | ☐ 확인 필요 | |
| `user_id` prefix 형식 (`user_XX`) | ✅ | ☐ 확인 필요 | |

---

## 6. 자주 나오는 iOS 오류 & 대응

| 오류 | 원인 | 해결 |
|---|---|---|
| `Native module not found` | pod install 안 함 | `cd ios && pod install` |
| `Invalid id length` 에러 | minIdLength 미적용 | `amplitude.ts` init 옵션 확인 |
| 이벤트가 라이브에 안 보임 | 빌드 캐시 문제 | `npx expo run:ios --no-build-cache` |
| 시뮬레이터에선 되는데 실기기에서 안 됨 | 네트워크 차단 | 실기기 Wi-Fi 확인, VPN 해제 |
| Xcode 빌드 실패 (signing) | 팀 설정 없음 | Xcode → Signing & Capabilities → Team 설정 |

---

## 7. 검증 완료 기준

아래 두 조건 모두 충족 시 iOS 검증 완료:

- [ ] 17개 이벤트 전부 Amplitude 라이브 이벤트에서 Platform=iOS로 수신 확인
- [ ] `alternative_replaced`가 Android와 동일한 파라미터 구조로 수신 확인 (NSM 기준 이벤트)
