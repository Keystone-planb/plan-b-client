#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "../..");

const read = (relativePath) =>
  fs.readFileSync(path.join(rootDir, relativePath), "utf8");

const pickerSource = read("src/components/common/VisitTimePickerPanel.tsx");
const screenSource = read("src/screens/PlanAScreen.tsx");
const placesHookSource = read("src/hooks/usePlanAPlaces.ts");
const utilsSource = read("src/utils/planA/planAScreenUtils.ts");

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

if (failures.length > 0) {
  console.error("Plan A time picker QA failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log("Plan A time picker QA passed.");
