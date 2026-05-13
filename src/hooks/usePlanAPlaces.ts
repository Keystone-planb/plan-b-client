import { useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  MemoItem,
  PlaceItem,
  PlacesByDay,
  SelectedPlaceParam,
  SelectedPlacesParam,
} from "../types/planA";
import { TravelSchedule } from "../types/schedule";
import {
  loadPlanASchedule,
  savePlanASchedule,
} from "../api/schedules/planAStorage";
import {
  addLocationToTripDay,
  createTrip,
  deleteTrip,
  deletePlanPlace,
  updateTrip,
  updatePlanSchedule,
  getTripDetail,
} from "../../api/schedules/server";
import {
  toAddLocationRequests,
  toCreateTripRequest,
} from "../utils/schedules/serverMapper";

type EditingMemoState = {
  placeId: string;
  memoId: string;
} | null;

type UsePlanAPlacesParams = {
  selectedDay: number;
  selectedPlace?: SelectedPlaceParam;
  selectedPlaces?: SelectedPlacesParam;
  gapSelectedPlace?: SelectedPlaceParam;
  tripName: string;
  startDate: string;
  endDate: string;
  location?: string;
  scheduleId?: string;
  serverTripId?: number | string;
  reloadKey?: number;
};

type UpdateScheduleInfoPayload = {
  tripName?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
};

type CreatedTripLocationResult = {
  tripPlaceId?: number | string;
  placeId?: string;
  name?: string;
  visitOrder?: number;
  visitTime?: string | null;
  endTime?: string | null;
  memo?: string | null;
};

type CreatedLocationWithDay = {
  day: number;
  createdLocation: CreatedTripLocationResult;
};

const NEW_SCHEDULE_ROUTE_KEY = "__new_plan_a_schedule__";

/**
 * 저장 전 Plan.A draft 보존용 메모리 캐시.
 * AddScheduleLocation → PlanA 왕복 중 screen이 새로 mount되어도
 * 기존 장소 배열이 날아가지 않게 유지한다.
 */
const DRAFT_SCHEDULE_CACHE: Record<string, TravelSchedule> = {};

const createNow = () => new Date().toISOString();

const getTripDayCount = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return 1;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 1;
  }

  const diffDays = Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  return Math.max(diffDays + 1, 1);
};

const trimScheduleDaysByTripRange = (schedule: TravelSchedule) => {
  const maxDay = getTripDayCount(schedule.startDate, schedule.endDate);

  return {
    ...schedule,
    days: schedule.days.filter((day) => Number(day.day) <= maxDay),
  };
};


const fillMissingScheduleDaysByTripRange = (schedule: TravelSchedule) => {
  const maxDay = getTripDayCount(schedule.startDate, schedule.endDate);
  const existingDays = new Map(
    schedule.days.map((day) => [Number(day.day), day]),
  );

  return {
    ...schedule,
    days: Array.from({ length: maxDay }, (_, index) => {
      const dayNumber = index + 1;
      const existingDay = existingDays.get(dayNumber);

      return (
        existingDay ?? {
          day: dayNumber,
          places: [],
        }
      );
    }),
  };
};


const createId = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const createMemo = (text: string): MemoItem => {
  const now = createNow();

  return {
    id: createId("memo"),
    text,
    createdAt: now,
    updatedAt: now,
  };
};

const toServerTimeText = (value?: string | null) => {
  return normalizeServerTimeToHHmm(value);
};

const normalizeNullableTime = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const makeDisplayTime = (
  visitTime?: string | null,
  endTime?: string | null,
) => {
  const start = normalizeNullableTime(visitTime);
  const end = normalizeNullableTime(endTime);

  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;

  return "";
};

const normalizeServerTimeToHHmm = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const raw = String(value).trim();

  if (!raw) {
    return null;
  }

  const normalized = raw
    .replace(/\s+/g, " ")
    .replace("오전", "AM")
    .replace("오후", "PM")
    .trim();

  const hhmmMatch = normalized.match(
    /^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/,
  );

  if (hhmmMatch) {
    return `${hhmmMatch[1].padStart(2, "0")}:${hhmmMatch[2]}`;
  }

  const prefixMeridiemMatch = normalized.match(
    /^(AM|PM)\s*(\d{1,2}):([0-5]\d)$/i,
  );

  if (prefixMeridiemMatch) {
    const meridiem = prefixMeridiemMatch[1].toUpperCase();
    let hour = Number(prefixMeridiemMatch[2]);
    const minute = prefixMeridiemMatch[3];

    if (meridiem === "PM" && hour < 12) {
      hour += 12;
    }

    if (meridiem === "AM" && hour === 12) {
      hour = 0;
    }

    return `${String(hour).padStart(2, "0")}:${minute}`;
  }

  const suffixMeridiemMatch = normalized.match(
    /^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i,
  );

  if (suffixMeridiemMatch) {
    let hour = Number(suffixMeridiemMatch[1]);
    const minute = suffixMeridiemMatch[2];
    const meridiem = suffixMeridiemMatch[3].toUpperCase();

    if (meridiem === "PM" && hour < 12) {
      hour += 12;
    }

    if (meridiem === "AM" && hour === 12) {
      hour = 0;
    }

    return `${String(hour).padStart(2, "0")}:${minute}`;
  }

  return null;
};

const parseLegacyTime = (time?: string | null) => {
  const normalized = normalizeNullableTime(time);

  if (!normalized || normalized === "시간 미정") {
    return {
      visitTime: null,
      endTime: null,
    };
  }

  const [start, end] = normalized.split(/\s*-\s*/);

  return {
    visitTime: normalizeNullableTime(start),
    endTime: normalizeNullableTime(end),
  };
};

