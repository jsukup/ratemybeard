/**
 * Formatting utilities for consistent display across platforms
 */
/**
 * Format a rating score for display
 */
export declare function formatRating(rating: number): string;
/**
 * Format a date for display
 */
export declare function formatDate(dateString: string, options?: {
    style?: 'short' | 'medium' | 'long' | 'relative';
    includeTime?: boolean;
}): string;
/**
 * Format relative time (e.g., "2 hours ago")
 */
export declare function formatRelativeTime(date: Date): string;
/**
 * Format numbers for display (e.g., 1,234)
 */
export declare function formatNumber(num: number): string;
/**
 * Format large numbers with abbreviations (e.g., 1.2K, 1.5M)
 */
export declare function formatLargeNumber(num: number): string;
/**
 * Format percentile for display
 */
export declare function formatPercentile(percentile: number): string;
/**
 * Format category name for display
 */
export declare function formatCategoryName(category: string): string;
/**
 * Truncate text with ellipsis
 */
export declare function truncateText(text: string, maxLength: number): string;
/**
 * Format username for display (handle case and special characters)
 */
export declare function formatUsername(username: string): string;
/**
 * Format file size in bytes to human readable format
 */
export declare function formatFileSize(bytes: number): string;
/**
 * Format duration in milliseconds to human readable format
 */
export declare function formatDuration(ms: number): string;
/**
 * Format URL for display (remove protocol, truncate)
 */
export declare function formatUrl(url: string, maxLength?: number): string;
//# sourceMappingURL=formatting.d.ts.map