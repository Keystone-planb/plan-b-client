import { getTrips, TripSummary } from "../schedules/server";

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
      order: 2,
      name: "안목해변 카페거리",
      address: "강원도 강릉시",
      time: "13:00",
    },
    {
      id: "ongoing-place-3",
      order: 3,
      name: "경포해변",
      address: "강원도 강릉시",
      time: "16:00",
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

const formatDateForHome = (date: string) => {
  return date.replaceAll("-", ".");
};

const guessLocationFromTitle = (title: string) => {
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    return "여행지";
  }

  const [firstWord] = normalizedTitle.split(/\s+/);

  return firstWord || "여행지";
};

const convertTripToUpcomingTrip = (trip: TripSummary): UpcomingTrip => {
  return {
    id: String(trip.tripId),
    title: trip.title,
    startDate: formatDateForHome(trip.startDate),
    endDate: formatDateForHome(trip.endDate),
    location: guessLocationFromTitle(trip.title),
    placeCount: 0,
    thumbnailEmoji: "✈️",
  };
};

export const getHomeSchedules = async (): Promise<HomeScheduleResponse> => {
  if (USE_HOME_MOCK) {
    return MOCK_HOME_DATA;
  }

  const trips = await getTrips("ALL");

  const ongoingTrips = trips.filter((trip) => trip.status === "ONGOING");
  const upcomingTrips = trips.filter((trip) => trip.status !== "PAST");

  /*
   * 추후 진행중 여행 상세 GET /api/trips/{tripId}를 연결하면 보완 진행..
   */
  return {
    ongoingPlaces: [],
    upcomingTrips: upcomingTrips.map(convertTripToUpcomingTrip),
  };
};
