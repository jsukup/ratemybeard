import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ENV_KEYS } from '../constants/api';

/**
 * Platform-agnostic Supabase client configuration
 */

// Environment variable getter interface (platform-specific implementation)
export interface EnvironmentProvider {
  getEnvVar: (key: string) => string | undefined;
}

// Web environment provider class
export class WebEnvironmentProvider implements EnvironmentProvider {
  getEnvVar(key: string): string | undefined {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
    return undefined;
  }
}

// Default web environment provider
const defaultWebEnvironment: EnvironmentProvider = new WebEnvironmentProvider();

/**
 * Supabase client factory with platform-agnostic configuration
 */
export class SupabaseClientFactory {
  private static instance: SupabaseClient | null = null;
  private static environment: EnvironmentProvider = defaultWebEnvironment;

  /**
   * Set the environment provider (for mobile or other platforms)
   */
  static setEnvironmentProvider(provider: EnvironmentProvider): void {
    this.environment = provider;
    this.instance = null; // Reset instance to use new environment
  }

  /**
   * Get or create Supabase client instance
   */
  static getClient(): SupabaseClient {
    if (!this.instance) {
      this.instance = this.createClient();
    }
    return this.instance;
  }

  /**
   * Create a new Supabase client
   */
  private static createClient(): SupabaseClient {
    // Get environment variables with fallbacks
    const supabaseUrl = this.getCleanEnvVar(ENV_KEYS.SUPABASE_URL, 'https://placeholder-url.supabase.co');
    const supabaseAnonKey = this.getCleanEnvVar(ENV_KEYS.SUPABASE_ANON_KEY, 'placeholder-key');

    // Validate configuration
    this.validateConfiguration(supabaseUrl, supabaseAnonKey);

    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  /**
   * Get and clean environment variable
   */
  private static getCleanEnvVar(key: string, fallback: string): string {
    const value = this.environment.getEnvVar(key) || fallback;
    
    // Clean environment variables to remove any whitespace/newlines that cause header errors
    return value.trim().replace(/\s+/g, '');
  }

  /**
   * Validate Supabase configuration
   */
  private static validateConfiguration(url: string, key: string): void {
    const rawUrl = this.environment.getEnvVar(ENV_KEYS.SUPABASE_URL);
    const rawKey = this.environment.getEnvVar(ENV_KEYS.SUPABASE_ANON_KEY);

    // Log warnings if environment variables are missing or problematic
    if (!rawUrl || !rawKey) {
      console.warn('Supabase environment variables are missing. Using placeholder values. Database operations will fail.');
      return;
    }

    // Check for common environment variable issues
    if (rawUrl !== rawUrl.trim() || rawKey !== rawKey.trim()) {
      console.warn('Supabase environment variables contain leading/trailing whitespace. This has been automatically cleaned.');
    }
    
    if (rawUrl.includes('\n') || rawKey.includes('\n')) {
      console.warn('Supabase environment variables contain newline characters. This has been automatically cleaned.');
    }
    
    if (rawUrl.includes(' ') || rawKey.includes(' ')) {
      console.warn('Supabase environment variables contain spaces. This has been automatically cleaned.');
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      console.error('Invalid Supabase URL format:', url);
    }
  }

  /**
   * Check if Supabase is properly configured
   */
  static isConfigured(): boolean {
    const url = this.environment.getEnvVar(ENV_KEYS.SUPABASE_URL);
    const key = this.environment.getEnvVar(ENV_KEYS.SUPABASE_ANON_KEY);
    
    return !!(url && key && url !== 'https://placeholder-url.supabase.co' && key !== 'placeholder-key');
  }

  /**
   * Reset the client instance (useful for testing or configuration changes)
   */
  static resetClient(): void {
    this.instance = null;
  }

  /**
   * Get connection status
   */
  static async getConnectionStatus(): Promise<{
    connected: boolean;
    configured: boolean;
    error?: string;
  }> {
    const configured = this.isConfigured();
    
    if (!configured) {
      return {
        connected: false,
        configured: false,
        error: 'Supabase not configured'
      };
    }

    try {
      const client = this.getClient();
      
      // Simple health check - try to get a count from a known table
      const { error } = await client
        .from('images')
        .select('*', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        return {
          connected: false,
          configured: true,
          error: error.message
        };
      }

      return {
        connected: true,
        configured: true
      };
    } catch (error) {
      return {
        connected: false,
        configured: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Default Supabase client instance
 */
export const supabase = SupabaseClientFactory.getClient();

/**
 * Convenience function to check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return SupabaseClientFactory.isConfigured();
}

/**
 * Convenience function to get connection status
 */
export async function getSupabaseConnectionStatus() {
  return SupabaseClientFactory.getConnectionStatus();
}

/**
 * Platform-specific initialization (to be called by each platform)
 */
export function initializeSupabase(environmentProvider?: EnvironmentProvider): SupabaseClient {
  if (environmentProvider) {
    SupabaseClientFactory.setEnvironmentProvider(environmentProvider);
  }
  
  return SupabaseClientFactory.getClient();
}


// Re-export types from @supabase/supabase-js for convenience
export type { SupabaseClient, RealtimeChannel, User, Session } from '@supabase/supabase-js';