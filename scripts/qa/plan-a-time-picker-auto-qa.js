#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "../..");

const read = (relativePath) =>
  fs.readFileSync(path.join(rootDir, relativePath), "utf8");

const pickerSource = read("src/components/common/VisitTimePickerPanel.tsx");
const screenSource = read("src/screens/PlanAScreen.tsx");
const placesHookSource = read("src/hooks/usePlanAPlaces.ts");
const utilsSource = read("src/utils/planA/planAScreenUtils.ts");
const validationUtilsSource = read("src/utils/planA/planAValidationUtils.ts");

const failures = [];

const check = (label, passed) => {
  if (!passed) failures.push(label);
};

const count = (source, pattern) => {
  const matches = source.match(pattern);
  return matches ? matches.length : 0;
};

const between = (source, start, end) => {
  const startIndex = source.indexOf(start);
  if (startIndex === -1) return "";

  const endIndex = source.indexOf(end, startIndex);
  if (endIndex === -1) return "";

  return source.slice(startIndex, endIndex + end.length);
};

const getStyleBlock = (source, styleName) => {
  const start = source.indexOf(`${styleName}: {`);
  if (start === -1) return "";

  const end = source.indexOf("  },", start);
  if (end === -1) return "";

  return source.slice(start, end);
};

const loadTsModule = (relativePath) => {
  const source = read(relativePath);
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const module = { exports: {} };
  const sandbox = {
    console,
    exports: module.exports,
    module,
    require,
  };

  vm.runInNewContext(compiled, sandbox, {
    filename: relativePath,
  });

  return module.exports;
};

const makePlace = (overrides) => ({
  id: overrides.id,
  name: overrides.name,
  time: overrides.time ?? "",
  visitTime: overrides.visitTime,
  endTime: overrides.endTime,
  memos: [],
  order: overrides.order ?? 1,
  createdAt: "2026-06-25T00:00:00.000Z",
  updatedAt: "2026-06-25T00:00:00.000Z",
});

const makeSchedule = (places) => ({
  id: "qa-schedule",
  tripName: "Plan A QA",
  startDate: "2026-06-25",
  endDate: "2026-06-25",
  location: "수원",
  days: [
    {
      day: 1,
      places,
    },
  ],
  createdAt: "2026-06-25T00:00:00.000Z",
  updatedAt: "2026-06-25T00:00:00.000Z",
});

const sameNames = (actual, expected) =>
  actual.length === expected.length &&
  expected.every((name) => actual.includes(name));

const hourSyncEffect = between(
  pickerSource,
  "if (lastSyncedHourRef.current === hour) return;",
  "}, [hour]);",
);

const minuteSyncEffect = between(
  pickerSource,
  "if (lastSyncedMinuteRef.current === minute) return;",
  "}, [minute]);",
);

check(
  "minute 변경 시 hour scrollTo가 다시 실행되지 않도록 combined [hour, minute] effect가 없어야 한다",
  !pickerSource.includes("}, [hour, minute]);"),
);

check(
  "hour 동기화 effect는 hour 값만 의존해야 한다",
  hourSyncEffect.includes("hourRef.current?.scrollTo") &&
    hourSyncEffect.includes("lastSyncedHourRef.current = hour") &&
    !hourSyncEffect.includes("minuteRef.current?.scrollTo"),
);

check(
  "minute 동기화 effect는 minute 값만 의존해야 한다",
  minuteSyncEffect.includes("minuteRef.current?.scrollTo") &&
    minuteSyncEffect.includes("lastSyncedMinuteRef.current = minute") &&
    !minuteSyncEffect.includes("hourRef.current?.scrollTo"),
);

check(
  "scroll end 확정은 onMomentumScrollEnd만 사용하고 onScrollEndDrag 중복 호출 경로는 없어야 한다",
  count(pickerSource, /onMomentumScrollEnd=/g) === 2 &&
    !pickerSource.includes("onScrollEndDrag="),
);

