import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ScrollView, Animated } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import type { RootStackParamList } from '../types/navigation';
import { colors } from '../constants/colors';
import { submitRating } from '../services/supabase';
import { validateRating } from '../../../shared/utils/validation';

type Props = StackScreenProps<RootStackParamList, 'Rating'>;

export default function RatingScreen({ navigation, route }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [graffitiAnimations] = useState(
    Array.from({ length: 10 }, () => new Animated.Value(0))
  );
  const { imageUri, imageId } = route.params;

  const submitUserRating = async () => {
    if (rating === null) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    // Use shared validation logic
    const ratingValidation = validateRating(rating);
    if (!ratingValidation.success) {
      Alert.alert('Invalid Rating', ratingValidation.error || 'Please select a valid rating.');
      return;
    }

    if (!imageId) {
      Alert.alert('Error', 'Image ID is missing. Cannot submit rating.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Submit rating to Supabase
      await submitRating(imageId, rating);
      
      // Trigger graffiti effect
      triggerGraffitiEffect();
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Show success message after animation
      setTimeout(() => {
        Alert.alert('Success', 'Rating submitted successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('MainTabs') }
        ]);
      }, 1500);
      
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Rating submission error:', error);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
      setIsSubmitting(false);
    }
  };

  const triggerGraffitiEffect = () => {
    // Create staggered graffiti animations
    const graffitiTexts = ['BOOM!', 'NICE!', 'WOW!', '🔥', '⭐', '💯'];
    
    graffitiAnimations.forEach((animation, index) => {
      Animated.sequence([
        Animated.delay(index * 100),
        Animated.timing(animation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    });
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
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setRating(i);
          }}
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      </View>
      
      <View style={styles.contentSection}>
        <Text style={styles.title}>Rate this image</Text>
        <Text style={styles.subtitle}>Tap a button to rate from 1-10</Text>
        
        <View style={styles.ratingContainer}>
          {renderRatingButtons()}
        </View>
        
        {rating && (
          <View style={styles.selectedContainer}>
            <Text style={styles.selectedRating}>
              ⭐ {rating}/10
            </Text>
            <Text style={styles.selectedSubtext}>
              {rating >= 8 ? 'Excellent!' : rating >= 6 ? 'Good!' : rating >= 4 ? 'Average' : 'Poor'}
            </Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.submitButton, !rating && styles.disabledButton]}
          onPress={submitUserRating}
          disabled={!rating || isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Graffiti Effects Overlay */}
      {graffitiAnimations.map((animation, index) => (
        <Animated.View
          key={index}
          style={[
            styles.graffitiOverlay,
            {
              opacity: animation,
              transform: [
                {
                  scale: animation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 1.2, 0.8],
                  }),
                },
                {
                  translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, -100],
                  }),
                },
              ],
              left: Math.random() * 200 + 50,
              top: Math.random() * 200 + 200,
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.graffitiText}>
            {['BOOM!', 'NICE!', 'WOW!', '🔥', '⭐', '💯'][index % 6]}
          </Text>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    flexGrow: 1,
  },
  imageContainer: {
    height: 400,
    backgroundColor: colors.background.secondary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentSection: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  ratingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  ratingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  selectedRatingButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ratingButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  selectedRatingButtonText: {
    color: colors.text.inverse,
  },
  selectedContainer: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
  },
  selectedRating: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  selectedSubtext: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  disabledButton: {
    backgroundColor: colors.button.disabled,
  },
  submitButtonText: {
    color: colors.text.inverse,
    fontSize: 17,
    fontWeight: '600',
  },
  graffitiOverlay: {
    position: 'absolute',
    zIndex: 1000,
  },
  graffitiText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});