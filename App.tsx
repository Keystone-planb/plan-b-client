import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import OnboardingFirstScreen from "./src/screens/OnboardingFirstScreen";
import OnboardingSecondScreen from "./src/screens/OnboardingSecondScreen";
import OnboardingThirdScreen from "./src/screens/OnboardingThirdScreen";
import OnboardingFourthScreen from "./src/screens/OnboardingFourthScreen";

import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import OAuthRedirectScreen from "./src/screens/OAuthRedirectScreen";

import MainScreen from "./src/screens/MainScreen";

import AddScheduleNameScreen from "./src/screens/AddScheduleNameScreen";
import AddScheduleDateScreen from "./src/screens/AddScheduleDateScreen";

export type RootStackParamList = {
  OnboardingFirst: undefined;
  OnboardingSecond: undefined;
  OnboardingThird: undefined;
  OnboardingFourth: undefined;

  Login: undefined;
  SignUp: undefined;
  OAuthRedirect: undefined;

  Main: undefined;

  AddSchedule: undefined;
  AddScheduleDate: {
    tripName?: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * 소셜 로그인 redirect URL 처리
 *
 * 앱:
 * planb://oauth/success?access_token=...
 * planb://oauth/failure?error=...
 *
 * 웹:
 * http://localhost:8081/oauth/success?access_token=...
 * http://localhost:8082/oauth/success?access_token=...
 */
const linking = {
  prefixes: ["planb://", "http://localhost:8081", "http://localhost:8082"],
  config: {
    screens: {
      OnboardingFirst: "",
      Login: "login",
      SignUp: "signup",
      Main: "main",

      OAuthRedirect: {
        path: "oauth/:result",
      },

      AddSchedule: "add-schedule",
      AddScheduleDate: "add-schedule-date",
    },
  },
};

/**
 * 온보딩 화면 전환 옵션
 * - 페이지가 오른쪽에서 자연스럽게 넘어오도록 통일
 */
const onboardingScreenOptions = {
  animation: "slide_from_right" as const,
  animationDuration: 260,
};

/**
 * 인증/리다이렉트 화면 전환 옵션
 * - 로그인, 회원가입, OAuth 처리 화면은 튀지 않게 fade 계열 사용
 */
const authScreenOptions = {
  animation: "fade" as const,
  animationDuration: 240,
};

export default function App() {
  const [initialRoute, setInitialRoute] = useState<
    keyof RootStackParamList | null
  >(null);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("access_token");
        const refreshToken = await AsyncStorage.getItem("refresh_token");

        setInitialRoute(
          accessToken && refreshToken ? "Main" : "OnboardingFirst",
        );
      } catch (error) {
        console.log("초기 상태 확인 실패:", error);
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
        id={undefined}
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          animation: "slide_from_right",
          animationDuration: 260,
          contentStyle: {
            backgroundColor: "#F7F9FB",
          },
        }}
      >
        {/* Onboarding */}
        <Stack.Screen
          name="OnboardingFirst"
          component={OnboardingFirstScreen}
          options={onboardingScreenOptions}
        />

        <Stack.Screen
          name="OnboardingSecond"
          component={OnboardingSecondScreen}
          options={onboardingScreenOptions}
        />

        <Stack.Screen
          name="OnboardingThird"
          component={OnboardingThirdScreen}
          options={onboardingScreenOptions}
        />

        <Stack.Screen
          name="OnboardingFourth"
          component={OnboardingFourthScreen}
          options={onboardingScreenOptions}
        />

        {/* Auth */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            animation: "fade_from_bottom",
            animationDuration: 260,
          }}
        />

        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={authScreenOptions}
        />

        <Stack.Screen
          name="OAuthRedirect"
          component={OAuthRedirectScreen}
          options={{
            animation: "fade",
            animationDuration: 180,
          }}
        />

        {/* Main */}
        <Stack.Screen
          name="Main"
          component={MainScreen}
          options={{
            animation: "fade",
            animationDuration: 240,
            gestureEnabled: false,
          }}
        />

        {/* Add Schedule */}
        <Stack.Screen
          name="AddSchedule"
          component={AddScheduleNameScreen}
          options={{
            animation: "slide_from_right",
            animationDuration: 260,
          }}
        />

        <Stack.Screen
          name="AddScheduleDate"
          component={AddScheduleDateScreen}
          options={{
            animation: "slide_from_right",
            animationDuration: 260,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
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
