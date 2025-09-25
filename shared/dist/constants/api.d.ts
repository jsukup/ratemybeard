/**
 * API configuration constants
 */
export declare const RATE_LIMITS: {
    readonly DAILY_RATING_LIMIT: 50;
    readonly DAILY_UPLOAD_LIMIT: 5;
    readonly SESSION_RATE_LIMIT: 100;
    readonly IP_RATE_LIMIT_WINDOW: number;
};
export declare const RATING_SYSTEM: {
    readonly MIN_RATING: 0;
    readonly MAX_RATING: 10;
    readonly RATING_PRECISION: 0.01;
    readonly DEFAULT_RATING: 5;
    readonly DISCRETE_RATINGS: readonly [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    readonly DISCRETE_MODE_ENV_KEY: "NEXT_PUBLIC_ENABLE_DISCRETE_RATINGS";
};
export declare const IMAGE_CONSTRAINTS: {
    readonly MAX_FILE_SIZE: number;
    readonly MAX_WIDTH: 4096;
    readonly MAX_HEIGHT: 4096;
    readonly MIN_WIDTH: 200;
    readonly MIN_HEIGHT: 200;
    readonly SUPPORTED_FORMATS: readonly ["image/jpeg", "image/png", "image/webp"];
    readonly SUPPORTED_EXTENSIONS: readonly [".jpg", ".jpeg", ".png", ".webp"];
};
export declare const PAGINATION: {
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_SORT_BY: "created_at";
    readonly DEFAULT_SORT_ORDER: "desc";
};
export declare const SESSION_CONFIG: {
    readonly SESSION_ID_PREFIX: "session_";
    readonly TEMP_SESSION_ID_PREFIX: "temp_session_";
    readonly SESSION_STORAGE_KEY: "ratemybeard_session_id";
    readonly SESSION_LIFETIME: number;
};
export declare const ENV_KEYS: {
    readonly SUPABASE_URL: "NEXT_PUBLIC_SUPABASE_URL";
    readonly SUPABASE_ANON_KEY: "NEXT_PUBLIC_SUPABASE_ANON_KEY";
    readonly ENABLE_DISCRETE_RATINGS: "NEXT_PUBLIC_ENABLE_DISCRETE_RATINGS";
    readonly CONTACT_EMAIL: "NEXT_PUBLIC_CONTACT_EMAIL";
    readonly COMPANY_NAME: "NEXT_PUBLIC_COMPANY_NAME";
    readonly COMPANY_PHONE: "NEXT_PUBLIC_COMPANY_PHONE";
    readonly COMPANY_ADDRESS: "NEXT_PUBLIC_COMPANY_ADDRESS";
};
export declare const API_ENDPOINTS: {
    readonly RATINGS: {
        readonly SUBMIT: "/api/ratings/submit";
        readonly LIST: "/api/ratings";
    };
    readonly REPORTS: {
        readonly SUBMIT: "/api/reports/submit";
        readonly LIST: "/api/reports";
    };
    readonly ADMIN: {
        readonly DAILY_DIGEST: "/api/admin/daily-digest";
        readonly DELETE_IMAGE: "/api/admin/delete-image";
        readonly REPORTS: "/api/admin/reports";
    };
    readonly HEALTH: {
        readonly SUPABASE_TEST: "/api/supabase-test";
    };
};
export declare const ERROR_CODES: {
    readonly INVALID_RATING: "INVALID_RATING";
    readonly INVALID_IMAGE_ID: "INVALID_IMAGE_ID";
    readonly INVALID_SESSION_ID: "INVALID_SESSION_ID";
    readonly INVALID_USERNAME: "INVALID_USERNAME";
    readonly ALREADY_RATED: "ALREADY_RATED";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly IMAGE_NOT_FOUND: "IMAGE_NOT_FOUND";
    readonly INSUFFICIENT_RATINGS: "INSUFFICIENT_RATINGS";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly STORAGE_ERROR: "STORAGE_ERROR";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly UNKNOWN_ERROR: "UNKNOWN_ERROR";
    readonly SESSION_REQUIRED: "SESSION_REQUIRED";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly PERMISSION_DENIED: "PERMISSION_DENIED";
};
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly SERVICE_UNAVAILABLE: 503;
};
export declare const TIMEOUTS: {
    readonly API_REQUEST: 10000;
    readonly IMAGE_UPLOAD: 30000;
    readonly DATABASE_QUERY: 5000;
    readonly BATCH_OPERATION: 60000;
};
export declare const CACHE_CONFIG: {
    readonly LEADERBOARD_TTL: number;
    readonly IMAGE_STATS_TTL: number;
    readonly SESSION_RATINGS_TTL: number;
    readonly USER_PROFILE_TTL: number;
};
export declare const FEATURE_FLAGS: {
    readonly ENABLE_REPORTS: true;
    readonly ENABLE_ADMIN_PANEL: true;
    readonly ENABLE_ANALYTICS: true;
    readonly ENABLE_NOTIFICATIONS: false;
    readonly ENABLE_COMMENTS: false;
    readonly ENABLE_USER_PROFILES: false;
};
export declare const VALIDATION_PATTERNS: {
    readonly USERNAME: RegExp;
    readonly SESSION_ID: RegExp;
    readonly EMAIL: RegExp;
    readonly UUID: RegExp;
};
export declare const ERROR_MESSAGES: {
    readonly INVALID_RATING: "Rating must be between 0 and 10";
    readonly INVALID_IMAGE_ID: "Invalid image ID";
    readonly INVALID_SESSION_ID: "Invalid session ID";
    readonly INVALID_USERNAME: "Username contains invalid characters";
    readonly ALREADY_RATED: "You have already rated this image";
    readonly RATE_LIMIT_EXCEEDED: "Rate limit exceeded. Please try again later";
    readonly IMAGE_NOT_FOUND: "Image not found";
    readonly INSUFFICIENT_RATINGS: "Image does not have enough ratings for ranking";
    readonly DATABASE_ERROR: "Database error occurred";
    readonly STORAGE_ERROR: "Storage error occurred";
    readonly NETWORK_ERROR: "Network error occurred";
    readonly UNKNOWN_ERROR: "An unknown error occurred";
    readonly SESSION_REQUIRED: "Session is required";
    readonly INVALID_CREDENTIALS: "Invalid credentials";
    readonly PERMISSION_DENIED: "Permission denied";
};
//# sourceMappingURL=api.d.ts.map