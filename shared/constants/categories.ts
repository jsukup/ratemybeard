import type { CategoryName, CategoryConfig } from '../types';

/**
 * Category configuration for the rating system
 */

export const CATEGORY_CONFIGS: CategoryConfig[] = [
  { 
    name: "Newest", 
    label: "Latest Uploads", 
    icon: null, 
    color: "bg-gradient-to-r from-emerald-500 to-green-500",
    description: "Fresh uploads waiting for ratings - be the first to rate!"
  },
  { 
    name: "Elite", 
    label: "Elite Feet", 
    icon: null, 
    color: "bg-gradient-to-r from-yellow-400 to-amber-500",
    description: "Top 10% - The absolute finest feet you'll find here"
  },
  { 
    name: "Beautiful", 
    label: "Keen Kicks", 
    icon: null, 
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    description: "Top 11-30% - Genuinely attractive and well-maintained"
  },
  { 
    name: "Average", 
    label: "Jiggy Piggys", 
    icon: null, 
    color: "bg-gradient-to-r from-blue-500 to-cyan-500",
    description: "Middle 31-70% - Probably attracting some perv's attention"
  },
  { 
    name: "Below Average", 
    label: "Crows Toes", 
    icon: null, 
    color: "bg-gradient-to-r from-orange-500 to-red-400",
    description: "Bottom 71-90% - Are you even human?"
  },
  { 
    name: "Needs Work", 
    label: "Puke", 
    icon: null, 
    color: "bg-gradient-to-r from-red-500 to-rose-600",
    description: "Bottom 10% - Consider amputation"
  },
];

// Legacy category mappings
export const LEGACY_CATEGORY_MAP: Record<string, CategoryName> = {
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
  'Elite': { min: 0, max: 10 },      // Top 10%
  'Beautiful': { min: 10, max: 30 }, // 11-30%
  'Average': { min: 30, max: 70 },   // 31-70%
  'Below Average': { min: 70, max: 90 }, // 71-90%
  'Needs Work': { min: 90, max: 100 }    // Bottom 10%
} as const;

// Helper functions
export function getCategoryConfig(categoryName: CategoryName): CategoryConfig | undefined {
  return CATEGORY_CONFIGS.find(config => config.name === categoryName);
}

export function getCategoryFromPercentile(percentile: number): CategoryName {
  if (percentile >= 90) return "Needs Work";
  if (percentile >= 70) return "Below Average";
  if (percentile >= 30) return "Average";
  if (percentile >= 10) return "Beautiful";
  return "Elite";
}

export function mapLegacyCategory(oldCategory: string): CategoryName {
  return LEGACY_CATEGORY_MAP[oldCategory] || 'Average';
}

export function getCategoryBadgeColor(category: CategoryName): string {
  const config = getCategoryConfig(category);
  return config?.color || 'bg-gray-500';
}

export function getCategoryDescription(category: CategoryName): string {
  const config = getCategoryConfig(category);
  return config?.description || 'Unknown category';
}

export function getCategoryLabel(category: CategoryName): string {
  const config = getCategoryConfig(category);
  return config?.label || category;
}

// Minimum ratings required for ranking
export const MIN_RATINGS_FOR_RANKING = 10;

// Default category for new/unrated images
export const DEFAULT_CATEGORY: CategoryName = "Newest";