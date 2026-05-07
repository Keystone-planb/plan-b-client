import { ScheduleMemo, SchedulePlace, TravelSchedule } from "./schedule";

export type DayOption = {
  id: number;
  label: string;
};

/**
 * Plan.A 화면에서 쓰는 메모 타입
 * schedule.ts의 ScheduleMemo를 그대로 사용한다.
 */
export type MemoItem = ScheduleMemo;

/**
 * Plan.A 화면에서 쓰는 장소 타입
 * schedule.ts의 SchedulePlace를 그대로 사용한다.
 */
export type PlaceItem = SchedulePlace;

/**
 * 기존 컴포넌트 호환용 타입
 * selectedDay 기준으로 places를 바로 꺼내 쓰기 위해 유지한다.
 */
export type PlacesByDay = Record<number, PlaceItem[]>;

/**
 * AddPlace / AddScheduleLocation → PlanA로 돌아올 때 전달하는 단일 장소 params
 */
export type SelectedPlaceParam = {
  id: string;

  /**
   * 서버 장소 ID
   * 대안 추천 payload의 tripPlaceId/currentPlanId로 사용
   */
  tripPlaceId?: number | string;
  serverTripPlaceId?: number | string;

  /**
   * 외부 장소 ID
   * Google Place ID 계열
   * 대안 추천 payload의 placeId로 사용
   */
  placeId?: string;
  googlePlaceId?: string;

  name: string;
  address?: string;
  category?: string;
  latitude?: number;
  longitude?: number;

  /**
   * 기존 UI 호환용 단일 표시 시간
   */
  time?: string;

  /**
   * 서버 명세 기준 방문 시작/종료 시간
   */
  visitTime?: string | null;
  endTime?: string | null;

  /**
   * 추가될 Day 번호
   */
  day?: number;
};

/**
 * AddScheduleLocation에서 여러 장소를 한 번에 선택해 PlanA로 넘길 때 사용
 */
export type SelectedPlacesParam = SelectedPlaceParam[];

/**
 * Plan.A 화면에서 관리할 전체 일정 타입
 */
export type PlanASchedule = TravelSchedule;
