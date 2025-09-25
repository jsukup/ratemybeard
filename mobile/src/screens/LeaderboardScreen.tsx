import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Dimensions, 
  ActivityIndicator,
  TouchableOpacity,
  PanResponder,
  Animated
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import type { GalleryStackParamList } from '../types/navigation';
import { colors } from '../constants/colors';
import { getImagesByCategory, getNewestImages, DatabaseImage } from '../services/supabase';

// Import category constants from shared package
import { CATEGORY_CONFIGS, getCategoryLabel, getCategoryConfig } from '../../../shared/constants/categories';
import { formatRating, formatNumber } from '../../../shared/utils/formatting';

type Props = StackScreenProps<GalleryStackParamList, 'GalleryMain'>;

interface CategoryData {
  name: string;
  label: string;
  color: string;
  images: DatabaseImage[];
  currentIndex: number;
  loading: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export default function LeaderboardScreen({ navigation }: Props) {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Animated values for swipe gestures
  const translateX = new Animated.Value(0);
  const translateY = new Animated.Value(0);

  // Convert Tailwind gradient to React Native color
  const getReactNativeColor = (tailwindGradient: string): string => {
    const colorMap: Record<string, string> = {
      'bg-gradient-to-r from-emerald-500 to-green-500': '#10B981',
      'bg-gradient-to-r from-yellow-400 to-amber-500': '#F59E0B',
      'bg-gradient-to-r from-purple-500 to-pink-500': '#A855F7',
      'bg-gradient-to-r from-blue-500 to-cyan-500': '#3B82F6',
      'bg-gradient-to-r from-orange-500 to-red-400': '#F97316',
      'bg-gradient-to-r from-red-500 to-rose-600': '#EF4444',
    };
    return colorMap[tailwindGradient] || colors.primary;
  };

  // Initialize categories from shared package
  const initializeCategories = () => {
    const categoryData: CategoryData[] = CATEGORY_CONFIGS.map(config => ({
      name: config.name,
      label: config.label,
      color: getReactNativeColor(config.color),
      images: [],
      currentIndex: 0,
      loading: true,
    }));
    
    setCategories(categoryData);
    return categoryData;
  };

  // Preload next/previous images for smooth transitions
  const preloadImages = useCallback((images: DatabaseImage[], currentIndex: number) => {
    const preloadRange = 2; // Preload 2 images ahead and behind
    for (let i = Math.max(0, currentIndex - preloadRange); 
         i < Math.min(images.length, currentIndex + preloadRange + 1); 
         i++) {
      if (images[i]?.url) {
        Image.prefetch(images[i].url);
      }
    }
  }, []);

  // Load images for a specific category
  const loadCategoryImages = useCallback(async (categoryIndex: number, categoryData: CategoryData[]) => {
    try {
      const category = categoryData[categoryIndex];
      let images: DatabaseImage[] = [];
      
      if (category.name === 'Newest') {
        images = await getNewestImages(50); // Get more images for better swiping experience
      } else {
        images = await getImagesByCategory(50);
        // Filter by actual category percentile ranges when implemented in backend
        // For now, use the same dataset for all categories
      }
      
      // Add placeholder images for demonstration
      const placeholderImages: DatabaseImage[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${category.name}-${i}`,
        url: `https://picsum.photos/400/600?random=${category.name}-${i}`,
        username: `user${i + 1}`,
        median_score: Math.random() * 10,
        total_ratings: Math.floor(Math.random() * 100) + 1,
        created_at: new Date().toISOString(),
        percentile_rank: Math.random() * 100,
      }));
      
      const allImages = [...images, ...placeholderImages];
      
      setCategories(prev => prev.map((cat, idx) => 
        idx === categoryIndex 
          ? { ...cat, images: allImages, loading: false }
          : cat
      ));

      // Preload first few images for smooth experience
      if (allImages.length > 0) {
        preloadImages(allImages, 0);
      }
    } catch (error) {
      console.error('Failed to load ' + categoryData[categoryIndex].name + ' images:', error);
      setCategories(prev => prev.map((cat, idx) => 
        idx === categoryIndex 
          ? { ...cat, loading: false }
          : cat
      ));
    }
  };

  // Navigation between images within category
  const navigateToNextImage = useCallback(() => {
    const currentCategory = categories[currentCategoryIndex];
    if (!currentCategory || currentCategory.images.length === 0) return;
    
    if (currentCategory.currentIndex < currentCategory.images.length - 1) {
      const newIndex = currentCategory.currentIndex + 1;
      setCategories(prev => prev.map((cat, idx) => 
        idx === currentCategoryIndex 
          ? { ...cat, currentIndex: newIndex }
          : cat
      ));
      
      // Preload images around new position
      preloadImages(currentCategory.images, newIndex);
      
      // Haptic feedback for navigation
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // At last image of category, move to next category
      navigateToNextCategory();
    }
  }, [categories, currentCategoryIndex, preloadImages]);

