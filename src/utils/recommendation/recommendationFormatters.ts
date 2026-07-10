export const toText = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

export const normalizeDisplayTime = (
  value?: string | null,
): string => {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return "";
  }

  const colonTimeMatch = raw.match(
    /(?:^|[Tt\s])(\d{1,2}):(\d{2})(?::?(\d{2}))?/,
  );

  if (colonTimeMatch) {
    return `${colonTimeMatch[1].padStart(2, "0")}:${colonTimeMatch[2]}`;
  }

  const compactOnlyMatch = raw.match(
    /^(\d{2})(\d{2})(\d{2})?$/,
  );

  if (compactOnlyMatch) {
    return `${compactOnlyMatch[1]}:${compactOnlyMatch[2]}`;
  }

  const compactDateTimeMatch = raw.match(
    /^\d{8}[Tt](\d{2})(\d{2})(\d{2})?$/,
  );

  if (compactDateTimeMatch) {
    return `${compactDateTimeMatch[1]}:${compactDateTimeMatch[2]}`;
  }

  return raw;
};

export const normalizeDisplayTimeRange = (
  value?: string | null,
  endValue?: string | null,
) => {
  const hasExplicitEnd =
    endValue !== undefined &&
    endValue !== null &&
    String(endValue).trim().length > 0;

  if (hasExplicitEnd) {
    const startTime = normalizeDisplayTime(value);
    const endTime = normalizeDisplayTime(endValue);

    if (startTime && endTime) {
      return `${startTime} - ${endTime}`;
    }

    if (startTime || endTime) {
      return startTime || endTime;
    }
  }

  const raw = String(value ?? "").trim();

  if (!raw) {
    return "";
  }

  const parts = raw.split(/\s+-\s+/);

  if (parts.length > 1) {
    const normalizedParts = parts
      .map((part) => normalizeDisplayTime(part))
      .filter(Boolean);

    if (normalizedParts.length > 0) {
      return normalizedParts.join(" - ");
    }
  }

  return normalizeDisplayTime(raw);
};

type PreviewTimeSource = {
  time?: string | null;
  visitTime?: string | null;
  startTime?: string | null;
  previousVisitTime?: string | null;
  beforePlanStartTime?: string | null;
  nextVisitTime?: string | null;
  afterPlanStartTime?: string | null;
  newVisitTime?: string | null;
  endTime?: string | null;
  previousEndTime?: string | null;
  beforePlanEndTime?: string | null;
  nextEndTime?: string | null;
  afterPlanEndTime?: string | null;
  newEndTime?: string | null;
  finishTime?: string | null;
  toTime?: string | null;
};

const pickFirstTimeValue = (
  values: Array<string | null | undefined>,
) => {
  for (const value of values) {
    const normalized = normalizeDisplayTime(value);

    if (normalized) {
      return normalized;
    }
  }

  return "";
};

export const getPreviewTimeParts = (
  place?: PreviewTimeSource | null,
) => {
  const visitTime = pickFirstTimeValue([
    place?.visitTime,
    place?.startTime,
    place?.previousVisitTime,
    place?.beforePlanStartTime,
    place?.nextVisitTime,
    place?.afterPlanStartTime,
    place?.newVisitTime,
  ]);

  const endTime = pickFirstTimeValue([
    place?.endTime,
    place?.previousEndTime,
    place?.beforePlanEndTime,
    place?.nextEndTime,
    place?.afterPlanEndTime,
    place?.newEndTime,
    place?.finishTime,
    place?.toTime,
  ]);

  if (visitTime || endTime) {
    return {
      visitTime: visitTime || null,
      endTime: endTime || null,
    };
  }

  const normalizedRange = normalizeDisplayTimeRange(
    place?.time,
  );

  if (normalizedRange) {
    const [rangeVisitTime, rangeEndTime] =
      normalizedRange.split(/\s*-\s*/);

    return {
      visitTime: rangeVisitTime || null,
      endTime: rangeEndTime || null,
    };
  }

  return {
    visitTime: null,
    endTime: null,
  };
};

export const getPreviewTimeText = (
  place?: PreviewTimeSource | null,
) => {
  const { visitTime, endTime } =
    getPreviewTimeParts(place);

  const visitEndTime =
    normalizeDisplayTimeRange(
      visitTime,
      endTime,
    );

  if (visitEndTime) {
    return visitEndTime;
  }

  const directTime = normalizeDisplayTimeRange(
    place?.time,
  );

  return directTime;
};

export const padPreviewTime = (value: number) =>
  String(value).padStart(2, "0");

export const splitPreviewTime = (value?: string | null) => {
  const matched = normalizeDisplayTime(value).match(
    /([01]?\d|2[0-3]):([0-5]\d)/,
  );

  return {
    hour: matched ? Number(matched[1]) : 0,
    minute: matched ? Number(matched[2]) : 0,
  };
};

export const makePreviewTime = (hour: number, minute: number) =>
  `${padPreviewTime(hour)}:${padPreviewTime(minute)}`;

