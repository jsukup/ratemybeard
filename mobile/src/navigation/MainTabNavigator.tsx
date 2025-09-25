import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import GalleryNavigator from './GalleryNavigator';
import type { MainTabParamList } from '../types/navigation';
import { colors } from '../constants/colors';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Simple icon components (will replace with proper icons later)
const HomeIcon = ({ focused }: { focused: boolean }) => (
  <Text style={{ color: focused ? colors.tab.active : colors.tab.inactive, fontSize: 24 }}>🏠</Text>
);

const CameraIcon = ({ focused }: { focused: boolean }) => (
  <Text style={{ color: focused ? colors.tab.active : colors.tab.inactive, fontSize: 24 }}>📷</Text>
);

const GalleryIcon = ({ focused }: { focused: boolean }) => (
  <Text style={{ color: focused ? colors.tab.active : colors.tab.inactive, fontSize: 24 }}>🖼️</Text>
);

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.tab.active,
        tabBarInactiveTintColor: colors.tab.inactive,
        tabBarStyle: {
          backgroundColor: colors.tab.background,
          borderTopWidth: 1,
          borderTopColor: colors.tab.border,
          paddingBottom: 8,
          height: 88,
        },
        headerStyle: {
          backgroundColor: colors.background.primary,
          shadowOpacity: 0.1,
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
          color: colors.text.primary,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'RateMyBeard',
          tabBarIcon: HomeIcon,
        }}
      />
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          title: 'Take Photo',
          tabBarIcon: CameraIcon,
          headerShown: false, // Hide header for camera screen
        }}
      />
      <Tab.Screen
        name="Gallery"
        component={GalleryNavigator}
        options={{
          title: 'Gallery',
          tabBarIcon: GalleryIcon,
          headerShown: false, // GalleryNavigator will handle its own headers
        }}
      />
    </Tab.Navigator>
  );
}