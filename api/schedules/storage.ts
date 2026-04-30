import AsyncStorage from "@react-native-async-storage/async-storage";

const SCHEDULES_STORAGE_KEY = "schedules";

export type SavedSchedule = {
  id: string;
  tripName: string;
  startDate: string;
  endDate: string;
  location: string;
  createdAt: string;
};

export const getSchedules = async (): Promise<SavedSchedule[]> => {
  const rawSchedules = await AsyncStorage.getItem(SCHEDULES_STORAGE_KEY);

  if (!rawSchedules) {
    return [];
  }

  try {
    return JSON.parse(rawSchedules) as SavedSchedule[];
  } catch (error) {
        return [];
  }
};

export const saveSchedule = async (
  schedule: Omit<SavedSchedule, "id" | "createdAt">,
) => {
  const prevSchedules = await getSchedules();

  const newSchedule: SavedSchedule = {
    id: `${Date.now()}`,
    ...schedule,
    createdAt: new Date().toISOString(),
  };

  const nextSchedules = [newSchedule, ...prevSchedules];

  await AsyncStorage.setItem(
    SCHEDULES_STORAGE_KEY,
    JSON.stringify(nextSchedules),
  );

  return newSchedule;
};

export const clearSchedules = async () => {
  await AsyncStorage.removeItem(SCHEDULES_STORAGE_KEY);
};