check(
  "같은 normalized 값의 중복 onMomentumScrollEnd는 다시 처리하지 않아야 한다",
  pickerSource.includes("lastHandledHourValueRef.current === normalized") &&
    pickerSource.includes("lastHandledMinuteValueRef.current === normalized") &&
    count(pickerSource, /moveByStep\(/g) === 2,
);

check(
  "hour/minute ScrollView 모두 iOS bounce와 overscroll이 꺼져 있어야 한다",
  count(pickerSource, /bounces=\{false\}/g) === 2 &&
    count(pickerSource, /overScrollMode="never"/g) === 2,
);

const activeWheelStyle = getStyleBlock(pickerSource, "wheelItemTextActive");
check(
  "active wheel item은 색상과 굵기만 바꾸고 크기/간격/높이를 바꾸면 안 된다",
  activeWheelStyle.includes('color: "#2158E8"') &&
    activeWheelStyle.includes('fontWeight: "900"') &&
    !/(fontSize|lineHeight|height|margin|padding):/.test(activeWheelStyle),
);

check(
  "시작/종료 시간 탭 전환 시 preview 값과 저장 대상 시간이 target 기준으로 유지되어야 한다",
  pickerSource.includes('onSwitchTarget("visitTime")') &&
    pickerSource.includes('onSwitchTarget("endTime")') &&
    pickerSource.includes('target === "visitTime" ? previewText : visitTimeText') &&
    pickerSource.includes('target === "endTime" ? previewText : endTimeText'),
);

check(
  "종료 시간이 시작 시간보다 빠르거나 같으면 저장 버튼이 disabled 되어야 한다",
  pickerSource.includes("toMinutes(selectedVisitTime) < toMinutes(selectedEndTime)") &&
    pickerSource.includes("disabled={!canSave}") &&
    pickerSource.includes("!canSave && styles.timeModalSaveButtonDisabled"),
);

check(
  "기존 시간이 있는 장소는 최종 저장 검증에서 legacy/display time fallback을 거쳐야 한다",
  screenSource.includes("normalizePlaceTimeForValidation") &&
    screenSource.includes("getPlaceVisitTime(place)") &&
    screenSource.includes("getPlaceEndTime(place)") &&
    utilsSource.includes("parseLegacyDisplayTime(place.time).visitTime") &&
    utilsSource.includes("parseLegacyDisplayTime(place.time).endTime") &&
    utilsSource.includes("getMissingTimePlaceNames"),
);

check(
  "PlanAScreen 저장 검증은 selectedDay의 currentPlaces를 반영한 scheduleForValidation을 만들어야 한다",
  screenSource.includes("buildScheduleForTimeValidation(") &&
    screenSource.includes("scheduleForTimeValidation") &&
    validationUtilsSource.includes("export const buildScheduleForTimeValidation") &&
    validationUtilsSource.includes("dayNumber !== selectedDay") &&
    validationUtilsSource.includes("currentPlaces.map"),
);

const updatePlaceTimeBlock = between(
  placesHookSource,
  "const handleUpdatePlaceTime = (",
  "const updatedPlace = nextSchedule.days",
);

check(
  "하나의 장소 시간 수정 시 대상 place만 교체하고 다른 place는 그대로 유지해야 한다",
  updatePlaceTimeBlock.includes("places.map((place)") &&
    updatePlaceTimeBlock.includes("place.id === placeId") &&
    updatePlaceTimeBlock.includes("visitTime: nextVisitTime") &&
    updatePlaceTimeBlock.includes("endTime: nextEndTime") &&
    updatePlaceTimeBlock.includes(": place"),
);

const { getMissingTimePlaceNames } = loadTsModule(
  "src/utils/planA/planAScreenUtils.ts",
);
const { buildScheduleForTimeValidation } = loadTsModule(
  "src/utils/planA/planAValidationUtils.ts",
);

const legacyTimeOnlySchedule = makeSchedule([
  makePlace({
    id: "hanla",
    name: "한라면옥",
    time: "03:00 - 04:00",
    order: 1,
  }),
  makePlace({
    id: "kt-wiz-park",
    name: "수원KT위즈파크",
    time: "05:05 - 10:00",
    order: 2,
  }),
]);

check(
  "PlanA 저장 검증 데이터 QA A: time 문자열만 있는 장소는 missing이 없어야 한다",
  sameNames(getMissingTimePlaceNames(legacyTimeOnlySchedule), []),
);

const explicitTimeSchedule = makeSchedule([
  makePlace({
    id: "kt-wiz-park",
    name: "수원KT위즈파크",
    visitTime: "05:05",
    endTime: "10:00",
  }),
]);

check(
  "PlanA 저장 검증 데이터 QA B: visitTime/endTime 직접 필드가 있으면 missing이 없어야 한다",
  sameNames(getMissingTimePlaceNames(explicitTimeSchedule), []),
);

const visitOnlySchedule = makeSchedule([
  makePlace({
    id: "visit-only",
    name: "시작만 있는 장소",
    visitTime: "05:05",
  }),
]);

check(
  "PlanA 저장 검증 데이터 QA C: visitTime만 있고 endTime이 없으면 missing이어야 한다",
  sameNames(getMissingTimePlaceNames(visitOnlySchedule), ["시작만 있는 장소"]),
);

const endOnlySchedule = makeSchedule([
  makePlace({
    id: "end-only",
    name: "종료만 있는 장소",
    endTime: "10:00",
  }),
]);

check(
  "PlanA 저장 검증 데이터 QA D: endTime만 있고 visitTime이 없으면 missing이어야 한다",
  sameNames(getMissingTimePlaceNames(endOnlySchedule), ["종료만 있는 장소"]),
);

const staleSchedule = makeSchedule([
  makePlace({
    id: "kt-wiz-park",
    name: "수원KT위즈파크",
  }),
]);
const currentPlaces = [
  makePlace({
    id: "kt-wiz-park",
    name: "수원KT위즈파크",
    time: "05:05 - 10:00",
  }),
];
const scheduleForValidation = buildScheduleForTimeValidation(
  staleSchedule,
  1,
  currentPlaces,
);

check(
  "PlanA 저장 검증 데이터 QA E: selectedDay currentPlaces의 시간이 stale schedule보다 우선되어야 한다",
  !getMissingTimePlaceNames(scheduleForValidation).includes("수원KT위즈파크") &&
    staleSchedule.days[0].places[0].time === "" &&
    scheduleForValidation.days[0].places[0].time === "05:05 - 10:00" &&
    scheduleForValidation.days[0].places[0] !== currentPlaces[0],
);

if (failures.length > 0) {
  console.error("Plan A time picker QA failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log("Plan A time picker QA passed.");
