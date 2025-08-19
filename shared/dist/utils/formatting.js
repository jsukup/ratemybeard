/**
 * Formatting utilities for consistent display across platforms
 */
/**
 * Format a rating score for display
 */
export function formatRating(rating) {
    if (typeof rating !== 'number' || isNaN(rating)) {
        return '0.00';
    }
    return rating.toFixed(2);
}
/**
 * Format a date for display
 */
export function formatDate(dateString, options = {}) {
    const { style = 'medium', includeTime = false } = options;
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Unknown';
        }
        if (style === 'relative') {
            return formatRelativeTime(date);
        }
        const formatOptions = {};
        switch (style) {
            case 'short':
                formatOptions.month = 'short';
                formatOptions.day = 'numeric';
                break;
            case 'medium':
                formatOptions.month = 'short';
                formatOptions.day = 'numeric';
                if (includeTime) {
                    formatOptions.hour = '2-digit';
                    formatOptions.minute = '2-digit';
                }
                break;
            case 'long':
                formatOptions.weekday = 'short';
                formatOptions.month = 'long';
                formatOptions.day = 'numeric';
                formatOptions.year = 'numeric';
                if (includeTime) {
                    formatOptions.hour = '2-digit';
                    formatOptions.minute = '2-digit';
                }
                break;
        }
        return date.toLocaleDateString('en-US', formatOptions);
    }
    catch {
        return 'Unknown';
    }
}
/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    if (diffSeconds < 60) {
        return 'Just now';
    }
    else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    }
    else if (diffHours < 24) {
        return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    }
    else if (diffDays < 7) {
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }
    else if (diffWeeks < 4) {
        return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
    }
    else if (diffMonths < 12) {
        return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
    }
    else {
        return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
    }
}
/**
 * Format numbers for display (e.g., 1,234)
 */
export function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) {
        return '0';
    }
    return num.toLocaleString('en-US');
}
/**
 * Format large numbers with abbreviations (e.g., 1.2K, 1.5M)
 */
export function formatLargeNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) {
        return '0';
    }
    if (num < 1000) {
        return num.toString();
    }
    else if (num < 1000000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    else if (num < 1000000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    else {
        return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
}
/**
 * Format percentile for display
 */
export function formatPercentile(percentile) {
    if (typeof percentile !== 'number' || isNaN(percentile)) {
        return '0%';
    }
    return `${Math.round(percentile)}%`;
}
/**
 * Format category name for display
 */
export function formatCategoryName(category) {
    if (!category || typeof category !== 'string') {
        return 'Unknown';
    }
    // Handle legacy category names
    const categoryMap = {
        'Smoke Shows': 'Elite',
        'Monets': 'Beautiful',
        'Mehs': 'Average',
        'Plebs': 'Below Average',
        'Dregs': 'Needs Work',
        'Unrated': 'Newest'
    };
    return categoryMap[category] || category;
}
/**
 * Truncate text with ellipsis
 */
export function truncateText(text, maxLength) {
    if (!text || typeof text !== 'string') {
        return '';
    }
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength - 3) + '...';
}
/**
 * Format username for display (handle case and special characters)
 */
export function formatUsername(username) {
    if (!username || typeof username !== 'string') {
        return 'Anonymous';
    }
    // Remove any leading/trailing whitespace
    const cleaned = username.trim();
    // Ensure it's not empty after cleaning
    if (!cleaned) {
        return 'Anonymous';
    }
    return cleaned;
}
/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes) {
    if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) {
        return '0 B';
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
/**
 * Format duration in milliseconds to human readable format
 */
export function formatDuration(ms) {
    if (typeof ms !== 'number' || isNaN(ms) || ms < 0) {
        return '0ms';
    }
    if (ms < 1000) {
        return `${Math.round(ms)}ms`;
    }
    else if (ms < 60000) {
        return `${(ms / 1000).toFixed(1)}s`;
    }
    else if (ms < 3600000) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    }
    else {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    }
}
/**
 * Format URL for display (remove protocol, truncate)
 */
export function formatUrl(url, maxLength = 50) {
    if (!url || typeof url !== 'string') {
        return '';
    }
    try {
        const urlObj = new URL(url);
        let displayUrl = urlObj.hostname + urlObj.pathname;
        if (urlObj.search) {
            displayUrl += urlObj.search;
        }
        return truncateText(displayUrl, maxLength);
    }
    catch {
        // If URL parsing fails, just truncate the original string
        return truncateText(url, maxLength);
    }
}
