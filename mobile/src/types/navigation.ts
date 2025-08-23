export type RootStackParamList = {
  MainTabs: undefined;
  Rating: { imageUri: string; imageId?: string };
  ImageDetail: { imageId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Camera: undefined;
  Gallery: undefined;
};

export type GalleryStackParamList = {
  GalleryMain: undefined;
  ImageDetail: { imageId: string };
};

// Navigation props types
import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;
export type GalleryStackNavigationProp = StackNavigationProp<GalleryStackParamList>;