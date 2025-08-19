import 'dotenv/config';

export default {
  expo: {
    name: "RateMyFeet",
    slug: "ratemyfeet-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.ratemyfeet.mobile"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.ratemyfeet.mobile"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-camera",
      [
        "expo-image-picker",
        {
          "photosPermission": "The app accesses your photos to let you select images to rate.",
          "cameraPermission": "The app accesses your camera to let you capture images for rating."
        }
      ]
    ],
    extra: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: "ratemyfeet-mobile-project"
      }
    }
  }
};