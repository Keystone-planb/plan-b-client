import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import MainScreen from "./src/screens/MainScreen";

type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Main: undefined;
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

        setInitialRoute(accessToken && refreshToken ? "Main" : "Login");
      } catch (error) {
        console.log("초기 인증 상태 확인 실패:", error);
        setInitialRoute("Login");
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
        <Stack.Screen name="Login" component={LoginScreen} />

        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{
            animation: "fade",
            animationDuration: 300,
          }}
        />

        <Stack.Screen name="Main" component={MainScreen} />
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
