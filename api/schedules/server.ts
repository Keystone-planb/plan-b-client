/**
 * 기존 import 경로 호환용 barrel file.
 *
 * 기존 코드:
 * import { getTrips } from "api/schedules/server";
 *
 * 위 import를 변경하지 않고 내부 구현만 기능별로 분리한다.
 */

export * from "./types";
export * from "./trips";
export * from "./plans";
export * from "./memos";
export * from "./recommendations";
