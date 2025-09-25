import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import type { GalleryStackParamList } from '../types/navigation';
import { colors } from '../constants/colors';
import { formatRating, formatNumber, formatDate } from '../../../shared/utils/formatting';

type Props = StackScreenProps<GalleryStackParamList, 'ImageDetail'>;

export default function ImageDetailScreen({ route, navigation }: Props) {
  const { imageId } = route.params;

  // Placeholder data - will integrate with Supabase later
  const imageData = {
    id: imageId,
    url: 'https://via.placeholder.com/300x300/FF69B4/FFFFFF?text=Beard+Image',
    username: 'user123',
    medianScore: 7.8,
    totalRatings: 42,
    category: 'Revered Beards',
    createdAt: '2024-01-15',
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageData.url }} style={styles.image} resizeMode="cover" />
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{formatRating(imageData.medianScore)}/10</Text>
          <Text style={styles.categoryText}>{imageData.category}</Text>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(imageData.totalRatings)}</Text>
            <Text style={styles.statLabel}>Ratings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>@{imageData.username}</Text>
            <Text style={styles.statLabel}>Username</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDate(imageData.createdAt, { style: 'short' })}</Text>
            <Text style={styles.statLabel}>Posted</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.rateButton}
          onPress={() => navigation.navigate('Rating', { imageUri: imageData.url, imageId })}
        >
          <Text style={styles.rateButtonText}>Rate This Image</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  imageContainer: {
    height: 400,
    backgroundColor: colors.background.secondary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 20,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    paddingVertical: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  rateButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  rateButtonText: {
    color: colors.text.inverse,
    fontSize: 17,
    fontWeight: '600',
  },
});