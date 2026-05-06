import AsyncStorage from "@react-native-async-storage/async-storage";

import { TravelSchedule } from "../../types/schedule";

const PLAN_A_SCHEDULE_PREFIX = "plan_a_schedule:";
const LATEST_PLAN_A_SCHEDULE_ID_KEY = "latest_plan_a_schedule_id";
const PLAN_A_SCHEDULE_IDS_KEY = "plan_a_schedule_ids";

export const getPlanAScheduleStorageKey = (scheduleId: string) => {
  return `${PLAN_A_SCHEDULE_PREFIX}${scheduleId}`;
};

const loadPlanAScheduleIds = async () => {
  const rawIds = await AsyncStorage.getItem(PLAN_A_SCHEDULE_IDS_KEY);

  if (!rawIds) {
    return [];
  }

  try {
    const parsedIds = JSON.parse(rawIds);

    return Array.isArray(parsedIds) ?
        parsedIds.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
};

const savePlanAScheduleIds = async (ids: string[]) => {
  const uniqueIds = Array.from(new Set(ids));

  await AsyncStorage.setItem(
    PLAN_A_SCHEDULE_IDS_KEY,
    JSON.stringify(uniqueIds),
  );
};

export const savePlanASchedule = async (schedule: TravelSchedule) => {
  const storageKey = getPlanAScheduleStorageKey(schedule.id);
  const serializedSchedule = JSON.stringify(schedule);

  const prevIds = await loadPlanAScheduleIds();
  const nextIds = [schedule.id, ...prevIds.filter((id) => id !== schedule.id)];

  await AsyncStorage.multiSet([
    [storageKey, serializedSchedule],
    [LATEST_PLAN_A_SCHEDULE_ID_KEY, schedule.id],
    [PLAN_A_SCHEDULE_IDS_KEY, JSON.stringify(nextIds)],
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

export const loadAllPlanASchedules = async () => {
  const ids = await loadPlanAScheduleIds();
  const latestScheduleId = await AsyncStorage.getItem(
    LATEST_PLAN_A_SCHEDULE_ID_KEY,
  );

  const targetIds =
    ids.length > 0 ? ids
    : latestScheduleId ? [latestScheduleId]
    : [];

  const schedules = await Promise.all(
    targetIds.map((scheduleId) => loadPlanASchedule(scheduleId)),
  );

  const filteredSchedules = schedules.filter(
    (schedule): schedule is NonNullable<typeof schedule> => Boolean(schedule),
  );

  console.log("[PlanAStorage 전체 조회]", {
    ids: targetIds,
    count: filteredSchedules.length,
  });

  return filteredSchedules;
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

  const prevIds = await loadPlanAScheduleIds();
  const nextIds = prevIds.filter((id) => id !== scheduleId);
  await savePlanAScheduleIds(nextIds);
};

export const clearPlanAStorageForDebug = async () => {
  const latestScheduleId = await AsyncStorage.getItem(
    LATEST_PLAN_A_SCHEDULE_ID_KEY,
  );

  if (latestScheduleId) {
    await AsyncStorage.removeItem(getPlanAScheduleStorageKey(latestScheduleId));
  }

  await AsyncStorage.removeItem(LATEST_PLAN_A_SCHEDULE_ID_KEY);
  await AsyncStorage.removeItem(PLAN_A_SCHEDULE_IDS_KEY);
};
