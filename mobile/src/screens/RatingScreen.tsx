import React from 'react';
import { View, StyleSheet, Image, ScrollView, Text, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import RatingInterface from '../components/RatingInterface';

type RatingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Rating'>;
type RatingScreenRouteProp = RouteProp<RootStackParamList, 'Rating'>;

interface Props {
  navigation: RatingScreenNavigationProp;
  route: RatingScreenRouteProp;
}

export default function RatingScreen({ navigation, route }: Props) {
  const { imageId, username, imageUrl } = route.params;

  const handleRatingSubmit = (rating: number, updatedStats?: { median_score: number; rating_count: number }) => {
    console.log('Rating submitted:', { imageId, rating, updatedStats });
    
    // Navigate back to home or leaderboard after successful rating
    navigation.navigate('Leaderboard');
  };

  const navigateToLeaderboard = () => {
    navigation.navigate('Leaderboard');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
        <View style={styles.imageOverlay}>
          <Text style={styles.usernameText}>{username}</Text>
        </View>
      </View>

      <RatingInterface
        imageId={imageId}
        username={username}
        onRatingSubmit={handleRatingSubmit}
      />

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.leaderboardButton}
          onPress={navigateToLeaderboard}
        >
          <Text style={styles.leaderboardButtonText}>View Leaderboard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  imageContainer: {
    position: 'relative',
    height: 400,
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  usernameText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionContainer: {
    padding: 20,
    alignItems: 'center',
  },
  leaderboardButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
  },
  leaderboardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});