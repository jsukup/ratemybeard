import { getCategoryFromPercentile } from '../constants/categories';

/**
 * Get rating category based on score
 */
export function getRatingCategory(rating: number): string {
  // Convert rating to percentile (inverse since higher rating = better)
  const percentile = 100 - ((rating / 10) * 100);
  return getCategoryFromPercentile(percentile);
}

/**
 * Validate rating value
 */
export function validateRating(rating: any): { valid: boolean; error?: string; normalizedRating?: number } {
  // Check if rating exists
  if (rating === undefined || rating === null) {
    return { valid: false, error: 'Rating is required' };
  }

  // Convert to number
  const numRating = Number(rating);
  
  // Check if it's a valid number
  if (isNaN(numRating)) {
    return { valid: false, error: 'Rating must be a number' };
  }
  
  // Check range (0-10)
  if (numRating < 0 || numRating > 10) {
    return { valid: false, error: 'Rating must be between 0 and 10' };
  }
  
  // Round to 2 decimal places
  const normalizedRating = Math.round(numRating * 100) / 100;
  
  return { valid: true, normalizedRating };
}

/**
 * Format rating for display
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}