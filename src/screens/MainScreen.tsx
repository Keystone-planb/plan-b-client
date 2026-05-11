import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Swipeable } from "react-native-gesture-handler";

import RadialBackground from "../components/RadialBackground";
import WeatherNotificationCard from "../components/notifications/WeatherNotificationCard";
import { removePlanASchedule } from "../api/schedules/planAStorage";
import {
  deleteTrip,
  getTripDetail,
  getTrips,
  TripSummary,
} from "../../api/schedules/server";
import {
  dismissNotification,
  getWeatherNotifications,
} from "../../api/notifications/notifications";
import { seedTestWeatherNotification } from "../../api/notifications/testSeed";
import type { WeatherNotification } from "../types/notification";

type Props = {
  navigation: any;
  route?: {
    params?: {
      refreshSchedules?: boolean;
      savedScheduleId?: string;
    };
  };
};

type StoredSchedule = {
  id?: string;
  scheduleId?: string;
  tripId?: number | string;
  serverTripId?: number | string;
  tripName?: string;
  title?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  transportMode?: "WALK" | "TRANSIT" | "CAR";
  transportLabel?: string;
  days?: unknown[];
  updatedAt?: string;
  createdAt?: string;
};

const PLAN_A_STORAGE_PREFIX = "plan_a_schedule:";

const getTodayDisplayText = () => {
  const today = new Date();

  return `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(
    2,
    "0",
  )}.${String(today.getDate()).padStart(2, "0")}`;
};

const formatDisplayDate = (value?: string) => {
  if (!value) return "";
  return value.replace(/-/g, ".");
};

const getScheduleId = (schedule: StoredSchedule) => {
  return schedule.scheduleId || schedule.id || "";
};

const getScheduleTitle = (schedule: StoredSchedule) => {
  return (
    schedule.tripName || schedule.title || schedule.name || "이름 없는 여행"
  );
};

const getScheduleDate = (schedule: StoredSchedule) => {
  const startDate = formatDisplayDate(schedule.startDate);
  const endDate = formatDisplayDate(schedule.endDate);

  if (startDate && endDate) {
    return `${startDate} - ${endDate}`;
  }

  if (startDate) return startDate;
  if (endDate) return endDate;

  return "날짜 미정";
};

const getScheduleLocation = (schedule: StoredSchedule) => {
  return schedule.location || "장소 미정";
};

const getWeatherStatusText = (notifications: WeatherNotification[]) => {
  return `날씨 알림 ${notifications.length}건`;
};

const getWeatherStatusEmoji = (notifications: WeatherNotification[]) => {
  if (notifications.length === 0) {
    return "☁️";
  }

  const weatherType = String(notifications[0]?.weatherType ?? "").toUpperCase();

  if (weatherType === "RAIN") return "🌧️";
  if (weatherType === "SNOW") return "❄️";
  if (weatherType === "HEAT") return "☀️";
  if (weatherType === "COLD") return "🥶";
  if (weatherType === "WIND") return "🌬️";
  if (weatherType === "STORM") return "⛈️";

  return "☁️";
};

