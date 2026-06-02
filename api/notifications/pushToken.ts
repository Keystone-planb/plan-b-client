import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_CONFIG } from "../config";

type RegisterPushTokenParams = {
  expoPushToken: string;
};

type RegisterPushTokenResponse = {
  message?: string;
};

const getStoredAccessToken = async () => {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage.getItem("access_token");
  }

  return AsyncStorage.getItem("access_token");
};

export const registerPushToken = async ({
  expoPushToken,
}: RegisterPushTokenParams) => {
  try {
    const accessToken = await getStoredAccessToken();

    if (!accessToken) {
      console.log("[push] access token 없음 - push token 서버 등록 생략");
      return {
        success: false,
        skipped: true,
      };
    }

    console.log("[push] push token 서버 등록 요청:", {
      endpoint: "/api/users/me/push-token",
      hasToken: Boolean(expoPushToken),
    });

    const response = await axios.post<RegisterPushTokenResponse>(
      `${API_CONFIG.BASE_URL}/api/users/me/push-token`,
      {
        expoPushToken,
      },
      {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    console.log("[push] push token 서버 등록 완료:", {
      message: response.data?.message,
    });

    return {
      success: true,
      message: response.data?.message,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log("[push] push token 서버 등록 실패:", {
        status: error.response?.status,
        message: error.message,
      });

      return {
        success: false,
        status: error.response?.status,
      };
    }

    console.log("[push] push token 서버 등록 실패:", error);

    return {
      success: false,
    };
  }
};