export const getPreviewTimeMinutes = (value?: string | null) => {
  const matched = normalizeDisplayTime(value).match(
    /([01]?\d|2[0-3]):([0-5]\d)/,
  );

  if (!matched) {
    return null;
  }

  return Number(matched[1]) * 60 + Number(matched[2]);
};

export const pickText = (source: any, keys: string[]) => {
  for (const key of keys) {
    const value = toText(source?.[key]);
    if (value) return value;
  }

  return "";
};

export const safeParseJson = (value: unknown) => {
  if (!value || typeof value !== "string") return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const formatOpeningHoursText = (value: unknown) => {
  const parsed = safeParseJson(value);
  const weekdayText = parsed?.weekday_text;

  if (Array.isArray(weekdayText) && weekdayText.length > 0) {
    return weekdayText.join("\n");
  }

  if (typeof parsed?.open_now === "boolean") {
    return parsed.open_now ? "영업 중" : "영업 종료";
  }

  return (
    typeof value === "string" && value.trim() && !value.trim().startsWith("{")
  )
    ? value
    : "";
};

export const formatTodayOpeningHoursText = (value: unknown) => {
  const parsed = safeParseJson(value);
  const weekdayText = parsed?.weekday_text;

  const openNow =
    typeof parsed?.open_now === "boolean" ? parsed.open_now : null;

  const statusText =
    openNow === true ? "영업시간" : openNow === false ? "영업 종료" : "";

  if (Array.isArray(weekdayText) && weekdayText.length > 0) {
    const today = new Date().getDay();
    const dayLabels = [
      "일요일",
      "월요일",
      "화요일",
      "수요일",
      "목요일",
      "금요일",
      "토요일",
    ];

    const todayLabel = dayLabels[today];
    const todayRow =
      weekdayText.find((row: string) => String(row).startsWith(todayLabel)) ||
      weekdayText[0];

    const timeText = String(todayRow)
      .replace(new RegExp(`^${todayLabel}\\s*:?\\s*`), "")
      .trim();

    if (statusText && timeText) return `${statusText} · ${timeText}`;
    return timeText || statusText;
  }

  const fallback = formatOpeningHoursText(value);

  if (!fallback) return statusText;
  if (fallback === "영업 중" || fallback === "영업 종료") return fallback;

  return statusText ? `${statusText} · ${fallback}` : fallback;
};

export const formatReviewDataText = (value: unknown) => {
  const parsed = safeParseJson(value);

  if (!parsed) return "";

  if (
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    typeof parsed.totalSummary === "string"
  ) {
    return parsed.totalSummary.trim();
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return "";
  }

  return parsed
    .slice(0, 3)
    .map((review) => {
      const author = review?.author_name ? `${review.author_name}: ` : "";
      const rating =
        typeof review?.rating === "number" ? `★${review.rating} ` : "";
      const body = typeof review?.text === "string" ? review.text.trim() : "";

      return `${author}${rating}${body}`.trim();
    })
    .filter(Boolean)
    .join("\n\n");
};

export const getPlatformReviewSummary = (
  value: unknown,
  platform: "Naver" | "Google",
) => {
  const parsed = safeParseJson(value);
  const summary = parsed?.platformSummaries?.[platform];

  return typeof summary === "string" ? summary.trim() : "";
};

export const formatPriceLevel = (value: unknown) => {
  if (typeof value !== "number") return "";

  if (value <= 0) return "무료";
  return "₩".repeat(Math.min(value, 4));
};

export const unwrapData = (value: any) => {
  return value?.data ?? value?.result ?? value?.payload ?? value;
};

export const getSpaceLabel = (value?: string) => {
  const key = String(value ?? "").toUpperCase();
  if (key === "INDOOR") return "실내";
  if (key === "OUTDOOR") return "야외";
  if (key === "MIX") return "복합";
  return "";
};

export const getTypeLabel = (value?: string) => {
  const key = String(value ?? "").toUpperCase();
  const labels: Record<string, string> = {
    FOOD: "음식점",
    CAFE: "카페",
    SIGHTS: "관광명소",
    SHOP: "쇼핑",
    MARKET: "시장",
    THEME: "테마시설",
    CULTURE: "문화시설",
    PARK: "공원",
  };
  return labels[key] ?? value ?? "";
};

export const getMoodLabel = (value?: string) => {
  const key = String(value ?? "").toUpperCase();
  const labels: Record<string, string> = {
    HEALING: "힐링",
    ADVENTURE: "모험",
    ROMANTIC: "로맨틱",
    FAMILY: "가족",
    CULTURE: "문화",
    FOOD: "음식",
    NATURE: "자연",
    URBAN: "도시",
    CLASSIC: "클래식",
    TRENDY: "트렌디",
    LOCAL: "현지",
    ACTIVE: "액티브",
  };
  return labels[key] ?? value ?? "";
};

export const formatDateRange = (startDate?: string, endDate?: string) => {
  const start = startDate?.replace(/-/g, ".");
  const end = endDate?.replace(/-/g, ".");

  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;

  return "10:00 - 12:00";
};