const getCurrentDayLabel = (
  startDate?: string,
  endDate?: string,
) => {
  if (!startDate) {
    return "Day 1";
  }

  const normalizeDate = (value: string) => {
    const normalized = value.replace(/\./g, "-");

    const parsed = new Date(normalized);

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    parsed.setHours(0, 0, 0, 0);

    return parsed;
  };

  const tripStartDate = normalizeDate(startDate);

  if (!tripStartDate) {
    return "Day 1";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - tripStartDate.getTime();

  const diffDays = Math.floor(
    diffMs / (1000 * 60 * 60 * 24),
  );

  const currentDay = Math.max(1, diffDays + 1);

  if (endDate) {
    const tripEndDate = normalizeDate(endDate);

    if (tripEndDate) {
      const totalDiffMs =
        tripEndDate.getTime() - tripStartDate.getTime();

      const totalDays =
        Math.floor(
          totalDiffMs / (1000 * 60 * 60 * 24),
        ) + 1;

      return `Day ${Math.min(currentDay, totalDays)}`;
    }
  }

  return `Day ${currentDay}`;
};

const getFirstPlaceName = (schedule?: StoredSchedule) => {
  const days = Array.isArray(schedule?.days) ? schedule?.days : [];

  for (const day of days) {
    if (!day || typeof day !== "object") continue;

    const places = (day as { places?: unknown }).places;

    if (!Array.isArray(places)) continue;

    const firstPlace = places.find(
      (place) =>
        place &&
        typeof place === "object" &&
        typeof (place as { name?: unknown }).name === "string",
    ) as { name?: string } | undefined;

    if (firstPlace?.name) {
      return firstPlace.name;
    }
  }

  return "";
};

const getPlaceCount = (schedule?: StoredSchedule) => {
  const days = Array.isArray(schedule?.days) ? schedule?.days : [];

  return days.reduce<number>((count, day) => {
    if (!day || typeof day !== "object") return count;

    const places = (day as { places?: unknown }).places;

    return count + (Array.isArray(places) ? places.length : 0);
  }, 0);
};

const isRecord = (value: unknown): value is Record<string, any> => {
  return Boolean(value) && typeof value === "object";
};

const getFirstServerPlaceFromSchedule = (schedule?: StoredSchedule) => {
  const days = Array.isArray(schedule?.days) ? schedule?.days : [];

  for (const day of days) {
    if (!isRecord(day) || !Array.isArray(day.places)) continue;

    for (const place of day.places) {
      if (!isRecord(place)) continue;

      const tripPlaceId = place.tripPlaceId ?? place.serverTripPlaceId;
      const googlePlaceId = place.googlePlaceId ?? place.placeId;

      if (!tripPlaceId || String(tripPlaceId).startsWith("ChIJ")) {
        continue;
      }

      return {
        tripPlaceId,
        googlePlaceId,
        name: place.name,
        category: place.category,
        latitude: place.latitude,
        longitude: place.longitude,
      };
    }
  }

  return null;
};

const normalizeDateForCompare = (value?: string) => {
  if (!value) return null;

  const parsed = new Date(value.replace(/\./g, "-"));

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);

  return parsed;
};

