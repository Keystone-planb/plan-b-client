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

const Stack = createNativeStackNavigator();

type InitialRoute = "OnboardingFirst" | "Login" | "Main";

export default function App() {
  type InitialRoute = "OnboardingFirst" | "Login" | "Main";

  const [initialRoute, setInitialRoute] = useState<InitialRoute | null>(null);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("access_token");
        const onboardingSeen = await AsyncStorage.getItem("onboarding_seen");

        if (accessToken) {
          setInitialRoute("Main");
          return;
        }

        if (onboardingSeen === "true") {
          setInitialRoute("Login");
          return;
        }

        setInitialRoute("OnboardingFirst");
      } catch (error) {
        console.log("초기 상태 확인 실패:", error);
        setInitialRoute("OnboardingFirst");
      }
    };

    bootstrapAuth();
  }, []);

  if (!initialRoute) {
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

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
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
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Main" component={MainScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
