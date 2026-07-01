export const HOURS = Array.from(
  { length: 24 },
  (_, index) => index,
);

export const MINUTES = Array.from(
  { length: 12 },
  (_, index) => index * 5,
);

export const ITEM_HEIGHT = 34;
export const WHEEL_PADDING = ITEM_HEIGHT * 2;

export const toNumber = (
  value: string,
) => {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
};

export const padTimeUnit = (
  value: number,
) => {
  return String(value).padStart(2, "0");
};

export const isValidTimeText = (
  value?: string | null,
): value is string => {
  if (
    typeof value !== "string" ||
    !/^\d{1,2}:\d{2}$/.test(value)
  ) {
    return false;
  }

  const [hour, minute] =
    value.split(":").map(Number);

  return (
    Number.isInteger(hour) &&
    Number.isInteger(minute) &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59
  );
};

export const resolveTimeText = (
  changedValue?: string | null,
  originalValue?: string | null,
) => {
  if (isValidTimeText(changedValue)) {
    return changedValue;
  }

  if (isValidTimeText(originalValue)) {
    return originalValue;
  }

  return "";
};

export const toMinutes = (
  value?: string | null,
) => {
  if (!isValidTimeText(value)) {
    return null;
  }

  const [hour, minute] =
    value.split(":").map(Number);

  return hour * 60 + minute;
};

export const canSaveTimeRange = (
  visitTime?: string | null,
  endTime?: string | null,
) => {
  const visitMinutes =
    toMinutes(visitTime);

  const endMinutes =
    toMinutes(endTime);

  if (
    visitMinutes === null ||
    endMinutes === null
  ) {
    return false;
  }

  return visitMinutes < endMinutes;
};

export const moveByStep = (
  current: number,
  next: number,
  max: number,
  decrease: () => void,
  increase: () => void,
) => {
  if (current === next) {
    return;
  }

  const forward =
    (next - current + max) % max;

  const backward =
    (current - next + max) % max;

  const count =
    Math.min(forward, backward);

  const action =
    forward <= backward
      ? increase
      : decrease;

  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    action();
  }
};
