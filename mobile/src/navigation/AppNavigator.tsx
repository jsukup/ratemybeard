import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import RatingScreen from '../screens/RatingScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Rating: {
    imageId: string;
    username: string;
    imageUrl: string;
  };
  Leaderboard: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            title: 'RateMyFeet',
            headerStyle: {
              backgroundColor: '#007AFF',
            },
          }}
        />
        <Stack.Screen 
          name="Camera" 
          component={CameraScreen}
          options={{
            title: 'Capture Image',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen 
          name="Rating" 
          component={RatingScreen}
          options={({ route }) => ({
            title: `Rate ${route.params.username}`,
            headerBackTitle: 'Back',
          })}
        />
        <Stack.Screen 
          name="Leaderboard" 
          component={LeaderboardScreen}
          options={{
            title: 'Leaderboard',
            headerBackTitle: 'Back',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}