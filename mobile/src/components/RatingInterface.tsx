import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { validateRating } from '@shared/utils/rating';
import { supabase } from '../services/supabase';
import { sessionManager } from '../utils/storage';

interface RatingInterfaceProps {
  imageId: string;
  username: string;
  onRatingSubmit?: (rating: number, updatedStats?: { median_score: number; rating_count: number }) => void;
  disabled?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const RATING_BUTTONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function RatingInterface({ 
  imageId, 
  username, 
  onRatingSubmit, 
  disabled = false 
}: RatingInterfaceProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingSelect = (rating: number) => {
    if (disabled || isSubmitting) return;
    setSelectedRating(rating);
  };

  const submitRating = async () => {
    if (!selectedRating || disabled || isSubmitting) {
      Alert.alert('Error', 'Please select a rating first.');
      return;
    }

    const validation = validateRating(selectedRating);
    if (!validation.valid) {
      Alert.alert('Invalid Rating', validation.error || 'Please select a valid rating.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get session ID
      const sessionId = await sessionManager.getSessionId();

      // Submit rating to API
      const response = await fetch('/api/ratings/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          rating: selectedRating,
          sessionId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit rating');
      }

      Alert.alert('Success', `Rating ${selectedRating}/10 submitted successfully!`);
      
      onRatingSubmit?.(selectedRating, result.updatedStats);
      
      // Reset rating
      setSelectedRating(null);

    } catch (error: any) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', error.message || 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingColor = (rating: number): string => {
    if (rating <= 3) return '#dc3545'; // Red for low ratings
    if (rating <= 6) return '#ffc107'; // Yellow for medium ratings
    if (rating <= 8) return '#fd7e14'; // Orange for good ratings
    return '#28a745'; // Green for excellent ratings
  };

  const getRatingLabel = (rating: number): string => {
    if (rating <= 2) return '🤢';
    if (rating <= 4) return '😬';
    if (rating <= 6) return '😐';
    if (rating <= 8) return '😊';
    return '🔥';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rate {username}'s feet</Text>
      <Text style={styles.subtitle}>Tap a number to rate from 1 to 10</Text>

      <View style={styles.ratingGrid}>
        {RATING_BUTTONS.map((rating) => (
          <TouchableOpacity
            key={rating}
            style={[
              styles.ratingButton,
              selectedRating === rating && styles.selectedButton,
              { backgroundColor: selectedRating === rating ? getRatingColor(rating) : '#f8f9fa' }
            ]}
            onPress={() => handleRatingSelect(rating)}
            disabled={disabled || isSubmitting}
          >
            <Text style={[
              styles.ratingText,
              selectedRating === rating && styles.selectedText
            ]}>
              {rating}
            </Text>
            <Text style={styles.emojiText}>
              {selectedRating === rating ? getRatingLabel(rating) : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedRating && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedLabel}>
            Selected Rating: {selectedRating}/10 {getRatingLabel(selectedRating)}
          </Text>
          <Text style={styles.ratingDescription}>
            {selectedRating <= 2 && "Not attractive"}
            {selectedRating > 2 && selectedRating <= 4 && "Below average"}
            {selectedRating > 4 && selectedRating <= 6 && "Average"}
            {selectedRating > 6 && selectedRating <= 8 && "Above average"}
            {selectedRating > 8 && "Very attractive"}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.submitButton,
          (!selectedRating || disabled || isSubmitting) && styles.disabledButton
        ]}
        onPress={submitRating}
        disabled={!selectedRating || disabled || isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? 'Submitting...' : 'Submit Rating'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Ratings are anonymous and cannot be changed once submitted
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  ratingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  ratingButton: {
    width: (screenWidth - 80) / 5 - 10, // 5 buttons per row with gaps
    height: 60,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  selectedButton: {
    borderColor: '#fff',
    transform: [{ scale: 1.1 }],
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedText: {
    color: '#fff',
  },
  emojiText: {
    fontSize: 16,
    marginTop: 2,
  },
  selectedContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  selectedLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  ratingDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});