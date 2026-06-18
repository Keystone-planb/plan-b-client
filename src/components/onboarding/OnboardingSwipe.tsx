import React, { useMemo } from "react";
import { PanResponder, StyleSheet, View } from "react-native";

type Props = {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
};

const SWIPE_DISTANCE = 60;

export default function OnboardingSwipe({
  children,
  onSwipeLeft,
  onSwipeRight,
}: Props) {
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return (
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
            Math.abs(gestureState.dx) > 18
          );
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx <= -SWIPE_DISTANCE) {
            onSwipeLeft?.();
            return;
          }

          if (gestureState.dx >= SWIPE_DISTANCE) {
            onSwipeRight?.();
          }
        },
      }),
    [onSwipeLeft, onSwipeRight],
  );

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
