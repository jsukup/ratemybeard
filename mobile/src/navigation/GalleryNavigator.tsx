import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import LeaderboardScreen from '../screens/LeaderboardScreen';
import ImageDetailScreen from '../screens/ImageDetailScreen';
import type { GalleryStackParamList } from '../types/navigation';
import { colors } from '../constants/colors';

const Stack = createStackNavigator<GalleryStackParamList>();

export default function GalleryNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background.primary,
          shadowOpacity: 0.1,
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
          color: colors.text.primary,
        },
        headerBackTitleVisible: false,
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen
        name="GalleryMain"
        component={LeaderboardScreen}
        options={{
          title: 'Gallery',
        }}
      />
      <Stack.Screen
        name="ImageDetail"
        component={ImageDetailScreen}
        options={{
          title: 'Image Details',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}