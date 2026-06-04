// src/utils/ongoing/loadTripDetail.ts

import type { MutableRefObject } from "react";

import { getTripDay, getTripDetail } from "../../../api/schedules/server";

type ScheduleDay = {
  day: number;
  places: any[];
};

type LoadTripDetailParams = {
  resolvedTripId?: string | number;
  refreshPlanAAt?: number | string;
  selectedDayIndex: number;
  lastTripDetailLoadKeyRef: MutableRefObject<string | null>;
  setServerDays: React.Dispatch<React.SetStateAction<ScheduleDay[]>>;
};

export const loadOngoingTripDetail = async ({
  resolvedTripId,
  refreshPlanAAt,
  selectedDayIndex,
  lastTripDetailLoadKeyRef,
  setServerDays,
}: LoadTripDetailParams) => {
  if (!resolvedTripId) return;

  const refreshKey = String(refreshPlanAAt ?? "");
  // 선택한 날짜(day)별로 따로 조회해야 하므로 loadKey에 selectedDayIndex를 포함한다.
  // (이게 없으면 1일차↔2일차 전환이 "중복 호출"로 막혀 새 날짜가 비어 보임)
  const loadKey = `${String(resolvedTripId)}:${refreshKey}:${String(
    selectedDayIndex,
  )}`;

  if (lastTripDetailLoadKeyRef.current === loadKey) {
    if (__DEV__) {
      console.log("[OngoingSchedule'] getTripDetail 중복 호출 생략:", {
        resolvedTripId,
        refreshKey,
      });
    }

    return;
  }

  lastTripDetailLoadKeyRef.current = loadKey;

  try {
    const currentDay =
      Number.isFinite(Number(selectedDayIndex)) ? selectedDayIndex + 1 : 1;

    try {
      const dayDetail = await getTripDay(resolvedTripId, currentDay);

      const nextDay: ScheduleDay = {
        day: dayDetail?.day ?? currentDay,
        places: Array.isArray(dayDetail?.places) ? dayDetail.places : [],
      };

      setServerDays((prev) => {
        const exists = prev.some(
          (day) => Number(day.day) === Number(nextDay.day),
        );

        if (!exists) {
          return [...prev, nextDay].sort(
            (a, b) => Number(a.day) - Number(b.day),
          );
        }

        return prev.map((day) =>
          Number(day.day) === Number(nextDay.day) ? nextDay : day,
        );
      });

      if (__DEV__) {
        console.log("[OngoingSchedule] getTripDay 부분 재조회 성공:", {
          tripId: resolvedTripId,
          day: currentDay,
          placeCount: nextDay.places.length,
        });
      }

      return;
    } catch (dayError) {
      if (__DEV__) {
        console.log("[OngoingSchedule] getTripDay 실패, 전체 재조회 fallback:", {
          tripId: resolvedTripId,
          day: currentDay,
          error: dayError,
        });
      }
    }

    const detail = await getTripDetail(resolvedTripId);

    const itineraries =
      Array.isArray(detail?.itineraries) ? detail.itineraries : [];

    const mappedDays: ScheduleDay[] = itineraries.map(
      (itinerary: any, index: number) => ({
        day: itinerary.day ?? index + 1,
        places: Array.isArray(itinerary.places) ? itinerary.places : [],
      }),
    );

    setServerDays(mappedDays);
  } catch (error) {
    console.log("[OngoingSchedule] getTripDetail 재조회 실패:", error);
  }
};
