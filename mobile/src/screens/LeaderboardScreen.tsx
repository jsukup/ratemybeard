import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getLeaderboardData } from '@shared/utils/medianCalculation';
import { supabase } from '../services/supabase';
import { formatRelativeTime } from '@shared/utils/formatting';

type LeaderboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Leaderboard'>;

interface Props {
  navigation: LeaderboardScreenNavigationProp;
}

interface LeaderboardEntry {
  id: string;
  username: string;
  image_url: string;
  median_score: number;
  rating_count: number;
  created_at: string;
  category: string;
}

export default function LeaderboardScreen({ navigation }: Props) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadLeaderboard();
  }, [selectedCategory]);

  const loadLeaderboard = async (refreshing = false) => {
    try {
      if (!refreshing) setIsLoading(true);

      const result = await getLeaderboardData(supabase, {
        minRatings: 1, // Lower threshold for mobile demo
        limit: 50,
        offset: 0,
        sortBy: 'median_score',
        sortOrder: 'desc',
        includeUnrated: selectedCategory === 'all',
      });

      if (result?.data) {
        let filteredData = result.data;
        
        // Filter by category if not 'all'
        if (selectedCategory !== 'all') {
          filteredData = result.data.filter(item => 
            item.category.toLowerCase() === selectedCategory.toLowerCase()
          );
        }

        setLeaderboardData(filteredData);
      } else {
        setLeaderboardData([]);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      Alert.alert('Error', 'Failed to load leaderboard data');
      setLeaderboardData([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadLeaderboard(true);
  };

  const handleImagePress = (item: LeaderboardEntry) => {
    // Navigate to rating screen for this image
    navigation.navigate('Rating', {
      imageId: item.id,
      username: item.username,
      imageUrl: item.image_url,
    });
  };

  const getCategoryEmoji = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'smoke shows': return '🔥';
      case 'monets': return '🎨';
      case 'mehs': return '😐';
      case 'plebs': return '👎';
      case 'dregs': return '💩';
      case 'unrated': return '⏳';
      default: return '❓';
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'smoke shows': return '#dc3545';
      case 'monets': return '#fd7e14';
      case 'mehs': return '#ffc107';
      case 'plebs': return '#6c757d';
      case 'dregs': return '#28a745';
      case 'unrated': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <TouchableOpacity
      style={styles.leaderboardItem}
      onPress={() => handleImagePress(item)}
    >
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>#{index + 1}</Text>
      </View>

      <Image source={{ uri: item.image_url }} style={styles.itemImage} />

      <View style={styles.itemInfo}>
        <Text style={styles.usernameText}>{item.username}</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            {item.median_score ? `${item.median_score}/10` : 'No ratings'}
          </Text>
          <Text style={styles.ratingCountText}>
            ({item.rating_count} rating{item.rating_count !== 1 ? 's' : ''})
          </Text>
        </View>
        <View style={styles.categoryContainer}>
          <Text style={[styles.categoryText, { backgroundColor: getCategoryColor(item.category) }]}>
            {getCategoryEmoji(item.category)} {item.category}
          </Text>
        </View>
        <Text style={styles.timeText}>
          {formatRelativeTime(new Date(item.created_at))}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const categories = ['all', 'smoke shows', 'monets', 'mehs', 'plebs', 'dregs', 'unrated'];

  return (
    <View style={styles.container}>
      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === item && styles.selectedCategoryButton
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === item && styles.selectedCategoryText
              ]}>
                {item === 'all' ? 'All' : `${getCategoryEmoji(item)} ${item}`}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Leaderboard List */}
      <FlatList
        data={leaderboardData}
        keyExtractor={(item) => item.id}
        renderItem={renderLeaderboardItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading...' : 'No images found'}
            </Text>
          </View>
        }
        contentContainerStyle={leaderboardData.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  selectedCategoryButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  leaderboardItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 5,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rankContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    marginRight: 15,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  usernameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 8,
  },
  ratingCountText: {
    fontSize: 12,
    color: '#666',
  },
  categoryContainer: {
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  emptyList: {
    flex: 1,
  },
});