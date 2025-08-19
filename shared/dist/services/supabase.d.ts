import { type SupabaseClient } from '@supabase/supabase-js';
/**
 * Platform-agnostic Supabase client configuration
 */
export interface EnvironmentProvider {
    getEnvVar: (key: string) => string | undefined;
}
export declare class WebEnvironmentProvider implements EnvironmentProvider {
    getEnvVar(key: string): string | undefined;
}
/**
 * Supabase client factory with platform-agnostic configuration
 */
export declare class SupabaseClientFactory {
    private static instance;
    private static environment;
    /**
     * Set the environment provider (for mobile or other platforms)
     */
    static setEnvironmentProvider(provider: EnvironmentProvider): void;
    /**
     * Get or create Supabase client instance
     */
    static getClient(): SupabaseClient;
    /**
     * Create a new Supabase client
     */
    private static createClient;
    /**
     * Get and clean environment variable
     */
    private static getCleanEnvVar;
    /**
     * Validate Supabase configuration
     */
    private static validateConfiguration;
    /**
     * Check if Supabase is properly configured
     */
    static isConfigured(): boolean;
    /**
     * Reset the client instance (useful for testing or configuration changes)
     */
    static resetClient(): void;
    /**
     * Get connection status
     */
    static getConnectionStatus(): Promise<{
        connected: boolean;
        configured: boolean;
        error?: string;
    }>;
}
/**
 * Default Supabase client instance
 */
export declare const supabase: SupabaseClient<any, "public", any>;
/**
 * Convenience function to check if Supabase is configured
 */
export declare function isSupabaseConfigured(): boolean;
/**
 * Convenience function to get connection status
 */
export declare function getSupabaseConnectionStatus(): Promise<{
    connected: boolean;
    configured: boolean;
    error?: string;
}>;
/**
 * Platform-specific initialization (to be called by each platform)
 */
export declare function initializeSupabase(environmentProvider?: EnvironmentProvider): SupabaseClient;
export type { SupabaseClient, RealtimeChannel, User, Session } from '@supabase/supabase-js';
//# sourceMappingURL=supabase.d.ts.map