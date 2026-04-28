import AsyncStorage from "@react-native-async-storage/async-storage";

import { TravelSchedule } from "../../types/schedule";

const PLAN_A_SCHEDULE_PREFIX = "plan_a_schedule:";
const LATEST_PLAN_A_SCHEDULE_ID_KEY = "latest_plan_a_schedule_id";

export const getPlanAScheduleStorageKey = (scheduleId: string) => {
  return `${PLAN_A_SCHEDULE_PREFIX}${scheduleId}`;
};

export const savePlanASchedule = async (schedule: TravelSchedule) => {
  const storageKey = getPlanAScheduleStorageKey(schedule.id);
  const serializedSchedule = JSON.stringify(schedule);

  await AsyncStorage.multiSet([
    [storageKey, serializedSchedule],
    [LATEST_PLAN_A_SCHEDULE_ID_KEY, schedule.id],
  ]);

  console.log("[PlanAStorage 저장 완료]", {
    scheduleId: schedule.id,
    storageKey,
    tripName: schedule.tripName,
  });

  return schedule;
};

export const loadPlanASchedule = async (scheduleId: string) => {
  const storageKey = getPlanAScheduleStorageKey(scheduleId);
  const rawSchedule = await AsyncStorage.getItem(storageKey);

  console.log("[PlanAStorage 단일 조회]", {
    scheduleId,
    storageKey,
    found: Boolean(rawSchedule),
  });

  if (!rawSchedule) {
    return null;
  }

  return JSON.parse(rawSchedule) as TravelSchedule;
};

export const loadLatestPlanASchedule = async () => {
  const latestScheduleId = await AsyncStorage.getItem(
    LATEST_PLAN_A_SCHEDULE_ID_KEY,
  );

  console.log("[PlanAStorage 최신 ID 조회]", latestScheduleId);

  if (!latestScheduleId) {
    return null;
  }

  return loadPlanASchedule(latestScheduleId);
};

export const removePlanASchedule = async (scheduleId: string) => {
  const storageKey = getPlanAScheduleStorageKey(scheduleId);

  await AsyncStorage.removeItem(storageKey);

  const latestScheduleId = await AsyncStorage.getItem(
    LATEST_PLAN_A_SCHEDULE_ID_KEY,
  );

  if (latestScheduleId === scheduleId) {
    await AsyncStorage.removeItem(LATEST_PLAN_A_SCHEDULE_ID_KEY);
  }
};

export const clearPlanAStorageForDebug = async () => {
  const latestScheduleId = await AsyncStorage.getItem(
    LATEST_PLAN_A_SCHEDULE_ID_KEY,
  );

  if (latestScheduleId) {
    await AsyncStorage.removeItem(getPlanAScheduleStorageKey(latestScheduleId));
  }

  await AsyncStorage.removeItem(LATEST_PLAN_A_SCHEDULE_ID_KEY);
};
