import "dotenv/config";

export default ({ config }) => {
  return {
    ...config,

    scheme: "planb",

    android: {
      ...config.android,
      package: "com.planbtravel.app",
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey:
            process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY ||
            "AIzaSy...실제_구글_지도_키_직접_입력",
        },
      },
    },

    ios: {
      ...config.ios,
      bundleIdentifier: "com.planbtravel.app",
      config: {
        usesNonExemptEncryption: false,
      },
      config: {
        ...config.ios?.config,
      },
    },

    extra: {
      ...config.extra,
      eas: {
        projectId: "ae4365b2-a5ee-46b6-b12c-e4ef3fd10f7a",
      },
    },
  };
};