const getPlaceVisitTime = (place: PlaceItem) => {
  return (
    normalizeNullableTime(place.visitTime) ??
    parseLegacyTime(place.time).visitTime
  );
};

const getPlaceEndTime = (place: PlaceItem) => {
  return (
    normalizeNullableTime(place.endTime) ?? parseLegacyTime(place.time).endTime
  );
};

const createPlace = ({
  id,
  tripPlaceId,
  serverTripPlaceId,
  placeId,
  googlePlaceId,
  name,
  address,
  category,
  latitude,
  longitude,
  time,
  visitTime,
  endTime,
  order,
  memos = [],
}: {
  id: string;
  tripPlaceId?: number | string;
  serverTripPlaceId?: number | string;
  placeId?: string;
  googlePlaceId?: string;
  name: string;
  address?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  time?: string;
  visitTime?: string | null;
  endTime?: string | null;
  order: number;
  memos?: MemoItem[];
}): PlaceItem => {
  const now = createNow();

  const legacyParsed = parseLegacyTime(time);
  const nextVisitTime =
    normalizeNullableTime(visitTime) ?? legacyParsed.visitTime;
  const nextEndTime = normalizeNullableTime(endTime) ?? legacyParsed.endTime;
  const displayTime = makeDisplayTime(nextVisitTime, nextEndTime) || time || "";

  return {
    id,
    tripPlaceId,
    serverTripPlaceId,
    placeId,
    googlePlaceId,
    name,
    address,
    category,
    latitude,
    longitude,
    time: displayTime,
    visitTime: nextVisitTime,
    endTime: nextEndTime,
    order,
    memos,
    createdAt: now,
    updatedAt: now,
  };
};

const reorderPlaces = (places: PlaceItem[]) => {
  const now = createNow();

  return places.map((place, index) => ({
    ...place,
    order: index + 1,
    updatedAt: now,
  }));
};

const createInitialSchedule = ({
  scheduleId,
  tripName,
  startDate,
  endDate,
  location,
}: {
  scheduleId?: string;
  tripName: string;
  startDate: string;
  endDate: string;
  location?: string;
}): TravelSchedule => {
  const now = createNow();

  return {
    id: scheduleId ?? createId("schedule"),
    tripName,
    startDate,
    endDate,
    location: location ?? "",
    createdAt: now,
    updatedAt: now,
    days: [
      {
        day: 1,
        places: [],
      },
      {
        day: 2,
        places: [],
      },
      {
        day: 3,
        places: [],
      },
    ],
  };
};

const convertScheduleToPlacesByDay = (
  schedule: TravelSchedule,
): PlacesByDay => {
  return schedule.days.reduce<PlacesByDay>((acc, day) => {
    acc[day.day] = day.places;
    return acc;
  }, {});
};

const cacheDraftSchedule = (schedule: TravelSchedule) => {
  DRAFT_SCHEDULE_CACHE[schedule.id] = schedule;
};

const getCachedDraftSchedule = (scheduleId?: string) => {
  if (!scheduleId) return null;
  return DRAFT_SCHEDULE_CACHE[scheduleId] ?? null;
};

const getServerValueByPath = (source: unknown, path: string): unknown => {
  if (!source || typeof source !== "object") {
    return undefined;
  }

  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, source);
};

