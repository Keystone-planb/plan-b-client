import { useEffect, useState } from "react";

import {
  MemoItem,
  PlaceItem,
  PlacesByDay,
  SelectedPlaceParam,
} from "../types/planA";

type EditingMemoState = {
  placeId: string;
  memoId: string;
} | null;

type UsePlanAPlacesParams = {
  selectedDay: number;
  selectedPlace?: SelectedPlaceParam;
};

const DEFAULT_PLACES_BY_DAY: PlacesByDay = {
  1: [
    {
      id: "place-1",
      name: "강릉역",
      time: "10:00",
      memos: [
        { id: "memo-1", text: "내일 매점 까먹지 말기" },
        { id: "memo-2", text: "강릉역 근처 맛집 확인하기" },
        { id: "memo-3", text: "카페 예약 시간 확인하기" },
      ],
    },
  ],
  2: [],
  3: [],
};

export function usePlanAPlaces({
  selectedDay,
  selectedPlace,
}: UsePlanAPlacesParams) {
  const [placesByDay, setPlacesByDay] = useState<PlacesByDay>(
    DEFAULT_PLACES_BY_DAY,
  );

  const [memoDrafts, setMemoDrafts] = useState<Record<string, string>>({});

  const [editingMemo, setEditingMemo] = useState<EditingMemoState>(null);
  const [editingMemoText, setEditingMemoText] = useState("");

  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [editingPlaceName, setEditingPlaceName] = useState("");
  const [editingPlaceTime, setEditingPlaceTime] = useState("");

  const currentPlaces = placesByDay[selectedDay] ?? [];
  const isEditingMemo = Boolean(editingMemo);

  useEffect(() => {
    if (!selectedPlace?.id || !selectedPlace.name) return;

    const targetDay = selectedPlace.day ?? 1;

    setPlacesByDay((prev) => {
      const targetPlaces = prev[targetDay] ?? [];
      const alreadyExists = targetPlaces.some(
        (place) => place.id === selectedPlace.id,
      );

      if (alreadyExists) {
        return {
          ...prev,
          [targetDay]: targetPlaces.map((place) =>
            place.id === selectedPlace.id ?
              {
                ...place,
                name: selectedPlace.name,
                time: selectedPlace.time ?? place.time,
              }
            : place,
          ),
        };
      }

      return {
        ...prev,
        [targetDay]: [
          ...targetPlaces,
          {
            id: selectedPlace.id,
            name: selectedPlace.name,
            time: selectedPlace.time ?? "10:00",
            memos: [],
          },
        ],
      };
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

    setPlacesByDay((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] ?? []).map((place) =>
        place.id === editingPlaceId ?
          {
            ...place,
            name: trimmedName,
            time: trimmedTime || "시간 미정",
          }
        : place,
      ),
    }));

    handleCancelEditPlace();
  };

  const handleDeletePlace = (placeId: string) => {
    setPlacesByDay((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] ?? []).filter(
        (place) => place.id !== placeId,
      ),
    }));

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

    setPlacesByDay((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] ?? []).map((place) =>
        place.id === placeId ?
          {
            ...place,
            memos: [
              ...place.memos,
              {
                id: `${Date.now()}`,
                text: trimmedMemo,
              },
            ],
          }
        : place,
      ),
    }));

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

    setPlacesByDay((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] ?? []).map((place) =>
        place.id === editingMemo.placeId ?
          {
            ...place,
            memos: place.memos.map((memo) =>
              memo.id === editingMemo.memoId ?
                {
                  ...memo,
                  text: trimmedText,
                }
              : memo,
            ),
          }
        : place,
      ),
    }));

    handleCancelEditMemo();
  };

  const handleDeleteMemo = (placeId: string, memoId: string) => {
    setPlacesByDay((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] ?? []).map((place) =>
        place.id === placeId ?
          {
            ...place,
            memos: place.memos.filter((memo) => memo.id !== memoId),
          }
        : place,
      ),
    }));

    if (editingMemo?.placeId === placeId && editingMemo.memoId === memoId) {
      handleCancelEditMemo();
    }
  };

  return {
    placesByDay,
    setPlacesByDay,

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
