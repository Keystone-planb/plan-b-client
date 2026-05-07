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
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { reportPreferenceFeedback } from "../../api/preferences/preferences";
import type { RecommendedPlace } from "../types/recommendation";

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

type RootStackParamList = {
  Main: undefined;
  RecommendationResult: {
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

    placesJson?: string;
    fromAIAnalysis?: boolean;
    hasError?: boolean;
    title?: string;
  };
};

type Props = NativeStackScreenProps<RootStackParamList, "RecommendationResult">;

type DisplayPlace = RecommendedPlace & {
  placeId?: string | number;
  name: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  reason?: string;
  sourceSummary?: {
    naver?: string;
    instagram?: string;
    google?: string;
  };
};

const MOCK_RECOMMENDATIONS: DisplayPlace[] = Array.from({ length: 5 }).map(
  (_, index) => ({
    placeId: `mock-everland-${index + 1}`,
    name: "에버랜드",
    category: "아웃도어",
    rating: 4.58,
    reviewCount: 2239,
    address: "경기도 용인시 처인구 포곡읍 에버랜드로 199",
    phone: "053-123-1234",
    website: "www.planb.com",
    openingHours: "10:00 - 20:00",
    reason: "아이들과 함께 가기 너무 좋아요! 구경거리도 많아서 좋아요",
    sourceSummary: {
      naver: "아이들과 함께 가기 너무 좋아요! 구경거리도 많아서 좋아요",
      instagram: "아이들과 함께 가기 너무 좋아요! 구경거리도 많아서 좋아요",
      google: "아이들과 함께 가기 너무 좋아요! 구경거리도 많아서 좋아요",
    },
  }),
);

