/**
 * Get rating category based on score
 */
export declare function getRatingCategory(rating: number): string;
/**
 * Validate rating value
 */
export declare function validateRating(rating: any): {
    valid: boolean;
    error?: string;
    normalizedRating?: number;
};
/**
 * Format rating for display
 */
export declare function formatRating(rating: number): string;
//# sourceMappingURL=rating.d.ts.map