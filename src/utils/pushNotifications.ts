import { Platform } from "react-native";
import * as Notifications from "expo-notifications";


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});



export const configureAndroidNotificationChannel = async () => {
  try {
    if (Platform.OS !== "android") {
      return;
    }

    await Notifications.setNotificationChannelAsync("weather-alerts", {
      name: "날씨 알림",
      description: "여행 일정에 영향을 줄 수 있는 날씨 알림",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2158E8",
    });

    console.log("[push] Android notification channel 설정 완료");
  } catch (error) {
    console.log("[push] Android notification channel 설정 실패:", error);
  }
};

export type PushTokenResult = {
  granted: boolean;
  expoPushToken?: string;
  reason?: string;
};

export const requestExpoPushToken = async (): Promise<PushTokenResult> => {
  try {
    await configureAndroidNotificationChannel();

    if (Platform.OS === "web") {
      console.log("[push] web에서는 푸시 토큰 발급을 생략합니다.");
      return {
        granted: false,
        reason: "web_unsupported",
      };
    }

    const currentPermission = await Notifications.getPermissionsAsync();

    let finalStatus = currentPermission.status;

    if (currentPermission.status !== "granted") {
      const requestedPermission = await Notifications.requestPermissionsAsync();
      finalStatus = requestedPermission.status;
    }

    if (finalStatus !== "granted") {
      console.log("[push] 푸시 알림 권한이 허용되지 않았습니다.");
      return {
        granted: false,
        reason: "permission_denied",
      };
    }

    const tokenResult = await Notifications.getExpoPushTokenAsync();

    console.log("[push] Expo push token 발급 완료:", {
      hasToken: Boolean(tokenResult.data),
    });

    return {
      granted: true,
      expoPushToken: tokenResult.data,
    };
  } catch (error) {
    console.log("[push] Expo push token 발급 실패:", error);

    return {
      granted: false,
      reason: "token_request_failed",
    };
  }
};

let notificationResponseListener: { remove: () => void } | null = null;

export const registerNotificationClickListener = (
  onReceive: (data: Record<string, unknown>) => void,
) => {
  try {
    if (notificationResponseListener) {
      notificationResponseListener.remove();
    }

    notificationResponseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data =
          (response.notification.request.content.data as Record<
            string,
            unknown
          >) ?? {};

        console.log("[push] notification click:", data);

        onReceive(data);
      });

    console.log("[push] notification click listener 등록 완료");
  } catch (error) {
    console.log("[push] notification click listener 등록 실패:", error);
  }
};

export const removeNotificationClickListener = () => {
  try {
    notificationResponseListener?.remove();
    notificationResponseListener = null;

    console.log("[push] notification click listener 제거 완료");
  } catch (error) {
    console.log("[push] notification click listener 제거 실패:", error);
  }
};


