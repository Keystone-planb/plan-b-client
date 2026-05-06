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
import MainScreen from "./src/screens/MainScreen";
import AddScheduleNameScreen from "./src/screens/AddScheduleNameScreen";
import AddScheduleDateScreen from "./src/screens/AddScheduleDateScreen";
import AddScheduleTransportScreen from "./src/screens/AddScheduleTransportScreen";
import AddScheduleLocationScreen from "./src/screens/AddScheduleLocationScreen";
import PlanAScreen from "./src/screens/PlanAScreen";
import OAuthRedirectScreen from "./src/screens/OAuthRedirectScreen";

type RootStackParamList = {
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
    location?: string;
    transportMode?: "WALK" | "TRANSIT" | "CAR";
    transportLabel?: string;
  };

  PlanA: {
    scheduleId?: string;
    tripName?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    transportMode?: "WALK" | "TRANSIT" | "CAR";
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
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: ["planb://", "http://localhost:8081", "http://localhost:8082"],
  config: {
    screens: {
      OAuthRedirect: {
        path: "oauth/success",
      },
    },
  },
};

// 화면 플로우 테스트용.
// 커밋 전 반드시 null로 변경.
// 예: const FORCE_INITIAL_ROUTE_FOR_FLOW_TEST: keyof RootStackParamList | null = null;
const FORCE_INITIAL_ROUTE_FOR_FLOW_TEST: keyof RootStackParamList | null =
  null;

export default function App() {
  const [initialRoute, setInitialRoute] = useState<
    keyof RootStackParamList | null
  >(null);

  useEffect(() => {
    const bootstrapAuth = async () => {
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
          component={MainScreen}
          options={{
            headerShown: false,
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
          name="AddScheduleTransport"
          component={AddScheduleTransportScreen}
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
