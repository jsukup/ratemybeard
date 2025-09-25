/**
 * Category configuration for the rating system
 */
export const CATEGORY_CONFIGS = [
    {
        name: "Newest",
        label: "Latest Uploads",
        icon: null,
        color: "bg-gradient-to-r from-emerald-500 to-green-500",
        description: "Fresh uploads waiting for ratings - be the first to rate!"
    },
    {
        name: "Elite",
        label: "Revered Beards",
        icon: null,
        color: "bg-gradient-to-r from-yellow-400 to-amber-500",
        description: "Top 10% - The absolute finest beards you'll find here"
    },
    {
        name: "Beautiful",
        label: "Brisker Whiskers",
        icon: null,
        color: "bg-gradient-to-r from-purple-500 to-pink-500",
        description: "Top 11-30% - Genuinely attractive and well-maintained"
    },
    {
        name: "Average",
        label: "Tuff Scruff",
        icon: null,
        color: "bg-gradient-to-r from-blue-500 to-cyan-500",
        description: "Middle 31-70% - Your fake ID probably works"
    },
    {
        name: "Below Average",
        label: "Chin Pubes",
        icon: null,
        color: "bg-gradient-to-r from-orange-500 to-red-400",
        description: "Bottom 71-90% - Help society. Shave already!"
    },
    {
        name: "Needs Work",
        label: "Prepubescent",
        icon: null,
        color: "bg-gradient-to-r from-red-500 to-rose-600",
        description: "Bottom 10% - Are you a baby?"
    },
];
// Legacy category mappings
export const LEGACY_CATEGORY_MAP = {
    'Smoke Shows': 'Elite',
    'Monets': 'Beautiful',
    'Mehs': 'Average',
    'Plebs': 'Below Average',
    'Dregs': 'Needs Work',
    'Unrated': 'Newest',
    'Newest': 'Newest'
};
// Percentile thresholds for category assignment
export const CATEGORY_THRESHOLDS = {
    'Elite': { min: 0, max: 10 }, // Top 10%
    'Beautiful': { min: 10, max: 30 }, // 11-30%
    'Average': { min: 30, max: 70 }, // 31-70%
    'Below Average': { min: 70, max: 90 }, // 71-90%
    'Needs Work': { min: 90, max: 100 } // Bottom 10%
};
// Helper functions
export function getCategoryConfig(categoryName) {
    return CATEGORY_CONFIGS.find(config => config.name === categoryName);
}
export function getCategoryFromPercentile(percentile) {
    if (percentile >= 90)
        return "Needs Work";
    if (percentile >= 70)
        return "Below Average";
    if (percentile >= 30)
        return "Average";
    if (percentile >= 10)
        return "Beautiful";
    return "Elite";
}
export function mapLegacyCategory(oldCategory) {
    return LEGACY_CATEGORY_MAP[oldCategory] || 'Average';
}
export function getCategoryBadgeColor(category) {
    const config = getCategoryConfig(category);
    return config?.color || 'bg-gray-500';
}
export function getCategoryDescription(category) {
    const config = getCategoryConfig(category);
    return config?.description || 'Unknown category';
}
export function getCategoryLabel(category) {
    const config = getCategoryConfig(category);
    return config?.label || category;
}
// Minimum ratings required for ranking
export const MIN_RATINGS_FOR_RANKING = 10;
// Default category for new/unrated images
export const DEFAULT_CATEGORY = "Newest";
