import { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  MemoItem,
  PlaceItem,
  PlacesByDay,
  SelectedPlaceParam,
} from "../types/planA";
import { TravelSchedule } from "../types/schedule";
import {
  loadLatestPlanASchedule,
  loadPlanASchedule,
  savePlanASchedule,
} from "../api/schedules/planAStorage";
import {
  addTripLocation,
  AddTripLocationRequest,
  createTrip,
  CreateTripRequest,
  deleteTrip,
} from "../../api/schedules/server";

type EditingMemoState = {
  placeId: string;
  memoId: string;
} | null;

type UsePlanAPlacesParams = {
  selectedDay: number;
  selectedPlace?: SelectedPlaceParam;
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

const createNow = () => new Date().toISOString();

const createId = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const normalizeServerDate = (date: string) => {
  return date.replace(/\./g, "-");
};

const toCreateTripRequest = (schedule: TravelSchedule): CreateTripRequest => {
  return {
    title: schedule.tripName,
    startDate: normalizeServerDate(schedule.startDate),
    endDate: normalizeServerDate(schedule.endDate),
    travelStyles: ["HEALING"],
  };
};

const toAddLocationRequests = (
  schedule: TravelSchedule,
): Array<{
  day: number;
  payload: AddTripLocationRequest;
}> => {
  return schedule.days.flatMap((day) => {
    return day.places.map((place) => {
      const memoText =
        place.memos.length > 0
          ? place.memos.map((memo) => memo.text).join("\n")
          : null;

      return {
        day: day.day,
        payload: {
          place_id: place.id,
          name: place.name,
          visitTime: place.time || null,
          endTime: null,
          memo: memoText,
        },
      };
    });
  });
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

const createPlace = ({
  id,
  name,
  time,
  order,
  memos = [],
}: {
  id: string;
  name: string;
  time: string;
  order: number;
  memos?: MemoItem[];
}): PlaceItem => {
  const now = createNow();

  return {
    id,
    name,
    time,
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
        places: [
          createPlace({
            id: "place-1",
            name: "강릉역",
            time: "10:00",
            order: 1,
            memos: [
              createMemo("내일 매점 까먹지 말기"),
              createMemo("강릉역 근처 맛집 확인하기"),
              createMemo("카페 예약 시간 확인하기"),
            ],
          }),
        ],
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

export function usePlanAPlaces({
  selectedDay,
  selectedPlace,
  tripName,
  startDate,
  endDate,
  location,
  scheduleId,
}: UsePlanAPlacesParams) {
  const [schedule, setSchedule] = useState<TravelSchedule>(() =>
    createInitialSchedule({
      scheduleId,
      tripName,
      startDate,
      endDate,
      location,
    }),
  );

  const [memoDrafts, setMemoDrafts] = useState<Record<string, string>>({});

  const [editingMemo, setEditingMemo] = useState<EditingMemoState>(null);
  const [editingMemoText, setEditingMemoText] = useState("");

  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [editingPlaceName, setEditingPlaceName] = useState("");
  const [editingPlaceTime, setEditingPlaceTime] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");

  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [hasLoadedSavedSchedule, setHasLoadedSavedSchedule] = useState(false);
  const [loadedSavedSchedule, setLoadedSavedSchedule] = useState(false);

  const placesByDay = useMemo(() => {
    return convertScheduleToPlacesByDay(schedule);
  }, [schedule]);

  const currentPlaces = placesByDay[selectedDay] ?? [];
  const isEditingMemo = Boolean(editingMemo);

  useEffect(() => {
    const loadSavedSchedule = async () => {
      try {
        setLoadingSchedule(true);
        setLoadError("");

        const savedSchedule =
          scheduleId ?
            await loadPlanASchedule(scheduleId)
          : await loadLatestPlanASchedule();

        console.log("[PlanA hook 저장 일정 조회 결과]", savedSchedule);

        if (savedSchedule) {
          setSchedule(savedSchedule);
          setLoadedSavedSchedule(true);
        } else {
          setLoadedSavedSchedule(false);
        }

        setHasLoadedSavedSchedule(true);
      } catch (error) {
        console.log("Plan.A 일정 불러오기 실패:", error);
        setLoadError("저장된 Plan.A 일정을 불러오지 못했습니다.");
        setLoadedSavedSchedule(false);
        setHasLoadedSavedSchedule(true);
      } finally {
        setLoadingSchedule(false);
      }
    };

    loadSavedSchedule();
  }, [scheduleId]);

  const updateScheduleInfo = (payload: UpdateScheduleInfoPayload) => {
    setSchedule((prev) => ({
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
    setSchedule((prev) => {
      const hasTargetDay = prev.days.some((day) => day.day === dayNumber);

      const nextDays =
        hasTargetDay ?
          prev.days.map((day) =>
            day.day === dayNumber ?
              {
                ...day,
                places: updater(day.places),
              }
            : day,
          )
        : [
            ...prev.days,
            {
              day: dayNumber,
              places: updater([]),
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
    if (!selectedPlace?.id || !selectedPlace.name) return;

    const targetDay = selectedPlace.day ?? 1;

    updatePlacesForDay(targetDay, (targetPlaces) => {
      const alreadyExists = targetPlaces.some(
        (place) => place.id === selectedPlace.id,
      );

      if (alreadyExists) {
        return targetPlaces.map((place) =>
          place.id === selectedPlace.id ?
            {
              ...place,
              name: selectedPlace.name,
              time: selectedPlace.time ?? place.time,
              updatedAt: createNow(),
            }
          : place,
        );
      }

      return [
        ...targetPlaces,
        createPlace({
          id: selectedPlace.id,
          name: selectedPlace.name,
          time: selectedPlace.time ?? "10:00",
          order: targetPlaces.length + 1,
        }),
      ];
    });
  }, [
    selectedPlace?.id,
    selectedPlace?.name,
    selectedPlace?.time,
    selectedPlace?.day,
  ]);

  const resetEditingState = () => {
    setEditingMemo(null);
    setEditingMemoText("");
    setEditingPlaceId(null);
    setEditingPlaceName("");
    setEditingPlaceTime("");
  };

  const handleSaveSchedule = async () => {
    const scheduleBase = {
      ...schedule,
      updatedAt: createNow(),
    };

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

        setSchedule(scheduleBase);
        setLoadedSavedSchedule(true);
        setSaveSuccessMessage("로그인 토큰이 없어 로컬에만 저장되었습니다.");

        return;
      }

      console.log("[PlanA 서버 저장 시도]", {
        localScheduleId: scheduleBase.id,
        serverTripId: scheduleBase.serverTripId,
        tripName: scheduleBase.tripName,
      });

      if (scheduleBase.serverTripId) {
        await deleteTrip(scheduleBase.serverTripId);
        console.log("[PlanA 기존 서버 여행 삭제 완료]", {
          serverTripId: scheduleBase.serverTripId,
        });
      }

      const createdTrip = await createTrip(toCreateTripRequest(scheduleBase));

      console.log("[PlanA 서버 여행 생성 완료]", createdTrip);

      const locationRequests = toAddLocationRequests(scheduleBase);

      for (const item of locationRequests) {
        const createdLocation = await addTripLocation(
          createdTrip.tripId,
          item.day,
          item.payload,
        );

        console.log("[PlanA 서버 장소 추가 완료]", createdLocation);
      }

      const scheduleToSave = {
        ...scheduleBase,
        serverTripId: createdTrip.tripId,
        tripName: createdTrip.title,
        startDate: createdTrip.startDate,
        endDate: createdTrip.endDate,
        updatedAt: createNow(),
      };

      await savePlanASchedule(scheduleToSave);

      setSchedule(scheduleToSave);
      setLoadedSavedSchedule(true);
      setSaveSuccessMessage("Plan.A 변경사항이 서버와 로컬에 저장되었습니다.");
    } catch (error) {
      console.log("Plan.A 서버 저장 실패:", error);

      try {
        await savePlanASchedule(scheduleBase);

        setSchedule(scheduleBase);
        setLoadedSavedSchedule(true);
        setSaveError(
          "서버 저장은 실패했지만, 변경사항은 로컬에 저장되었습니다.",
        );
      } catch (localSaveError) {
        console.log("Plan.A 로컬 백업 저장 실패:", localSaveError);
        setSaveError("Plan.A 변경사항 저장에 실패했습니다.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditPlace = (place: PlaceItem) => {
    if (isEditingMemo) return;

    setEditingPlaceId(place.id);
    setEditingPlaceName(place.name);
    setEditingPlaceTime(place.time);
  };

  const handleCancelEditPlace = () => {
    setEditingPlaceId(null);
    setEditingPlaceName("");
    setEditingPlaceTime("");
  };

  const handleSaveEditPlace = () => {
    const trimmedName = editingPlaceName.trim();
    const trimmedTime = editingPlaceTime.trim();

    if (!editingPlaceId || !trimmedName) return;

    updatePlacesForDay(selectedDay, (places) =>
      places.map((place) =>
        place.id === editingPlaceId ?
          {
            ...place,
            name: trimmedName,
            time: trimmedTime || "시간 미정",
            updatedAt: createNow(),
          }
        : place,
      ),
    );

    handleCancelEditPlace();
  };

  const handleDeletePlace = (placeId: string) => {
    updatePlacesForDay(selectedDay, (places) => {
      const nextPlaces = places.filter((place) => place.id !== placeId);
      return reorderPlaces(nextPlaces);
    });

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
    setEditingPlaceTime("");

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
    setSchedule,
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
    editingPlaceTime,
    setEditingPlaceTime,

    resetEditingState,

    handleStartEditPlace,
    handleCancelEditPlace,
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
