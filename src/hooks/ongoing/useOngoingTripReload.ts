// src/hooks/ongoing/useOngoingTripReload.ts

import { MutableRefObject, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { loadOngoingTripDetail } from "../../utils/ongoing/loadTripDetail";

type ScheduleDay = {
  day: number;
  places: any[];
};

type Params = {
  resolvedTripId?: string | number;
  refreshPlanAAt?: number | string;
  selectedDayIndex: number;
  lastTripDetailLoadKeyRef: MutableRefObject<string | null>;
  setServerDays: React.Dispatch<React.SetStateAction<ScheduleDay[]>>;
};

export function useOngoingTripReload({
  resolvedTripId,
  refreshPlanAAt,
  selectedDayIndex,
  lastTripDetailLoadKeyRef,
  setServerDays,
}: Params) {
  useFocusEffect(
    useCallback(() => {
      loadOngoingTripDetail({
        resolvedTripId,
        refreshPlanAAt,
        selectedDayIndex,
        lastTripDetailLoadKeyRef,
        setServerDays,
      });
    }, [
      resolvedTripId,
      refreshPlanAAt,
      selectedDayIndex,
      lastTripDetailLoadKeyRef,
      setServerDays,
    ]),
  );
}
