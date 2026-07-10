import "dotenv/config";

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY ?? "";
const amplitudeApiKey = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY ?? "";

export default ({ config }) => ({
  ...config,

  name: "PLAN.B",
  slug: "keystone",
  scheme: "planb",

  android: {
    package: "com.planbtravel.app",
    adaptiveIcon: {
      foregroundImage: "./assets/logo.png",
      backgroundColor: "#F3F4F6",
    },
    config: {
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    },
  },

  ios: {
    ...(config.ios ?? {}),
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
    amplitudeApiKey,
    eas: {
      ...(config.extra?.eas ?? {}),
      projectId: "ae4365b2-a5ee-46b6-b12c-e4ef3fd10f7a",
    },
  },
});
