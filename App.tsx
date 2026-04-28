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
          name="OAuthRedirect"
          component={OAuthRedirectScreen}
          options={{
            animation: "fade",
          }}
        />

        <Stack.Screen name="Main" component={MainScreen} />

        <Stack.Screen name="AddSchedule" component={AddScheduleNameScreen} />

        <Stack.Screen
          name="AddScheduleDate"
          component={AddScheduleDateScreen}
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
