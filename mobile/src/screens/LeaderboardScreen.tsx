import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';

interface LeaderboardEntry {
  id: string;
  username: string;
  image_url: string;
  median_score: number;
  rating_count: number;
  category: string;
}

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLeaderboard = async () => {
    try {
      // TODO: Implement leaderboard loading using shared package
      // For now, show placeholder data
      const placeholderData: LeaderboardEntry[] = [
        {
          id: '1',
          username: 'user1',
          image_url: '',
          median_score: 8.5,
          rating_count: 25,
          category: 'Smoke Shows'
        },
        {
          id: '2',
          username: 'user2',
          image_url: '',
          median_score: 7.2,
          rating_count: 18,
          category: 'Monets'
        },
        {
          id: '3',
          username: 'user3',
          image_url: '',
          median_score: 6.8,
          rating_count: 12,
          category: 'Monets'
        },
      ];
      
      setLeaderboard(placeholderData);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Smoke Shows': return '#FFD700';
      case 'Monets': return '#C0C0C0';
      case 'Mehs': return '#CD7F32';
      case 'Plebs': return '#808080';
      case 'Dregs': return '#654321';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Top Rated Images</Text>
      
      {leaderboard.map((entry, index) => (
        <View key={entry.id} style={styles.entryContainer}>
          <View style={styles.rankContainer}>
            <Text style={styles.rank}>#{index + 1}</Text>
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={styles.username}>{entry.username}</Text>
            <Text style={[
              styles.category,
              { color: getCategoryColor(entry.category) }
            ]}>
              {entry.category}
            </Text>
            <Text style={styles.score}>
              {entry.median_score.toFixed(1)}/10 ({entry.rating_count} ratings)
            </Text>
          </View>
        </View>
      ))}
      
      {leaderboard.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No images have been rated yet</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  entryContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 15,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  category: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  score: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});