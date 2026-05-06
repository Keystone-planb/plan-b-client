import React from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MainScreen from "../screens/MainScreen";
import PlanXScreen from "../screens/PlanXScreen";
import ProfileScreen from "../screens/ProfileScreen";

type BottomTabParamList = {
  PlanX: undefined;
  Home: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();
type IconName = keyof typeof Ionicons.glyphMap;

function getIconName(routeName: string, focused: boolean): IconName {
  if (routeName === "PlanX") {
    return focused ? "time" : "time-outline";
  }

  if (routeName === "Home") {
    return focused ? "home" : "home-outline";
  }

  if (routeName === "Profile") {
    return focused ? "person" : "person-outline";
  }

  return "ellipse-outline";
}

function CustomBottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.tabBarOuter,
        {
          bottom: Platform.OS === "ios" ? Math.max(insets.bottom, 16) : 18,
        },
      ]}
    >
      <View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];

          const iconName = getIconName(route.name, focused);

          const handlePress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name as keyof BottomTabParamList);
            }
          };

          const handleLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              testID={`bottom-tab-${route.name}`}
              accessibilityLabel={`bottom-tab-${route.name}`}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              activeOpacity={0.75}
              onPress={handlePress}
              onLongPress={handleLongPress}
              style={styles.tabButton}
            >
              <Ionicons
                name={iconName}
                size={34}
                color={focused ? "#2B3445" : "#C8D1DF"}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      id={undefined}
      initialRouteName="Home"
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen name="PlanX" component={PlanXScreen} />

      <Tab.Screen name="Home" component={MainScreen} />

      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    position: "absolute",
    left: 24,
    right: 24,
    alignItems: "center",
  },
  tabBarContainer: {
    width: "100%",
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE6F2",
  },

  tabButton: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
