import type { SupabaseClient } from '@supabase/supabase-js';
/**
 * Calculate median from an array of numbers
 */
export declare function calculateMedian(ratings: number[]): number;
/**
 * Validate rating value
 */
export declare function validateRating(rating: any): {
    valid: boolean;
    error?: string;
    normalizedRating?: number;
};
/**
 * Fetch all ratings for a specific image
 */
export declare function fetchImageRatings(imageId: string, supabase: SupabaseClient): Promise<number[]>;
/**
 * Update median score and rating count for a specific image
 */
export declare function updateImageMedianScore(imageId: string, supabase: SupabaseClient): Promise<{
    median: number;
    count: number;
} | null>;
/**
 * Get leaderboard data with median scores and categories
 */
export declare function getLeaderboardData(supabase: SupabaseClient, options?: {
    minRatings?: number;
    limit?: number;
    offset?: number;
    sortBy?: 'median_score' | 'rating_count' | 'created_at';
    sortOrder?: 'asc' | 'desc';
    category?: string;
    includeUnrated?: boolean;
}): Promise<{
    data: Array<{
        id: string;
        username: string;
        image_url: string;
        median_score: number;
        rating_count: number;
        created_at: string;
        category: string;
    }>;
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
} | null>;
/**
 * Calculate percentile ranking for an image
 */
export declare function calculatePercentile(imageScore: number, allScores: number[]): number;
/**
 * Batch update median scores for multiple images
 */
export declare function batchUpdateMedianScores(imageIds: string[], supabase: SupabaseClient): Promise<{
    successful: number;
    failed: number;
    results: Array<{
        imageId: string;
        success: boolean;
        median?: number;
        count?: number;
        error?: string;
    }>;
}>;
//# sourceMappingURL=medianCalculation.d.ts.map