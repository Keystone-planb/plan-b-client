import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const StepSearchIcon = require("../assets/ai-loading/step-search.png");
const StepPinIcon = require("../assets/ai-loading/step-pin.png");
const StepStarIcon = require("../assets/ai-loading/step-star.png");
const StepInboxIcon = require("../assets/ai-loading/step-inbox.png");
const StepWriteIcon = require("../assets/ai-loading/step-write.png");

type TransportMode = "WALK" | "TRANSIT" | "CAR";
type MoveTime = "10" | "20" | "30" | "ANY";
type PlaceScope = "INDOOR" | "OUTDOOR";

type TodayPlace = {
  id?: string;
  name?: string;
  address?: string;
  time?: string;
  latitude?: number;
  longitude?: number;
};

type Props = {
  navigation: any;
  route?: {
    params?: {
      scheduleId?: string;
      tripName?: string;
      startDate?: string;
      endDate?: string;
      location?: string;
      transportMode?: TransportMode;
      moveTime?: MoveTime;
      considerDistance?: boolean;
      considerCrowd?: boolean;
      changeCategory?: boolean;
      placeScope?: PlaceScope;
      targetPlace?: TodayPlace;
    };
  };
};

type LoadingStep = {
  icon: ImageSourcePropType;
  title: string;
  description: string;
  tip: string;
  detailTipTitle: string;
  detailTipDescription: string;
};

const LOADING_STEPS: LoadingStep[] = [
  {
    icon: StepSearchIcon,
    title: "여행 데이터 분석 중",
    description: "선택하신 조건을 바탕으로 데이터를 수집하고 있어요",
    tip: "💡 5개의 대안을 찾아드려요",
    detailTipTitle: "잠깐! 알고 계셨나요?",
    detailTipDescription: "Plan.B AI는 현재 일정과 선택 조건을 함께 분석해요.",
  },
  {
    icon: StepPinIcon,
    title: "주변 장소 분석 중",
    description: "선택 사항을 고려해 장소를 찾고 있어요",
    tip: "💡 AI가 최적의 장소를 찾아드려요",
    detailTipTitle: "장소를 비교하고 있어요",
    detailTipDescription:
      "현재 위치, 다음 일정, 이동 조건을 바탕으로 주변 장소를 살펴보고 있어요.",
  },
  {
    icon: StepStarIcon,
    title: "리뷰 분석 중",
    description: "AI가 실시간 리뷰를 분석하고 있어요",
    tip: "💡 네이버, 구글, 인스타그램 리뷰를 종합 분석해요",
    detailTipTitle: "리뷰도 함께 확인해요",
    detailTipDescription:
      "평점뿐 아니라 방문자 반응과 장소 분위기도 함께 참고하고 있어요.",
  },
  {
    icon: StepInboxIcon,
    title: "대안 장소 분석 중",
    description: "가장 적합한 대안들을 선별하고 있어요",
    tip: "💡 다음 목적지와의 거리를 고려해요",
    detailTipTitle: "일정 흐름을 지켜요",
    detailTipDescription:
      "대안 장소를 고를 때 다음 목적지와의 이동 부담도 함께 고려해요.",
  },
  {
    icon: StepWriteIcon,
    title: "추천 결과 생성 중",
    description: "최종 결과를 정리하고 있어요",
    tip: "💡 곧 완료돼요!",
    detailTipTitle: "추천 결과를 정리 중이에요",
    detailTipDescription: "추천 이유와 장소 정보를 보기 쉽게 정리하고 있어요.",
  },
];

const DOT_COUNT = 6;

export default function AIAnalysisLoadingScreen({ navigation, route }: Props) {
  const [progress, setProgress] = useState(2);
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const [dotDirection, setDotDirection] = useState<1 | -1>(1);

  const floatValue = useMemo(() => new Animated.Value(0), []);
  const pulseValue = useMemo(() => new Animated.Value(0), []);

  const currentStepIndex = Math.min(
    Math.floor((progress / 100) * LOADING_STEPS.length),
    LOADING_STEPS.length - 1,
  );

  const currentStep = LOADING_STEPS[currentStepIndex];

  const iconFloat = floatValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -6, 0],
  });

  const iconScale = pulseValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.035, 1],
  });

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);

          setTimeout(() => {
            navigation.navigate("RecommendationResult", {
              ...route?.params,
              fromAIAnalysis: true,
            });
          }, 450);

          return 100;
        }

        return Math.min(prev + 2, 100);
      });
    }, 170);

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
    }, 240);

    return () => {
      clearInterval(dotTimer);
    };
  }, [dotDirection]);

  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.timing(floatValue, {
        toValue: 1,
        duration: 1700,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );

    const pulseAnimation = Animated.loop(
      Animated.timing(pulseValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );

    floatAnimation.start();
    pulseAnimation.start();

    return () => {
      floatAnimation.stop();
      pulseAnimation.stop();
    };
  }, [floatValue, pulseValue]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <Text style={styles.logoText}>Plan.B</Text>

        <View style={styles.centerContent}>
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                transform: [{ translateY: iconFloat }, { scale: iconScale }],
              },
            ]}
          >
            <Image
              source={currentStep.icon}
              style={styles.stepIcon}
              resizeMode="contain"
            />
          </Animated.View>

          <Text style={styles.title}>{currentStep.title}</Text>

          <Text style={styles.description}>{currentStep.description}</Text>

          <View style={styles.tipPill}>
            <Text style={styles.tipPillText}>{currentStep.tip}</Text>
          </View>
        </View>

        <View style={styles.dotsArea}>
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
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipCardTitle}>{currentStep.detailTipTitle}</Text>

          <Text style={styles.tipCardDescription}>
            {currentStep.detailTipDescription}
          </Text>
        </View>
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
    paddingHorizontal: 36,
  },

  logoText: {
    color: "#1C2534",
    fontSize: 29,
    fontWeight: "900",
    letterSpacing: -0.8,
    textAlign: "center",
    marginTop: 70,
  },

  centerContent: {
    alignItems: "center",
    marginTop: 76,
  },

  iconWrapper: {
    width: 132,
    height: 132,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 34,
  },

  stepIcon: {
    width: 132,
    height: 132,
  },

  title: {
    color: "#111827",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.4,
    textAlign: "center",
    marginBottom: 14,
  },

  description: {
    color: "#8A9BB2",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 18,
  },

  tipPill: {
    minHeight: 30,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#CFE0FF",
    backgroundColor: "#F2F7FF",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  tipPillText: {
    color: "#2F6BFF",
    fontSize: 10,
    fontWeight: "900",
  },

  dotsArea: {
    marginTop: 64,
    alignItems: "center",
  },

  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#E0E8F2",
  },

  activeDot: {
    width: 18,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#2158E8",
  },

  tipCard: {
    marginTop: 62,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E1E7EF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingVertical: 22,
    minHeight: 116,
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

  tipCardTitle: {
    color: "#1C2534",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 12,
  },

  tipCardDescription: {
    color: "#8A9BB2",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
  },
});
