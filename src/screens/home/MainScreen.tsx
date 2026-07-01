import React, { useCallback, useRef, useState } from "react";
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

import RadialBackground from "../../components/RadialBackground";
import EmptyCurrentScheduleState from "../../components/home/EmptyCurrentScheduleState";
import WeatherNotificationCard from "../../components/notifications/WeatherNotificationCard";
import { removePlanASchedule } from "../../api/schedules/planAStorage";
import { getPlaceDetail } from "../../../api/places/place";
import {
  deleteTrip,
  getTripDetail,
  getTrips,
  TripSummary,
} from "../../../api/schedules/server";
import {
  dismissNotification,
  getWeatherNotifications,
} from "../../../api/notifications/notifications";
import type { WeatherNotification } from "../../types/notification";
import {
  registerNotificationClickListener,
  removeNotificationClickListener,
  requestExpoPushToken,
} from "../../utils/pushNotifications";
import { registerPushToken } from "../../../api/notifications/pushToken";

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

const normalizeMainDateOnlyText = (value?: string | null) => {
  const normalized = String(value ?? "")
    .trim()
    .replace(/\./g, "-");

  const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return "";

  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
};

const getMainLocalDateOnlyText = (date = new Date()) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const isMainTripOngoingByDate = (schedule: {
  startDate?: string;
  endDate?: string;
}) => {
  const startText = normalizeMainDateOnlyText(schedule.startDate);
  const endText = normalizeMainDateOnlyText(schedule.endDate);
  const todayText = getMainLocalDateOnlyText();

  if (!startText || !endText) return false;

  return startText <= todayText && todayText <= endText;
};

const isMainTripUpcomingByDate = (schedule: { startDate?: string }) => {
  const startText = normalizeMainDateOnlyText(schedule.startDate);
  const todayText = getMainLocalDateOnlyText();

  if (!startText) return false;

  return todayText < startText;
};

