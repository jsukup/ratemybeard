import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionManager, type StorageInterface } from '@shared/utils/sessionManager';

/**
 * React Native AsyncStorage adapter for session management
 */
export class MobileStorage implements StorageInterface {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from AsyncStorage:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in AsyncStorage:', error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from AsyncStorage:', error);
      throw error;
    }
  }
}

// Initialize session manager with mobile storage
const mobileStorage = new MobileStorage();
export const sessionManager = new SessionManager(mobileStorage);