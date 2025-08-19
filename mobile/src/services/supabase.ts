import Constants from 'expo-constants';
import { SupabaseClientFactory, type EnvironmentProvider } from '@shared/services/supabase';

/**
 * React Native Environment Provider for Expo
 */
export class MobileEnvironmentProvider implements EnvironmentProvider {
  getEnvVar(key: string): string | undefined {
    // In Expo, environment variables are accessed through Constants.expoConfig.extra
    // or process.env for development
    if (process.env[key]) {
      return process.env[key];
    }
    
    // For production builds, use expo-constants
    const extra = Constants.expoConfig?.extra;
    if (extra && extra[key]) {
      return extra[key];
    }
    
    return undefined;
  }
}

// Initialize Supabase with mobile environment provider
SupabaseClientFactory.setEnvironmentProvider(new MobileEnvironmentProvider());

// Export the configured client
export const supabase = SupabaseClientFactory.getClient();
export const isSupabaseConfigured = () => SupabaseClientFactory.isConfigured();
export const getSupabaseConnectionStatus = () => SupabaseClientFactory.getConnectionStatus();