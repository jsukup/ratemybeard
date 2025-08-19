import { z } from 'zod';
/**
 * Validation schemas and utilities
 */
export declare const usernameSchema: z.ZodString;
export declare const ratingSchema: z.ZodEffects<z.ZodNumber, number, number>;
export declare const imageIdSchema: z.ZodString;
export declare const sessionIdSchema: z.ZodString;
export declare const reportReasonSchema: z.ZodEnum<["inappropriate_content", "spam", "harassment", "copyright", "other"]>;
export declare const environmentSchema: z.ZodObject<{
    NEXT_PUBLIC_SUPABASE_URL: z.ZodString;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.ZodString;
}, "strip", z.ZodTypeAny, {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
}, {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
}>;
/**
 * Validation result type
 */
export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    errors?: Record<string, string[]>;
}
/**
 * Validate a value against a Zod schema
 */
export declare function validateSchema<T>(schema: z.ZodSchema<T>, value: unknown): ValidationResult<T>;
/**
 * Validate username
 */
export declare function validateUsername(username: string): ValidationResult<string>;
/**
 * Validate rating
 */
export declare function validateRating(rating: number): ValidationResult<number>;
/**
 * Validate image ID
 */
export declare function validateImageId(imageId: string): ValidationResult<string>;
/**
 * Validate session ID
 */
export declare function validateSessionId(sessionId: string): ValidationResult<string>;
/**
 * Validate report reason
 */
export declare function validateReportReason(reason: string): ValidationResult<string>;
/**
 * Validate environment variables
 */
export declare function validateEnvironment(env: Record<string, string | undefined>): ValidationResult<{
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
}>;
/**
 * Email validation (for reports and contact)
 */
export declare const emailSchema: z.ZodString;
export declare function validateEmail(email: string): ValidationResult<string>;
/**
 * URL validation
 */
export declare const urlSchema: z.ZodString;
export declare function validateUrl(url: string): ValidationResult<string>;
/**
 * Safe string validation (prevents XSS)
 */
export declare const safeStringSchema: z.ZodEffects<z.ZodString, string, string>;
export declare function validateSafeString(text: string): ValidationResult<string>;
/**
 * Pagination validation
 */
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["created_at", "median_score", "rating_count"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    sortBy: "median_score" | "rating_count" | "created_at";
    sortOrder: "asc" | "desc";
    page: number;
}, {
    limit?: number | undefined;
    sortBy?: "median_score" | "rating_count" | "created_at" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    page?: number | undefined;
}>;
export declare function validatePagination(params: unknown): ValidationResult<{
    page: number;
    limit: number;
    sortBy: 'created_at' | 'median_score' | 'rating_count';
    sortOrder: 'asc' | 'desc';
}>;
//# sourceMappingURL=validation.d.ts.map