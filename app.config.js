import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config, // app.json의 기본 설정들을 유지합니다.
    
    // 1. Linking 경고 해결을 위한 scheme 추가
    scheme: "planb", 

    // 2. Android 설정 주입
    android: {
      ...config.android,
      package: "com.anonymous.keystone",
      config: {
        ...config.android?.config,
        googleMaps: {
          // .env 키를 우선으로 하되, 빌드 시점에 안 읽힐 경우를 대비해 실제 키를 백업으로 넣으세요.
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY || "AIzaSy...실제_구글_지도_키_직접_입력"
        }
      }
    },

    // 3. iOS 설정 주입
    ios: {
      ...config.ios,
      bundleIdentifier: "com.anonymous.keystone",
      config: {
        ...config.ios?.config,
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY || "AIzaSy...실제_구글_지도_키_직접_입력"
      }
    },

    // 4. 기타 설정 유지 (EAS 등)
    extra: {
      ...config.extra,
      eas: {
        projectId: "ae4365b2-a5ee-46b6-b12c-e4ef3fd10f7a"
      }
    }
  };
};