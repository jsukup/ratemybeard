import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import type { MainTabParamList, RootStackParamList } from '../types/navigation';
import { colors } from '../constants/colors';
import { uploadImage, createImageRecord } from '../services/supabase';
import { validateUsername } from '../../../shared/utils/validation';

type CameraScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Camera'>,
  StackScreenProps<RootStackParamList>
>;

interface Props extends CameraScreenProps {};

export default function CameraScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [username, setUsername] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!username.trim()) {
      Alert.alert('Username Required', 'Please enter a username before taking a picture.');
      return;
    }

    // Use shared validation logic
    const usernameValidation = validateUsername(username.trim());
    if (!usernameValidation.success) {
      Alert.alert('Invalid Username', usernameValidation.error || 'Please check your username.');
      return;
    }

    if (cameraRef.current && !isUploading) {
      try {
        setIsUploading(true);
        
        // Take the picture
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        if (photo?.uri) {
          // Upload image to Supabase
          const imageUrl = await uploadImage(photo.uri, username.trim());
          
          // Create database record
          const imageRecord = await createImageRecord(imageUrl, username.trim());
          
          // Navigate to success or rating screen
          Alert.alert(
            'Success!', 
            'Your image has been uploaded successfully. It will appear in the gallery for others to rate.',
            [
              {
                text: 'OK',
                onPress: () => {
                  setUsername('');
                  navigation.navigate('Gallery');
                }
              }
            ]
          );
        }
      } catch (error) {
        console.error('Upload error:', error);
        Alert.alert(
          'Upload Failed', 
          'Failed to upload your image. Please check your internet connection and try again.'
        );
      } finally {
        setIsUploading(false);
      }
    }
  };

  const flipCamera = () => {
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.usernameInput}
        placeholder="Enter username (3-20 characters)"
        value={username}
        onChangeText={setUsername}
        maxLength={20}
        editable={!isUploading}
      />
      
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
      >
        {isUploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color={colors.text.inverse} />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.flipButton, isUploading && styles.disabledButton]} 
            onPress={flipCamera}
            disabled={isUploading}
          >
            <Text style={styles.text}>Flip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.captureButton, isUploading && styles.disabledButton]} 
            onPress={takePicture}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="large" color={colors.text.inverse} />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>
          
          <View style={styles.placeholder} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 20,
    color: colors.text.inverse,
    fontSize: 18,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: colors.text.inverse,
    fontSize: 17,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  usernameInput: {
    backgroundColor: colors.background.primary,
    margin: 20,
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  flipButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 107, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
  },
  placeholder: {
    width: 60,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  uploadingText: {
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
});