const formatDateRange = (startDate?: string, endDate?: string) => {
  const start = startDate?.replace(/-/g, ".");
  const end = endDate?.replace(/-/g, ".");

  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;

  return "10:00 - 12:00";
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
  const [expandedPlaceId, setExpandedPlaceId] = useState<
    string | number | null
  >(null);

  const params = route.params ?? {};

  const parsedPlaces = useMemo<DisplayPlace[]>(() => {
    try {
      if (!params.placesJson) return [];

      const parsed = JSON.parse(params.placesJson);

      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.log("[RecommendationResult] places parse failed:", error);
      return [];
    }
  }, [params.placesJson]);

  const places = parsedPlaces.length > 0 ? parsedPlaces : MOCK_RECOMMENDATIONS;

  const shownPlaceIds = useMemo(() => {
    return places
      .map((place, index) => place.placeId ?? `place-${index}`)
      .filter((id) => id !== undefined && id !== null && id !== "");
  }, [places]);

  const targetPlace = params.targetPlace;
  const currentPlaceName = targetPlace?.name || "강릉역";
  const currentPlaceAddress =
    targetPlace?.address || params.location || "강원도 강릉시";
  const currentPlaceTime =
    targetPlace?.time || formatDateRange(params.startDate, params.endDate);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("Main");
  };

  const handleToggleDetail = (placeId: string | number) => {
    setExpandedPlaceId((prev) =>
      String(prev) === String(placeId) ? null : placeId,
    );
  };

  const handleSelectPlace = async (place: DisplayPlace) => {
    const placeId = place.placeId ?? place.name;

    try {
      setSubmittingPlaceId(placeId);

      const storedUserId = await AsyncStorage.getItem("user_id");

      if (storedUserId) {
        await reportPreferenceFeedback({
          userId: storedUserId,
          shownPlaceIds,
          selectedPlaceId: placeId,
        });
      }

      setSelectedPlaceId(placeId);

      Alert.alert("선택 완료", `${place.name} 장소를 선택했어요.`);
    } catch (error) {
      console.log("[RecommendationResult] select failed:", error);

      setSelectedPlaceId(placeId);

      Alert.alert(
        "선택 완료",
        "피드백 저장은 실패했지만 장소 선택은 완료 처리했어요.",
      );
    } finally {
      setSubmittingPlaceId(null);
    }
  };

  const title = params.title ?? "AI 대안 추천";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.75}
          onPress={handleBack}
        >
          <Ionicons name="chevron-back" size={26} color="#6F7F95" />
        </TouchableOpacity>

        <Text style={styles.logoText}>Plan.B</Text>

        <View style={styles.headerRightSpace} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>{title}</Text>
          <Text style={styles.screenSubtitle}>
            거리와 리뷰를 기반으로 추천된 top5예요
          </Text>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>기존 일정</Text>

          <View style={styles.currentScheduleCard}>
            <View style={styles.currentInfoBox}>
              <Text style={styles.currentPlaceName}>{currentPlaceName}</Text>
              <Text style={styles.currentAddress}>{currentPlaceAddress}</Text>

              <View style={styles.currentTimeRow}>
                <Ionicons name="time-outline" size={14} color="#7C8CA3" />
                <Text style={styles.currentTimeText}>{currentPlaceTime}</Text>
              </View>
            </View>

            <View style={styles.badge}>
              <Ionicons name="rainy-outline" size={12} color="#FFFFFF" />
              <Text style={styles.badgeText}>비예보</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>추천 대안</Text>

          <View style={styles.resultList}>
            {places.map((place, index) => {
              const placeId = place.placeId ?? `place-${index}`;
              const isExpanded = String(expandedPlaceId) === String(placeId);
              const isSelected = String(selectedPlaceId) === String(placeId);
              const isSubmitting =
                String(submittingPlaceId) === String(placeId);

              const reviewCount =
                typeof place.reviewCount === "number" ?
                  place.reviewCount.toLocaleString()
                : "2,239";

              return (
                <View
                  key={`recommendation-${String(placeId)}-${index}`}
                  style={[
                    styles.placeCard,
                    isExpanded && styles.expandedPlaceCard,
                    isSelected && styles.selectedCard,
                  ]}
                >
                  <View style={styles.placeTopRow}>
                    <View style={styles.thumbnailCircle}>
                      <Text style={styles.thumbnailEmoji}>🎡</Text>
                    </View>

                    <View style={styles.placeMainInfo}>
                      <View style={styles.placeNameRow}>
                        <Text style={styles.placeName} numberOfLines={1}>
                          {place.name || "에버랜드"}
                        </Text>

                        <View style={styles.categoryPill}>
                          <Text style={styles.categoryText}>
                            {place.category || "아웃도어"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={14} color="#FFD400" />
                        <Text style={styles.ratingText}>
                          {typeof place.rating === "number" ?
                            place.rating.toFixed(2)
                          : "4.58"}
                        </Text>
                        <Text style={styles.reviewText}>({reviewCount})</Text>
                      </View>

                      <View style={styles.infoLine}>
                        <Ionicons
                          name="location-outline"
                          size={18}
                          color="#8EA0B7"
                        />
                        <Text style={styles.infoText} numberOfLines={1}>
                          {place.address ||
                            "경기도 용인시 처인구 포곡읍 에버랜드로 199"}
                        </Text>
                      </View>

                      {isExpanded ?
                        <>
                          <View style={styles.infoLine}>
                            <Ionicons
                              name="call-outline"
                              size={18}
                              color="#8EA0B7"
                            />
                            <Text style={styles.infoText}>
                              {place.phone || "053-123-1234"}
                            </Text>
                          </View>

                          <View style={styles.infoLine}>
                            <Ionicons
                              name="globe-outline"
                              size={18}
                              color="#8EA0B7"
                            />
                            <Text style={styles.infoText}>
                              {place.website || "www.planb.com"}
                            </Text>
                          </View>

                          <View style={styles.infoLine}>
                            <Ionicons
                              name="storefront-outline"
                              size={18}
                              color="#8EA0B7"
                            />
                            <Text style={styles.infoText}>
                              {place.openingHours || "10:00 - 20:00"}
                            </Text>
                          </View>
                        </>
                      : null}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.aiSummaryBox,
                      isExpanded && styles.expandedAiSummaryBox,
                    ]}
                  >
                    <View style={styles.aiBadge}>
                      <Text style={styles.aiBadgeText}>AI</Text>
                    </View>

                    <Text style={styles.aiSummaryIcon}>📊</Text>

                    <Text style={styles.aiSummaryText}>
                      {place.reason ||
                        "아이들과 함께 가기 너무 좋아요! 구경거리도 많아서 좋아요"}
                    </Text>
                  </View>

                  {isExpanded ?
                    <View style={styles.detailBox}>
                      <View style={styles.verticalLine} />

                      <View style={styles.sourceList}>
                        <View style={styles.sourceCard}>
                          <View style={[styles.sourceIconBox, styles.naverBox]}>
                            <Text style={styles.naverIconText}>N</Text>
                          </View>

                          <Text style={styles.sourceText}>
                            {place.sourceSummary?.naver ||
                              "아이들과 함께 가기 너무 좋아요! 구경거리도 많아서 좋아요"}
                          </Text>
                        </View>

                        <View style={styles.sourceCard}>
                          <View
                            style={[styles.sourceIconBox, styles.instagramBox]}
                          >
                            <Text style={styles.instagramIconText}>◎</Text>
                          </View>

                          <Text style={styles.sourceText}>
                            {place.sourceSummary?.instagram ||
                              "아이들과 함께 가기 너무 좋아요! 구경거리도 많아서 좋아요"}
                          </Text>
                        </View>

                        <View style={styles.sourceCard}>
                          <View
                            style={[styles.sourceIconBox, styles.googleBox]}
                          >
                            <Text style={styles.googleIconText}>G</Text>
                          </View>

                          <Text style={styles.sourceText}>
                            {place.sourceSummary?.google ||
                              "아이들과 함께 가기 너무 좋아요! 구경거리도 많아서 좋아요"}
                          </Text>
                        </View>
                      </View>

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
                        : <Text
                            style={[
                              styles.selectButtonText,
                              isSelected && styles.selectedButtonText,
                            ]}
                          >
                            {isSelected ? "선택 완료" : "이 장소 선택"}
                          </Text>
                        }
                      </TouchableOpacity>
                    </View>
                  : null}

                  <TouchableOpacity
                    style={styles.detailButton}
                    activeOpacity={0.8}
                    onPress={() => handleToggleDetail(placeId)}
                  >
                    <Text style={styles.detailButtonText}>
                      {isExpanded ? "간략히" : "자세히"}
                    </Text>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={16}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  header: {
    height: 106,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  logoText: {
    flex: 1,
    color: "#1C2534",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
    textAlign: "center",
  },

  headerRightSpace: {
    width: 42,
  },

  scroll: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  scrollContent: {
    paddingBottom: 42,
  },

  titleSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 30,
    paddingBottom: 24,
  },

  screenTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginBottom: 8,
  },

  screenSubtitle: {
    color: "#9AA8BA",
    fontSize: 14,
    fontWeight: "700",
  },

  sectionBlock: {
    paddingHorizontal: 18,
    paddingTop: 24,
  },

  sectionTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 14,
    marginLeft: 8,
  },

  currentScheduleCard: {
    minHeight: 84,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE5F0",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  currentInfoBox: {
    flex: 1,
  },

  currentPlaceName: {
    color: "#1C2534",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },

  currentAddress: {
    color: "#7C8CA3",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },

  currentTimeRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  currentTimeText: {
    color: "#7C8CA3",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 5,
  },

  badge: {
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2158E8",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  resultList: {
    gap: 16,
  },

  placeCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE5F0",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
  },

  expandedPlaceCard: {
    paddingTop: 70,
    paddingBottom: 26,
    borderRadius: 24,
    borderColor: "#DDE5F0",
  },

  selectedCard: {
    borderColor: "#2158E8",
    backgroundColor: "#F8FBFF",
  },

  placeTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  thumbnailCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFD0F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  thumbnailEmoji: {
    fontSize: 29,
  },

  placeMainInfo: {
    flex: 1,
  },

  placeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  placeName: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "900",
    marginRight: 8,
    maxWidth: 150,
  },

  categoryPill: {
    borderRadius: 8,
    backgroundColor: "#F3F6FA",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  categoryText: {
    color: "#7C8CA3",
    fontSize: 11,
    fontWeight: "800",
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  ratingText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 3,
  },

  reviewText: {
    color: "#7C8CA3",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 3,
  },

  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  infoText: {
    flex: 1,
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },

  aiSummaryBox: {
    position: "relative",
    marginTop: 20,
    marginLeft: 28,
    width: "78%",
    minHeight: 58,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#C7DCFF",
    backgroundColor: "#EEF6FF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  expandedAiSummaryBox: {
    width: "78%",
    marginLeft: 74,
    marginTop: 30,
  },

  aiBadge: {
    position: "absolute",
    right: -13,
    top: -13,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#5B3DFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#5B3DFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 6,
  },

  aiBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  aiSummaryIcon: {
    fontSize: 16,
    marginRight: 7,
    marginTop: 1,
  },

  aiSummaryText: {
    flex: 1,
    color: "#2158E8",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },

  detailButton: {
    marginTop: 22,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F5F7FA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  detailButtonText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "900",
  },

  detailBox: {
    marginTop: 26,
    paddingLeft: 58,
    position: "relative",
  },

  verticalLine: {
    position: "absolute",
    left: 45,
    top: 0,
    bottom: 52,
    width: 2,
    backgroundColor: "#E1E8F2",
  },

  sourceList: {
    gap: 12,
  },

  sourceCard: {
    minHeight: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDE5F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  sourceIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  naverBox: {
    backgroundColor: "#03C75A",
  },

  instagramBox: {
    backgroundColor: "#F35A9C",
  },

  googleBox: {
    backgroundColor: "#FFFFFF",
  },

  naverIconText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  instagramIconText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  googleIconText: {
    color: "#4285F4",
    fontSize: 17,
    fontWeight: "900",
  },

  sourceText: {
    flex: 1,
    color: "#8A97AA",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },

  selectButton: {
    marginTop: 18,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EAF1FF",
    alignItems: "center",
    justifyContent: "center",
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

  warningBox: {
    marginHorizontal: 18,
    marginTop: 18,
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
});
