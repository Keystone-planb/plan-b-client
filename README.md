# Keystone

> **2026 BuildersLeague Project (2026.03 ~ 2026.07)**  
> 흩어진 여행 정보를 하나로, 원큐에!  
> 사용자 맞춤형 여행 일정 큐레이션 서비스

---

## Project Overview

- **프로젝트명**: Keystone (키스톤)
- **진행 기간**: 2026.03 ~ 2026.07
- **소속**: 2026 BuildersLeague
- **주요 목표**: Google Maps, Naver, Instagram 등 파편화된 여행 데이터를 통합하여 신뢰도 높은 정보와 대안 일정을 제공합니다.

## Tech Stack

### Frontend

- **React Native**: iOS, Android, Web을 고려한 크로스 플랫폼 앱 개발
- **Expo**: 개발 서버 실행, 시뮬레이터 테스트, 앱 빌드 및 배포 환경 구성
- **TypeScript**: 화면, API, 데이터 타입 안정성 확보
- **React Navigation**: 온보딩, 로그인, 메인, Plan.A, Plan.X 등 화면 이동 관리

### State & Data Management

- **React Query**: 서버 상태 관리 및 API 데이터 캐싱
- **Zustand**: 전역 상태 관리
- **React Hooks**: 화면 상태 및 비동기 로직 관리
- **AsyncStorage**: access token, refresh token, 로컬 일정 데이터 저장
- **Axios**: REST API 요청 및 인증 토큰 인터셉터 처리
- **Fetch Streaming / SSE**: 실시간 대안 추천 및 갭 추천 스트리밍 응답 처리

### UI & Styling

- **React Native StyleSheet**: 주요 화면 스타일링
- **Tailwind CSS / Styled-components**: 일부 UI 스타일링 및 확장 가능 구조
- **Figma**: 화면 설계 및 UI 기준안 관리
- **Ionicons**: 앱 내 아이콘 구성

### Map & Location

- **Google Places API**: 장소 검색 및 장소 상세 정보 조회
- **Map Preview UI**: 일정 장소의 좌표 기반 지도 표시
- **Latitude / Longitude**: 장소 위도·경도 기반 마커 표시 및 추천 로직 연동

### Authentication

- **JWT 기반 인증**: access token / refresh token 저장 및 갱신
- **일반 로그인**: 이메일/비밀번호 기반 로그인
- **Kakao Social Login**: 카카오 OAuth 로그인 연동
- **Google Social Login**: 구글 OAuth 로그인 연동
- **Deep Link / Redirect URI**: 앱·웹 OAuth 성공/실패 redirect 처리

### Recommendation & API Integration

- **REST API**: 일정 생성, 조회, 수정, 삭제 및 장소 추가 연동
- **SSE Streaming API**: AI 대안 장소 추천, 빈 시간 갭 추천 실시간 처리
- **Weather Notification API**: 날씨 기반 일정 알림 조회 및 대안 추천 연결
- **Preference Feedback API**: 사용자 선택 기반 개인화 피드백 전송

### Development & Collaboration

- **Git / GitHub**: 브랜치 기반 협업 및 PR 관리
- **EAS Build**: Android APK 빌드 및 테스트 배포
- **TypeScript Check**: `npx tsc --noEmit --pretty false` 기반 타입 검증

## Collaboration Convention

### 1. Issue & Branch Strategy

모든 작업은 Issue 생성 후 해당 번호를 딴 Branch에서 진행합니다.

| 구분          | 규칙 (Naming Convention) | 예시                                |
| :------------ | :----------------------- | :---------------------------------- |
| **이슈 제목** | `[타입] 작업 내용`       | `[Feat] 지도 API 연동 및 마커 표시` |
| **브랜치명**  | `타입/#이슈번호-내용`    | `feat/#12-map-api`                  |

### 2. Commit Message Type

| 타입           | 설명              | 타입        | 설명                      |
| :------------- | :---------------- | :---------- | :------------------------ |
| **`feat`**     | 새로운 기능 추가  | **`fix`**   | 버그 수정                 |
| **`docs`**     | 문서 수정         | **`style`** | 코드 포맷팅 (로직 변경 X) |
| **`refactor`** | 코드 리팩토링     | **`chore`** | 빌드/패키지 설정 변경     |
| **`design`**   | UI/UX 디자인 수정 | **`test`**  | 테스트 코드 추가          |

### 3. Pull Request Workflow

- PR 생성 시 본문에 `Closes #이슈번호`를 기재하여 이슈를 자동 종료합니다.
- 최소 1명 이상의 리뷰어 승인 후 `main` 브랜치에 Merge 합니다.

## 🚀 Key Features (WIP)

- [ ] 다양한 플랫폼(Google, Naver, SNS) 데이터 통합 파이프라인 구축
- [ ] 실시간 위치 기반 여행지 추천 및 대안 일정 제시
- [ ] 사용자 맞춤형 여행 경로 최적화 알고리즘

---

© 2026 Keystone Team. Powered by BuildersLeague.
