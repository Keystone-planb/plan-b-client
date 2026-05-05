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

import AddScheduleNameScreen from "./src/screens/AddScheduleNameScreen";
import AddScheduleDateScreen from "./src/screens/AddScheduleDateScreen";
import AddScheduleLocationScreen from "./src/screens/AddScheduleLocationScreen";

import PlanXDetailScreen from "./src/screens/PlanXDetailScreen";
import ProfileEditScreen from "./src/screens/ProfileEditScreen";

import BottomTabNavigator from "./src/navigation/BottomTabNavigator";

export type RootStackParamList = {
  OnboardingFirst: undefined;
  OnboardingSecond: undefined;
  OnboardingThird: undefined;
  OnboardingFourth: undefined;

  Login: undefined;
  SignUp: undefined;
  OAuthRedirect: undefined;

  MainTabs: undefined;

  PlanXDetail: {
    tripId?: string;
    scheduleId?: string;
    tripName?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
  };

  ProfileEdit: undefined;

  AddSchedule: undefined;
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

const linking = {
  prefixes: ["planb://", "http://localhost:8081", "http://localhost:8082"],
  config: {
    screens: {
      OnboardingFirst: "",
      Login: "login",
      SignUp: "signup",
      MainTabs: "main",
      PlanXDetail: "plan-x-detail",
      ProfileEdit: "profile-edit",
      OAuthRedirect: {
        path: "oauth/:result",
      },
      AddSchedule: "add-schedule",
      AddScheduleDate: "add-schedule-date",
      AddScheduleLocation: "add-schedule-location",
    },
  },
};

const onboardingScreenOptions = {
  animation: "slide_from_right" as const,
  animationDuration: 260,
};

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
          accessToken && refreshToken ? "MainTabs" : "OnboardingFirst",
        );
      } catch {
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

        <Stack.Screen
          name="MainTabs"
          component={BottomTabNavigator}
          options={{
            headerShown: false,
            animation: "fade",
            animationDuration: 250,
            gestureEnabled: false,
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
          name="ProfileEdit"
          component={ProfileEditScreen}
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
