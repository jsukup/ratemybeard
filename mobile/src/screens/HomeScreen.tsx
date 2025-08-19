import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase, isSupabaseConfigured, getSupabaseConnectionStatus } from '../services/supabase';
import { sessionManager } from '../utils/storage';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    configured: boolean;
    error?: string;
  } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalImages: number;
    totalRatings: number;
  }>({ totalImages: 0, totalRatings: 0 });

  useEffect(() => {
    initializeApp();
    loadStats();
  }, []);

  const initializeApp = async () => {
    try {
      // Check Supabase connection
      const status = await getSupabaseConnectionStatus();
      setConnectionStatus(status);

      // Initialize session
      const sessionId = await sessionManager.getSessionId();
      setSessionId(sessionId);

      console.log('App initialized:', {
        supabaseConfigured: isSupabaseConfigured(),
        connectionStatus: status,
        sessionId: sessionId
      });
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('Initialization Error', 'Failed to initialize the app. Please try again.');
    }
  };

  const loadStats = async () => {
    try {
      // Get total images count
      const { count: imageCount, error: imageError } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true })
        .eq('is_visible', true);

      // Get total ratings count
      const { count: ratingsCount, error: ratingsError } = await supabase
        .from('ratings')
        .select('*', { count: 'exact', head: true });

      if (!imageError && !ratingsError) {
        setStats({
          totalImages: imageCount || 0,
          totalRatings: ratingsCount || 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const navigateToCamera = () => {
    if (!connectionStatus?.connected) {
      Alert.alert(
        'Connection Required', 
        'Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: initializeApp },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }
    navigation.navigate('Camera');
  };

  const navigateToLeaderboard = () => {
    if (!connectionStatus?.connected) {
      Alert.alert(
        'Connection Required', 
        'Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: initializeApp },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }
    navigation.navigate('Leaderboard');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to RateMyFeet</Text>
        <Text style={styles.subtitle}>Mobile Edition</Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Connection Status</Text>
        <Text style={[styles.statusText, { color: connectionStatus?.configured ? 'green' : 'orange' }]}>
          Database: {connectionStatus?.configured ? '✅ Configured' : '⚠️ Not Configured'}
        </Text>
        <Text style={[styles.statusText, { color: connectionStatus?.connected ? 'green' : 'red' }]}>
          Connection: {connectionStatus?.connected ? '✅ Connected' : '❌ Disconnected'}
        </Text>
        {connectionStatus?.error && (
          <Text style={styles.errorText}>Error: {connectionStatus.error}</Text>
        )}
        <Text style={styles.statusText}>
          Session: {sessionId ? `✅ ${sessionId.slice(-8)}` : '⏳ Loading...'}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Platform Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalImages}</Text>
            <Text style={styles.statLabel}>Total Images</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalRatings}</Text>
            <Text style={styles.statLabel}>Total Ratings</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={navigateToCamera}
        >
          <Text style={styles.actionButtonText}>📸 Capture & Upload</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={navigateToLeaderboard}
        >
          <Text style={styles.actionButtonText}>🏆 View Leaderboard</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Features</Text>
        <Text style={styles.infoText}>
          • 📱 Native mobile camera capture{'\n'}
          • ⭐ Anonymous rating system{'\n'}
          • 🏆 Real-time leaderboard{'\n'}
          • 💾 Offline session management{'\n'}
          • 🔄 Shared business logic with web app
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  statusContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 5,
  },
  errorText: {
    fontSize: 12,
    color: 'red',
    marginTop: 5,
  },
  statsContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  actionsContainer: {
    margin: 15,
  },
  actionButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: '#28a745',
  },
  secondaryButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});