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
import AddScheduleLocationScreen from "./src/screens/AddScheduleLocationScreen";

type RootStackParamList = {
  OnboardingFirst: undefined;
  OnboardingSecond: undefined;
  OnboardingThird: undefined;
  OnboardingFourth: undefined;

  Login: undefined;
  SignUp: undefined;
  Main: undefined;

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

export default function App() {
  const [initialRoute, setInitialRoute] = useState<
    keyof RootStackParamList | null
  >(null);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        await AsyncStorage.getItem("access_token");
        await AsyncStorage.getItem("refresh_token");

        // 임시 테스트용: 앱 실행 시 장소 선택/상세 테스트 화면으로 바로 이동
        setInitialRoute("AddScheduleLocation");

        // 원래 로그인 흐름으로 되돌릴 때는 아래 코드 사용
        // setInitialRoute(
        //   accessToken && refreshToken ? "Main" : "OnboardingFirst",
        // );
      } catch (error) {
        console.log("초기 상태 확인 실패:", error);
        setInitialRoute("AddScheduleLocation");
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
          name="Main"
          component={MainScreen}
          options={{
            animation: "fade",
            animationDuration: 250,
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
          initialParams={{
            tripName: "테스트 여행",
            startDate: "2026-05-03",
            endDate: "2026-05-05",
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
