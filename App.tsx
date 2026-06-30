import "react-native-gesture-handler";

import React, { useEffect, useRef, useState } from "react";
import { onAuthExpired } from "./src/utils/authEvents";
import { getAuthFailureLog } from "./src/utils/authFailureLog";
import { initAmplitude } from "./src/utils/amplitude";
import { ActivityIndicator, AppState, Platform, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  clearLoginSession,
  isSessionExpiredByIdleTime,
  markSessionActive,
} from "./src/utils/sessionActivity";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Linking from "expo-linking";

import OnboardingFirstScreen from "./src/screens/onboarding/OnboardingFirstScreen";
import OnboardingSecondScreen from "./src/screens/onboarding/OnboardingSecondScreen";
import OnboardingThirdScreen from "./src/screens/onboarding/OnboardingThirdScreen";
import OnboardingFourthScreen from "./src/screens/onboarding/OnboardingFourthScreen";
import LoginScreen from "./src/screens/auth/login/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import BottomTabNavigator from "./src/navigation/BottomTabNavigator";
import AddScheduleNameScreen from "./src/screens/AddScheduleNameScreen";
import AddScheduleDateScreen from "./src/screens/AddScheduleDateScreen";
import AddScheduleLocationScreen from "./src/screens/AddScheduleLocationScreen";
import PlanAScreen from "./src/screens/PlanAScreen";
import OngoingScheduleScreen from "./src/screens/OngoingScheduleScreen";
import UpcomingScheduleScreen from "./src/screens/UpcomingScheduleScreen";
import AlternativeSettingsScreen from "./src/screens/recommendation/settings/AlternativeSettingsScreen";
import AIAnalysisLoadingScreen from "./src/screens/recommendation/loading/AIAnalysisLoadingScreen";
import RecommendationResultScreen from "./src/screens/RecommendationResultScreen";
import GapRecommendationResultScreen from "./src/screens/GapRecommendationResultScreen";
import ProfileEditScreen from "./src/screens/profile/ProfileEditScreen";
import PlanXDetailScreen from "./src/screens/schedule/history/PlanXDetailScreen";
import OAuthRedirectScreen from "./src/screens/OAuthRedirectScreen";

type TransportMode = "WALK" | "TRANSIT" | "CAR";
type MoveTime = "10" | "20" | "30" | "ANY";
type PlaceScope = "INDOOR" | "OUTDOOR";
type RecommendationType = "PLACE" | "GAP";

type TodayPlace = {
  currentPlanId?: number | string;
  id?: string | number;

  // 서버 장소 ID
  tripPlaceId?: number | string;
  serverTripPlaceId?: number | string;

  // Google Place ID
  placeId?: string;
  googlePlaceId?: string;

  name?: string;
  address?: string;
  time?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
};

type ScheduleMemo = {
  id: string;
  text: string;
  createdAt?: string;
  updatedAt?: string;
};

type SchedulePlace = {
  id?: string | number;

  // 서버 장소 ID
  tripPlaceId?: number | string;
  serverTripPlaceId?: number | string;

  // Google Place ID
  placeId?: string;
  googlePlaceId?: string;

  name?: string;
  address?: string;
  time?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  order?: number;
  memos?: ScheduleMemo[];
};

type ScheduleDay = {
  day: number;
  places: SchedulePlace[];
};

