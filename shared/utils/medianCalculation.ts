import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Calculate median from an array of numbers
 */
export function calculateMedian(ratings: number[]): number {
  if (!ratings || ratings.length === 0) return 0;
  
  // Sort the ratings in ascending order
  const sortedRatings = [...ratings].sort((a, b) => a - b);
  const length = sortedRatings.length;
  const mid = Math.floor(length / 2);
  
  // For odd length arrays, return the middle element
  // For even length arrays, return the average of the two middle elements
  const median = length % 2 !== 0
    ? sortedRatings[mid]
    : (sortedRatings[mid - 1] + sortedRatings[mid]) / 2;
    
  // Round to 2 decimal places
  return Math.round(median * 100) / 100;
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
  const numericRating = parseFloat(rating.toString());
  
  // Check if it's a valid number
  if (isNaN(numericRating)) {
    return { valid: false, error: 'Rating must be a valid number' };
  }

  // Check range
  if (numericRating < 0 || numericRating > 10) {
    return { valid: false, error: 'Rating must be between 0.00 and 10.00' };
  }

  // Round to 2 decimal places
  const normalizedRating = Math.round(numericRating * 100) / 100;

  return { valid: true, normalizedRating };
}

/**
 * Fetch all ratings for a specific image
 */
export async function fetchImageRatings(imageId: string, supabase: SupabaseClient): Promise<number[]> {
  try {
    const { data: ratings, error } = await supabase
      .from('ratings')
      .select('rating')
      .eq('image_id', imageId)
      .order('rating', { ascending: true });

    if (error) {
      console.error('Error fetching ratings:', {
        message: error?.message || 'Unknown error',
        details: error?.details || 'No details available',
        hint: error?.hint || 'No hint available',
        code: error?.code || 'No code available',
        fullError: JSON.stringify(error, null, 2)
      });
      throw error;
    }

    return ratings ? ratings.map(r => r.rating) : [];
  } catch (error) {
    console.error('Error in fetchImageRatings:', {
      message: error?.message || 'Unknown error',
      details: error?.details || 'No details available',
      hint: error?.hint || 'No hint available',
      code: error?.code || 'No code available',
      fullError: JSON.stringify(error, null, 2)
    });
    return [];
  }
}

/**
 * Update median score and rating count for a specific image
 */
export async function updateImageMedianScore(imageId: string, supabase: SupabaseClient): Promise<{
  median: number;
  count: number;
} | null> {
  try {
    // Fetch all ratings for this image
    const ratings = await fetchImageRatings(imageId, supabase);
    
    // Calculate median and count
    const median = calculateMedian(ratings);
    const count = ratings.length;
    
    // Update the images table
    const { error: updateError } = await supabase
      .from('images')
      .update({
        median_score: median,
        rating_count: count,
      })
      .eq('id', imageId);

    if (updateError) {
      console.error('Error updating image median score:', {
        message: updateError?.message || 'Unknown error',
        details: updateError?.details || 'No details available',
        hint: updateError?.hint || 'No hint available',
        code: updateError?.code || 'No code available',
        fullError: JSON.stringify(updateError, null, 2)
      });
      throw updateError;
    }

    console.log(`Updated image ${imageId}: median=${median}, count=${count}`);
    return { median, count };
    
  } catch (error) {
    console.error('Error in updateImageMedianScore:', {
      message: error?.message || 'Unknown error',
      details: error?.details || 'No details available',
      hint: error?.hint || 'No hint available',
      code: error?.code || 'No code available',
      fullError: JSON.stringify(error, null, 2)
    });
    return null;
  }
}

/**
 * Determine category based on percentile ranking
 */
export function getCategoryFromPercentile(percentile: number): string {
  if (percentile >= 90) return "Needs Work";
  if (percentile >= 70) return "Below Average";  
  if (percentile >= 30) return "Average";
  if (percentile >= 10) return "Beautiful";
  return "Elite";
}

/**
 * Calculate percentile ranking for an image
 */
export function calculatePercentile(imageScore: number, allScores: number[]): number {
  if (allScores.length === 0) return 0;
  
  const lowerScores = allScores.filter(score => score < imageScore);
  return Math.round((lowerScores.length / allScores.length) * 100);
}

/**
 * Batch update median scores for multiple images
 */
export async function batchUpdateMedianScores(
  imageIds: string[], 
  supabase: SupabaseClient
): Promise<{
  successful: number;
  failed: number;
  results: Array<{ imageId: string; success: boolean; median?: number; count?: number; error?: string }>;
}> {
  const results: Array<{ imageId: string; success: boolean; median?: number; count?: number; error?: string }> = [];
  let successful = 0;
  let failed = 0;

  for (const imageId of imageIds) {
    try {
      const result = await updateImageMedianScore(imageId, supabase);
      if (result) {
        results.push({
          imageId,
          success: true,
          median: result.median,
          count: result.count,
        });
        successful++;
      } else {
        results.push({
          imageId,
          success: false,
          error: 'Update returned null',
        });
        failed++;
      }
    } catch (error) {
      results.push({
        imageId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      failed++;
    }

    // Add small delay to prevent overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { successful, failed, results };
}