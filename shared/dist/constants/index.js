// Re-export all shared constants
export * from './branding';
export * from './categories';
export * from './api';
// Platform-specific constants that can be overridden
export const PLATFORM_DEFAULTS = {
    // Storage keys (may differ between web localStorage and mobile AsyncStorage)
    STORAGE_KEYS: {
        SESSION_ID: 'ratemyfeet_session_id',
        USER_PREFERENCES: 'ratemyfeet_user_preferences',
        CACHE_PREFIX: 'ratemyfeet_cache_',
        LAST_SYNC: 'ratemyfeet_last_sync',
    },
    // Image handling
    IMAGE_QUALITY: {
        THUMBNAIL: 0.7,
        PREVIEW: 0.8,
        FULL: 0.9,
    },
    // Animation durations (in milliseconds)
    ANIMATIONS: {
        FAST: 150,
        NORMAL: 300,
        SLOW: 500,
        CONFETTI: 2000,
    },
    // Network retry configuration
    RETRY: {
        MAX_ATTEMPTS: 3,
        INITIAL_DELAY: 1000,
        BACKOFF_MULTIPLIER: 2,
    },
};
