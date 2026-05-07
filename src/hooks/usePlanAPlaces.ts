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
  tripName: string;
  startDate: string;
  endDate: string;
  location?: string;
  scheduleId?: string;
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
  tripName,
  startDate,
  endDate,
  location,
  scheduleId,
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

      if (loadedRouteKeyRef.current === routeKey) {
        return;
      }

      const cachedDraft = getCachedDraftSchedule(scheduleId);

      if (cachedDraft) {
        console.log("[PlanA hook draft cache 사용]", {
          scheduleId: cachedDraft.id,
          placeCount: cachedDraft.days.reduce(
            (sum, day) => sum + day.places.length,
            0,
          ),
        });

        scheduleRef.current = cachedDraft;
        setSchedule(cachedDraft);
        setLoadedSavedSchedule(true);
        setHasLoadedSavedSchedule(true);
        loadedRouteKeyRef.current = routeKey;
        return;
      }

      try {
        setLoadingSchedule(true);
        setLoadError("");

        const savedSchedule =
          scheduleId ? await loadPlanASchedule(scheduleId) : null;

        console.log("[PlanA hook 저장 일정 조회 결과]", savedSchedule);

        if (savedSchedule) {
          scheduleRef.current = savedSchedule;
          cacheDraftSchedule(savedSchedule);
          setSchedule(savedSchedule);
          setLoadedSavedSchedule(true);
        } else {
          scheduleRef.current = initialSchedule;
          cacheDraftSchedule(initialSchedule);
          setSchedule(initialSchedule);
          setLoadedSavedSchedule(false);
        }

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
    setScheduleSafely((prev) => {
      const hasTargetDay = prev.days.some((day) => day.day === dayNumber);

      const nextDays =
        hasTargetDay ?
          prev.days.map((day) =>
            day.day === dayNumber ?
              {
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

      return {
        ...prev,
        days: nextDays.sort((a, b) => a.day - b.day),
        updatedAt: createNow(),
      };
    });

    setSaveSuccessMessage("");
    setSaveError("");
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
      selectedPlaces && selectedPlaces.length > 0 ? selectedPlaces
      : selectedPlace ? [selectedPlace]
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

    updatePlacesForDay(selectedDay, (places) =>
      places.map((place) =>
        place.id === placeId ?
          {
            ...place,
            visitTime: nextVisitTime,
            endTime: nextEndTime,
            time: nextDisplayTime,
            updatedAt: createNow(),
          }
        : place,
      ),
    );

    console.log("[PlanA 장소 시간 변경 완료]", {
      day: selectedDay,
      placeId,
      visitTime: nextVisitTime,
      endTime: nextEndTime,
      time: nextDisplayTime,
    });
  };

  const resetEditingState = () => {
    setEditingMemo(null);
    setEditingMemoText("");
    setEditingPlaceId(null);
    setEditingPlaceName("");
    setEditingPlaceVisitTime("");
    setEditingPlaceEndTime("");
  };

  const handleSaveSchedule = async (): Promise<TravelSchedule> => {
    const scheduleBase: TravelSchedule = {
      ...scheduleRef.current,
      updatedAt: createNow(),
    };

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

      if (scheduleBase.serverTripId) {
        try {
          await deleteTrip(scheduleBase.serverTripId);

          console.log("[PlanA 기존 서버 여행 삭제 완료]", {
            serverTripId: scheduleBase.serverTripId,
          });
        } catch (deleteError) {
          console.log("[PlanA 기존 서버 여행 삭제 실패 - 재생성 계속 진행]", {
            serverTripId: scheduleBase.serverTripId,
            error: deleteError,
          });
        }
      }

      const createdTrip = await createTrip(toCreateTripRequest(scheduleBase));

      console.log("[PlanA 서버 여행 생성 완료]", createdTrip);

      const locationRequests = toAddLocationRequests(scheduleBase);
      const createdLocations: CreatedLocationWithDay[] = [];

      for (const item of locationRequests) {
        const createdLocation = await addLocationToTripDay({
          tripId: createdTrip.tripId,
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
        serverTripId: createdTrip.tripId,
        tripName: createdTrip.title,
        startDate: createdTrip.startDate,
        endDate: createdTrip.endDate,
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

    updatePlacesForDay(selectedDay, (places) =>
      places.map((place) =>
        place.id === editingPlaceId ?
          {
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

    handleCancelEditPlace();
  };

  const handleDeletePlace = (placeId: string) => {
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
        place.id === placeId ?
          {
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
        place.id === editingMemo.placeId ?
          {
            ...place,
            memos: place.memos.map((memo) =>
              memo.id === editingMemo.memoId ?
                {
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
        place.id === placeId ?
          {
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
