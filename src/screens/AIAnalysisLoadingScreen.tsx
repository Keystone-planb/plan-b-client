import React from "react";
import {
  Animated,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "./AIAnalysisLoadingScreen.styles";
import { useAIAnalysisLoadingFlow } from "../hooks/recommendation/useAIAnalysisLoadingFlow";
import { useAIAnalysisLoadingAnimations } from "../hooks/recommendation/useAIAnalysisLoadingAnimations";
import {
  AI_ANALYSIS_DOT_COUNT as DOT_COUNT,
  AI_ANALYSIS_LOADING_STEPS as LOADING_STEPS,
  EmptyResultImage,
  type AIAnalysisLoadingScreenProps as Props,
} from "../utils/recommendation/aiAnalysisLoadingConfig";


export default function AIAnalysisLoadingScreen({ navigation, route }: Props) {
  const params = route?.params ?? {};

  const {
    progress,
    displayStepIndex,
    activeDotIndex,
    streamMessage,
    receivedPlaceCount,
    errorMessage,
    handleRetry,
    handleGoBack,
  } = useAIAnalysisLoadingFlow({
    navigation,
    params,
  });

  const {
    iconFloat,
    iconScale,
    progressWidth,
  } = useAIAnalysisLoadingAnimations(
    progress,
  );

  const progressStepIndex = Math.min(
    Math.floor(
      (progress / 100) *
        LOADING_STEPS.length,
    ),
    LOADING_STEPS.length - 1,
  );

  const currentStepIndex =
    progress >= 94
      ? displayStepIndex
      : progressStepIndex;

  const currentStep =
    LOADING_STEPS[currentStepIndex];

  const placeCountText =
    receivedPlaceCount > 0 ?
      `현재 ${receivedPlaceCount}개의 추천 후보를 분석했어요`
    : "";

  const descriptionText =
    errorMessage || streamMessage || currentStep.description;

  const isEmptyResult =
    errorMessage.includes("현재 조건으로는 추천할 장소가 없어요") ||
    errorMessage.includes("조건에 맞는 장소를 찾지 못했습니다");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.logoText}>Plan.B</Text>
        </View>

        {isEmptyResult ? (
          <View style={styles.emptyResultContent}>
            <Image
              source={EmptyResultImage}
              style={styles.emptyResultImage}
              resizeMode="contain"
            />

            <Text style={styles.emptyResultTitle}>
              추천 결과를 찾지 못했어요
            </Text>

            <Text style={styles.emptyResultDescription}>
              현재 조건으로는 추천할 장소가 없어요.
            </Text>

            <TouchableOpacity
              style={styles.resetConditionButton}
              activeOpacity={0.85}
              onPress={handleGoBack}
            >
              <Text style={styles.resetConditionButtonText}>
                조건 다시 설정하기
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.centerContent}>
            <View style={styles.progressBox}>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[styles.progressFill, { width: progressWidth }]}
                />
              </View>

              <Text style={styles.progressText}>
                {Math.round(progress)}%
              </Text>
            </View>

            <Animated.View
              style={[
                styles.iconWrapper,
                {
                  transform: [
                    { translateY: iconFloat },
                    { scale: iconScale },
                  ],
                },
              ]}
            >
              <View style={styles.iconGlow} />

              <Image
                source={currentStep.icon}
                style={styles.stepIcon}
                resizeMode="contain"
              />
            </Animated.View>

            <Text style={styles.title}>
              {errorMessage
                ? "추천 요청을 완료하지 못했어요"
                : currentStep.title}
            </Text>

            <Text
              style={[
                styles.description,
                errorMessage ? styles.errorDescription : null,
              ]}
            >
              {descriptionText}
            </Text>

            {!errorMessage && placeCountText ? (
              <Text style={styles.placeCountText}>
                {placeCountText}
              </Text>
            ) : null}

            {errorMessage ? (
              <View style={styles.errorButtonRow}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.secondaryButton,
                  ]}
                  activeOpacity={0.85}
                  onPress={handleGoBack}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      styles.secondaryText,
                    ]}
                  >
                    이전으로
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.primaryButton,
                  ]}
                  activeOpacity={0.85}
                  onPress={handleRetry}
                >
                  <Text style={styles.actionButtonText}>
                    다시 시도
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.tipPill}>
                <Text style={styles.tipPillEmoji}>💡</Text>
                <Text style={styles.tipPillText}>
                  {currentStep.tip}
                </Text>
              </View>
            )}
          </View>
        )}

        {!errorMessage && !isEmptyResult ?
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
        : null}

        {isEmptyResult ? (
          <View style={styles.emptyTipCard}>
            <Text style={styles.emptyTipLabel}>TIP</Text>

            <Text style={styles.emptyTipTitle}>
              PLAN.B의 제안
            </Text>

            <Text style={styles.emptyTipDescription}>
              조건을 조금 완화하면 더 많은{"\n"}
              추천 결과를 확인할 수 있어요.
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.tipCard,
              errorMessage ? styles.errorCard : null,
            ]}
          >
            <View style={styles.tipCardHeader}>
              <Text
                style={[
                  styles.tipCardLabel,
                  errorMessage
                    ? styles.errorTipCardLabel
                    : null,
                ]}
              >
                {errorMessage ? "TIP" : "AI ANALYSIS"}
              </Text>
            </View>

            <Text style={styles.tipCardTitle}>
              {errorMessage
                ? "PLAN.B의 제안"
                : currentStep.detailTitle}
            </Text>

            <Text style={styles.tipCardDescription}>
              {errorMessage
                ? "잠시 후 다시 시도하거나 이전 화면에서 조건을 확인해주세요."
                : currentStep.detailDescription}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
