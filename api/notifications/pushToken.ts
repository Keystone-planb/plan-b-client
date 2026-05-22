import apiClient from "../client";

type RegisterPushTokenParams = {
  expoPushToken: string;
};

type RegisterPushTokenResponse = {
  message?: string;
};

export const registerPushToken = async ({
  expoPushToken,
}: RegisterPushTokenParams) => {
  try {
    console.log("[push] push token 서버 등록 요청:", {
      endpoint: "/api/users/me/push-token",
      hasToken: Boolean(expoPushToken),
    });

    const response = await apiClient.post<RegisterPushTokenResponse>(
      "/api/users/me/push-token",
      {
        expoPushToken,
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
    console.log("[push] push token 서버 등록 실패:", error);

    return {
      success: false,
    };
  }
};
