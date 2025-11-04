export default {
  expo: {
    name: "accessibility-app",
    slug: "accessibility-app",
    version: "1.0.0",
    extra: {
      API_URL: process.env.API_URL,
      GOOGLE_VISION_API_KEY: process.env.GOOGLE_VISION_API_KEY,
      OCR_API_KEY: process.env.OCR_API_KEY,
      eas: {
        projectId: "516b5f0c-da2c-4425-8898-799f3246518d",
      },
    },
    android: {
      package: "com.nuhuyahuza.accessibilityapp",
    },
    plugins: [
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            minSdkVersion: 24,
            buildToolsVersion: "35.0.0",
          },
        },
      ],
    ],
  },
};
