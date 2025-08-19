import { z } from 'zod';
/**
 * Validation schemas and utilities
 */
// Username validation
export const usernameSchema = z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be no more than 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .regex(/^(?!.*[-_]{2,}).*$/, 'Username cannot contain consecutive special characters')
    .regex(/^[a-zA-Z0-9].*[a-zA-Z0-9]$/, 'Username must start and end with a letter or number');
// Rating validation
export const ratingSchema = z
    .number()
    .min(0, 'Rating must be at least 0')
    .max(10, 'Rating must be at most 10')
    .refine(val => Number.isFinite(val), 'Rating must be a valid number');
// Image ID validation
export const imageIdSchema = z
    .string()
    .uuid('Invalid image ID format');
// Session ID validation
export const sessionIdSchema = z
    .string()
    .regex(/^(session|temp_session)_\d+_[a-z0-9]+$/, 'Invalid session ID format');
// Report reason validation
export const reportReasonSchema = z.enum([
    'inappropriate_content',
    'spam',
    'harassment',
    'copyright',
    'other'
]);
// Environment validation
export const environmentSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anonymous key is required'),
});
/**
 * Validate a value against a Zod schema
 */
export function validateSchema(schema, value) {
    try {
        const result = schema.parse(value);
        return { success: true, data: result };
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const errors = {};
            error.issues.forEach(issue => {
                const path = issue.path.join('.');
                if (!errors[path])
                    errors[path] = [];
                errors[path].push(issue.message);
            });
            return {
                success: false,
                error: error.issues[0]?.message || 'Validation failed',
                errors
            };
        }
        return {
            success: false,
            error: 'Validation failed'
        };
    }
}
/**
 * Validate username
 */
export function validateUsername(username) {
    return validateSchema(usernameSchema, username);
}
/**
 * Validate rating
 */
export function validateRating(rating) {
    return validateSchema(ratingSchema, rating);
}
/**
 * Validate image ID
 */
export function validateImageId(imageId) {
    return validateSchema(imageIdSchema, imageId);
}
/**
 * Validate session ID
 */
export function validateSessionId(sessionId) {
    return validateSchema(sessionIdSchema, sessionId);
}
/**
 * Validate report reason
 */
export function validateReportReason(reason) {
    return validateSchema(reportReasonSchema, reason);
}
/**
 * Validate environment variables
 */
export function validateEnvironment(env) {
    return validateSchema(environmentSchema, env);
}
/**
 * Email validation (for reports and contact)
 */
export const emailSchema = z
    .string()
    .email('Invalid email address')
    .max(254, 'Email address is too long');
export function validateEmail(email) {
    return validateSchema(emailSchema, email);
}
/**
 * URL validation
 */
export const urlSchema = z
    .string()
    .url('Invalid URL format');
export function validateUrl(url) {
    return validateSchema(urlSchema, url);
}
/**
 * Safe string validation (prevents XSS)
 */
export const safeStringSchema = z
    .string()
    .max(1000, 'Text is too long')
    .refine(val => !/<script|javascript:|on\w+=/i.test(val), 'Text contains potentially unsafe content');
export function validateSafeString(text) {
    return validateSchema(safeStringSchema, text);
}
/**
 * Pagination validation
 */
export const paginationSchema = z.object({
    page: z.number().int().min(1, 'Page must be at least 1').default(1),
    limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
    sortBy: z.enum(['created_at', 'median_score', 'rating_count']).default('created_at'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export function validatePagination(params) {
    const result = paginationSchema.safeParse(params || {});
    if (result.success) {
        return {
            success: true,
            data: result.data
        };
    }
    return {
        success: false,
        error: result.error.errors.map(e => e.message).join(', ')
    };
}
