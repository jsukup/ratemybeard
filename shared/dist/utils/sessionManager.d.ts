import type { SupabaseClient } from '@supabase/supabase-js';
export interface StorageInterface {
    getItem: (key: string) => Promise<string | null> | string | null;
    setItem: (key: string, value: string) => Promise<void> | void;
    removeItem: (key: string) => Promise<void> | void;
}
/**
 * Session manager with platform-agnostic storage
 */
export declare class SessionManager {
    private storage;
    private readonly SESSION_KEY;
    constructor(storage?: StorageInterface);
    /**
     * Generate and store a unique session ID
     */
    getSessionId(): Promise<string>;
    /**
     * Generate a temporary session ID (for SSR or when storage isn't available)
     */
    generateTempSessionId(): string;
    /**
     * Clear the current session (useful for testing or logout)
     */
    clearSession(): Promise<void>;
    /**
     * Validate if a session ID is in the correct format
     */
    isValidSessionId(sessionId: string): boolean;
}
/**
 * Default session manager instance for web
 */
export declare const sessionManager: SessionManager;
/**
 * Legacy functions for backward compatibility
 */
export declare function getSessionId(): Promise<string>;
export declare function clearSession(): Promise<void>;
export declare function isValidSessionId(sessionId: string): boolean;
/**
 * Check if the current session has already rated a specific image
 */
export declare function hasRatedImage(imageId: string, supabase: SupabaseClient, sessionId?: string): Promise<boolean>;
/**
 * Get all ratings by the current session
 */
export declare function getSessionRatings(supabase: SupabaseClient, sessionId?: string): Promise<Array<{
    id: string;
    image_id: string;
    rating: number;
    created_at: string;
}> | null>;
/**
 * Check IP-based rate limiting for the current session
 */
export declare function checkRateLimit(supabase: SupabaseClient, ipAddress?: string): Promise<{
    allowed: boolean;
    ratingsToday: number;
    limit: number;
    resetsAt: Date;
}>;
/**
 * Get session statistics
 */
export declare function getSessionStats(supabase: SupabaseClient, sessionId?: string): Promise<{
    totalRatings: number;
    averageRating: number;
    ratingsToday: number;
    firstRatingDate?: string;
    lastRatingDate?: string;
} | null>;
/**
 * Get IP address from request headers (for use in API routes)
 */
export declare function getClientIP(headers: Headers): string;
//# sourceMappingURL=sessionManager.d.ts.map