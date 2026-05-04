import apiClient from "../client";

// true  = mock 데이터 사용, 실제 홈/일정 API 호출 안 함
// false = 실제 홈/일정 API 호출
const USE_HOME_MOCK = true;

export type OngoingPlace = {
  id: string;
  order: number;
  name: string;
  address: string;
  time: string;
};

export type UpcomingTrip = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  placeCount: number;
  thumbnailEmoji: string;
};

export type HomeScheduleResponse = {
  ongoingPlaces: OngoingPlace[];
  upcomingTrips: UpcomingTrip[];
};

const MOCK_HOME_DATA: HomeScheduleResponse = {
  ongoingPlaces: [
    {
      id: "ongoing-place-1",
      order: 1,
      name: "강릉역",
      address: "강원도 강릉시",
      time: "10:00",
    },
    {
      id: "ongoing-place-2",
      order: 1,
      name: "강릉역",
      address: "강원도 강릉시",
      time: "10:00",
    },
    {
      id: "ongoing-place-3",
      order: 1,
      name: "강릉역",
      address: "강원도 강릉시",
      time: "10:00",
    },
  ],
  upcomingTrips: [
    {
      id: "trip-jeju-1",
      title: "제주도 힐링여행",
      startDate: "2027.03.15",
      endDate: "2027.03.18",
      location: "제주",
      placeCount: 8,
      thumbnailEmoji: "🏝️",
    },
  ],
};

export const getHomeSchedules = async (): Promise<HomeScheduleResponse> => {
  console.log("[홈 일정] USE_HOME_MOCK:", USE_HOME_MOCK);

  if (USE_HOME_MOCK) {
    console.log("[홈 일정] mock 데이터 사용");
    return MOCK_HOME_DATA;
  }

  console.log("[홈 일정] 실제 API 호출:", "/api/schedules/home");

  const response = await apiClient.get<HomeScheduleResponse>(
    "/api/schedules/home",
  );

  return response.data;
};
