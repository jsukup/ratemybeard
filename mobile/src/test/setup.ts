import '@testing-library/jest-native/extend-expect';

// Mock Expo modules
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Error: 'error',
    Warning: 'warning',
  },
}));

jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  CameraType: {
    back: 'back',
    front: 'front',
  },
  useCameraPermissions: () => [
    { granted: true },
    jest.fn()
  ],
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Supabase
jest.mock('../services/supabase', () => ({
  uploadImage: jest.fn(),
  createImageRecord: jest.fn(),
  submitRating: jest.fn(),
  getImagesByCategory: jest.fn(),
  getNewestImages: jest.fn(),
}));

// Global test utilities
global.fetch = jest.fn();