type RootStackParamList = {
  OnboardingFirst: undefined;
  OnboardingSecond: undefined;
  OnboardingThird: undefined;
  OnboardingFourth: undefined;
  Login: undefined;
  SignUp: undefined;

  OAuthRedirect: {
    result?: "success" | "failure";
  };

  Main:
    | undefined
    | {
        screen?: string;
        refreshSchedules?: boolean;
        savedScheduleId?: string;
        tripId?: string | number;
        serverTripId?: string | number;
      };

  ProfileEdit: undefined;

  PlanXDetail: {
    tripId?: string | number;
    tripName?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    placeCount?: number;
    emoji?: string;
  };

  AddSchedule: undefined;

  AddScheduleDate: {
    tripName: string;
  };

  AddScheduleTransport: {
    tripName?: string;
    startDate?: string;
    endDate?: string;
  };

  AddScheduleLocation: {
    tripName?: string;
    startDate?: string;
    endDate?: string;
    day?: number;
    selectedDay?: number;
    scheduleId?: string;
    tripId?: string | number;
    serverTripId?: string | number;
    location?: string;
    transportMode?: TransportMode;
    transportLabel?: string;
  };

  PlanA: {
    scheduleId?: string;
    tripId?: string | number;
    serverTripId?: string | number;
    tripName?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    transportMode?: TransportMode;
    transportLabel?: string;
    selectedPlace?: {
      id: string;
      placeId?: string;
      googlePlaceId?: string;
      name: string;
      address?: string;
      category?: string;
      latitude?: number;
      longitude?: number;
      day?: number;
      time?: string;
    };
    alternativeTargetPlace?: TodayPlace;
    returnScreen?: "OngoingSchedule" | "UpcomingSchedule";
  };

  OngoingSchedule: {
    scheduleId?: string;
    tripId?: string | number;
    serverTripId?: string | number;
    tripName?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    transportMode?: TransportMode;
    transportLabel?: string;
    places?: TodayPlace[];
    days?: ScheduleDay[];
    selectedDay?: number;
    refreshPlanAAt?: number;
    successToastMessage?: string;
  };

  UpcomingSchedule: {
    scheduleId?: string;
    tripId?: string | number;
    serverTripId?: string | number;
    tripName?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    transportMode?: TransportMode;
    transportLabel?: string;
    places?: TodayPlace[];
    days?: ScheduleDay[];
    selectedDay?: number;
    refreshPlanAAt?: number;
    successToastMessage?: string;
  };

  AlternativeSettings: {
    scheduleId?: string;
    tripId?: string | number;
    serverTripId?: string | number;
    tripName?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    transportMode?: TransportMode;
    transportLabel?: string;
    targetPlace?: TodayPlace;
    recommendationType?: RecommendationType;
    beforePlanId?: string | number;
    afterPlanId?: string | number;
  };

  AlternativeLoading: {
    scheduleId?: string;
    tripId?: string | number;
    serverTripId?: string | number;
    tripName?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    transportMode?: TransportMode;
    transportLabel?: string;
    moveTime?: MoveTime;
    considerDistance?: boolean;
    considerCrowd?: boolean;
    changeCategory?: boolean;
    placeScope?: PlaceScope;
    targetPlace?: TodayPlace;
    recommendationType?: RecommendationType;
    beforePlanId?: string | number;
    afterPlanId?: string | number;
  };

  RecommendationResult: {
    scheduleId?: string;
    tripId?: string | number;
    serverTripId?: string | number;
    tripName?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    transportMode?: TransportMode;
    transportLabel?: string;
    moveTime?: MoveTime;
    considerDistance?: boolean;
    considerCrowd?: boolean;
    changeCategory?: boolean;
    placeScope?: PlaceScope;
    targetPlace?: TodayPlace;
    recommendationType?: RecommendationType;
    beforePlanId?: string | number;
    afterPlanId?: string | number;

    placesJson?: string;
    fromAIAnalysis?: boolean;
    hasError?: boolean;
    title?: string;
  };

  GapRecommendationResult: {
    scheduleId?: string;
    tripId: string | number;
    serverTripId?: string | number;

    tripName?: string;
    startDate?: string;
    endDate?: string;
    location?: string;

    selectedDay?: number;
    day?: number;

    returnScreen:
      | "OngoingSchedule"
      | "UpcomingSchedule";

    beforePlanId: string | number;
    beforePlanTitle: string;
    beforePlanEndTime?: string;

    afterPlanId: string | number;
    afterPlanTitle: string;
    afterPlanStartTime?: string;

    availableMinutes?: number;
    gapMinutes?: number;

    transportMode:
      | "WALK"
      | "TRANSIT"
      | "CAR";
    transportLabel?: string;

    placesJson: string;
    fromAIAnalysis?: boolean;
    hasError?: boolean;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const webPrefix =
  Platform.OS === "web" && typeof window !== "undefined" ?
    window.location.origin
  : undefined;

const linking = {
  prefixes: [
    Linking.createURL("/", {
      scheme: "planb",
    }),
    "planb://",
    ...(webPrefix ? [webPrefix] : []),
  ],
  config: {
    screens: {
      OAuthRedirect: "oauth/:result",
    },
  },
};

// 화면 플로우 테스트용.
// 커밋 전 반드시 null 유지.
const FORCE_INITIAL_ROUTE_FOR_FLOW_TEST: keyof RootStackParamList | null = null;

export default function App() {
  const [initialRoute, setInitialRoute] = useState<
    keyof RootStackParamList | null
  >(null);
  const [navigationSessionKey, setNavigationSessionKey] = useState(0);

  useEffect(() => {
    // Amplitude 초기화 — 앱 최초 실행 시 1회
    initAmplitude();
  }, []);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const previousAuthFailure =
          await getAuthFailureLog();

        if (previousAuthFailure) {
          console.warn(
            "[AuthFailureReport] 지난 인증 종료 기록",
            previousAuthFailure,
          );
        }
      } catch (error) {
        console.warn(
          "[AuthFailureReport] 지난 인증 종료 기록 조회 실패:",
          error,
        );
      }

      if (FORCE_INITIAL_ROUTE_FOR_FLOW_TEST) {
        console.log(
          "[App] 화면 플로우 테스트용 초기 라우트:",
          FORCE_INITIAL_ROUTE_FOR_FLOW_TEST,
        );

        setInitialRoute(FORCE_INITIAL_ROUTE_FOR_FLOW_TEST);
        return;
      }

      try {
        const accessToken = await AsyncStorage.getItem("access_token");
        const refreshToken = await AsyncStorage.getItem("refresh_token");

        console.log("[App] bootstrap token check:", {
          hasAccessToken: Boolean(accessToken),
          hasRefreshToken: Boolean(refreshToken),
        });

        /**
         * 사용자가 직접 로그아웃하지 않는 이상 로그인 유지.
         * access_token은 만료/누락될 수 있으므로 refresh_token 존재를 로그인 유지 기준으로 본다.
         */
        if (!refreshToken) {
          setInitialRoute("OnboardingFirst");
          return;
        }

        const expiredByIdleTime = await isSessionExpiredByIdleTime();

        if (expiredByIdleTime) {
          await clearLoginSession();
          console.log("[Session] 자동 로그아웃: 미접속 시간 초과");
          setInitialRoute("OnboardingFirst");
          return;
        }

        await markSessionActive();
        setInitialRoute("Main");
      } catch (error) {
        console.log("[App] 초기 상태 확인 실패:", error);
        setInitialRoute("OnboardingFirst");
      }
    };

    bootstrapAuth();
  }, []);

  // 세션 만료(토큰 정리) 시 로그인 화면으로 보낸다. 실패 버스트 중복 방지를 위해 ref로 가드.
  const authExpiryHandledRef = useRef(false);
  useEffect(() => {
    const unsubscribe = onAuthExpired(() => {
      if (authExpiryHandledRef.current) return;
      authExpiryHandledRef.current = true;

      setInitialRoute("Login");
      setNavigationSessionKey((prev) => prev + 1);

      // 잠시 후 가드 해제(이후 재로그인 → 또 만료 시 다시 동작하도록)
      setTimeout(() => {
        authExpiryHandledRef.current = false;
      }, 3000);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextState) => {
        if (nextState !== "active") {
          return;
        }

        try {
          const accessToken = await AsyncStorage.getItem("access_token");
          const refreshToken = await AsyncStorage.getItem("refresh_token");

          if (!refreshToken) {
            return;
          }

          const expiredByIdleTime = await isSessionExpiredByIdleTime();

          if (expiredByIdleTime) {
            await clearLoginSession();
            console.log("[Session] 자동 로그아웃: 미접속 시간 초과");

            setInitialRoute("OnboardingFirst");
            setNavigationSessionKey((prev) => prev + 1);
            return;
          }

          await markSessionActive();
        } catch (error) {
          console.log("[Session] AppState 세션 체크 실패:", error);
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  if (!initialRoute) {
    return <SplashLoading />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer key={navigationSessionKey} linking={linking}>
        <Stack.Navigator
          id={undefined}
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            animationDuration: 300,
          }}
        >
          <Stack.Screen
            name="OnboardingFirst"
            component={OnboardingFirstScreen}
          />
          <Stack.Screen
            name="OnboardingSecond"
            component={OnboardingSecondScreen}
          />
          <Stack.Screen
            name="OnboardingThird"
            component={OnboardingThirdScreen}
          />
          <Stack.Screen
            name="OnboardingFourth"
            component={OnboardingFourthScreen}
          />

          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              animation: "fade",
              animationDuration: 300,
            }}
          />

          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{
              animation: "fade",
              animationDuration: 300,
            }}
          />

          <Stack.Screen
            name="OAuthRedirect"
            component={OAuthRedirectScreen}
            options={{
              headerShown: false,
              animation: "fade",
              animationDuration: 200,
            }}
          />

          <Stack.Screen
            name="Main"
            component={BottomTabNavigator}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="ProfileEdit"
            component={ProfileEditScreen}
            options={{
              headerShown: false,
              animation: "slide_from_right",
              animationDuration: 260,
            }}
          />

          <Stack.Screen
            name="PlanXDetail"
            component={PlanXDetailScreen}
            options={{
              headerShown: false,
              animation: "slide_from_right",
              animationDuration: 260,
            }}
          />

          <Stack.Screen
            name="AddSchedule"
            component={AddScheduleNameScreen}
            options={{
              headerShown: false,
              animation: "slide_from_right",
              animationDuration: 260,
            }}
          />

          <Stack.Screen
            name="AddScheduleDate"
            component={AddScheduleDateScreen}
            options={{
              headerShown: false,
              animation: "slide_from_right",
              animationDuration: 260,
            }}
          />

          <Stack.Screen
            name="AddScheduleLocation"
            component={AddScheduleLocationScreen}
            options={{
              headerShown: false,
              animation: "slide_from_right",
              animationDuration: 260,
            }}
          />

          <Stack.Screen
            name="PlanA"
            component={PlanAScreen}
            options={{
              headerShown: false,
              animation: "slide_from_right",
              animationDuration: 260,
            }}
          />

          <Stack.Screen
            name="OngoingSchedule"
            component={OngoingScheduleScreen}
            options={{
              headerShown: false,
              animation: "slide_from_right",
              animationDuration: 260,
            }}
          />

          <Stack.Screen
            name="UpcomingSchedule"
            component={UpcomingScheduleScreen}
            options={{
              headerShown: false,
              animation: "slide_from_right",
              animationDuration: 260,
            }}
          />

          <Stack.Screen
            name="AlternativeSettings"
            component={AlternativeSettingsScreen}
            options={{
              headerShown: false,
              animation: "slide_from_right",
              animationDuration: 260,
            }}
          />

          <Stack.Screen
            name="AlternativeLoading"
            component={AIAnalysisLoadingScreen as React.ComponentType<any>}
            options={{
              headerShown: false,
              animation: "slide_from_right",
              animationDuration: 260,
            }}
          />

          <Stack.Screen
            name="RecommendationResult"
            component={RecommendationResultScreen as React.ComponentType<any>}
            options={{
              headerShown: false,
              animation: "slide_from_right",
              animationDuration: 260,
            }}
          />

        <Stack.Screen
          name="GapRecommendationResult"
          component={
            GapRecommendationResultScreen
          }
        />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

function SplashLoading() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F7F9FB",
      }}
    >
      <ActivityIndicator size="large" color="#2158E8" />
    </View>
  );
}
