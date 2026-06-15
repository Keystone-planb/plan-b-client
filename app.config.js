import "dotenv/config";

export default ({ config }) => ({
  ...config,

  name: "PLAN.B",
  slug: "keystone",
  scheme: "planb",

  android: {
    ...config.android,
    package: "com.planbtravel.app",
    config: {
      ...(config.android?.config ?? {}),
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY ?? "",
      },
    },
  },

  ios: {
    ...config.ios,
    bundleIdentifier: "com.planbtravel.app",
    config: {
      ...(config.ios?.config ?? {}),
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      ...(config.ios?.infoPlist ?? {}),
      ITSAppUsesNonExemptEncryption: false,
      LSApplicationQueriesSchemes: [
        "kakaokompassauth",
        "storykompassauth",
        "kakaolink",
        "kakaotalk",
      ],
    },
  },

  extra: {
    ...(config.extra ?? {}),
    eas: {
      projectId: "ae4365b2-a5ee-46b6-b12c-e4ef3fd10f7a",
    },
  },
});
