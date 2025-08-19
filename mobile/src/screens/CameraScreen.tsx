import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import CameraCapture from '../components/CameraCapture';

type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Camera'>;

interface Props {
  navigation: CameraScreenNavigationProp;
}

export default function CameraScreen({ navigation }: Props) {
  const handleImageUploaded = (imageData: { id: string; username: string; image_url: string }) => {
    // Navigate to rating screen with the uploaded image data
    navigation.navigate('Rating', {
      imageId: imageData.id,
      username: imageData.username,
      imageUrl: imageData.image_url,
    });
  };

  const handleImageCaptured = (imageUri: string) => {
    console.log('Image captured:', imageUri);
    // Image captured but not uploaded yet - user still needs to enter username
  };

  return (
    <View style={styles.container}>
      <CameraCapture
        onImageCaptured={handleImageCaptured}
        onImageUploaded={handleImageUploaded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});