const getMainTodayDayIndex = (schedule: {
  startDate?: string;
  endDate?: string;
}) => {
  if (!isMainTripOngoingByDate(schedule)) return 0;

  const startText = normalizeMainDateOnlyText(schedule.startDate);
  const todayText = getMainLocalDateOnlyText();

  const start = new Date(`${startText}T00:00:00`);
  const today = new Date(`${todayText}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(today.getTime())) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
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
  return `날씨알림 ${notifications.length}건`;
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

const getCurrentDayLabel = (startDate?: string, endDate?: string) => {
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

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const currentDay = Math.max(1, diffDays + 1);

  if (endDate) {
    const tripEndDate = normalizeDate(endDate);

    if (tripEndDate) {
      const totalDiffMs = tripEndDate.getTime() - tripStartDate.getTime();

      const totalDays = Math.floor(totalDiffMs / (1000 * 60 * 60 * 24)) + 1;

      return `Day ${Math.min(currentDay, totalDays)}`;
    }
  }

  return `Day ${currentDay}`;
};

const getUpcomingDDayLabel = (startDate?: string) => {
  const start = normalizeDateForCompare(startDate);

  if (!start) {
    return "일정 없음";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil(
    (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) {
    return "일정 없음";
  }

  if (diffDays > 14) {
    return "일정 없음";
  }

  if (diffDays === 0) {
    return "D-Day";
  }

  return `D-${diffDays}`;
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

const getMainTimeMinutes = (value?: unknown) => {
  const normalized = String(value ?? "").trim();
  const firstTime = normalized.split("-")[0]?.trim() ?? normalized;
  const match = firstTime.match(/(?:T|\b)(\d{1,2}):(\d{2})\s*(AM|PM)?/i);

  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3]?.toUpperCase();

  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

  return hour * 60 + minute;
};

const getMainTimeRangeEndText = (value?: unknown) => {
  const normalized = String(value ?? "").trim();
  const [, end] = normalized.split(/\s*-\s*/);

  return end?.trim() || "";
};

const getCurrentPlaceName = (schedule?: StoredSchedule) => {
  if (!schedule || !isMainTripOngoingByDate(schedule)) return "";

  const days = Array.isArray(schedule.days) ? schedule.days : [];
  const todayDayNumber = getMainTodayDayIndex(schedule) + 1;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayDay = days.find((day, index) => {
    if (!isRecord(day)) return false;

    const rawDay = day.day ?? day.dayNumber ?? index + 1;

    return Number(rawDay) === todayDayNumber;
  });

  if (!isRecord(todayDay) || !Array.isArray(todayDay.places)) {
    return "";
  }

  const currentPlace = todayDay.places.find((place) => {
    if (!isRecord(place)) return false;

    const startMinutes = getMainTimeMinutes(place.visitTime ?? place.time);
    const endMinutes = getMainTimeMinutes(
      place.endTime ?? getMainTimeRangeEndText(place.time),
    );

    if (startMinutes === null || endMinutes === null) return false;

    return startMinutes <= currentMinutes && currentMinutes <= endMinutes;
  });

  if (!isRecord(currentPlace)) return "";

  return typeof currentPlace.name === "string" ? currentPlace.name : "";
};

const getMainCurrentPlaceDayIndex = (schedule?: StoredSchedule) => {
  if (!schedule) return null;

  const days = Array.isArray(schedule.days) ? schedule.days : [];
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const matchedDayIndex = days.findIndex((day) => {
    if (!isRecord(day) || !Array.isArray(day.places)) {
      return false;
    }

    return day.places.some((place) => {
      if (!isRecord(place)) return false;

      const startMinutes = getMainTimeMinutes(place.visitTime ?? place.time);
      const endMinutes = getMainTimeMinutes(place.endTime);

      if (startMinutes === null || endMinutes === null) {
        return false;
      }

      return startMinutes <= currentMinutes && currentMinutes <= endMinutes;
    });
  });

  return matchedDayIndex >= 0 ? matchedDayIndex : (
      getMainTodayDayIndex(schedule)
    );
};

const getPlaceCount = (schedule?: StoredSchedule) => {
  // 서버 목록 응답의 placeCount가 있으면 그대로 사용(홈에서 상세 호출 없이 빠르게 표시).
  const summaryPlaceCount = (schedule as { placeCount?: number } | undefined)
    ?.placeCount;
  if (typeof summaryPlaceCount === "number") {
    return summaryPlaceCount;
  }

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

  return (
    startDate.getTime() <= today.getTime() &&
    today.getTime() <= endDate.getTime()
  );
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
    // 목록 응답의 카운트(상세 호출 없이 홈에서 바로 사용)
    placeCount: trip.placeCount,
    itineraryCount: trip.itineraryCount,
  } as StoredSchedule;
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
  if (__DEV__) {
    console.count("[Main] getTripDetail hydrateMainScheduleWithDetail");
  }

  const detail = await getTripDetail(tripId);
  const serverItineraries = detail.itineraries ?? [];

  if (__DEV__) {
    console.log("[Main] 서버 상세 조회 성공:", {
      tripId: detail.tripId,
      itineraryCount: serverItineraries.length,
      placeCount: serverItineraries.reduce(
        (count, itinerary) => count + itinerary.places.length,
        0,
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
  const [activeNotificationIndex, setActiveNotificationIndex] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scheduleLoadError, setScheduleLoadError] = useState("");
  const didRegisterPushTokenRef = useRef(false);

  const registerDevicePushToken = async () => {
    if (didRegisterPushTokenRef.current) {
      console.log("[push] 이미 push token 등록을 시도했습니다. 생략합니다.");
      return;
    }

    didRegisterPushTokenRef.current = true;

    try {
      const storedUserId = await AsyncStorage.getItem("user_id");

      if (!storedUserId) {
        console.log("[push] user_id 없음 - push token 등록 생략");
        return;
      }

      const tokenResult = await requestExpoPushToken();

      if (!tokenResult.granted || !tokenResult.expoPushToken) {
        console.log("[push] push token 없음 - 서버 등록 생략:", {
          reason: tokenResult.reason,
        });
        return;
      }

      await registerPushToken({
        expoPushToken: tokenResult.expoPushToken,
      });
    } catch (error) {
      console.log("[push] push token 등록 흐름 실패:", error);
    }
  };

  const loadNotifications = async (
    baseSchedules: StoredSchedule[] = schedules,
  ) => {
    try {
      const storedUserId = await AsyncStorage.getItem("user_id");

      if (!storedUserId) {
        setNotifications([]);
        setActiveNotificationIndex(0);
        return;
      }

      setNotificationsLoading(true);

      if (__DEV__) {
        console.count("[Main] getWeatherNotifications");
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
        setActiveNotificationIndex(0);
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
      }
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
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
      setScheduleLoadError("");

      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (!accessToken && !refreshToken) {
        console.log("[Main] 토큰 없음. 서버 일정 조회 생략");
        setSchedules([]);
        setScheduleLoadError("");
        await loadNotifications([]);
        return;
      }

      try {
        const serverTrips = await getTrips("ALL");

        const activeServerTrips = serverTrips.filter(
          (trip) => !isPastTripSummary(trip),
        );

        let serverSchedules = activeServerTrips
          .map(convertTripSummaryToStoredSchedule)
          .sort(sortMainTrips);

        // 홈 화면 속도 개선: 모든 여행마다 GET /api/trips/{id}를 호출하지 않는다.
        // 목록 응답의 placeCount/itineraryCount를 그대로 쓰고,
        // 현재 장소 표시가 필요한 "진행중" 여행만 상세를 보강한다.
        serverSchedules = await Promise.all(
          serverSchedules.map(async (schedule) => {
            if (isOngoingSchedule(schedule)) {
              return hydrateMainScheduleWithDetail(schedule);
            }
            return schedule;
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
            });
          }

          setSchedules(serverSchedules);
          await loadNotifications(serverSchedules);
          return;
        }

        console.log("[Main] 서버 일정 없음 - 빈 화면 표시");
        setSchedules([]);
        await loadNotifications([]);
        return;
      } catch (serverError) {
        console.log("[Main] 서버 일정 조회 실패:", serverError);
        setSchedules([]);
        await loadNotifications([]);
        setScheduleLoadError("일정 조회에 실패했습니다.");
        return;
      }
    } catch (error) {
      console.log("[Main] 일정 불러오기 실패:", error);
      setSchedules([]);
      setScheduleLoadError("일정 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSchedules();
      registerDevicePushToken();

      registerNotificationClickListener((data) => {
        console.log("[push] MainScreen notification click data:", data);

        const notificationId = data.notificationId;
        const tripId = data.tripId;
        const tripPlaceId = data.tripPlaceId;

        if (notificationId || tripId || tripPlaceId) {
          console.log("[push] weather notification click:", {
            notificationId,
            tripId,
            tripPlaceId,
          });

          navigation.navigate("Main", {
            openedFromPush: true,
            notificationId,
            tripId,
            tripPlaceId,
          });

          return;
        }

        navigation.navigate("Main");
      });

      return () => {
        removeNotificationClickListener();
      };
    }, [navigation]),
  );

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

  const handleOpenNotificationRecommendation = async (
    notification: WeatherNotification,
  ) => {
    const rawNotification = notification as any;

    const notificationId = rawNotification.notificationId ?? rawNotification.id;

    const currentPlanId =
      rawNotification.currentPlanId ??
      rawNotification.tripPlaceId ??
      rawNotification.planId;

    if (!currentPlanId) {
      Alert.alert(
        "대안 추천 불가",
        "이 알림에 연결된 현재 일정 ID가 없습니다.",
      );
      return;
    }

    const baseSchedule =
      schedules.find(
        (schedule) =>
          String(schedule.tripId ?? schedule.serverTripId) ===
          String(rawNotification.tripId),
      ) ?? schedules[0];

    const tripId =
      rawNotification.tripId ??
      baseSchedule?.tripId ??
      baseSchedule?.serverTripId;

    if (!tripId) {
      Alert.alert("대안 추천 불가", "여행 ID를 찾을 수 없습니다.");
      return;
    }

    const alternatives =
      rawNotification.recommendedPlaces ?? rawNotification.alternatives ?? [];

    const originalPlace = rawNotification.originalPlace;

    if (alternatives.length > 0) {
      navigation.navigate("RecommendationResult", {
        source: "weather-notification",
        fromWeatherNotification: true,
        notificationId,
        day: Number(rawNotification.day) > 0 ? Number(rawNotification.day) : undefined,
        placesJson: JSON.stringify(alternatives),
        currentPlanId: Number(
          originalPlace?.tripPlaceId ??
            originalPlace?.serverTripPlaceId ??
            originalPlace?.placeId ??
            currentPlanId,
        ),
        tripPlaceId: Number(
          originalPlace?.tripPlaceId ??
            originalPlace?.serverTripPlaceId ??
            originalPlace?.placeId ??
            currentPlanId,
        ),
        serverTripPlaceId: Number(
          originalPlace?.tripPlaceId ??
            originalPlace?.serverTripPlaceId ??
            originalPlace?.placeId ??
            currentPlanId,
        ),
        tripId: Number(tripId),
        serverTripId: Number(tripId),
        scheduleId: getScheduleId(baseSchedule ?? {}),
        tripName: getScheduleTitle(baseSchedule ?? {}),
        startDate: baseSchedule?.startDate,
        endDate: baseSchedule?.endDate,
        location: baseSchedule?.location,
        targetPlace:
          originalPlace ?
            {
              id:
                originalPlace.tripPlaceId ??
                originalPlace.serverTripPlaceId ??
                originalPlace.placeId ??
                currentPlanId,
              tripPlaceId:
                originalPlace.tripPlaceId ??
                originalPlace.serverTripPlaceId ??
                originalPlace.placeId ??
                currentPlanId,
              serverTripPlaceId:
                originalPlace.tripPlaceId ??
                originalPlace.serverTripPlaceId ??
                originalPlace.placeId ??
                currentPlanId,
              placeId: originalPlace.googlePlaceId,
              googlePlaceId: originalPlace.googlePlaceId,
              name: originalPlace.name,
              address: originalPlace.address,
              category: originalPlace.category,
              latitude: originalPlace.latitude,
              longitude: originalPlace.longitude,
              time:
                originalPlace.time ??
                [originalPlace.visitTime, originalPlace.endTime]
                  .filter(Boolean)
                  .join(" - "),
            }
          : undefined,
      });
      return;
    }

    const affectedPlace = baseSchedule?.days
      ?.flatMap((day: any) => day.places ?? [])
      .find((place: any) =>
        [place.id, place.tripPlaceId, place.serverTripPlaceId].some(
          (id) => String(id) === String(currentPlanId),
        ),
      );

    let currentLat =
      rawNotification.currentLat ??
      rawNotification.latitude ??
      rawNotification.lat ??
      rawNotification.placeLatitude ??
      affectedPlace?.latitude;

    let currentLng =
      rawNotification.currentLng ??
      rawNotification.longitude ??
      rawNotification.lng ??
      rawNotification.placeLongitude ??
      affectedPlace?.longitude;

    // 좌표가 없으면 상세조회(getPlaceDetail)로 보강한다.
    if (currentLat == null || currentLng == null) {
      const detailId =
        originalPlace?.googlePlaceId ??
        originalPlace?.placeId ??
        affectedPlace?.googlePlaceId ??
        affectedPlace?.placeId;

      if (detailId) {
        try {
          const detail: any = await getPlaceDetail(String(detailId));
          currentLat = currentLat ?? detail?.latitude ?? detail?.lat;
          currentLng = currentLng ?? detail?.longitude ?? detail?.lng;
        } catch (error) {
          console.log("[Main] 대안추천 좌표 보강 실패:", error);
        }
      }
    }

    if (currentLat == null || currentLng == null) {
      // 좌표가 없어 근처 실내 대안을 추천할 수 없는 경우 → 일정 조정을 안내한다.
      const notifDay =
        Number(rawNotification.day) > 0 ? Number(rawNotification.day) : undefined;

      Alert.alert(
        "실내 대안을 찾지 못했어요",
        "이 시간대 근처에 추천할 실내 장소가 없어요. 일정을 조정하시겠어요?",
        [
          { text: "취소", style: "cancel" },
          {
            text: "일정 조정",
            onPress: () => {
              navigation.navigate("PlanA", {
                scheduleId: getScheduleId(baseSchedule ?? {}),
                tripId: Number(tripId),
                serverTripId: Number(tripId),
                tripName: getScheduleTitle(baseSchedule ?? {}),
                startDate: baseSchedule?.startDate,
                endDate: baseSchedule?.endDate,
                location: baseSchedule?.location,
                day: notifDay,
                selectedDay: notifDay,
                isEditMode: true,
                refreshPlanAAt: Date.now(),
                // 저장(시간/장소 수정) 완료 시 이 날씨 알림을 삭제하기 위해 전달
                dismissNotificationId: notificationId,
              } as any);
            },
          },
        ],
      );
      return;
    }

    const nextParams = {
      source: "weather-notification",

      tripId: Number(tripId),
      serverTripId: Number(tripId),
      currentPlanId: Number(currentPlanId),
      tripPlaceId: Number(currentPlanId),
      serverTripPlaceId: Number(currentPlanId),

      currentLat: Number(currentLat),
      currentLng: Number(currentLng),
      radiusMinute: 15,
      transportMode: (baseSchedule as any)?.transportMode ?? "WALK",
      selectedSpace: "INDOOR",
      selectedType: "CAFE",
      keepOriginalCategory: false,
      considerNextPlan: true,

      nextLat: rawNotification.nextLat,
      nextLng: rawNotification.nextLng,

      notificationId,
      fromWeatherNotification: true,

      scheduleId: getScheduleId(baseSchedule ?? {}),
      tripName: getScheduleTitle(baseSchedule ?? {}),
      startDate: baseSchedule?.startDate,
      endDate: baseSchedule?.endDate,
      location: baseSchedule?.location,

      targetPlace: {
        id: currentPlanId,
        tripPlaceId: currentPlanId,
        serverTripPlaceId: currentPlanId,
        name: rawNotification.placeName ?? affectedPlace?.name,
        latitude: Number(currentLat),
        longitude: Number(currentLng),
      },

      reason:
        rawNotification.message ??
        "날씨 변화로 인해 기존 일정 대신 방문하기 좋은 대안 장소를 추천해주세요.",
    };

    console.log("[Main] 날씨 알림 AI 대안 추천 payload:", nextParams);

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

    const commonParams = {
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
    };

    if (isMainTripUpcomingByDate(schedule)) {
      navigation.navigate("UpcomingSchedule", {
        ...commonParams,
        selectedDay: 1,
        day: 1,
      });
      return;
    }

    const targetDayIndex = getMainCurrentPlaceDayIndex(schedule);

    navigation.navigate("OngoingSchedule", {
      ...commonParams,
      ...(targetDayIndex !== null
        ? {
            selectedDayIndex: targetDayIndex,
            selectedDay: targetDayIndex + 1,
          }
        : {}),
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
      <EmptyCurrentScheduleState
        onPressPastTrips={() => navigation.navigate("PlanX")}
        addButton={
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={handleAddSchedule}
          >
            <Text style={styles.addButtonText}>일정 추가하기</Text>
          </TouchableOpacity>
        }
      />
    );
  };

  const renderScheduleLoadErrorState = () => {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.radialLayer} pointerEvents="none">
          <RadialBackground />
        </View>

        <View style={styles.foregroundContent}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="warning-outline" size={42} color="#2158E8" />
          </View>

          <Text style={styles.emptyTitle}>{scheduleLoadError}</Text>

          <Text style={styles.emptyDescription}>
            로그인 상태 또는 네트워크를 확인한 뒤 다시 시도해주세요.
          </Text>

          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={loadSchedules}
          >
            <Text style={styles.addButtonText}>다시 조회하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHomeSkeleton = () => {
    return (
      <ScrollView
        style={styles.scheduleList}
        contentContainerStyle={styles.homeContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
        <View style={styles.skeletonTodayInfoPill}>
          <View style={styles.skeletonTodayItem} />
          <View style={styles.skeletonTodayDivider} />
          <View style={styles.skeletonTodayItem} />
          <View style={styles.skeletonTodayDivider} />
          <View style={styles.skeletonTodayItemSmall} />
        </View>

        <View style={styles.skeletonOngoingSection}>
          <View style={styles.skeletonSectionTitle} />

          <View style={styles.skeletonOngoingCard}>
            <View style={styles.skeletonCircle} />

            <View style={styles.skeletonOngoingInfo}>
              <View style={styles.skeletonLineTitle} />
              <View style={styles.skeletonLineMedium} />
              <View style={styles.skeletonLineLong} />
            </View>

            <View style={styles.skeletonChevron} />
          </View>
        </View>

        <View style={styles.skeletonAddButton} />

        <View style={styles.skeletonNextTripSection}>
          <View style={styles.skeletonSectionTitle} />

          <View style={styles.skeletonNextTripCard}>
            <View style={styles.skeletonThumbnail} />

            <View style={styles.skeletonNextTripInfo}>
              <View style={styles.skeletonLineTitle} />
              <View style={styles.skeletonLineLong} />
              <View style={styles.skeletonLineMedium} />
            </View>

            <View style={styles.skeletonChevron} />
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderHomeContent = () => {
    const activeSchedules = schedules
      .filter((schedule) => !isPastSchedule(schedule))
      .sort(sortSchedulesByStartDate);

    if (activeSchedules.length === 0) {
      return renderEmptyState();
    }

    const currentSchedule = activeSchedules.find(isOngoingSchedule) ?? null;

    // 같은 여행(이름+기간)이 여러 개로 나뉘어 들어오는 경우, 하나로 묶어
    // 그중 장소가 가장 많은(가장 완성된) 항목을 대표로 보여준다.
    const nextScheduleGroups = new Map<string, StoredSchedule>();

    activeSchedules
      .filter((schedule) => !isOngoingSchedule(schedule))
      .forEach((schedule) => {
        const groupKey = [
          getScheduleTitle(schedule),
          schedule.startDate ?? "",
          schedule.endDate ?? "",
        ].join("|");

        const existing = nextScheduleGroups.get(groupKey);

        if (!existing || getPlaceCount(schedule) > getPlaceCount(existing)) {
          nextScheduleGroups.set(groupKey, schedule);
        }
      });

    const nextSchedules = Array.from(nextScheduleGroups.values()).sort(
      sortSchedulesByStartDate,
    );
    const nextSchedule = nextSchedules[0] ?? null;

    const currentFirstPlaceName =
      currentSchedule ? getCurrentPlaceName(currentSchedule) : "";

    const activeNotification =
      notifications[
        Math.min(activeNotificationIndex, Math.max(notifications.length - 1, 0))
      ];

    const buildDisplayNotification = (
      notification: WeatherNotification,
    ): WeatherNotification => {
      const rawNotification = notification as any;

      const notificationTripId = rawNotification.tripId;
      const currentPlanId =
        rawNotification.currentPlanId ??
        rawNotification.tripPlaceId ??
        rawNotification.planId;

      const baseSchedule =
        activeSchedules.find(
          (schedule) =>
            String(schedule.tripId ?? schedule.serverTripId) ===
            String(notificationTripId),
        ) ??
        currentSchedule ??
        activeSchedules[0];

      const matchedDay =
        Array.isArray(baseSchedule?.days) ?
          (baseSchedule?.days as any[]).find(
            (day) =>
              Array.isArray(day?.places) &&
              day.places.some((place: any) =>
                [place.id, place.tripPlaceId, place.serverTripPlaceId].some(
                  (id) => String(id) === String(currentPlanId),
                ),
              ),
          )
        : null;

      const affectedPlace = matchedDay?.places?.find((place: any) =>
        [place.id, place.tripPlaceId, place.serverTripPlaceId].some(
          (id: any) => String(id) === String(currentPlanId),
        ),
      );

      if (__DEV__ && currentPlanId && !affectedPlace) {
        console.log("[Main] 날씨 알림 planId 매칭 실패:", {
          currentPlanId,
          tripId: notificationTripId,
          scheduleTitle: getScheduleTitle(baseSchedule ?? {}),
          placeIds:
            Array.isArray(baseSchedule?.days) ?
              (baseSchedule?.days as any[]).flatMap((day) =>
                Array.isArray(day?.places) ?
                  day.places.map((place: any) => ({
                    day: day?.day,
                    id: place?.id,
                    tripPlaceId: place?.tripPlaceId,
                    serverTripPlaceId: place?.serverTripPlaceId,
                    placeId: place?.placeId,
                    googlePlaceId: place?.googlePlaceId,
                    name: place?.name,
                    visitTime: place?.visitTime,
                    endTime: place?.endTime,
                  }))
                : [],
              )
            : [],
        });
      }

      if (__DEV__) {
        console.log("[Main] 날씨 알림 표시 데이터:", {
          notificationId: rawNotification.notificationId ?? rawNotification.id,
          currentPlanId,
          scheduleTitle: getScheduleTitle(baseSchedule ?? {}),
          matchedDay: matchedDay?.day,
          affectedPlaceName: affectedPlace?.name,
          visitTime: affectedPlace?.visitTime,
          endTime: affectedPlace?.endTime,
          rawVisitTime: rawNotification.visitTime,
          rawEndTime: rawNotification.endTime,
        });
      }

      return {
        ...notification,
        tripName: getScheduleTitle(baseSchedule ?? {}),
        scheduleName: getScheduleTitle(baseSchedule ?? {}),
        placeName:
          affectedPlace?.name ??
          rawNotification.originalPlace?.name ??
          rawNotification.placeName ??
          rawNotification.name,
        address:
          affectedPlace?.address ??
          rawNotification.originalPlace?.address ??
          rawNotification.address ??
          rawNotification.placeAddress,
        visitTime:
          affectedPlace?.visitTime ??
          affectedPlace?.startTime ??
          rawNotification.originalPlace?.visitTime ??
          rawNotification.originalPlace?.time ??
          rawNotification.visitTime,
        endTime:
          affectedPlace?.endTime ??
          rawNotification.originalPlace?.endTime ??
          rawNotification.endTime,
        day:
          matchedDay?.day ??
          rawNotification.originalPlace?.day ??
          rawNotification.day,
      } as WeatherNotification;
    };

    return (
      <ScrollView
        style={styles.scheduleList}
        contentContainerStyle={styles.homeContent}
        showsVerticalScrollIndicator={false}
      >
        {notificationsLoading ?
          <View style={styles.notificationSection}>
            <View style={styles.notificationLoadingBox}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.notificationLoadingText}>
                날씨 알림을 확인하는 중이에요...
              </Text>
            </View>
          </View>
        : notifications.length > 0 && activeNotification ?
          <View style={styles.notificationSection}>
            <WeatherNotificationCard
              key="weather-notification-card"
              notification={buildDisplayNotification(activeNotification)}
              onPressRecommend={handleOpenNotificationRecommendation}
              onDismiss={handleDismissNotification}
              currentIndex={Math.min(
                activeNotificationIndex,
                Math.max(notifications.length - 1, 0),
              )}
              totalCount={notifications.length}
              onChangeIndex={setActiveNotificationIndex}
              onPrev={() =>
                setActiveNotificationIndex((prev) =>
                  prev <= 0 ? notifications.length - 1 : prev - 1,
                )
              }
              onNext={() =>
                setActiveNotificationIndex((prev) =>
                  prev >= notifications.length - 1 ? 0 : prev + 1,
                )
              }
            />
          </View>
        : null}

        <View style={styles.todayInfoPill}>
          <View style={styles.todayInfoItem}>
            <Text style={styles.todayEmoji}>
              {getWeatherStatusEmoji(notifications)}
            </Text>
            <Text style={styles.todayInfoText}>
              {getWeatherStatusText(notifications)}
            </Text>
          </View>

          <View style={styles.todayDivider} />

          <View style={styles.todayInfoItem}>
            <Text style={styles.todayEmoji}>📅</Text>
            <Text style={styles.todayInfoText}>{getTodayDisplayText()}</Text>
          </View>

          <View style={styles.todayDivider} />

          <View style={styles.todayInfoItem}>
            <Text style={styles.todayEmoji}>🗺️</Text>
            <Text style={styles.todayInfoText}>
              {currentSchedule ?
                getCurrentDayLabel(
                  currentSchedule.startDate,
                  currentSchedule.endDate,
                )
              : getUpcomingDDayLabel(nextSchedule?.startDate)}{" "}
            </Text>
          </View>
        </View>
        <View style={styles.ongoingSection}>
          <Text style={styles.homeSectionTitle}>진행중인 일정</Text>

          {currentSchedule ?
            <Swipeable
              renderRightActions={() => renderDeleteAction(currentSchedule)}
              overshootRight={false}
            >
              <TouchableOpacity
                testID="home-current-schedule-card"
                accessibilityLabel={`Home current schedule ${getScheduleTitle(currentSchedule)}`}
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
                    {currentFirstPlaceName || "현재 진행중인 장소 없음"}
                  </Text>

                  <View style={styles.ongoingDateRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={17}
                      color="#94A3B8"
                    />
                    <Text style={styles.ongoingDateText}>
                      {getScheduleDate(currentSchedule)}
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color="#CBD5E1"
                  style={styles.ongoingCardChevron}
                />
              </TouchableOpacity>
            </Swipeable>
          : <View style={styles.ongoingCard}>
              <View style={styles.pinIconCircle}>
                <Text style={styles.pinEmoji}>📌</Text>
              </View>

              <View style={styles.ongoingInfo}>
                <Text style={styles.ongoingTitle}>진행중인 일정 없음</Text>
                <Text style={styles.ongoingLocation}>
                  현재 진행 중인 여행이 없어요.
                </Text>
              </View>
            </View>
          }
        </View>

        <TouchableOpacity
          style={styles.newScheduleCardButton}
          activeOpacity={0.86}
          onPress={handleAddSchedule}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.newScheduleTitle}>새로운 일정 추가하기</Text>
        </TouchableOpacity>

        <View style={styles.nextTripSection}>
          <Text style={styles.homeSectionTitle}>다음 여행</Text>

          {nextSchedules.length > 0 ?
            nextSchedules.map((schedule, index) => (
              <TouchableOpacity
                key={String(
                  schedule.id ?? schedule.tripId ?? schedule.serverTripId,
                )}
                testID={`home-next-schedule-card-${index}`}
                accessibilityLabel={`Home next schedule ${getScheduleTitle(schedule)}`}
                style={[styles.nextTripCard, { marginBottom: 12 }]}
                activeOpacity={0.86}
                onPress={() => handleOpenSchedule(schedule)}
              >
                <View style={styles.nextTripThumb}>
                  <Text style={styles.nextTripEmoji}>🏝️</Text>
                </View>

                <View style={styles.nextTripInfo}>
                  <Text style={styles.nextTripTitle} numberOfLines={1}>
                    {getScheduleTitle(schedule)}
                  </Text>

                  <View style={styles.nextTripMetaRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={15}
                      color="#94A3B8"
                    />
                    <Text style={styles.nextTripMetaText}>
                      {getScheduleDate(schedule)}
                    </Text>
                  </View>

                  <View style={styles.nextTripMetaRow}>
                    <Ionicons
                      name="location-outline"
                      size={15}
                      color="#94A3B8"
                    />
                    <Text style={styles.nextTripMetaText}>
                      {getPlaceCount(schedule)}개 장소
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color="#CBD5E1"
                  style={styles.nextTripCardChevron}
                />
              </TouchableOpacity>
            ))
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
          renderHomeSkeleton()
        : scheduleLoadError ?
          renderScheduleLoadErrorState()
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
    paddingBottom: 28,
  },

  logoText: {
    color: "#012055",
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

  skeletonTodayInfoPill: {
    height: 48,
    marginTop: 10,
    marginBottom: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8EDF3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  skeletonTodayItem: {
    width: 74,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E7ECF2",
  },

  skeletonTodayItemSmall: {
    width: 54,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E7ECF2",
  },

  skeletonTodayDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#E2E8F0",
  },

  skeletonOngoingSection: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#D8E8F8",
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 18,
    marginBottom: 14,
  },

  skeletonNextTripSection: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 18,
  },

  skeletonSectionTitle: {
    width: 112,
    height: 20,
    borderRadius: 8,
    backgroundColor: "#E4EAF1",
    marginBottom: 16,
  },

  skeletonOngoingCard: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
    paddingVertical: 6,
  },

  skeletonCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E7ECF2",
    marginRight: 18,
  },

  skeletonOngoingInfo: {
    flex: 1,
    justifyContent: "center",
    gap: 8,
  },

  skeletonLineTitle: {
    width: "62%",
    height: 16,
    borderRadius: 8,
    backgroundColor: "#DDE4EC",
  },

  skeletonLineMedium: {
    width: "48%",
    height: 13,
    borderRadius: 7,
    backgroundColor: "#E7ECF2",
  },

  skeletonLineLong: {
    width: "78%",
    height: 13,
    borderRadius: 7,
    backgroundColor: "#E7ECF2",
  },

  skeletonChevron: {
    width: 10,
    height: 18,
    borderRadius: 5,
    backgroundColor: "#E7ECF2",
    marginLeft: 12,
  },

  skeletonAddButton: {
    height: 60,
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: "#D8E2F2",
  },

  skeletonNextTripCard: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
  },

  skeletonThumbnail: {
    width: 82,
    height: 82,
    borderRadius: 14,
    backgroundColor: "#DDE8F5",
    marginRight: 18,
  },

  skeletonNextTripInfo: {
    flex: 1,
    gap: 9,
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
    marginTop: 10,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    fontSize: 16,
    lineHeight: 20,
  },

  todayInfoText: {
    flexShrink: 0,
    minWidth: 0,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
    color: "#334155",
    textAlign: "center",
  },
  todayDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#E2E8F0",
  },

  notificationLoadingBox: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notificationLoadingText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
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
    paddingTop: 20,
    paddingBottom: 18,
    marginBottom: 14,
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
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginBottom: 16,
  },

  ongoingCard: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    position: "relative",
    paddingRight: 44,
    paddingVertical: 6,
  },

  ongoingCardChevron: {
    position: "absolute",
    right: 0,
    top: "50%",
    marginTop: -16,
  },

  nextTripCardChevron: {
    position: "absolute",
    right: 0,
    top: "50%",
    marginTop: -12,
  },

  pinIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },

  pinEmoji: {
    fontSize: 22,
  },

  ongoingInfo: {
    flex: 1,
    justifyContent: "center",
    marginTop: -4,
  },

  ongoingTitle: {
    color: "#012055",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 3,
  },

  ongoingLocation: {
    color: "#8A9BB2",
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 3,
  },

  ongoingDateRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  ongoingDateText: {
    color: "#8A9BB2",
    fontSize: 14,
    fontWeight: "400",
    marginLeft: 6,
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
    paddingTop: 20,
    paddingBottom: 18,
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
    marginTop: 4,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 18,
    paddingHorizontal: 20,
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
    position: "relative",
    paddingRight: 44,
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
    color: "#012055",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 8,
  },

  nextTripMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  nextTripMetaText: {
    color: "#8A9BB2",
    fontSize: 14,
    fontWeight: "400",
    marginLeft: 6,
  },

  newScheduleCardButton: {
    height: 60,
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: "#2158E8",
    borderWidth: 0,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#2158E8",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },

  newScheduleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  newScheduleTextBox: {
    flex: 1,
  },

  newScheduleTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
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
