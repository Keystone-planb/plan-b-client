const API_ENV = process.env.EXPO_PUBLIC_API_ENV ?? "dev";

const DEV_BASE_URL = "https://api-dev.planb-travel.cloud";
const PROD_BASE_URL = "https://api.planb-travel.cloud";

export const API_CONFIG = {
  BASE_URL: API_ENV === "prod" ? PROD_BASE_URL : DEV_BASE_URL,
  USE_MOCK: false,
};
