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
import AddScheduleNameScreen from "./src/screens/AddScheduleNameScreen";
import AddScheduleDateScreen from "./src/screens/AddScheduleDateScreen";
import BottomTabNavigator from "./src/navigation/BottomTabNavigator";
import PlanXDetailScreen from "./src/screens/PlanXDetailScreen";

type RootStackParamList = {
  OnboardingFirst: undefined;
  OnboardingSecond: undefined;
  OnboardingThird: undefined;
  OnboardingFourth: undefined;
  Login: undefined;
  SignUp: undefined;

  MainTabs: undefined;

  PlanXDetail: {
    tripId: string;
    title: string;
  };

  AddSchedule: undefined;
  AddScheduleDate: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

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
    <NavigationContainer>
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
          name="MainTabs"
          component={BottomTabNavigator}
          options={{
            headerShown: false,
            animation: "fade",
            animationDuration: 250,
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
