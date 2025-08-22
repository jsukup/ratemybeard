import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

type RatingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Rating'>;
type RatingScreenRouteProp = RouteProp<RootStackParamList, 'Rating'>;

interface Props {
  navigation: RatingScreenNavigationProp;
  route: RatingScreenRouteProp;
}

export default function RatingScreen({ navigation, route }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const { imageUri } = route.params;

  const submitRating = async () => {
    if (rating === null) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    try {
      // TODO: Implement rating submission using shared package
      Alert.alert('Success', 'Rating submitted successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    }
  };

  const renderRatingButtons = () => {
    const buttons = [];
    for (let i = 1; i <= 10; i++) {
      buttons.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.ratingButton,
            rating === i && styles.selectedRatingButton
          ]}
          onPress={() => setRating(i)}
        >
          <Text style={[
            styles.ratingButtonText,
            rating === i && styles.selectedRatingButtonText
          ]}>
            {i}
          </Text>
        </TouchableOpacity>
      );
    }
    return buttons;
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUri }} style={styles.image} />
      
      <Text style={styles.title}>Rate this image</Text>
      <Text style={styles.subtitle}>Select a rating from 1-10</Text>
      
      <View style={styles.ratingContainer}>
        {renderRatingButtons()}
      </View>
      
      {rating && (
        <Text style={styles.selectedRating}>
          Selected: {rating}/10
        </Text>
      )}
      
      <TouchableOpacity 
        style={[styles.submitButton, !rating && styles.disabledButton]}
        onPress={submitRating}
        disabled={!rating}
      >
        <Text style={styles.submitButtonText}>Submit Rating</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  ratingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  ratingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  selectedRatingButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  ratingButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  selectedRatingButtonText: {
    color: 'white',
  },
  selectedRating: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#007AFF',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});