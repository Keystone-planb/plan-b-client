import {
  Animated,
  Easing,
} from "react-native";
import {
  useEffect,
  useMemo,
} from "react";

export function useAIAnalysisLoadingAnimations(
  progress: number,
) {
  const floatValue = useMemo(
    () => new Animated.Value(0),
    [],
  );

  const pulseValue = useMemo(
    () => new Animated.Value(0),
    [],
  );

  const progressValue = useMemo(
    () => new Animated.Value(2),
    [],
  );

  const iconFloat =
    floatValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, -8, 0],
    });

  const iconScale =
    pulseValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1.045, 1],
    });

  const progressWidth =
    progressValue.interpolate({
      inputRange: [0, 100],
      outputRange: ["0%", "100%"],
    });

  useEffect(() => {
    Animated.timing(
      progressValue,
      {
        toValue: progress,
        duration: 260,
        easing: Easing.out(
          Easing.cubic,
        ),
        useNativeDriver: false,
      },
    ).start();
  }, [
    progress,
    progressValue,
  ]);

  useEffect(() => {
    const floatAnimation =
      Animated.loop(
        Animated.timing(
          floatValue,
          {
            toValue: 1,
            duration: 1700,
            easing:
              Easing.inOut(
                Easing.ease,
              ),
            useNativeDriver: true,
            isInteraction: false,
          },
        ),
      );

    const pulseAnimation =
      Animated.loop(
        Animated.timing(
          pulseValue,
          {
            toValue: 1,
            duration: 1500,
            easing:
              Easing.inOut(
                Easing.ease,
              ),
            useNativeDriver: true,
            isInteraction: false,
          },
        ),
      );

    floatAnimation.start();
    pulseAnimation.start();

    return () => {
      floatAnimation.stop();
      pulseAnimation.stop();
    };
  }, [
    floatValue,
    pulseValue,
  ]);

  return {
    iconFloat,
    iconScale,
    progressWidth,
  };
}
