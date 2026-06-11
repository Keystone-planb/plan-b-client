import React from "react";
import {
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MainScreen from "../screens/MainScreen";
import PlanXScreen from "../screens/PlanXScreen";
import ProfileScreen from "../screens/ProfileScreen";

type BottomTabParamList = {
  PlanX: undefined;
  Home: undefined;
  Profile: undefined;
};

const ANDROID_NAVIGATION_BAR_HEIGHT = 48;
const TAB_BAR_FLOATING_GAP = 18;

const Tab = createBottomTabNavigator<BottomTabParamList>();
function getTabIconSource(routeName: string) {
  if (routeName === "PlanX") {
    return require("../../assets/tab-history.png");
  }

  if (routeName === "Home") {
    return require("../../assets/tab-home.png");
  }

  if (routeName === "Profile") {
    return require("../../assets/tab-profile.png");
  }

  return require("../../assets/tab-home.png");
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
          bottom:
            Platform.OS === "android" ?
              ANDROID_NAVIGATION_BAR_HEIGHT + TAB_BAR_FLOATING_GAP
            : Math.max(insets.bottom, 16),
        },
      ]}
    >
      <View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];

          const iconSource = getTabIconSource(route.name);

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
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              activeOpacity={0.75}
              onPress={handlePress}
              onLongPress={handleLongPress}
              style={styles.tabButton}
            >
              <Image
                source={iconSource}
                style={[
                  styles.tabIcon,
                  focused ? styles.tabIconActive : styles.tabIconInactive,
                ]}
                resizeMode="contain"
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
      <Tab.Screen
        name="PlanX"
        component={PlanXScreen}
        options={{
          tabBarButtonTestID: "bottom-tab-PlanX",
          tabBarAccessibilityLabel: "bottom-tab-PlanX",
        }}
      />

      <Tab.Screen
        name="Home"
        component={MainScreen}
        options={{
          tabBarButtonTestID: "bottom-tab-Home",
          tabBarAccessibilityLabel: "bottom-tab-Home",
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarButtonTestID: "bottom-tab-Profile",
          tabBarAccessibilityLabel: "bottom-tab-Profile",
        }}
      />
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

  tabIcon: {
    width: 24,
    height: 24,
  },

  tabIconActive: {
    opacity: 1,
  },

  tabIconInactive: {
    opacity: 0.9,
  },
});
