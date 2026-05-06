import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { streamRecommendations } from "../../api/recommendations/stream";
import type { RecommendedPlace, TransportMode } from "../types/recommendation";

type Props = {
  navigation: any;
  route: {
    params?: {
      userId?: number | string;
      tripId?: number | string;
      limit?: number;
      reason?: string;
      transportMode?: TransportMode;
      title?: string;
      subtitle?: string;
    };
  };
};

const DEFAULT_MESSAGES = [
  "현재 날씨와 일정을 확인하고 있어요",
  "주변 장소 후보를 분석하고 있어요",
  "이동 동선과 추천 이유를 정리하고 있어요",
  "가장 어울리는 대안 장소를 고르는 중이에요",
];

export default function AIAnalysisLoadingScreen({ navigation, route }: Props) {
  const [message, setMessage] = useState(DEFAULT_MESSAGES[0]);
  const [progressText, setProgressText] = useState("AI 분석 준비 중");
  const [places, setPlaces] = useState<RecommendedPlace[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const rotateValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;
  const mountedRef = useRef(true);

  const params = route?.params ?? {};

  const title = params.title ?? "AI가 대안 장소를 찾고 있어요";
  const subtitle =
    params.subtitle ??
    "날씨와 일정 흐름을 기준으로 가장 알맞은 장소를 분석 중이에요.";

  const animatedRotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const animatedPulse = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.08],
  });

  const messageIndex = useMemo(() => {
    const index = DEFAULT_MESSAGES.findIndex((item) => item === message);
    return index < 0 ? 0 : index;
  }, [message]);

  useEffect(() => {
    mountedRef.current = true;

    Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 850,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: 850,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    return () => {
      mountedRef.current = false;
    };
  }, [pulseValue, rotateValue]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    timer = setInterval(() => {
      setMessage((prev) => {
        const currentIndex = DEFAULT_MESSAGES.findIndex(
          (item) => item === prev,
        );
        const nextIndex =
          currentIndex < 0 ? 1 : (currentIndex + 1) % DEFAULT_MESSAGES.length;

        return DEFAULT_MESSAGES[nextIndex];
      });
    }, 1700);

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, []);

  useEffect(() => {
    const startAnalysis = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("user_id");

        const userId = params.userId ?? storedUserId ?? "";
        const tripId = params.tripId ?? 1;

        const collectedPlaces: RecommendedPlace[] = [];

        await streamRecommendations(
          {
            userId,
            tripId,
            limit: params.limit ?? 5,
            reason: params.reason ?? "WEATHER_ALTERNATIVE",
            transportMode: params.transportMode ?? "WALK",
          },
          {
            onProgress: (nextMessage) => {
              if (!mountedRef.current) return;

              setProgressText(nextMessage || "AI가 추천 장소를 분석 중이에요");
            },
            onPlace: (place) => {
              if (!mountedRef.current) return;

              collectedPlaces.push(place);

              setPlaces((prev) => {
                const exists = prev.some(
                  (item) => String(item.placeId) === String(place.placeId),
                );

                if (exists) return prev;

                return [...prev, place];
              });
            },
            onDone: () => {
              if (!mountedRef.current) return;

              navigation.replace("RecommendationResult", {
                placesJson: JSON.stringify(collectedPlaces),
                fromAIAnalysis: true,
              });
            },
            onError: (error) => {
              console.log("[AIAnalysisLoading] stream error:", error);

              if (!mountedRef.current) return;

              setErrorMessage("추천 분석 중 문제가 발생했어요.");

              setTimeout(() => {
                navigation.replace("RecommendationResult", {
                  placesJson: JSON.stringify(collectedPlaces),
                  fromAIAnalysis: true,
                  hasError: true,
                });
              }, 900);
            },
          },
        );
      } catch (error) {
        console.log("[AIAnalysisLoading] failed:", error);

        if (!mountedRef.current) return;

        setErrorMessage("AI 추천을 불러오지 못했어요.");

        setTimeout(() => {
          navigation.replace("RecommendationResult", {
            placesJson: JSON.stringify([]),
            fromAIAnalysis: true,
            hasError: true,
          });
        }, 900);
      }
    };

    startAnalysis();
  }, [
    navigation,
    params.limit,
    params.reason,
    params.transportMode,
    params.tripId,
    params.userId,
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topSection}>
          <Text style={styles.kicker}>AI Alternative</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.visualSection}>
          <Animated.View
            style={[
              styles.outerCircle,
              {
                transform: [{ scale: animatedPulse }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.orbitCircle,
                {
                  transform: [{ rotate: animatedRotate }],
                },
              ]}
            >
              <View style={styles.orbitDot} />
            </Animated.View>

            <View style={styles.innerCircle}>
              <Ionicons name="sparkles" size={42} color="#2158E8" />
            </View>
          </Animated.View>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <ActivityIndicator size="small" color="#2158E8" />
            <Text style={styles.statusTitle}>{progressText}</Text>
          </View>

          <Text style={styles.statusMessage}>{message}</Text>

          <View style={styles.stepRow}>
            {DEFAULT_MESSAGES.map((_, index) => (
              <View
                key={`step-${index}`}
                style={[
                  styles.stepDot,
                  index <= messageIndex && styles.activeStepDot,
                ]}
              />
            ))}
          </View>

          <Text style={styles.countText}>
            현재 {places.length}개의 후보 장소를 찾았어요
          </Text>
        </View>

        {errorMessage ?
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={17} color="#EF4444" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        : null}

        <Text style={styles.footerText}>
          잠시만 기다려주세요. 추천이 완료되면 결과 화면으로 이동해요.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F8FC",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 30,
  },
  topSection: {
    alignItems: "center",
  },
  kicker: {
    color: "#2158E8",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  title: {
    color: "#101828",
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 33,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 12,
    color: "#667085",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
    textAlign: "center",
  },
  visualSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  outerCircle: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "#EAF1FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  orbitCircle: {
    position: "absolute",
    width: 178,
    height: 178,
    borderRadius: 89,
    borderWidth: 1.5,
    borderColor: "#BFD3FF",
  },
  orbitDot: {
    position: "absolute",
    top: 7,
    left: 79,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#2158E8",
  },
  innerCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  statusCard: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderWidth: 1,
    borderColor: "#E4EAF4",
    shadowColor: "#1E293B",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusTitle: {
    flex: 1,
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "900",
  },
  statusMessage: {
    marginTop: 14,
    color: "#526174",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
  },
  stepRow: {
    marginTop: 18,
    flexDirection: "row",
    gap: 8,
  },
  stepDot: {
    flex: 1,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
  },
  activeStepDot: {
    backgroundColor: "#2158E8",
  },
  countText: {
    marginTop: 14,
    color: "#7C8BA1",
    fontSize: 12,
    fontWeight: "700",
  },
  errorBox: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "800",
  },
  footerText: {
    marginTop: 18,
    color: "#8A97AA",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
