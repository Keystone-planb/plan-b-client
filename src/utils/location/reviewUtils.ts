// src/utils/location/reviewUtils.ts

type ReviewItem = {
  text: string;
  rating?: number;
  relativeTimeDescription?: string;
  authorName?: string;
};

const MOCK_LIKE_SUMMARY_PATTERNS = [
  "분위기 있는 인테리어",
  "친절한 직원으로 유명한 카페",
  "커피 퀄리티가 높고",
  "디저트도 맛있습니다",
  "힐링 분위기와 잘 맞는 조용한 카페",
  "오후 방문을 추천합니다",
];

const unwrapApiData = (source: unknown) => {
  if (!source || typeof source !== "object") return source;

  const objectSource = source as Record<string, unknown>;

  return (
    objectSource.data ??
    objectSource.result ??
    objectSource.response ??
    objectSource.payload ??
    objectSource.body ??
    objectSource
  );
};

const normalizeTextValue = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);

  if (Array.isArray(value)) {
    return value.map(normalizeTextValue).filter(Boolean).join(" ");
  }

  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;

    return normalizeTextValue(
      objectValue.text ??
        objectValue.summary ??
        objectValue.reviewSummary ??
        objectValue.content ??
        objectValue.review ??
        objectValue.message ??
        objectValue.description ??
        objectValue.aiSummary,
    );
  }

  return "";
};

const getValueByPath = (source: unknown, path: string): unknown => {
  if (!source || typeof source !== "object") return undefined;

  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;

    return (current as Record<string, unknown>)[key];
  }, source);
};

const getReviewArrayByPath = (
  source: unknown,
  path: string,
): ReviewItem[] => {
  const value = getValueByPath(source, path);

  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const itemObject = item as Record<string, unknown>;

      const text = normalizeTextValue(
        itemObject.text ??
          itemObject.reviewText ??
          itemObject.content ??
          itemObject.review ??
          itemObject.comment ??
          itemObject.message,
      );

      if (!text) return null;

      const ratingRaw = itemObject.rating;
      const parsedRating =
        typeof ratingRaw === "number" ? ratingRaw
        : typeof ratingRaw === "string" ? Number(ratingRaw)
        : undefined;

      return {
        text,
        rating:
          typeof parsedRating === "number" && Number.isFinite(parsedRating)
            ? parsedRating
            : undefined,
        relativeTimeDescription: normalizeTextValue(
          itemObject.relativeTimeDescription ??
            itemObject.relativeTime ??
            itemObject.timeDescription ??
            itemObject.createdAt,
        ),
        authorName: normalizeTextValue(
          itemObject.authorName ??
            itemObject.userName ??
            itemObject.author ??
            itemObject.name,
        ),
      };
    })
    .filter(Boolean) as ReviewItem[];
};

export const getDetailReviews = (detail: unknown) => {
  const unwrappedDetail = unwrapApiData(detail);

  const reviewPaths = [
    "reviews",
    "googleReviews",
    "reviewList",
    "data.reviews",
    "data.googleReviews",
    "result.reviews",
    "result.googleReviews",
    "payload.reviews",
    "payload.googleReviews",
  ];

  for (const path of reviewPaths) {
    const reviews = getReviewArrayByPath(unwrappedDetail, path);

    if (reviews.length > 0) return reviews;
  }

  return [];
};

export const isMockLikeSummary = (summary: string) => {
  const normalized = summary.trim();

  if (!normalized) return false;

  return MOCK_LIKE_SUMMARY_PATTERNS.some((pattern) =>
    normalized.includes(pattern),
  );
};

export const createKeywordsFromReviews = (reviews: ReviewItem[]) => {
  const text = reviews.map((review) => review.text ?? "").join(" ");
  const keywords = new Set<string>();

  if (/야구|경기장|관람/.test(text)) {
    keywords.add("야구장");
    keywords.add("스포츠");
    keywords.add("관람");
  }

  if (/먹거리|음식|식당|쉐이크|커피/.test(text)) {
    keywords.add("먹거리");
  }

  if (/가족|아이|어린이/.test(text)) {
    keywords.add("가족");
  }

  if (/깔끔|쾌적|시설/.test(text)) {
    keywords.add("시설");
  }

  return Array.from(keywords).slice(0, 5);
};

export const createReviewSummaryFromReviews = (reviews: ReviewItem[]) => {
  if (reviews.length === 0) return "";

  const text = reviews.map((review) => review.text ?? "").join(" ");
  const summaries: string[] = [];

  if (/깔끔|쾌적|시설/.test(text)) {
    summaries.push(
      "방문객들은 시설이 깔끔하고 관람 환경이 쾌적하다고 평가했습니다.",
    );
  }

  if (/먹거리|음식|쉐이크|커피/.test(text)) {
    summaries.push("먹거리와 편의시설 선택지가 다양하다는 의견이 많았습니다.");
  }

  if (/야구|경기장|관람/.test(text)) {
    summaries.push(
      "경기 시야와 관람 만족도가 높다는 리뷰가 다수 확인되었습니다.",
    );
  }

  return summaries.slice(0, 2).join(" ");
};

export const getSpaceLabel = (value?: string) => {
  const key = String(value ?? "").toUpperCase();

  if (key === "INDOOR") return "실내";
  if (key === "OUTDOOR") return "야외";
  if (key === "MIX") return "복합";

  return "";
};

export const getPlaceTypeLabel = (value?: string) => {
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
    ESTABLISHMENT: "장소",
    LODGING: "숙소",
    HOTEL: "호텔",
    MOVIE_THEATER: "영화관",
    TOURIST_ATTRACTION: "관광명소",
    RESTAURANT: "음식점",
    BAR: "바",
    GYM: "운동시설",
  };

  return labels[key] ?? "";
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

  return labels[key] ?? "";
};

export const formatConfidenceScore = (score?: number) => {
  if (typeof score !== "number" || !Number.isFinite(score)) return "";

  if (score <= 1) return `${Math.round(score * 100)}%`;

  return `${Math.round(score)}%`;
};

export const isUsefulReviewText = (value: unknown) => {
  if (typeof value !== "string") return false;

  const normalized = value.trim();

  if (!normalized) return false;

  const uselessPatterns = [
    "데이터 부족",
    "분석 불가",
    "분석된 리뷰 정보가 없습니다",
    "아직 분석 데이터가 없습니다",
    "정보가 없습니다",
    "제공하지 않았습니다",
  ];

  return !uselessPatterns.some((pattern) => normalized.includes(pattern));
};

export const getFreshnessLabel = (status: string) => {
  if (!status) return "";

  const normalized = status.toUpperCase();

  if (normalized === "FRESH") return "FRESH";
  if (normalized === "STALE") return "STALE";
  if (normalized === "UNKNOWN") return "UNKNOWN";

  return status;
};

export const shortenAddress = (address?: string) => {
  if (!address) return "주소 정보 없음";

  return address
    .replace(/^대한민국\s*/, "")
    .replace(/^서울특별시\s*/, "서울 ")
    .replace(/^부산광역시\s*/, "부산 ")
    .replace(/^경기도\s*/, "경기 ")
    .replace(/^전북특별자치도\s*/, "전북 ")
    .replace(/^전라북도\s*/, "전북 ")
    .trim();
};