const getServerArrayByPaths = (source: unknown, paths: string[]) => {
  for (const path of paths) {
    const value = getServerValueByPath(source, path);

    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
};

const getServerTextByPaths = (source: unknown, paths: string[]) => {
  for (const path of paths) {
    const value = getServerValueByPath(source, path);

    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return undefined;
};

const getServerNumberByPaths = (source: unknown, paths: string[]) => {
  for (const path of paths) {
    const value = getServerValueByPath(source, path);

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
};

const normalizeServerPlaceForPlanA = (
  source: unknown,
  index: number,
): PlaceItem => {
  const rawTripPlaceId =
    getServerValueByPath(source, "tripPlaceId") ??
    getServerValueByPath(source, "serverTripPlaceId") ??
    getServerValueByPath(source, "planId") ??
    getServerValueByPath(source, "id");

  const tripPlaceId =
    typeof rawTripPlaceId === "number" || typeof rawTripPlaceId === "string"
      ? rawTripPlaceId
      : undefined;

  const placeId = getServerTextByPaths(source, [
    "placeId",
    "googlePlaceId",
    "google_place_id",
  ]);

  const visitTime = getServerTextByPaths(source, ["visitTime", "startTime"]);

  const endTime = getServerTextByPaths(source, ["endTime"]);

  return createPlace({
    id: String(tripPlaceId ?? placeId ?? `server-place-${index}`),
    tripPlaceId,
    serverTripPlaceId: tripPlaceId,
    placeId,
    googlePlaceId: placeId,
    name:
      getServerTextByPaths(source, ["name", "placeName"]) ?? "이름 없는 장소",
    address: getServerTextByPaths(source, [
      "address",
      "placeAddress",
      "location",
    ]),
    category: getServerTextByPaths(source, ["category", "placeCategory"]),
    latitude: getServerNumberByPaths(source, [
      "latitude",
      "lat",
      "place.latitude",
      "place.lat",
      "location.latitude",
      "location.lat",
    ]),
    longitude: getServerNumberByPaths(source, [
      "longitude",
      "lng",
      "lon",
      "place.longitude",
      "place.lng",
      "location.longitude",
      "location.lng",
    ]),
    visitTime,
    endTime,
    order: getServerNumberByPaths(source, ["visitOrder", "order"]) ?? index + 1,
    memos: [],
  });
};

const normalizeServerTripDetailToSchedule = ({
  detail,
  fallbackSchedule,
  scheduleId,
  serverTripId,
}: {
  detail: unknown;
  fallbackSchedule: TravelSchedule;
  scheduleId?: string;
  serverTripId?: number | string;
}): TravelSchedule | null => {
  const unwrapped =
    getServerValueByPath(detail, "data") ??
    getServerValueByPath(detail, "result") ??
    getServerValueByPath(detail, "payload") ??
    detail;

  const itineraryItems = getServerArrayByPaths(unwrapped, [
    "itineraries",
    "itinerary",
    "days",
    "tripDays",
  ]);

  const normalizedDays =
    itineraryItems.length > 0
      ? itineraryItems
          .map((item, dayIndex) => {
            const day =
              getServerNumberByPaths(item, ["day", "dayNumber", "dayIndex"]) ??
              dayIndex + 1;

            const places = getServerArrayByPaths(item, [
              "places",
              "locations",
              "tripPlaces",
              "plans",
            ]).map((place, placeIndex) =>
              normalizeServerPlaceForPlanA(place, placeIndex),
            );

            return {
              day,
              places,
            };
          })
          .filter((day) => day.places.length > 0)
      : (() => {
          const flatPlaces = getServerArrayByPaths(unwrapped, [
            "places",
            "locations",
            "tripPlaces",
            "plans",
          ]);

          const grouped = new Map<number, PlaceItem[]>();

          flatPlaces.forEach((place, placeIndex) => {
            const day =
              getServerNumberByPaths(place, ["day", "dayNumber"]) ?? 1;
            const normalizedPlace = normalizeServerPlaceForPlanA(
              place,
              placeIndex,
            );

            grouped.set(day, [...(grouped.get(day) ?? []), normalizedPlace]);
          });

          return Array.from(grouped.entries())
            .sort(([a], [b]) => a - b)
            .map(([day, places]) => ({
              day,
              places,
            }));
        })();

  if (normalizedDays.length === 0) {
    return null;
  }

  const now = createNow();

  return {
    ...fallbackSchedule,
    id: scheduleId ?? fallbackSchedule.id,
    serverTripId:
      typeof serverTripId === "number" || typeof serverTripId === "string"
        ? Number(serverTripId)
        : fallbackSchedule.serverTripId,
    tripName:
      getServerTextByPaths(unwrapped, ["tripName", "title", "name"]) ??
      fallbackSchedule.tripName,
    startDate:
      getServerTextByPaths(unwrapped, ["startDate"]) ??
      fallbackSchedule.startDate,
    endDate:
      getServerTextByPaths(unwrapped, ["endDate"]) ?? fallbackSchedule.endDate,
    location:
      getServerTextByPaths(unwrapped, ["location", "destination"]) ??
      fallbackSchedule.location,
    days: normalizedDays,
    updatedAt: now,
  };
};

const clearCachedDraftSchedule = (scheduleId?: string) => {
  if (!scheduleId) return;
  delete DRAFT_SCHEDULE_CACHE[scheduleId];
};

const findCreatedLocationForPlace = (
  place: PlaceItem,
  createdPlacesForDay: CreatedLocationWithDay[],
) => {
  return createdPlacesForDay.find(({ createdLocation }) => {
    const matchedByPlaceId =
      createdLocation.placeId !== undefined &&
      (createdLocation.placeId === place.id ||
        createdLocation.placeId === place.placeId ||
        createdLocation.placeId === place.googlePlaceId);

    const matchedByOrder =
      createdLocation.visitOrder !== undefined &&
      createdLocation.visitOrder === place.order;

    const matchedByName =
      createdLocation.name !== undefined && createdLocation.name === place.name;

    return Boolean(matchedByPlaceId || (matchedByOrder && matchedByName));
  });
};

const hasValidServerPlaceId = (value?: number | string) => {
  return value !== undefined && value !== null && value !== "";
};

const applyServerPlaceIdsToSchedule = ({
  schedule,
  createdLocations,
}: {
  schedule: TravelSchedule;
  createdLocations: CreatedLocationWithDay[];
}): TravelSchedule => {
  return {
    ...schedule,
    days: schedule.days.map((day) => {
      const createdPlacesForDay = createdLocations.filter(
        (item) => item.day === day.day,
      );

      return {
        ...day,
        places: day.places.map((place) => {
          const matchedCreatedPlace = findCreatedLocationForPlace(
            place,
            createdPlacesForDay,
          );

          const tripPlaceId =
            matchedCreatedPlace?.createdLocation.tripPlaceId ??
            place.tripPlaceId ??
            place.serverTripPlaceId;

          if (!hasValidServerPlaceId(tripPlaceId)) {
            return place;
          }

          const externalPlaceId =
            matchedCreatedPlace?.createdLocation.placeId ??
            place.placeId ??
            place.googlePlaceId ??
            place.id;

          const visitTime =
            matchedCreatedPlace?.createdLocation.visitTime ?? place.visitTime;
          const endTime =
            matchedCreatedPlace?.createdLocation.endTime ?? place.endTime;

          return {
            ...place,
            tripPlaceId,
            serverTripPlaceId: tripPlaceId,
            placeId: externalPlaceId ? String(externalPlaceId) : place.placeId,
            googlePlaceId:
              place.googlePlaceId ??
              (externalPlaceId ? String(externalPlaceId) : undefined),
            visitTime,
            endTime,
            time: makeDisplayTime(visitTime, endTime) || place.time,
            updatedAt: createNow(),
          };
        }),
      };
    }),
  };
};

const getSelectedPlaceKey = (day: number, place: SelectedPlaceParam) => {
  return `${day}:${place.id}:${place.placeId ?? ""}:${
    place.googlePlaceId ?? ""
  }`;
};

export function usePlanAPlaces({
  selectedDay,
  selectedPlace,
  selectedPlaces,
  gapSelectedPlace,
  tripName,
  startDate,
  endDate,
  location,
  scheduleId,
  serverTripId,
  reloadKey,
}: UsePlanAPlacesParams) {
  const initialSchedule = useMemo(
    () =>
      getCachedDraftSchedule(scheduleId) ??
      createInitialSchedule({
        scheduleId,
        tripName,
        startDate,
        endDate,
        location,
      }),
    [scheduleId, tripName, startDate, endDate, location],
  );

  const [schedule, setSchedule] = useState<TravelSchedule>(initialSchedule);
  const scheduleRef = useRef<TravelSchedule>(initialSchedule);

  const [memoDrafts, setMemoDrafts] = useState<Record<string, string>>({});

  const [editingMemo, setEditingMemo] = useState<EditingMemoState>(null);
  const [editingMemoText, setEditingMemoText] = useState("");

  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [editingPlaceName, setEditingPlaceName] = useState("");
  const [editingPlaceVisitTime, setEditingPlaceVisitTime] = useState("");
  const [editingPlaceEndTime, setEditingPlaceEndTime] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");

  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [hasLoadedSavedSchedule, setHasLoadedSavedSchedule] = useState(false);
  const [loadedSavedSchedule, setLoadedSavedSchedule] = useState(false);

  const loadedRouteKeyRef = useRef<string | null>(null);
  const savedSelectedPlaceKeyRef = useRef<Set<string>>(new Set());

  const setScheduleSafely = (
    next:
      | TravelSchedule
      | ((previousSchedule: TravelSchedule) => TravelSchedule),
  ) => {
    setSchedule((previousSchedule) => {
      const nextSchedule =
        typeof next === "function" ? next(previousSchedule) : next;

      scheduleRef.current = nextSchedule;
      cacheDraftSchedule(nextSchedule);

      return nextSchedule;
    });
  };

  const placesByDay = useMemo(() => {
    return convertScheduleToPlacesByDay(schedule);
  }, [schedule]);

  const currentPlaces = placesByDay[selectedDay] ?? [];
  const isEditingMemo = Boolean(editingMemo);

  useEffect(() => {
    const loadSavedSchedule = async () => {
      const routeKey = scheduleId ?? NEW_SCHEDULE_ROUTE_KEY;

      if (loadedRouteKeyRef.current === routeKey && !reloadKey) {
        return;
      }

      const cachedDraft = reloadKey ? null : getCachedDraftSchedule(scheduleId);

      if (cachedDraft) {
        const cachedPlaceCount = cachedDraft.days.reduce(
          (sum, day) => sum + day.places.length,
          0,
        );

        if (cachedPlaceCount > 0) {
          console.log("[PlanA hook draft cache 사용]", {
            scheduleId: cachedDraft.id,
            placeCount: cachedPlaceCount,
          });

          scheduleRef.current = cachedDraft;
          setSchedule(cachedDraft);
          setLoadedSavedSchedule(true);
          setHasLoadedSavedSchedule(true);
          loadedRouteKeyRef.current = routeKey;
          return;
        }

        console.log("[PlanA hook 빈 draft cache 무시]", {
          scheduleId: cachedDraft.id,
          placeCount: cachedPlaceCount,
        });
      }

      try {
        setLoadingSchedule(true);
        setLoadError("");

        const savedSchedule = scheduleId
          ? await loadPlanASchedule(scheduleId)
          : null;

        console.log("[PlanA hook 저장 일정 조회 결과]", savedSchedule);

        const fallbackSchedule = savedSchedule ?? initialSchedule;
        const resolvedServerTripId =
          serverTripId ??
          savedSchedule?.serverTripId ??
          fallbackSchedule.serverTripId;

        let serverSchedule: TravelSchedule | null = null;

        if (resolvedServerTripId) {
          try {
            const serverDetail = await getTripDetail(resolvedServerTripId);

            serverSchedule = normalizeServerTripDetailToSchedule({
              detail: serverDetail,
              fallbackSchedule,
              scheduleId,
              serverTripId: resolvedServerTripId,
            });

            if (serverSchedule) {
              console.log("[PlanA hook 서버 상세 우선 적용]", {
                scheduleId: serverSchedule.id,
                serverTripId: serverSchedule.serverTripId,
                places: serverSchedule.days.flatMap((day) =>
                  day.places.map((place) => ({
                    day: day.day,
                    name: place.name,
                    tripPlaceId: place.tripPlaceId,
                    placeId: place.placeId,
                  })),
                ),
              });

              await savePlanASchedule(serverSchedule);
            }
          } catch (serverError) {
            console.log("[PlanA hook 서버 상세 조회 실패 - 로컬 사용]", {
              serverTripId: resolvedServerTripId,
              error: serverError,
            });
          }
        }

        const nextSchedule = serverSchedule ?? fallbackSchedule;

        scheduleRef.current = nextSchedule;
        cacheDraftSchedule(nextSchedule);
        setSchedule(nextSchedule);
        setLoadedSavedSchedule(Boolean(savedSchedule || serverSchedule));
        loadedRouteKeyRef.current = routeKey;
        setHasLoadedSavedSchedule(true);
      } catch (error) {
        console.log("Plan.A 일정 불러오기 실패:", error);

        setLoadError("저장된 Plan.A 일정을 불러오지 못했습니다.");
        scheduleRef.current = initialSchedule;
        cacheDraftSchedule(initialSchedule);
        setSchedule(initialSchedule);
        setLoadedSavedSchedule(false);

        loadedRouteKeyRef.current = routeKey;
        setHasLoadedSavedSchedule(true);
      } finally {
        setLoadingSchedule(false);
      }
    };

    loadSavedSchedule();
  }, [scheduleId, initialSchedule]);

  const updateScheduleInfo = (payload: UpdateScheduleInfoPayload) => {
    setScheduleSafely((prev) => ({
      ...prev,
      tripName: payload.tripName ?? prev.tripName,
      startDate: payload.startDate ?? prev.startDate,
      endDate: payload.endDate ?? prev.endDate,
      location: payload.location ?? prev.location,
      updatedAt: createNow(),
    }));

    setSaveSuccessMessage("");
    setSaveError("");
  };

  const updatePlacesForDay = (
    dayNumber: number,
    updater: (places: PlaceItem[]) => PlaceItem[],
  ) => {
    const prev = scheduleRef.current;
    const hasTargetDay = prev.days.some((day) => day.day === dayNumber);

    const nextDays = hasTargetDay
      ? prev.days.map((day) =>
          day.day === dayNumber
            ? {
                ...day,
                places: reorderPlaces(updater(day.places)),
              }
            : day,
        )
      : [
          ...prev.days,
          {
            day: dayNumber,
            places: reorderPlaces(updater([])),
          },
        ];

    const nextSchedule = {
      ...prev,
      days: nextDays.sort((a, b) => a.day - b.day),
      updatedAt: createNow(),
    };

    setScheduleSafely(nextSchedule);

    setSaveSuccessMessage("");
    setSaveError("");

    return nextSchedule;
  };

  useEffect(() => {
    if (!hasLoadedSavedSchedule) return;
    if (loadedSavedSchedule) return;

    updateScheduleInfo({
      tripName,
      startDate,
      endDate,
      location,
    });
  }, [
    hasLoadedSavedSchedule,
    loadedSavedSchedule,
    tripName,
    startDate,
    endDate,
    location,
  ]);

  useEffect(() => {
    if (!hasLoadedSavedSchedule) return;

    const placesToAdd =
      selectedPlaces && selectedPlaces.length > 0
        ? selectedPlaces
        : gapSelectedPlace
          ? [gapSelectedPlace]
          : selectedPlace
            ? [selectedPlace]
            : [];

    const validPlacesToAdd = placesToAdd.filter(
      (place) => place.id && place.name,
    );

    if (validPlacesToAdd.length === 0) return;

    validPlacesToAdd.forEach((placeToAdd) => {
      const targetDay = placeToAdd.day ?? selectedDay ?? 1;
      const selectedPlaceKey = getSelectedPlaceKey(targetDay, placeToAdd);

      if (savedSelectedPlaceKeyRef.current.has(selectedPlaceKey)) {
        return;
      }

      savedSelectedPlaceKeyRef.current.add(selectedPlaceKey);

      updatePlacesForDay(targetDay, (targetPlaces) => {
        const alreadyExists = targetPlaces.some((place) => {
          const sameId = place.id === placeToAdd.id;
          const samePlaceId =
            placeToAdd.placeId !== undefined &&
            place.placeId === placeToAdd.placeId;
          const sameGooglePlaceId =
            placeToAdd.googlePlaceId !== undefined &&
            place.googlePlaceId === placeToAdd.googlePlaceId;

          return sameId || samePlaceId || sameGooglePlaceId;
        });

        if (alreadyExists) {
          return targetPlaces;
        }

        console.log("[PlanA 선택 장소 추가 완료]", {
          day: targetDay,
          placeId: placeToAdd.id,
          placeName: placeToAdd.name,
        });

        return [
          ...targetPlaces,
          createPlace({
            id: placeToAdd.id,

            tripPlaceId: placeToAdd.tripPlaceId,
            serverTripPlaceId:
              placeToAdd.serverTripPlaceId ?? placeToAdd.tripPlaceId,

            placeId:
              placeToAdd.placeId ?? placeToAdd.googlePlaceId ?? placeToAdd.id,
            googlePlaceId:
              placeToAdd.googlePlaceId ?? placeToAdd.placeId ?? placeToAdd.id,

            name: placeToAdd.name,
            address: placeToAdd.address,
            category: placeToAdd.category,
            latitude: placeToAdd.latitude,
            longitude: placeToAdd.longitude,
            time: placeToAdd.time ?? "",
            visitTime: placeToAdd.visitTime,
            endTime: placeToAdd.endTime,
            order: targetPlaces.length + 1,
          }),
        ];
      });
    });
  }, [hasLoadedSavedSchedule, selectedDay, selectedPlace, selectedPlaces]);

  const handleUpdatePlaceTime = (
    placeId: string,
    visitTime?: string | null,
    endTime?: string | null,
  ) => {
    const nextVisitTime = normalizeNullableTime(visitTime);
    const nextEndTime = normalizeNullableTime(endTime);
    const nextDisplayTime = makeDisplayTime(nextVisitTime, nextEndTime);

    const nextSchedule = updatePlacesForDay(selectedDay, (places) =>
      places.map((place) =>
        place.id === placeId
          ? {
              ...place,
              visitTime: nextVisitTime,
              endTime: nextEndTime,
              time: nextDisplayTime,
              updatedAt: createNow(),
            }
          : place,
      ),
    );

    const updatedPlace = nextSchedule.days
      .find((day) => day.day === selectedDay)
      ?.places.find((place) => place.id === placeId);

    console.log("[PlanA 장소 시간 변경 완료]", {
      day: selectedDay,
      placeId,
      visitTime: nextVisitTime,
      endTime: nextEndTime,
      time: nextDisplayTime,
    });

    savePlanASchedule(nextSchedule).catch((error) => {
      console.log("[PlanA 시간 변경 로컬 저장 실패]", error);
    });

    const planId =
      updatedPlace?.serverTripPlaceId ?? updatedPlace?.tripPlaceId;

    if (planId) {
      updatePlanSchedule(planId, {
        visitTime: toServerTimeText(nextVisitTime),
        endTime: toServerTimeText(nextEndTime),
      }).catch((error) => {
        console.log("[PlanA 시간 변경 서버 반영 실패]", {
          placeId,
          planId,
          visitTime: nextVisitTime,
          endTime: nextEndTime,
          error,
        });

        setSaveError("시간 변경을 서버에 반영하지 못했습니다.");
      });
    }
  };

  const resetEditingState = () => {
    setEditingMemo(null);
    setEditingMemoText("");
    setEditingPlaceId(null);
    setEditingPlaceName("");
    setEditingPlaceVisitTime("");
    setEditingPlaceEndTime("");
  };

  const handleUpdateTripName = (nextTripName: string) => {
    const nextSchedule: TravelSchedule = {
      ...scheduleRef.current,
      tripName: nextTripName,
      updatedAt: createNow(),
    };

    scheduleRef.current = nextSchedule;
    cacheDraftSchedule(nextSchedule);
    setSchedule(nextSchedule);
  };

  const handleSaveSchedule = async (): Promise<TravelSchedule> => {
    const scheduleBase: TravelSchedule = fillMissingScheduleDaysByTripRange(trimScheduleDaysByTripRange({
      ...scheduleRef.current,
      serverTripId:
        scheduleRef.current.serverTripId ??
        (serverTripId ? Number(serverTripId) : undefined),
      updatedAt: createNow(),
    }));

    scheduleRef.current = scheduleBase;
    cacheDraftSchedule(scheduleBase);
    setSchedule(scheduleBase);

    try {
      setSaving(true);
      setSaveError("");
      setSaveSuccessMessage("");

      const accessToken = await AsyncStorage.getItem("access_token");

      if (!accessToken) {
        console.log("[PlanA 로컬 저장]", {
          reason: "access_token 없음",
          localScheduleId: scheduleBase.id,
          tripName: scheduleBase.tripName,
        });

        await savePlanASchedule(scheduleBase);

        scheduleRef.current = scheduleBase;
        cacheDraftSchedule(scheduleBase);
        setSchedule(scheduleBase);
        setLoadedSavedSchedule(true);
        setSaveSuccessMessage("로그인 토큰이 없어 로컬에만 저장되었습니다.");

        return scheduleBase;
      }

      console.log("[PlanA 서버 저장 시도]", {
        localScheduleId: scheduleBase.id,
        serverTripId: scheduleBase.serverTripId,
        tripName: scheduleBase.tripName,
      });

      const createdTrip = scheduleBase.serverTripId
        ? await updateTrip(
            scheduleBase.serverTripId,
            toCreateTripRequest(scheduleBase),
          )
        : await createTrip(toCreateTripRequest(scheduleBase));

      console.log(
        scheduleBase.serverTripId
          ? "[PlanA 기존 서버 여행 수정 완료]"
          : "[PlanA 서버 여행 생성 완료]",
        createdTrip,
      );

      const createdTripRecord = createdTrip as unknown as {
        tripId?: number | string;
        id?: number | string;
      };

      const refreshedTripId =
        createdTripRecord.tripId ??
        createdTripRecord.id ??
        scheduleBase.serverTripId;

      if (!refreshedTripId) {
        throw new Error("서버 여행 ID를 확인하지 못했습니다.");
      }

      const refreshedTripIdNumber = Number(refreshedTripId);

      if (!Number.isFinite(refreshedTripIdNumber)) {
        throw new Error("서버 여행 ID 형식이 올바르지 않습니다.");
      }

      if (refreshedTripId) {
        try {
          const refreshedDetail = await getTripDetail(refreshedTripId);

          const refreshedSchedule = normalizeServerTripDetailToSchedule({
            detail: refreshedDetail,
            fallbackSchedule: scheduleBase,
            scheduleId: scheduleBase.id,
            serverTripId: refreshedTripId,
          });

          if (refreshedSchedule) {
            scheduleRef.current = refreshedSchedule;

            cacheDraftSchedule(refreshedSchedule);

            setSchedule(refreshedSchedule);

            await savePlanASchedule(refreshedSchedule);

            console.log("[PlanA 저장 후 서버 재동기화 완료]", {
              tripId: refreshedTripId,
            });
          }
        } catch (refreshError) {
          console.log("[PlanA 저장 후 서버 재조회 실패]", refreshError);
        }
      }

      const existingScheduleUpdateRequests: Array<{
        tripPlaceId: number | string;
        visitTime?: string | null;
        endTime?: string | null;
        memo?: string | null;
        placeName?: string;
      }> = [];

      const maxServerDay = getTripDayCount(
        scheduleBase.startDate,
        scheduleBase.endDate,
      );

      const locationRequests = toAddLocationRequests(scheduleBase)
        .filter((item) => {
          if (Number(item.day) > maxServerDay) {
            console.log("[PlanA 서버 장소 추가 차단 - 여행 기간 초과 Day]", {
              day: item.day,
              maxServerDay,
              placeName: item.payload.name,
              placeId: item.payload.place_id,
            });

            return false;
          }

          return true;
        })
        .filter(
        (item) => {
          const existingPlace = scheduleBase.days
            .find((day) => Number(day.day) === Number(item.day))
            ?.places.find((place) => {
              const requestPlaceId = String(item.payload.place_id ?? "");
              const placeIdCandidates = [
                place.placeId,
                place.googlePlaceId,
                place.id,
              ]
                .filter(Boolean)
                .map(String);

              return placeIdCandidates.includes(requestPlaceId);
            });

          const existingTripPlaceId =
            existingPlace?.serverTripPlaceId ?? existingPlace?.tripPlaceId;

          const shouldCreate = !hasValidServerPlaceId(existingTripPlaceId);

          if (!shouldCreate) {
            console.log("[PlanA 서버 장소 추가 생략 - 기존 tripPlaceId 존재]", {
              day: item.day,
              placeName: existingPlace?.name,
              placeId: item.payload.place_id,
              tripPlaceId: existingTripPlaceId,
            });

            if (existingTripPlaceId) {
              existingScheduleUpdateRequests.push({
                tripPlaceId: existingTripPlaceId,
                visitTime:
                  existingPlace?.visitTime ?? item.payload.visitTime ?? null,
                endTime: existingPlace?.endTime ?? item.payload.endTime ?? null,
                memo:
                  existingPlace?.memos?.[0]?.text ?? item.payload.memo ?? null,
                placeName: existingPlace?.name,
              });
            }
          }

          return shouldCreate;
        },
      );

      if (existingScheduleUpdateRequests.length > 0) {
        await Promise.all(
          existingScheduleUpdateRequests.map(async (item) => {
            const updatePayload = {
              visitTime: toServerTimeText(item.visitTime),
              endTime: toServerTimeText(item.endTime),
              memo: item.memo ?? null,
            };

            try {
              console.log("[PlanA 기존 서버 장소 시간/메모 PATCH 요청]", {
                tripPlaceId: item.tripPlaceId,
                placeName: item.placeName,
                payload: updatePayload,
              });

              const updateResponse = await updatePlanSchedule(
                item.tripPlaceId,
                updatePayload,
              );

              console.log("[PlanA 기존 서버 장소 시간/메모 수정 완료]", {
                tripPlaceId: item.tripPlaceId,
                placeName: item.placeName,
                response: updateResponse,
              });
            } catch (error) {
              console.log("[PlanA 기존 서버 장소 시간/메모 수정 실패]", {
                tripPlaceId: item.tripPlaceId,
                placeName: item.placeName,
                payload: updatePayload,
                error,
              });
            }
          }),
        );
      }

      const createdLocations: CreatedLocationWithDay[] = [];

      for (const item of locationRequests) {
        console.log("[QA_DUPLICATE] PlanA before addLocationToTripDay:", {
          tripId: refreshedTripId,
          day: item.day,
          placeId: item.payload.place_id,
          name: item.payload.name,
        });

        const createdLocation = await addLocationToTripDay({
          tripId: refreshedTripId,
          day: item.day,
          payload: item.payload,
        });

        createdLocations.push({
          day: item.day,
          createdLocation,
        });

        console.log("[PlanA 서버 장소 추가 완료]", createdLocation);
      }

      const scheduleWithServerPlaces = applyServerPlaceIdsToSchedule({
        schedule: scheduleBase,
        createdLocations,
      });

      const scheduleToSave: TravelSchedule = {
        ...scheduleWithServerPlaces,
        serverTripId: refreshedTripIdNumber,
        tripName: createdTrip.title ?? scheduleBase.tripName,
        startDate: createdTrip.startDate ?? scheduleBase.startDate,
        endDate: createdTrip.endDate ?? scheduleBase.endDate,
        updatedAt: createNow(),
      };

      await savePlanASchedule(scheduleToSave);

      scheduleRef.current = scheduleToSave;
      cacheDraftSchedule(scheduleToSave);
      setSchedule(scheduleToSave);
      setLoadedSavedSchedule(true);
      setSaveSuccessMessage("Plan.A 변경사항이 서버와 로컬에 저장되었습니다.");

      console.log("[PlanA 서버/로컬 저장 완료]", {
        scheduleId: scheduleToSave.id,
        serverTripId: scheduleToSave.serverTripId,
        places: scheduleToSave.days.flatMap((day) =>
          day.places.map((place) => ({
            day: day.day,
            name: place.name,
            placeId: place.placeId,
            googlePlaceId: place.googlePlaceId,
            tripPlaceId: place.tripPlaceId,
            serverTripPlaceId: place.serverTripPlaceId,
            visitTime: place.visitTime,
            endTime: place.endTime,
          })),
        ),
      });

      clearCachedDraftSchedule(scheduleBase.id);

      return scheduleToSave;
    } catch (error) {
      console.log("Plan.A 서버 저장 실패:", error);

      try {
        await savePlanASchedule(scheduleBase);

        scheduleRef.current = scheduleBase;
        cacheDraftSchedule(scheduleBase);
        setSchedule(scheduleBase);
        setLoadedSavedSchedule(true);
        setSaveError(
          "서버 저장은 실패했지만, 변경사항은 로컬에 저장되었습니다.",
        );

        return scheduleBase;
      } catch (localSaveError) {
        console.log("Plan.A 로컬 백업 저장 실패:", localSaveError);
        setSaveError("Plan.A 변경사항 저장에 실패했습니다.");

        throw localSaveError;
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditPlace = (place: PlaceItem) => {
    if (isEditingMemo) return;

    setEditingPlaceId(place.id);
    setEditingPlaceName(place.name);
    setEditingPlaceVisitTime(getPlaceVisitTime(place) ?? "");
    setEditingPlaceEndTime(getPlaceEndTime(place) ?? "");
  };

  const handleCancelEditPlace = () => {
    setEditingPlaceId(null);
    setEditingPlaceName("");
    setEditingPlaceVisitTime("");
    setEditingPlaceEndTime("");
  };

  const handleSaveEditPlace = () => {
    const trimmedName = editingPlaceName.trim();
    const nextVisitTime = normalizeNullableTime(editingPlaceVisitTime);
    const nextEndTime = normalizeNullableTime(editingPlaceEndTime);
    const nextDisplayTime = makeDisplayTime(nextVisitTime, nextEndTime);

    if (!editingPlaceId || !trimmedName) return;

    const nextSchedule = updatePlacesForDay(selectedDay, (places) =>
      places.map((place) =>
        place.id === editingPlaceId
          ? {
              ...place,
              name: trimmedName,
              visitTime: nextVisitTime,
              endTime: nextEndTime,
              time: nextDisplayTime,
              updatedAt: createNow(),
            }
          : place,
      ),
    );

    const updatedPlace = nextSchedule.days
      .find((day) => day.day === selectedDay)
      ?.places.find((place) => place.id === editingPlaceId);

    savePlanASchedule(nextSchedule).catch((error) => {
      console.log("[PlanA 장소 편집 로컬 저장 실패]", error);
    });

    const planId =
      updatedPlace?.serverTripPlaceId ?? updatedPlace?.tripPlaceId;

    if (planId) {
      updatePlanSchedule(planId, {
        visitTime: toServerTimeText(nextVisitTime),
        endTime: toServerTimeText(nextEndTime),
      }).catch((error) => {
        console.log("[PlanA 장소 편집 서버 시간 반영 실패]", {
          editingPlaceId,
          planId,
          visitTime: nextVisitTime,
          endTime: nextEndTime,
          error,
        });

        setSaveError("시간 변경을 서버에 반영하지 못했습니다.");
      });
    }

    handleCancelEditPlace();
  };

  const handleDeletePlace = async (placeId: string) => {
    const targetPlace = currentPlaces.find((place) => place.id === placeId);
    const planId = targetPlace?.serverTripPlaceId ?? targetPlace?.tripPlaceId;

    if (planId) {
      try {
        console.log("[PlanA 장소 삭제 서버 요청]", {
          placeId,
          planId,
          placeName: targetPlace?.name,
        });

        await deletePlanPlace(planId);

        console.log("[PlanA 장소 삭제 서버 완료]", {
          placeId,
          planId,
          placeName: targetPlace?.name,
        });
      } catch (error) {
        console.log("[PlanA 장소 삭제 서버 실패]", {
          placeId,
          planId,
          placeName: targetPlace?.name,
          error,
        });

        return;
      }
    }

    updatePlacesForDay(selectedDay, (places) =>
      places.filter((place) => place.id !== placeId),
    );

    setMemoDrafts((prev) => {
      const next = { ...prev };
      delete next[placeId];
      return next;
    });

    if (editingPlaceId === placeId) {
      handleCancelEditPlace();
    }

    if (editingMemo?.placeId === placeId) {
      setEditingMemo(null);
      setEditingMemoText("");
    }
  };

  const handleChangeMemoDraft = (placeId: string, value: string) => {
    setMemoDrafts((prev) => ({
      ...prev,
      [placeId]: value,
    }));
  };

  const handleAddMemo = (placeId: string) => {
    const trimmedMemo = memoDrafts[placeId]?.trim();

    if (!trimmedMemo) return;

    updatePlacesForDay(selectedDay, (places) =>
      places.map((place) =>
        place.id === placeId
          ? {
              ...place,
              memos: [...place.memos, createMemo(trimmedMemo)],
              updatedAt: createNow(),
            }
          : place,
      ),
    );

    setMemoDrafts((prev) => ({
      ...prev,
      [placeId]: "",
    }));
  };

  const handleClearMemo = (placeId: string) => {
    setMemoDrafts((prev) => ({
      ...prev,
      [placeId]: "",
    }));
  };

  const handleStartEditMemo = (placeId: string, item: MemoItem) => {
    setEditingPlaceId(null);
    setEditingPlaceName("");
    setEditingPlaceVisitTime("");
    setEditingPlaceEndTime("");

    setEditingMemo({
      placeId,
      memoId: item.id,
    });

    setEditingMemoText(item.text);
  };

  const handleCancelEditMemo = () => {
    setEditingMemo(null);
    setEditingMemoText("");
  };

  const handleSaveEditMemo = () => {
    const trimmedText = editingMemoText.trim();

    if (!editingMemo || !trimmedText) return;

    updatePlacesForDay(selectedDay, (places) =>
      places.map((place) =>
        place.id === editingMemo.placeId
          ? {
              ...place,
              memos: place.memos.map((memo) =>
                memo.id === editingMemo.memoId
                  ? {
                      ...memo,
                      text: trimmedText,
                      updatedAt: createNow(),
                    }
                  : memo,
              ),
              updatedAt: createNow(),
            }
          : place,
      ),
    );

    handleCancelEditMemo();
  };

  const handleDeleteMemo = (placeId: string, memoId: string) => {
    updatePlacesForDay(selectedDay, (places) =>
      places.map((place) =>
        place.id === placeId
          ? {
              ...place,
              memos: place.memos.filter((memo) => memo.id !== memoId),
              updatedAt: createNow(),
            }
          : place,
      ),
    );

    if (editingMemo?.placeId === placeId && editingMemo.memoId === memoId) {
      handleCancelEditMemo();
    }
  };

  return {
    schedule,
    setSchedule: setScheduleSafely,
    updateScheduleInfo,

    saving,
    saveError,
    saveSuccessMessage,
    handleSaveSchedule,
    handleUpdateTripName,

    loadingSchedule,
    loadError,

    placesByDay,
    currentPlaces,

    memoDrafts,

    editingMemo,
    editingMemoText,
    setEditingMemoText,

    editingPlaceId,
    editingPlaceName,
    setEditingPlaceName,
    editingPlaceVisitTime,
    setEditingPlaceVisitTime,
    editingPlaceEndTime,
    setEditingPlaceEndTime,

    resetEditingState,

    handleStartEditPlace,
    handleCancelEditPlace,
    handleUpdatePlaceTime,
    handleSaveEditPlace,
    handleDeletePlace,

    handleChangeMemoDraft,
    handleAddMemo,
    handleClearMemo,

    handleStartEditMemo,
    handleCancelEditMemo,
    handleSaveEditMemo,
    handleDeleteMemo,
  };
}
