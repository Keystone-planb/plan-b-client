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
 * AddPlace → PlanA로 돌아올 때 전달하는 장소 params
 */
export type SelectedPlaceParam = {
  id: string;
  name: string;
  time?: string;
  day?: number;
};

/**
 * Plan.A 화면에서 관리할 전체 일정 타입
 */
export type PlanASchedule = TravelSchedule;
