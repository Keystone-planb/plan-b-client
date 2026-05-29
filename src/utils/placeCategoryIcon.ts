import type { ImageSourcePropType } from "react-native";

const PLACE_CATEGORY_ICONS: Record<string, ImageSourcePropType> = {
  FOOD: require("../assets/place-icons/FOOD.png"),
  CAFE: require("../assets/place-icons/CAFE.png"),
  SIGHTS: require("../assets/place-icons/SIGHTS.png"),
  SHOP: require("../assets/place-icons/SHOP.png"),
  MARKET: require("../assets/place-icons/MARKET.png"),
  THEME: require("../assets/place-icons/THEME.png"),
  CULTURE: require("../assets/place-icons/CULTURE.png"),
  PARK: require("../assets/place-icons/PARK.png"),
  DEFAULT: require("../assets/place-icons/DEFAULT.png"),
};

const normalizePlaceCategory = (value?: string | null) => {
  if (!value) return "DEFAULT";

  const upper = String(value).trim().toUpperCase();

  if (
    upper.includes("FOOD") ||
    upper.includes("RESTAURANT") ||
    upper.includes("MEAL") ||
    upper.includes("BARBECUE") ||
    upper.includes("BBQ") ||
    upper.includes("DINING") ||
    upper.includes("음식") ||
    upper.includes("식당") ||
    upper.includes("맛집") ||
    upper.includes("고기") ||
    upper.includes("감자탕") ||
    upper.includes("화로구이")
  ) return "FOOD";
  if (upper.includes("CAFE") || upper.includes("카페")) return "CAFE";
  if (upper.includes("SHOP") || upper.includes("쇼핑")) return "SHOP";
  if (upper.includes("MARKET") || upper.includes("시장")) return "MARKET";
  if (upper.includes("THEME") || upper.includes("테마")) return "THEME";
  if (upper.includes("CULTURE") || upper.includes("문화") || upper.includes("공연")) return "CULTURE";
  if (upper.includes("PARK") || upper.includes("공원") || upper.includes("자연")) return "PARK";
  if (
    upper.includes("SIGHTS") ||
    upper.includes("TOURIST") ||
    upper.includes("LANDMARK") ||
    upper.includes("ATTRACTION") ||
    upper.includes("관광") ||
    upper.includes("명소") ||
    upper.includes("랜드마크")
  ) return "SIGHTS";

  return PLACE_CATEGORY_ICONS[upper] ? upper : "DEFAULT";
};

export const getPlaceCategoryIcon = (category?: string | null) => {
  return PLACE_CATEGORY_ICONS[normalizePlaceCategory(category)];
};
