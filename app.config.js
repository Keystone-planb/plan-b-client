const appJson = require("./app.json");

module.exports = ({ config }) => ({
  ...config,
  ...appJson.expo,
  android: {
    ...appJson.expo.android,
    config: {
      ...(appJson.expo.android?.config ?? {}),
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY ?? "",
      },
    },
  },
});