const isPastTripSummary = (trip: TripSummary) => {
  if (trip.status === "PAST") {
    return true;
  }

  const endDate = normalizeDateForCompare(trip.endDate);

  if (!endDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return endDate.getTime() < today.getTime();
};

const sortMainTrips = (a: StoredSchedule, b: StoredSchedule) => {
  const aStart = normalizeDateForCompare(a.startDate)?.getTime() ?? 0;
  const bStart = normalizeDateForCompare(b.startDate)?.getTime() ?? 0;

  return aStart - bStart;
};

const isPastSchedule = (schedule: StoredSchedule) => {
  const endDate = normalizeDateForCompare(schedule.endDate);

  if (!endDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return endDate.getTime() < today.getTime();
};

const isOngoingSchedule = (schedule: StoredSchedule) => {
  const startDate = normalizeDateForCompare(schedule.startDate);
  const endDate = normalizeDateForCompare(schedule.endDate);

  if (!startDate || !endDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return startDate.getTime() <= today.getTime() && today.getTime() <= endDate.getTime();
};

const sortSchedulesByStartDate = (a: StoredSchedule, b: StoredSchedule) => {
  const aTime = normalizeDateForCompare(a.startDate)?.getTime() ?? 0;
  const bTime = normalizeDateForCompare(b.startDate)?.getTime() ?? 0;

  return aTime - bTime;
};

const convertTripSummaryToStoredSchedule = (
  trip: TripSummary,
): StoredSchedule => {
  return {
    id: String(trip.tripId),
    scheduleId: String(trip.tripId),
    tripId: trip.tripId,
    serverTripId: trip.tripId,
    tripName: trip.title,
    title: trip.title,
    startDate: trip.startDate,
    endDate: trip.endDate,
    location: "장소 미정",
    updatedAt: trip.endDate,
    createdAt: trip.startDate,
    days: [],
  };
};



const getFirstPlaceNameFromDays = (days?: unknown[]) => {
  if (!Array.isArray(days)) {
    return "";
  }

  for (const day of days) {
    if (!isRecord(day) || !Array.isArray(day.places)) {
      continue;
    }

    const firstPlace = day.places.find((place) => {
      return isRecord(place) && typeof place.name === "string" && place.name;
    });

    if (isRecord(firstPlace) && typeof firstPlace.name === "string") {
      return firstPlace.name;
    }
  }

  return "";
};

const hydrateMainScheduleWithDetail = async (
  schedule: StoredSchedule,
): Promise<StoredSchedule> => {
  const resolvedTripId = schedule.serverTripId ?? schedule.tripId;

  if (!resolvedTripId) {
    return schedule;
  }

  try {
    const days = await enrichDaysWithServerTripPlaceIds(
      resolvedTripId,
      schedule.days,
    );

    const firstPlaceName = getFirstPlaceNameFromDays(days);

    return {
      ...schedule,
      days,
      location: firstPlaceName || schedule.location || "장소 미정",
    };
  } catch (error) {
    console.log("[Main] 메인 카드 상세 보강 실패:", {
      tripId: resolvedTripId,
      error,
    });

    return schedule;
  }
};

const enrichDaysWithServerTripPlaceIds = async (
  tripId: number | string,
  localDays?: unknown[],
): Promise<unknown[]> => {
  const detail = await getTripDetail(tripId);
  const serverItineraries = detail.itineraries ?? [];

  if (__DEV__) {
    console.log("[Main] 서버 상세 조회 성공:", {
      tripId: detail.tripId,
      itineraryCount: serverItineraries.length,
      places: serverItineraries.flatMap((itinerary) =>
        itinerary.places.map((place) => ({
          day: itinerary.day,
          tripPlaceId: place.tripPlaceId,
          placeId: place.placeId,
          name: place.name,
          visitOrder: place.visitOrder,
        })),
      ),
    });
  }

  if (serverItineraries.length === 0) {
    return localDays ?? [];
  }

  return serverItineraries.map((itinerary) => {
    const localDay = (localDays ?? []).find((day) => {
      return isRecord(day) && Number(day.day) === Number(itinerary.day);
    });

    const localPlaces =
      isRecord(localDay) && Array.isArray(localDay.places) ?
        localDay.places.filter(isRecord)
      : [];

    return {
      ...(isRecord(localDay) ? localDay : {}),
      day: itinerary.day,
      places: itinerary.places.map((serverPlace, index) => {
        const matchedLocalPlace = localPlaces.find((localPlace) => {
          const sameServerId =
            String(localPlace.tripPlaceId ?? "") ===
              String(serverPlace.tripPlaceId) ||
            String(localPlace.serverTripPlaceId ?? "") ===
              String(serverPlace.tripPlaceId);

          const sameGooglePlaceId =
            Boolean(serverPlace.placeId) &&
            (String(localPlace.placeId ?? "") === String(serverPlace.placeId) ||
              String(localPlace.googlePlaceId ?? "") ===
                String(serverPlace.placeId));

          const sameNameAndOrder =
            String(localPlace.name ?? "") === String(serverPlace.name ?? "") &&
            Number(localPlace.order ?? index + 1) ===
              Number(serverPlace.visitOrder ?? index + 1);

          return sameServerId || sameGooglePlaceId || sameNameAndOrder;
        });

        const visitTime =
          serverPlace.visitTime ?? matchedLocalPlace?.visitTime ?? null;
        const endTime =
          serverPlace.endTime ?? matchedLocalPlace?.endTime ?? null;

        return {
          ...(matchedLocalPlace ?? {}),
          id:
            matchedLocalPlace?.id ??
            String(serverPlace.placeId ?? serverPlace.tripPlaceId),
          tripPlaceId: serverPlace.tripPlaceId,
          serverTripPlaceId: serverPlace.tripPlaceId,
          placeId:
            matchedLocalPlace?.placeId ??
            matchedLocalPlace?.googlePlaceId ??
            serverPlace.placeId,
          googlePlaceId:
            matchedLocalPlace?.googlePlaceId ??
            matchedLocalPlace?.placeId ??
            serverPlace.placeId,
          name: serverPlace.name ?? matchedLocalPlace?.name,
          visitTime,
          endTime,
          time:
            matchedLocalPlace?.time ??
            [visitTime, endTime].filter(Boolean).join(" - "),
          order:
            serverPlace.visitOrder ?? matchedLocalPlace?.order ?? index + 1,
          memo: serverPlace.memo ?? matchedLocalPlace?.memo ?? null,
          memos: matchedLocalPlace?.memos ?? [],
        };
      }),
    };
  });
};

export default function MainScreen({ navigation }: Props) {
  const [schedules, setSchedules] = useState<StoredSchedule[]>([]);
  const [notifications, setNotifications] = useState<WeatherNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async (
    baseSchedules: StoredSchedule[] = schedules,
  ) => {
    try {
      const storedUserId = await AsyncStorage.getItem("user_id");

      if (!storedUserId) {
        setNotifications([]);
        return;
      }

      const serverNotifications = await getWeatherNotifications(storedUserId);

      if (serverNotifications.length > 0) {
        if (__DEV__) {
          console.log("[Main] 날씨 알림 조회:", {
            userId: storedUserId,
            count: serverNotifications.length,
            notifications: serverNotifications,
            source: "server",
          });
        }

        setNotifications(serverNotifications);
        return;
      }

      if (__DEV__) {
        console.log("[Main] 날씨 알림 조회:", {
          userId: storedUserId,
          count: 0,
          notifications: [],
          source: "empty",
        });
      }

      setNotifications([]);
    } catch (error) {
      if (__DEV__) {
        console.log("[Main] 날씨 알림 조회 실패:", error);
        setNotifications([]);
      }
    }
  };

  const loadLocalSchedules = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const planAKeys = keys.filter((key) =>
      key.startsWith(PLAN_A_STORAGE_PREFIX),
    );

    if (planAKeys.length === 0) {
      return [];
    }

    const entries = await AsyncStorage.multiGet(planAKeys);

    return entries
      .map(([, value]) => {
        if (!value) return null;

        try {
          return JSON.parse(value) as StoredSchedule;
        } catch (error) {
          console.log("[Main] 일정 파싱 실패:", error);
          return null;
        }
      })
      .filter((item): item is StoredSchedule => Boolean(item))
      .sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();

        return bTime - aTime;
      });
  };

  const loadSchedules = async () => {
    try {
      setLoading(true);

      try {
        const serverTrips = await getTrips("ALL");

        const activeServerTrips = serverTrips.filter(
          (trip) => !isPastTripSummary(trip),
        );

        let serverSchedules = activeServerTrips
          .map(convertTripSummaryToStoredSchedule)
          .sort(sortMainTrips);

        serverSchedules = await Promise.all(
          serverSchedules.map(async (schedule, index) => {
            if (index > 1) {
              return schedule;
            }

            return hydrateMainScheduleWithDetail(schedule);
          }),
        );

        if (serverTrips.length > 0 && serverSchedules.length === 0) {
          console.log("[Main] 서버 일정은 있지만 진행중/예정 일정 없음:", {
            totalCount: serverTrips.length,
          });

          setSchedules([]);
          await loadNotifications([]);
          return;
        }

        if (serverSchedules.length > 0) {
          if (__DEV__) {
            console.log("[Main] 서버 일정 목록 사용:", {
              count: serverSchedules.length,
              schedules: serverSchedules.map((schedule) => ({
                tripId: schedule.serverTripId,
                title: getScheduleTitle(schedule),
                startDate: schedule.startDate,
                endDate: schedule.endDate,
              })),
            });
          }

          setSchedules(serverSchedules);
          await loadNotifications(serverSchedules);
          return;
        }

        console.log("[Main] 서버 일정 없음 - 로컬 fallback 조회");
      } catch (serverError) {
        console.log("[Main] 서버 일정 조회 실패 - 로컬 fallback 사용:", serverError);
      }

      const localSchedules = await loadLocalSchedules();

      setSchedules(localSchedules);
      await loadNotifications(localSchedules);
    } catch (error) {
      console.log("[Main] 일정 불러오기 실패:", error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSchedules();
    }, []),
  );

  const handleSeedWeatherNotification = async () => {
    try {
      const result = await seedTestWeatherNotification(6, 166);

      console.log("[Main] 테스트 날씨 알림 생성:", result);

      await loadNotifications(schedules);

      Alert.alert("테스트 알림 생성 완료", "날씨 알림을 다시 조회했습니다.");
    } catch (error) {
      console.log("[Main] 테스트 날씨 알림 생성 실패:", error);

      Alert.alert(
        "테스트 알림 생성 실패",
        error instanceof Error ?
          error.message
        : "테스트 알림 생성 중 오류가 발생했습니다.",
      );
    }
  };

  const handleDismissNotification = async (
    notification: WeatherNotification,
  ) => {
    try {
      const notificationId = notification.notificationId ?? notification.id;

      if (!notificationId) {
        Alert.alert("알림 닫기 실패", "날씨 알림 ID를 찾을 수 없습니다.");
        return;
      }

      await dismissNotification(notificationId);

      setNotifications((prev) =>
        prev.filter((item) => {
          const itemNotificationId = item.notificationId ?? item.id;

          return String(itemNotificationId) !== String(notificationId);
        }),
      );

      console.log("[Main] 날씨 알림 dismiss 완료:", {
        notificationId,
      });
    } catch (error) {
      console.log("[Main] 날씨 알림 dismiss 실패:", error);
    }
  };

  const handleOpenNotificationRecommendation = (
    notification: WeatherNotification,
  ) => {
    const notificationId = notification.notificationId ?? notification.id;
    const tripPlaceId = notification.tripPlaceId ?? notification.planId;
    const recommendedPlaces =
      notification.recommendedPlaces ?? notification.alternatives ?? [];

    if (recommendedPlaces.length === 0) {
      Alert.alert(
        "추천 장소 없음",
        "이 알림에 연결된 대안 장소가 아직 없습니다.",
      );
      return;
    }

    if (!tripPlaceId) {
      Alert.alert(
        "대안 추천 불가",
        "이 알림에 연결된 서버 일정 장소 ID가 없습니다.",
      );
      return;
    }

    const baseSchedule =
      schedules.find(
        (schedule) =>
          String(schedule.tripId ?? schedule.serverTripId) ===
          String(notification.tripId),
      ) ?? schedules[0];

    const normalizedPlaces = recommendedPlaces.map((place) => ({
      placeId: place.googlePlaceId ?? String(place.placeId),
      googlePlaceId: place.googlePlaceId ?? String(place.placeId),
      notificationPlaceId: place.placeId,
      name: place.name,
      address: place.address,
      rating: place.rating,
      category: place.category,
      latitude: place.latitude,
      longitude: place.longitude,
      reason:
        "날씨 변화로 인해 기존 야외 일정 대신 방문하기 좋은 대안 장소예요.",
      distanceText: "",
      durationText: "",
    }));

    const nextParams = {
      source: "weather-notification",
      scheduleId: getScheduleId(baseSchedule ?? {}),
      tripId: notification.tripId,
      serverTripId: notification.tripId,
      tripName: getScheduleTitle(baseSchedule ?? {}),
      startDate: baseSchedule?.startDate,
      endDate: baseSchedule?.endDate,
      location: baseSchedule?.location,

      /**
       * 날씨 알림 기반 교체에 필요한 핵심 값
       */
      currentPlanId: notification.tripPlaceId,
      tripPlaceId: notification.tripPlaceId,
      serverTripPlaceId: notification.tripPlaceId,
      notificationId: notification.notificationId,
      fromWeatherNotification: true,

      /**
       * 이미 서버 알림에 포함된 추천 장소를 추천 결과 화면까지 전달한다.
       */
      placesJson: JSON.stringify(normalizedPlaces),

      targetPlace: {
        id: notification.tripPlaceId,
        tripPlaceId: notification.tripPlaceId,
        serverTripPlaceId: notification.tripPlaceId,
        name: notification.placeName,
      },

      reason:
        notification.message ??
        "날씨 변화로 인해 기존 일정 대신 방문하기 좋은 대안 장소를 추천해주세요.",
    };

    console.log("[Main] 날씨 알림 AI 분석 상세 이동:", {
      notificationId: notification.notificationId,
      tripId: notification.tripId,
      tripPlaceId: notification.tripPlaceId,
      placesCount: normalizedPlaces.length,
      nextParams,
    });

    /**
     * 흐름:
     * 날씨 알림 카드 클릭
     * → AI 분석 상세 보기
     * → 추천 결과
     */
    navigation.navigate("AIAnalysisLoading", nextParams);
  };

  const handleAddSchedule = () => {
    navigation.navigate("AddSchedule");
  };

  const handleOpenSchedule = async (schedule: StoredSchedule) => {
    const resolvedTripId = schedule.tripId ?? schedule.serverTripId;

    let days = schedule.days;

    if (resolvedTripId) {
      try {
        days = await enrichDaysWithServerTripPlaceIds(
          resolvedTripId,
          schedule.days,
        );
      } catch (error) {
        console.log("[Main] 서버 상세 조회 실패 - 로컬 days로 이동:", {
          resolvedTripId,
          error,
        });
      }
    }

    navigation.navigate("OngoingSchedule", {
      scheduleId: getScheduleId(schedule),
      tripId: resolvedTripId,
      serverTripId: resolvedTripId,
      tripName: getScheduleTitle(schedule),
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      location: schedule.location,
      transportMode: schedule.transportMode,
      transportLabel: schedule.transportLabel,
      days,
    });
  };

  const handleDeleteSchedule = (schedule: StoredSchedule) => {
    const scheduleId = getScheduleId(schedule);
    const resolvedTripId = schedule.tripId ?? schedule.serverTripId;

    if (!scheduleId) {
      Alert.alert("삭제 실패", "삭제할 일정 ID를 찾을 수 없습니다.");
      return;
    }

    Alert.alert("일정 삭제", "이 일정을 삭제할까요?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            if (resolvedTripId) {
              console.log("[Main] 서버 일정 삭제 요청:", resolvedTripId);
              await deleteTrip(resolvedTripId);
            }

            console.log("[Main] 로컬 일정 삭제 요청:", scheduleId);
            await removePlanASchedule(scheduleId);

            await loadSchedules();

            console.log("[Main] 일정 삭제 완료:", {
              scheduleId,
              tripId: resolvedTripId,
            });
          } catch (error) {
            console.log("[Main] 일정 삭제 실패:", error);

            Alert.alert(
              "삭제 실패",
              "일정을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.",
            );
          }
        },
      },
    ]);
  };

  const renderDeleteAction = (schedule: StoredSchedule) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        activeOpacity={0.85}
        onPress={() => handleDeleteSchedule(schedule)}
      >
        <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
        <Text style={styles.deleteActionText}>삭제</Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.radialLayer} pointerEvents="none">
          <RadialBackground />
        </View>

        <View style={styles.foregroundContent}>
          <View style={styles.emptyIconCircle}>
            <View style={styles.calendarIcon}>
              <View style={styles.calendarTopBar}>
                <View style={styles.calendarRing} />
                <View style={styles.calendarRing} />
              </View>

              <View style={styles.calendarBody}>
                <View style={styles.calendarDateBlock} />
              </View>
            </View>
          </View>

          <Text style={styles.emptyTitle}>등록된 일정이 없습니다</Text>

          <Text style={styles.emptyDescription}>
            새로운 여행 일정을 추가해보세요
          </Text>

          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={handleAddSchedule}
          >
            <Text style={styles.addButtonText}>일정 추가하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHomeContent = () => {
    const activeSchedules = schedules
      .filter((schedule) => !isPastSchedule(schedule))
      .sort(sortSchedulesByStartDate);

    if (activeSchedules.length === 0) {
      return renderEmptyState();
    }

    const ongoingSchedule = activeSchedules.find(isOngoingSchedule);
    const currentSchedule = ongoingSchedule ?? activeSchedules[0];
    const nextSchedule = activeSchedules.find((schedule) => {
      return getScheduleId(schedule) !== getScheduleId(currentSchedule);
    });
    const currentFirstPlaceName = getFirstPlaceName(currentSchedule);

    return (
      <ScrollView
        style={styles.scheduleList}
        contentContainerStyle={styles.homeContent}
        showsVerticalScrollIndicator={false}
      >

        


        {__DEV__ ?
          <TouchableOpacity
            style={styles.seedWeatherButton}
            activeOpacity={0.85}
            onPress={handleSeedWeatherNotification}
          >
            <Ionicons name="flask-outline" size={16} color="#FFFFFF" />
            <Text style={styles.seedWeatherButtonText}>
              테스트 날씨 알림 생성
            </Text>
          </TouchableOpacity>
        : null}

        {notifications.length > 0 ?
          <View style={styles.notificationSection}>
            {notifications.map((notification) => (
              <WeatherNotificationCard
                key={String(notification.notificationId)}
                notification={notification}
                onPressRecommend={handleOpenNotificationRecommendation}
                onDismiss={handleDismissNotification}
              />
            ))}
          </View>
        : null}


        <View style={styles.todayInfoPill}>
          <View style={styles.todayInfoItem}>
            <Text style={styles.todayEmoji}>{getWeatherStatusEmoji(notifications)}</Text>
            <Text style={styles.todayInfoText}>
              {getWeatherStatusText(notifications)}
            </Text>
          </View>

          <View style={styles.todayDivider} />

          <View style={styles.todayInfoItem}>
            <Text style={styles.todayEmoji}>📅</Text>
            <Text style={styles.todayInfoText}>
              {getTodayDisplayText()}
            </Text>
          </View>

          <View style={styles.todayDivider} />

          <View style={styles.todayInfoItem}>
            <Text style={styles.todayEmoji}>🗺️</Text>
            <Text style={styles.todayInfoText}>
              {getCurrentDayLabel(currentSchedule.startDate, currentSchedule.endDate)}
            </Text>
          </View>
        </View>
        <View style={styles.ongoingSection}>
          <Text style={styles.homeSectionTitle}>진행중인 일정</Text>

          <Swipeable
            renderRightActions={() => renderDeleteAction(currentSchedule)}
            overshootRight={false}
          >
            <TouchableOpacity
              style={styles.ongoingCard}
              activeOpacity={0.86}
              onPress={() => handleOpenSchedule(currentSchedule)}
            >
              <View style={styles.pinIconCircle}>
                <Text style={styles.pinEmoji}>📌</Text>
              </View>

              <View style={styles.ongoingInfo}>
                <Text style={styles.ongoingTitle} numberOfLines={1}>
                  {getScheduleTitle(currentSchedule)}
                </Text>

                <Text style={styles.ongoingLocation} numberOfLines={1}>
                  {currentFirstPlaceName ||
                    getScheduleLocation(currentSchedule)}
                </Text>

                <View style={styles.ongoingDateRow}>
                  <Ionicons name="calendar-outline" size={17} color="#94A3B8" />
                  <Text style={styles.ongoingDateText}>
                    {getScheduleDate(currentSchedule)}
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={26} color="#CBD5E1" />
            </TouchableOpacity>
          </Swipeable>
        </View>

        <View style={styles.nextTripSection}>
          <Text style={styles.homeSectionTitle}>다음 여행</Text>

          {nextSchedule ?
            <TouchableOpacity
              style={styles.nextTripCard}
              activeOpacity={0.86}
              onPress={() => handleOpenSchedule(nextSchedule)}
            >
              <View style={styles.nextTripThumb}>
                <Text style={styles.nextTripEmoji}>🏝️</Text>
              </View>

              <View style={styles.nextTripInfo}>
                <Text style={styles.nextTripTitle} numberOfLines={1}>
                  {getScheduleTitle(nextSchedule)}
                </Text>

                <View style={styles.nextTripMetaRow}>
                  <Ionicons name="calendar-outline" size={15} color="#94A3B8" />
                  <Text style={styles.nextTripMetaText}>
                    {getScheduleDate(nextSchedule)}
                  </Text>
                </View>

                <View style={styles.nextTripMetaRow}>
                  <Ionicons name="location-outline" size={15} color="#94A3B8" />
                  <Text style={styles.nextTripMetaText}>
                    {getScheduleLocation(nextSchedule)} ·{" "}
                    {getPlaceCount(nextSchedule)}개 장소
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
            </TouchableOpacity>
          : <View style={styles.emptyNextTripCard}>
              <Text style={styles.emptyNextTripTitle}>
                예정된 다음 여행이 없어요
              </Text>

              <Text style={styles.emptyNextTripDescription}>
                새로운 여행 일정을 추가해보세요.
              </Text>
            </View>
          }
        </View>

        <TouchableOpacity
          style={styles.newScheduleCardButton}
          activeOpacity={0.86}
          onPress={handleAddSchedule}
        >
          <View style={styles.newScheduleIconCircle}>
            <Ionicons name="add" size={22} color="#2158E8" />
          </View>

          <View style={styles.newScheduleTextBox}>
            <Text style={styles.newScheduleTitle}>새 일정 추가하기</Text>
            <Text style={styles.newScheduleDescription}>
              또 다른 여행 계획을 만들어보세요
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.logoText}>Plan.B</Text>
        </View>

        {loading ?
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2158E8" />
          </View>
        : schedules.length === 0 ?
          renderEmptyState()
        : renderHomeContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },

  screen: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },

  header: {
    alignItems: "center",
    paddingTop: 44,
    paddingBottom: 36,
  },

  logoText: {
    color: "#1C2534",
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1.4,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 110,
  },

  seedWeatherButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 14,
  },

  seedWeatherButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  scheduleList: {
    flex: 1,
  },

  homeContent: {
    paddingHorizontal: 24,
    paddingBottom: 150,
  },
  todayInfoPill: {
    marginTop: 14,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6ECF5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },

  todayInfoItem: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  todayEmoji: {
    fontSize: 11,
    lineHeight: 15,
  },

  todayInfoText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    color: "#334155",
    textAlign: "center",
  },
todayDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#E2E8F0",
  },

  notificationSection: {
    marginBottom: 12,
  },


  ongoingSection: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#B9DCFF",
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    marginBottom: 28,
    shadowColor: "#74B8FF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },

  homeSectionTitle: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 26,
  },

  ongoingCard: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  pinIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },

  pinEmoji: {
    fontSize: 24,
  },

  ongoingInfo: {
    flex: 1,
  },

  ongoingTitle: {
    color: "#1C2534",
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 6,
  },

  ongoingLocation: {
    color: "#8A9BB2",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 9,
  },

  ongoingDateRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  ongoingDateText: {
    color: "#8A9BB2",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
  },

  deleteAction: {
    width: 84,
    minHeight: 84,
    borderRadius: 18,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },

  deleteActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4,
  },

  nextTripSection: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },

  emptyNextTripCard: {
    marginTop: 14,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 24,
    paddingHorizontal: 22,
  },
  emptyNextTripTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptyNextTripDescription: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },

  nextTripCard: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
  },

  nextTripThumb: {
    width: 82,
    height: 82,
    borderRadius: 14,
    backgroundColor: "#CDE8FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  nextTripEmoji: {
    fontSize: 42,
  },

  nextTripInfo: {
    flex: 1,
  },

  nextTripTitle: {
    color: "#1C2534",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 11,
  },

  nextTripMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  nextTripMetaText: {
    color: "#8A9BB2",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },

  newScheduleCardButton: {
    minHeight: 76,
    marginTop: 18,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE6F2",
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },

  newScheduleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  newScheduleTextBox: {
    flex: 1,
  },

  newScheduleTitle: {
    color: "#1C2534",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 5,
  },

  newScheduleDescription: {
    color: "#8A9BB2",
    fontSize: 13,
    fontWeight: "700",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 130,
    position: "relative",
    overflow: "hidden",
  },

  radialLayer: {
    position: "absolute",
    top: "51%",
    marginTop: -175,
    width: 350,
    height: 350,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.32,
    zIndex: 0,
    elevation: 0,
  },

  foregroundContent: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 48,
    zIndex: 10,
    elevation: 10,
  },

  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#D7E9FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    zIndex: 11,
    elevation: 11,
  },

  calendarIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: "#2158E8",
    backgroundColor: "#D7E9FF",
    overflow: "hidden",
  },

  calendarTopBar: {
    height: 11,
    backgroundColor: "#2158E8",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 7,
    position: "relative",
  },

  calendarRing: {
    width: 4,
    height: 11,
    borderRadius: 2,
    backgroundColor: "#2158E8",
    marginTop: -7,
  },

  calendarBody: {
    flex: 1,
    backgroundColor: "#D7E9FF",
    alignItems: "center",
    justifyContent: "center",
  },

  calendarDateBlock: {
    width: 12,
    height: 10,
    borderRadius: 2,
    backgroundColor: "#2158E8",
    opacity: 0.95,
  },

  emptyTitle: {
    color: "#1C2534",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
    zIndex: 11,
    elevation: 11,
  },

  emptyDescription: {
    color: "#9AA8BA",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 30,
    zIndex: 11,
    elevation: 11,
  },

  addButton: {
    minWidth: 164,
    height: 56,
    paddingHorizontal: 28,
    borderRadius: 14,
    backgroundColor: "#2158E8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 12,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },
});
