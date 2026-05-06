import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { reportPreferenceFeedback } from "../../api/preferences/preferences";
import type { RecommendedPlace } from "../types/recommendation";

type Props = {
  navigation: any;
  route: {
    params?: {
      placesJson?: string;
      fromAIAnalysis?: boolean;
      hasError?: boolean;
      title?: string;
    };
  };
};

export default function RecommendationResultScreen({
  navigation,
  route,
}: Props) {
  const [selectedPlaceId, setSelectedPlaceId] = useState<
    string | number | null
  >(null);
  const [submittingPlaceId, setSubmittingPlaceId] = useState<
    string | number | null
  >(null);

  const params = route?.params ?? {};

  const places = useMemo<RecommendedPlace[]>(() => {
    try {
      if (!params.placesJson) return [];

      const parsed = JSON.parse(params.placesJson);

      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.log("[RecommendationResult] places parse failed:", error);
      return [];
    }
  }, [params.placesJson]);

  const shownPlaceIds = useMemo(() => {
    return places
      .map((place) => place.placeId)
      .filter((id) => id !== undefined && id !== null && id !== "");
  }, [places]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("MainTabs");
  };

  const handleSelectPlace = async (place: RecommendedPlace) => {
    try {
      setSubmittingPlaceId(place.placeId);

      const storedUserId = await AsyncStorage.getItem("user_id");

      if (storedUserId) {
        await reportPreferenceFeedback({
          userId: storedUserId,
          shownPlaceIds,
          selectedPlaceId: place.placeId,
        });
      }

      setSelectedPlaceId(place.placeId);

      Alert.alert("선택 완료", `${place.name} 장소를 선택했어요.`);
    } catch (error) {
      console.log("[RecommendationResult] select failed:", error);

      setSelectedPlaceId(place.placeId);

      Alert.alert(
        "선택 완료",
        "피드백 저장은 실패했지만 장소 선택은 완료 처리했어요.",
      );
    } finally {
      setSubmittingPlaceId(null);
    }
  };

  const handleDone = () => {
    navigation.navigate("MainTabs");
  };

  const title = params.title ?? "AI 추천 결과";
  const hasPlaces = places.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.75}
          onPress={handleBack}
        >
          <Ionicons name="chevron-back" size={24} color="#2B3445" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>
            지금 일정에 어울리는 장소를 골라봤어요
          </Text>
        </View>

        <View style={styles.headerRightSpace} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="sparkles" size={24} color="#2158E8" />
          </View>

          <View style={styles.heroTextBox}>
            <Text style={styles.heroTitle}>
              {hasPlaces ?
                `${places.length}개의 대안 장소를 찾았어요`
              : "추천 결과를 불러오지 못했어요"}
            </Text>
            <Text style={styles.heroSubtitle}>
              {hasPlaces ?
                "장소별 이유와 정보를 확인하고 가장 마음에 드는 장소를 선택해보세요."
              : "잠시 후 다시 시도하거나 다른 조건으로 추천을 받아보세요."}
            </Text>
          </View>
        </View>

        {params.hasError ?
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle-outline" size={18} color="#F97316" />
            <Text style={styles.warningText}>
              추천 스트림 연결이 불안정해 일부 결과만 표시될 수 있어요.
            </Text>
          </View>
        : null}

        {hasPlaces ?
          <View style={styles.resultList}>
            {places.map((place, index) => {
              const placeId = place.placeId ?? `place-${index}`;
              const isSelected = String(selectedPlaceId) === String(placeId);
              const isSubmitting =
                String(submittingPlaceId) === String(placeId);

              return (
                <View
                  key={`recommendation-${String(placeId)}-${index}`}
                  style={[styles.placeCard, isSelected && styles.selectedCard]}
                >
                  <View style={styles.placeTopRow}>
                    <View style={styles.indexBadge}>
                      <Text style={styles.indexText}>{index + 1}</Text>
                    </View>

                    <View style={styles.placeTitleBox}>
                      <Text style={styles.placeName}>{place.name}</Text>

                      {place.category ?
                        <Text style={styles.placeCategory}>
                          {place.category}
                        </Text>
                      : null}
                    </View>

                    {typeof place.rating === "number" ?
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={styles.ratingText}>
                          {place.rating.toFixed(1)}
                        </Text>
                      </View>
                    : null}
                  </View>

                  {place.address ?
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="location-outline"
                        size={15}
                        color="#8090A6"
                      />
                      <Text style={styles.addressText}>{place.address}</Text>
                    </View>
                  : null}

                  {place.reason ?
                    <View style={styles.reasonBox}>
                      <Text style={styles.reasonLabel}>AI 추천 이유</Text>
                      <Text style={styles.reasonText}>{place.reason}</Text>
                    </View>
                  : null}

                  <TouchableOpacity
                    style={[
                      styles.selectButton,
                      isSelected && styles.selectedButton,
                    ]}
                    activeOpacity={0.85}
                    disabled={isSubmitting || isSelected}
                    onPress={() => handleSelectPlace(place)}
                  >
                    {isSubmitting ?
                      <ActivityIndicator size="small" color="#2158E8" />
                    : <>
                        <Text
                          style={[
                            styles.selectButtonText,
                            isSelected && styles.selectedButtonText,
                          ]}
                        >
                          {isSelected ? "선택 완료" : "이 장소 선택"}
                        </Text>
                        {!isSelected ?
                          <Ionicons
                            name="arrow-forward"
                            size={15}
                            color="#2158E8"
                          />
                        : null}
                      </>
                    }
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        : <View style={styles.emptyBox}>
            <Ionicons name="cloud-offline-outline" size={42} color="#A0AEC0" />
            <Text style={styles.emptyTitle}>추천 결과가 없어요</Text>
            <Text style={styles.emptyText}>
              네트워크 상태를 확인한 뒤 다시 추천을 받아주세요.
            </Text>
          </View>
        }
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.doneButton}
          activeOpacity={0.85}
          onPress={handleDone}
        >
          <Text style={styles.doneButtonText}>완료</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F8FC",
  },
  header: {
    height: 74,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F8FC",
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E4EAF4",
  },
  headerTitleBox: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: "#101828",
    fontSize: 18,
    fontWeight: "900",
  },
  headerSubtitle: {
    marginTop: 3,
    color: "#8A97AA",
    fontSize: 11,
    fontWeight: "700",
  },
  headerRightSpace: {
    width: 42,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 110,
  },
  heroCard: {
    marginTop: 8,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    padding: 18,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E4EAF4",
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EAF1FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  heroTextBox: {
    flex: 1,
  },
  heroTitle: {
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },
  heroSubtitle: {
    marginTop: 6,
    color: "#667085",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  warningBox: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    padding: 13,
    flexDirection: "row",
    gap: 8,
  },
  warningText: {
    flex: 1,
    color: "#C2410C",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
  resultList: {
    marginTop: 16,
    gap: 14,
  },
  placeCard: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E8F2",
    padding: 16,
    shadowColor: "#1E293B",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  selectedCard: {
    borderColor: "#2158E8",
    backgroundColor: "#F5F8FF",
  },
  placeTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  indexBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  indexText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  placeTitleBox: {
    flex: 1,
  },
  placeName: {
    color: "#101828",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 21,
  },
  placeCategory: {
    marginTop: 4,
    color: "#2158E8",
    fontSize: 12,
    fontWeight: "800",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  ratingText: {
    color: "#B45309",
    fontSize: 12,
    fontWeight: "900",
  },
  infoRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  addressText: {
    flex: 1,
    color: "#667085",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  reasonBox: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    padding: 13,
  },
  reasonLabel: {
    color: "#2158E8",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 6,
  },
  reasonText: {
    color: "#344054",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  selectButton: {
    marginTop: 14,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#EAF1FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  selectedButton: {
    backgroundColor: "#2158E8",
  },
  selectButtonText: {
    color: "#2158E8",
    fontSize: 14,
    fontWeight: "900",
  },
  selectedButtonText: {
    color: "#FFFFFF",
  },
  emptyBox: {
    marginTop: 80,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 16,
    color: "#1E293B",
    fontSize: 18,
    fontWeight: "900",
  },
  emptyText: {
    marginTop: 8,
    color: "#8A97AA",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 22,
    backgroundColor: "rgba(246, 248, 252, 0.96)",
  },
  doneButton: {
    height: 52,
    borderRadius: 18,
    backgroundColor: "#273142",
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});
