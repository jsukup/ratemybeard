/**
 * API configuration constants
 */

// Rate limiting
export const RATE_LIMITS = {
  DAILY_RATING_LIMIT: 50,
  DAILY_UPLOAD_LIMIT: 5,
  SESSION_RATE_LIMIT: 100, // Per session lifetime
  IP_RATE_LIMIT_WINDOW: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
} as const;

// Rating system constants
export const RATING_SYSTEM = {
  MIN_RATING: 0,
  MAX_RATING: 10,
  RATING_PRECISION: 0.01, // Two decimal places
  DEFAULT_RATING: 5.0,
  
  // Discrete rating mode
  DISCRETE_RATINGS: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  DISCRETE_MODE_ENV_KEY: 'NEXT_PUBLIC_ENABLE_DISCRETE_RATINGS',
} as const;

// Image constraints
export const IMAGE_CONSTRAINTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_WIDTH: 4096,
  MAX_HEIGHT: 4096,
  MIN_WIDTH: 200,
  MIN_HEIGHT: 200,
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  SUPPORTED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
} as const;

// Database pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1,
  DEFAULT_SORT_BY: 'created_at' as const,
  DEFAULT_SORT_ORDER: 'desc' as const,
} as const;

// Session configuration
export const SESSION_CONFIG = {
  SESSION_ID_PREFIX: 'session_',
  TEMP_SESSION_ID_PREFIX: 'temp_session_',
  SESSION_STORAGE_KEY: 'ratemybeard_session_id',
  SESSION_LIFETIME: 365 * 24 * 60 * 60 * 1000, // 1 year in milliseconds
} as const;

// Environment variables
export const ENV_KEYS = {
  SUPABASE_URL: 'NEXT_PUBLIC_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ENABLE_DISCRETE_RATINGS: 'NEXT_PUBLIC_ENABLE_DISCRETE_RATINGS',
  CONTACT_EMAIL: 'NEXT_PUBLIC_CONTACT_EMAIL',
  COMPANY_NAME: 'NEXT_PUBLIC_COMPANY_NAME',
  COMPANY_PHONE: 'NEXT_PUBLIC_COMPANY_PHONE',
  COMPANY_ADDRESS: 'NEXT_PUBLIC_COMPANY_ADDRESS',
} as const;

// API endpoints (relative paths)
export const API_ENDPOINTS = {
  RATINGS: {
    SUBMIT: '/api/ratings/submit',
    LIST: '/api/ratings',
  },
  REPORTS: {
    SUBMIT: '/api/reports/submit',
    LIST: '/api/reports',
  },
  ADMIN: {
    DAILY_DIGEST: '/api/admin/daily-digest',
    DELETE_IMAGE: '/api/admin/delete-image',
    REPORTS: '/api/admin/reports',
  },
  HEALTH: {
    SUPABASE_TEST: '/api/supabase-test',
  },
} as const;

// Error codes
export const ERROR_CODES = {
  // Validation errors
  INVALID_RATING: 'INVALID_RATING',
  INVALID_IMAGE_ID: 'INVALID_IMAGE_ID',
  INVALID_SESSION_ID: 'INVALID_SESSION_ID',
  INVALID_USERNAME: 'INVALID_USERNAME',
  
  // Business logic errors
  ALREADY_RATED: 'ALREADY_RATED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  IMAGE_NOT_FOUND: 'IMAGE_NOT_FOUND',
  INSUFFICIENT_RATINGS: 'INSUFFICIENT_RATINGS',
  
  // System errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  
  // Authentication errors
  SESSION_REQUIRED: 'SESSION_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Request timeouts (in milliseconds)
export const TIMEOUTS = {
  API_REQUEST: 10000,     // 10 seconds
  IMAGE_UPLOAD: 30000,    // 30 seconds
  DATABASE_QUERY: 5000,   // 5 seconds
  BATCH_OPERATION: 60000, // 1 minute
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  LEADERBOARD_TTL: 5 * 60 * 1000,      // 5 minutes
  IMAGE_STATS_TTL: 1 * 60 * 1000,      // 1 minute
  SESSION_RATINGS_TTL: 10 * 60 * 1000, // 10 minutes
  USER_PROFILE_TTL: 15 * 60 * 1000,    // 15 minutes
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_REPORTS: true,
  ENABLE_ADMIN_PANEL: true,
  ENABLE_ANALYTICS: true,
  ENABLE_NOTIFICATIONS: false,
  ENABLE_COMMENTS: false,
  ENABLE_USER_PROFILES: false,
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  USERNAME: /^[a-zA-Z0-9_-]+$/,
  SESSION_ID: /^(session|temp_session)_\d+_[a-z0-9]+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

// Default error messages
export const ERROR_MESSAGES = {
  [ERROR_CODES.INVALID_RATING]: 'Rating must be between 0 and 10',
  [ERROR_CODES.INVALID_IMAGE_ID]: 'Invalid image ID',
  [ERROR_CODES.INVALID_SESSION_ID]: 'Invalid session ID',
  [ERROR_CODES.INVALID_USERNAME]: 'Username contains invalid characters',
  [ERROR_CODES.ALREADY_RATED]: 'You have already rated this image',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded. Please try again later',
  [ERROR_CODES.IMAGE_NOT_FOUND]: 'Image not found',
  [ERROR_CODES.INSUFFICIENT_RATINGS]: 'Image does not have enough ratings for ranking',
  [ERROR_CODES.DATABASE_ERROR]: 'Database error occurred',
  [ERROR_CODES.STORAGE_ERROR]: 'Storage error occurred',
  [ERROR_CODES.NETWORK_ERROR]: 'Network error occurred',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unknown error occurred',
  [ERROR_CODES.SESSION_REQUIRED]: 'Session is required',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid credentials',
  [ERROR_CODES.PERMISSION_DENIED]: 'Permission denied',
} as const;