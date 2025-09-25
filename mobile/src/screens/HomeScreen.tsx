import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../types/navigation';
import { colors } from '../constants/colors';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to RateMyBeard</Text>
        <Text style={styles.subtitle}>Share and rate beard images with the community</Text>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.navigate('Camera')}
        >
          <Text style={styles.buttonIcon}>📷</Text>
          <Text style={[styles.buttonText, styles.primaryButtonText]}>Capture Image</Text>
          <Text style={[styles.buttonSubtext, styles.primaryButtonText]}>Share your beard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('Gallery')}
        >
          <Text style={styles.buttonIcon}>🖼️</Text>
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Browse Gallery</Text>
          <Text style={[styles.buttonSubtext, styles.secondaryButtonText]}>Rate others' images</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>1. Take a photo of your beard</Text>
        <Text style={styles.infoText}>2. Community rates your image (0-10)</Text>
        <Text style={styles.infoText}>3. See your ranking on the leaderboard</Text>
        <Text style={styles.infoText}>4. Rate others to earn points</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionsContainer: {
    gap: 16,
    marginBottom: 40,
  },
  button: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  buttonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 14,
    opacity: 0.8,
  },
  primaryButtonText: {
    color: colors.text.inverse,
  },
  secondaryButtonText: {
    color: colors.text.primary,
  },
  infoContainer: {
    backgroundColor: colors.background.secondary,
    padding: 20,
    borderRadius: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 8,
    lineHeight: 22,
  },
});