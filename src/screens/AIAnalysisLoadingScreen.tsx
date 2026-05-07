import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  navigation: any;
  route?: {
    params?: {
      scheduleId?: string;
      tripName?: string;
      startDate?: string;
      endDate?: string;
      location?: string;
      transportMode?: "WALK" | "TRANSIT" | "CAR";
      moveTime?: "10" | "20" | "30" | "ANY";
      considerDistance?: boolean;
      considerCrowd?: boolean;
      changeCategory?: boolean;
      placeScope?: "INDOOR" | "OUTDOOR";
      targetPlace?: {
        id?: string;
        name?: string;
        address?: string;
        time?: string;
        latitude?: number;
        longitude?: number;
      };
    };
  };
};

const DOT_COUNT = 6;

export default function AIAnalysisLoadingScreen({ navigation, route }: Props) {
  const [progress, setProgress] = useState(2);
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const [dotDirection, setDotDirection] = useState<1 | -1>(1);

  const animatedValue = useMemo(() => new Animated.Value(0), []);

  const orbitRotate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const searchFloat = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -7, 0],
  });

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);

          setTimeout(() => {
            navigation.navigate("RecommendationResult", {
              ...route?.params,
            });
          }, 450);

          return 100;
        }

        return Math.min(prev + 2, 100);
      });
    }, 180);

    return () => {
      clearInterval(progressTimer);
    };
  }, [navigation, route?.params]);

  useEffect(() => {
    const dotTimer = setInterval(() => {
      setActiveDotIndex((prev) => {
        if (prev >= DOT_COUNT - 1) {
          setDotDirection(-1);
          return prev - 1;
        }

        if (prev <= 0) {
          setDotDirection(1);
          return prev + 1;
        }

        return prev + dotDirection;
      });
    }, 260);

    return () => {
      clearInterval(dotTimer);
    };
  }, [dotDirection]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [animatedValue]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View pointerEvents="none" style={styles.backgroundDotOne} />
        <View pointerEvents="none" style={styles.backgroundDotTwo} />
        <View pointerEvents="none" style={styles.backgroundDotThree} />
        <View pointerEvents="none" style={styles.backgroundDotFour} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.heroSection}>
            <View style={styles.analysisVisual}>
              <Animated.View
                style={[
                  styles.orbitRing,
                  {
                    transform: [{ rotate: orbitRotate }],
                  },
                ]}
              >
                <View style={[styles.orbitDot, styles.orbitDotTop]} />
                <View style={[styles.orbitDotSmall, styles.orbitDotRight]} />
                <View style={[styles.orbitDot, styles.orbitDotBottom]} />
                <View style={[styles.orbitDotSmall, styles.orbitDotLeft]} />
              </Animated.View>

              <Animated.View
                style={[
                  styles.searchIconCircle,
                  {
                    transform: [{ translateY: searchFloat }],
                  },
                ]}
              >
                <Text style={styles.searchIcon}>🔍</Text>
              </Animated.View>
            </View>

            <Text style={styles.title}>여행 데이터 분석 중</Text>

            <Text style={styles.description}>
              선택하신 조건을 바탕으로 데이터를 수집하고 있어요
            </Text>

            <View style={styles.guideBox}>
              <Text style={styles.guideText}>
                💡 평균 2-3개의 대안을 찾아드려요
              </Text>
            </View>
          </View>

          <View style={styles.dotsSection}>
            <View style={styles.dotsRow}>
              {Array.from({ length: DOT_COUNT }).map((_, index) => {
                const isActive = index === activeDotIndex;

                return (
                  <View
                    key={`loading-dot-${index}`}
                    style={[styles.dot, isActive && styles.activeDot]}
                  />
                );
              })}
            </View>

            <Text style={styles.loadingText}>
              조건에 맞는 장소를 비교하고 있어요
            </Text>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>잠깐! 알고 계셨나요?</Text>

            <Text style={styles.tipDescription}>
              Plan.B AI는 실시간으로 10,000개 이상의 장소 데이터를 분석해요
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    position: "relative",
    overflow: "hidden",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 36,
    paddingTop: 44,
    paddingBottom: 42,
  },

  backgroundDotOne: {
    position: "absolute",
    left: 20,
    top: 88,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#D7E5FF",
  },

  backgroundDotTwo: {
    position: "absolute",
    left: 188,
    top: 382,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#D7E5FF",
  },

  backgroundDotThree: {
    position: "absolute",
    left: 206,
    top: 616,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#D7E5FF",
  },

  backgroundDotFour: {
    position: "absolute",
    left: 54,
    bottom: 62,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#D7E5FF",
  },

  heroSection: {
    alignItems: "center",
    marginBottom: 52,
  },

  analysisVisual: {
    width: 154,
    height: 154,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 42,
  },

  orbitRing: {
    position: "absolute",
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1,
    borderColor: "#D9ECFF",
  },

  orbitDot: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#2158E8",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.22,
    shadowRadius: 7,
    elevation: 5,
  },

  orbitDotSmall: {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#9ED4FF",
  },

  orbitDotTop: {
    top: -7,
    left: 59,
  },

  orbitDotRight: {
    right: -4,
    top: 61,
  },

  orbitDotBottom: {
    bottom: -7,
    left: 59,
    backgroundColor: "#4EA3FF",
  },

  orbitDotLeft: {
    left: -4,
    top: 61,
  },

  searchIconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#F2F8FF",
    borderWidth: 1,
    borderColor: "#CFE6FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8CCBFF",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 8,
  },

  searchIcon: {
    fontSize: 48,
  },

  title: {
    color: "#1C2534",
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: -0.8,
    textAlign: "center",
    marginBottom: 18,
  },

  description: {
    color: "#8A9BB2",
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 28,
    textAlign: "center",
    marginBottom: 24,
  },

  guideBox: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CFE0FF",
    backgroundColor: "#F2F7FF",
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  guideText: {
    color: "#2F6BFF",
    fontSize: 16,
    fontWeight: "900",
  },

  dotsSection: {
    alignItems: "center",
    marginBottom: 46,
  },

  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 13,
    marginBottom: 18,
  },

  dot: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: "#E3E9F1",
  },

  activeDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#2158E8",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 5,
  },

  loadingText: {
    color: "#8A9BB2",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  tipCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E1E7EF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 24,
    minHeight: 132,
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },

  tipTitle: {
    color: "#1C2534",
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 14,
  },

  tipDescription: {
    color: "#8A9BB2",
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 27,
  },
});