  const navigateToPreviousImage = useCallback(() => {
    const currentCategory = categories[currentCategoryIndex];
    if (!currentCategory || currentCategory.images.length === 0) return;
    
    if (currentCategory.currentIndex > 0) {
      const newIndex = currentCategory.currentIndex - 1;
      setCategories(prev => prev.map((cat, idx) => 
        idx === currentCategoryIndex 
          ? { ...cat, currentIndex: newIndex }
          : cat
      ));
      
      // Preload images around new position
      preloadImages(currentCategory.images, newIndex);
      
      // Haptic feedback for navigation
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // At first image of category, move to previous category (last image)
      navigateToPreviousCategory();
    }
  }, [categories, currentCategoryIndex, preloadImages]);

  // Navigation between categories
  const navigateToNextCategory = useCallback(() => {
    if (currentCategoryIndex < categories.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
      // Stronger haptic feedback for category changes
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [currentCategoryIndex]);

  const navigateToPreviousCategory = useCallback(() => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => {
        const newIndex = prev - 1;
        // Set to last image of previous category
        setCategories(cats => cats.map((cat, idx) => 
          idx === newIndex && cat.images.length > 0
            ? { ...cat, currentIndex: cat.images.length - 1 }
            : cat
        ));
        // Stronger haptic feedback for category changes
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return newIndex;
      });
    }
  }, [currentCategoryIndex]);

  // Initialize categories and load data
  useEffect(() => {
    const categoryData = initializeCategories();
    // Load first category immediately
    loadCategoryImages(0, categoryData);
    setInitialLoading(false);
  }, []);

  // Load images when category changes
  useEffect(() => {
    if (categories.length > 0 && categories[currentCategoryIndex]?.images.length === 0) {
      loadCategoryImages(currentCategoryIndex, categories);
    }
  }, [currentCategoryIndex, categories]);

  // Pan responder for swipe navigation
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 20 || Math.abs(gestureState.dy) > 20;
    },
    onPanResponderGrant: () => {
      // Set initial values
      translateX.setOffset(0);
      translateY.setOffset(0);
    },
    onPanResponderMove: (evt, gestureState) => {
      translateX.setValue(gestureState.dx);
      translateY.setValue(gestureState.dy);
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dx, dy, vx } = gestureState;
      
      // Determine swipe direction
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx > SWIPE_THRESHOLD || vx > 0.5) {
          // Swipe right - previous image
          navigateToPreviousImage();
        } else if (dx < -SWIPE_THRESHOLD || vx < -0.5) {
          // Swipe left - next image
          navigateToNextImage();
        }
      }
      
      // Reset position
      Animated.parallel([
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      ]).start();
    },
  });

  const animatedStyle = {
    transform: [
      { translateX: translateX },
      { 
        translateY: translateY.interpolate({
          inputRange: [-100, 0, 100],
          outputRange: [-50, 0, 50], // Reduce vertical movement
          extrapolate: 'clamp',
        })
      },
    ],
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading gallery...</Text>
      </View>
    );
  }

  const currentCategory = categories[currentCategoryIndex];
  const currentImage = currentCategory?.images[currentCategory.currentIndex];

  if (!currentCategory || currentCategory.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading {currentCategory?.label}...</Text>
      </View>
    );
  }

  if (!currentImage) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No images in {currentCategory.label}</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[styles.imageContainer, animatedStyle]}
        {...panResponder.panHandlers}
      >
        <Image 
          source={{ uri: currentImage.url }} 
          style={styles.image} 
          resizeMode="cover"
        />
        
        {/* Image Overlay Info */}
        <View style={styles.overlay}>
          {/* Category Badge */}
          <View style={[styles.categoryBadge, { backgroundColor: currentCategory.color }]}>
            <Text style={styles.categoryBadgeText}>{currentCategory.label}</Text>
          </View>
          
          {/* Position Indicator */}
          <View style={styles.positionIndicator}>
            <Text style={styles.positionText}>
              {currentCategory.currentIndex + 1} / {currentCategory.images.length}
            </Text>
          </View>
          
          {/* Bottom Info */}
          <View style={styles.bottomInfo}>
            <View style={styles.userInfo}>
              <Text style={styles.username}>@{currentImage.username}</Text>
              {currentImage.median_score && (
                <Text style={styles.score}>
                  ⭐ {formatRating(currentImage.median_score)}/10 
                  <Text style={styles.ratingCount}> ({formatNumber(currentImage.total_ratings)} ratings)</Text>
                </Text>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.rateButton}
              onPress={() => navigation.navigate('ImageDetail', { imageId: currentImage.id })}
            >
              <Text style={styles.rateButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
      
      {/* Swipe Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>← Swipe to navigate →</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: colors.background.secondary,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50, // Account for status bar
    paddingBottom: 100, // Account for tab bar
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  categoryBadgeText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  positionIndicator: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 10,
  },
  positionText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '500',
  },
  bottomInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  score: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '500',
  },
  ratingCount: {
    opacity: 0.8,
  },
  rateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  rateButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 120, // Above tab bar
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionsText: {
    color: colors.text.inverse,
    fontSize: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});