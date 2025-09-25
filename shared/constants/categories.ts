import type { CategoryName, CategoryConfig } from '../types';

/**
 * Category configuration for the rating system
 */

export const CATEGORY_CONFIGS: CategoryConfig[] = [
  { 
    name: "Newest", 
    label: "Latest Uploads", 
    icon: null, 
    color: "bg-gradient-to-r from-lime-400 to-green-400",
    description: "Fresh uploads waiting for ratings - be the first to rate!"
  },
  { 
    name: "Elite", 
    label: "Revered Beards", 
    icon: null, 
    color: "bg-gradient-to-r from-yellow-300 to-orange-400",
    description: "Top 10% - The absolute finest beards you'll find here"
  },
  { 
    name: "Beautiful", 
    label: "Brisker Whiskers", 
    icon: null, 
    color: "bg-gradient-to-r from-fuchsia-400 to-purple-500",
    description: "Top 11-30% - Genuinely attractive and well-maintained"
  },
  { 
    name: "Average", 
    label: "Tuff\nScruff", 
    icon: null, 
    color: "bg-gradient-to-r from-cyan-400 to-blue-500",
    description: "Middle 31-70% - Your fake ID probably works"
  },
  { 
    name: "Below Average", 
    label: "Chin Pubes", 
    icon: null, 
    color: "bg-gradient-to-r from-orange-400 to-red-500",
    description: "Bottom 71-90% - Help society. Shave already!"
  },
  { 
    name: "Needs Work", 
    label: "Prepubescent", 
    icon: null, 
    color: "bg-gradient-to-r from-red-400 to-pink-500",
    description: "Bottom 10% - Are you a baby?"
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