import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import MainTabNavigator from './MainTabNavigator';
import RatingScreen from '../screens/RatingScreen';
import type { RootStackParamList } from '../types/navigation';
import { colors } from '../constants/colors';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
      />
      <Stack.Screen
        name="Rating"
        component={RatingScreen}
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Rate Image',
          headerStyle: {
            backgroundColor: colors.background.primary,
            shadowOpacity: 0.1,
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 17,
            color: colors.text.primary,
          },
          headerTintColor: colors.primary,
        }}
      />
    </Stack.Navigator>
  );
}