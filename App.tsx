import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// 온보딩 화면
import OnboardingFirstScreen from "./src/screens/OnboardingFirstScreen";
import OnboardingSecondScreen from "./src/screens/OnboardingSecondScreen";
import OnboardingThirdScreen from "./src/screens/OnboardingThirdScreen";
import OnboardingFourthScreen from "./src/screens/OnboardingFourthScreen";

// 인증 화면
import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import KakaoLoginWebViewScreen from "./src/screens/KakaoLoginWebViewScreen";
import OAuthRedirectScreen from "./src/screens/OAuthRedirectScreen";

// 메인 화면
import MainScreen from "./src/screens/MainScreen";

// 플랜 화면
import PlanAScreen from "./src/screens/PlanAScreen";
import PlanXScreen from "./src/screens/PlanXScreen";

// 일정 추가 화면
import AddScheduleNameScreen from "./src/screens/AddScheduleNameScreen";
import AddScheduleDateScreen from "./src/screens/AddScheduleDateScreen";
import AddScheduleLocationScreen from "./src/screens/AddScheduleLocationScreen";
import AddPlaceScreen from "./src/screens/AddPlaceScreen";

/**
 * 앱 전체 네비게이션 타입
 */
export type RootStackParamList = {
  // 온보딩
  OnboardingFirst: undefined;
  OnboardingSecond: undefined;
  OnboardingThird: undefined;
  OnboardingFourth: undefined;

  // 인증
  Login: undefined;
  SignUp: undefined;

  /**
   * 카카오 모바일 WebView 로그인 화면
   */
  KakaoLoginWebView: {
    authUrl: string;
    redirectUri: string;
  };

  /**
   * 웹 OAuth 성공/실패 redirect 처리 화면
   */
  OAuthRedirect: undefined;

  // 메인
  Main: undefined;

  // 플랜
  PlanA: {
    tripName?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    selectedPlace?: {
      id: string;
      name: string;
      time?: string;
      day?: number;
    };
  };

  PlanX: undefined;

  // 일정 추가
  AddSchedule: undefined;

  AddPlace: {
    day?: number;
    tripName?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
  };

  AddScheduleDate: {
    tripName?: string;
  };

  AddScheduleLocation: {
    tripName?: string;
    startDate?: string;
    endDate?: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * 개발 중 리로드할 때 바로 보고 싶은 화면
 *
 * null이면 기존 자동 로그인 로직 사용
 *
 * 예:
 * const DEV_INITIAL_ROUTE = "AddScheduleDate";
 * const DEV_INITIAL_ROUTE = "AddScheduleLocation";
 * const DEV_INITIAL_ROUTE = "PlanA";
 * const DEV_INITIAL_ROUTE = "PlanX";
 * const DEV_INITIAL_ROUTE = "Main";
 * const DEV_INITIAL_ROUTE = null;
 *
 * 커밋 전에는 null 권장.
 */
const DEV_INITIAL_ROUTE: keyof RootStackParamList | null = "Main";
/**
 * 웹 OAuth redirect URL 매핑
 *
 * http://localhost:8081/oauth/success?... → OAuthRedirect
 * http://localhost:8081/oauth/failure?... → OAuthRedirect
 * http://localhost:8082/oauth/success?... → OAuthRedirect
 * http://localhost:8082/oauth/failure?... → OAuthRedirect
 */
const linking = {
  prefixes: ["http://localhost:8081", "http://localhost:8082", "planb://"],
  config: {
    screens: {
      OnboardingFirst: "",
      Login: "login",
      SignUp: "signup",
      Main: "main",

      OAuthRedirect: {
        path: "oauth/:result",
      },

      PlanA: "plan-a",
      PlanX: "plan-x",

      AddPlace: "add-place",

      AddSchedule: "add-schedule",
      AddScheduleDate: "add-schedule-date",
      AddScheduleLocation: "add-schedule-location",
    },
  },
};

export default function App() {
  /**
   * 앱 최초 실행 시 진입할 화면
   *
   * 개발 모드:
   * - DEV_INITIAL_ROUTE가 있으면 해당 화면으로 바로 진입
   *
   * 일반 흐름:
   * - access_token, refresh_token 둘 다 있으면 Main
   * - 하나라도 없으면 OnboardingFirst
   */
  const [initialRoute, setInitialRoute] = useState<
    keyof RootStackParamList | null
  >(null);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        /**
         * 개발 중에는 원하는 화면으로 바로 진입
         * 운영 빌드에서는 동작하지 않음
         */
        if (__DEV__ && DEV_INITIAL_ROUTE) {
          setInitialRoute(DEV_INITIAL_ROUTE);
          return;
        }

        const accessToken = await AsyncStorage.getItem("access_token");
        const refreshToken = await AsyncStorage.getItem("refresh_token");

        setInitialRoute(
          accessToken && refreshToken ? "Main" : "OnboardingFirst",
        );
      } catch (error) {
        console.log("초기 로그인 상태 확인 실패:", error);

        setInitialRoute("OnboardingFirst");
      }
    };

    bootstrapAuth();
  }, []);

  if (!initialRoute) {
    return <SplashLoading />;
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        /**
         * React Navigation 타입 이슈 회피용
         * 기존 프로젝트에서 사용 중이던 설정 유지
         */
        id={undefined}
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          animationDuration: 300,
        }}
      >
        {/* =========================
            온보딩 플로우
        ========================= */}
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

        {/* =========================
            인증 플로우
        ========================= */}
        <Stack.Screen name="Login" component={LoginScreen} />

        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{
            animation: "fade",
            animationDuration: 300,
          }}
        />

        <Stack.Screen
          name="KakaoLoginWebView"
          component={KakaoLoginWebViewScreen}
          options={{
            animation: "slide_from_bottom",
          }}
        />

        <Stack.Screen
          name="OAuthRedirect"
          component={OAuthRedirectScreen}
          options={{
            animation: "fade",
          }}
        />

        {/* =========================
            메인
        ========================= */}
        <Stack.Screen name="Main" component={MainScreen} />

        {/* =========================
            플랜 화면

            Main
            → PlanA
            → PlanX
        ========================= */}
        <Stack.Screen name="PlanA" component={PlanAScreen} />

        <Stack.Screen name="PlanX" component={PlanXScreen} />

        <Stack.Screen name="AddPlace" component={AddPlaceScreen} />

        {/* =========================
            일정 추가 플로우

            Main
            → AddSchedule
            → AddScheduleDate
            → AddScheduleLocation
        ========================= */}
        <Stack.Screen name="AddSchedule" component={AddScheduleNameScreen} />

        <Stack.Screen
          name="AddScheduleDate"
          component={AddScheduleDateScreen}
        />

        <Stack.Screen
          name="AddScheduleLocation"
          component={AddScheduleLocationScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/**
 * 앱 초기 로딩 화면
 *
 * AsyncStorage에서 토큰을 확인하는 동안 표시된다.
 */
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
