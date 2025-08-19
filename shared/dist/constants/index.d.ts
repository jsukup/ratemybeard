export * from './branding';
export * from './categories';
export * from './api';
export declare const PLATFORM_DEFAULTS: {
    readonly STORAGE_KEYS: {
        readonly SESSION_ID: "ratemyfeet_session_id";
        readonly USER_PREFERENCES: "ratemyfeet_user_preferences";
        readonly CACHE_PREFIX: "ratemyfeet_cache_";
        readonly LAST_SYNC: "ratemyfeet_last_sync";
    };
    readonly IMAGE_QUALITY: {
        readonly THUMBNAIL: 0.7;
        readonly PREVIEW: 0.8;
        readonly FULL: 0.9;
    };
    readonly ANIMATIONS: {
        readonly FAST: 150;
        readonly NORMAL: 300;
        readonly SLOW: 500;
        readonly CONFETTI: 2000;
    };
    readonly RETRY: {
        readonly MAX_ATTEMPTS: 3;
        readonly INITIAL_DELAY: 1000;
        readonly BACKOFF_MULTIPLIER: 2;
    };
};
//# sourceMappingURL=index.d.ts.map