import { supabase } from '@/lib/supabase';

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
 * Fetch all ratings for a specific image
 */
export async function fetchImageRatings(imageId: string): Promise<number[]> {
  try {
    const { data: ratings, error } = await supabase
      .from('ratings')
      .select('rating')
      .eq('image_id', imageId)
      .order('rating', { ascending: true });

    if (error) {
      console.error('Error fetching ratings:', error);
      throw error;
    }

    return ratings ? ratings.map(r => r.rating) : [];
  } catch (error) {
    console.error('Error in fetchImageRatings:', error);
    return [];
  }
}

/**
 * Update median score and rating count for a specific image
 */
export async function updateImageMedianScore(imageId: string): Promise<{
  median: number;
  count: number;
} | null> {
  try {
    // Fetch all ratings for this image
    const ratings = await fetchImageRatings(imageId);
    
    // Calculate median and count
    const median = calculateMedian(ratings);
    const count = ratings.length;
    
    // Update the images table
    const { error: updateError } = await supabase
      .from('images')
      .update({
        median_score: median,
        rating_count: count,
        updated_at: new Date().toISOString(),
      })
      .eq('id', imageId);

    if (updateError) {
      console.error('Error updating image median score:', updateError);
      throw updateError;
    }

    console.log(`Updated image ${imageId}: median=${median}, count=${count}`);
    return { median, count };
    
  } catch (error) {
    console.error('Error in updateImageMedianScore:', error);
    return null;
  }
}

/**
 * Batch update median scores for multiple images
 */
export async function batchUpdateMedianScores(imageIds: string[]): Promise<{
  successful: number;
  failed: number;
  results: Array<{ imageId: string; success: boolean; median?: number; count?: number; error?: string }>;
}> {
  const results: Array<{ imageId: string; success: boolean; median?: number; count?: number; error?: string }> = [];
  let successful = 0;
  let failed = 0;

  for (const imageId of imageIds) {
    try {
      const result = await updateImageMedianScore(imageId);
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

/**
 * Get image statistics including median and percentile ranking
 */
export async function getImageStatistics(imageId: string): Promise<{
  median: number;
  count: number;
  percentile?: number;
  category?: string;
} | null> {
  try {
    // Get the specific image data
    const { data: imageData, error: imageError } = await supabase
      .from('images')
      .select('median_score, rating_count')
      .eq('id', imageId)
      .single();

    if (imageError || !imageData) {
      console.error('Error fetching image data:', imageError);
      return null;
    }

    const { median_score, rating_count } = imageData;

    // If no ratings yet, return basic info
    if (!rating_count || rating_count === 0) {
      return {
        median: 0,
        count: 0,
      };
    }

    // Get percentile ranking by counting images with lower median scores
    const { data: lowerRankingImages, error: rankError } = await supabase
      .from('images')
      .select('id')
      .lt('median_score', median_score)
      .gte('rating_count', 10); // Only consider images with minimum ratings

    if (rankError) {
      console.error('Error calculating percentile:', rankError);
    }

    // Get total count of eligible images for ranking
    const { data: totalEligibleImages, error: totalError } = await supabase
      .from('images')
      .select('id')
      .gte('rating_count', 10);

    let percentile: number | undefined;
    let category: string | undefined;

    if (!totalError && totalEligibleImages && !rankError && lowerRankingImages) {
      const totalCount = totalEligibleImages.length;
      const lowerCount = lowerRankingImages.length;
      
      if (totalCount > 0) {
        percentile = Math.round(((totalCount - lowerCount) / totalCount) * 100);
        
        // Determine category based on percentile
        if (percentile >= 90) category = "Smoke Shows";
        else if (percentile >= 70) category = "Monets";
        else if (percentile >= 30) category = "Mehs";
        else if (percentile >= 10) category = "Plebs";
        else category = "Dregs";
      }
    }

    return {
      median: median_score,
      count: rating_count,
      percentile,
      category,
    };
    
  } catch (error) {
    console.error('Error in getImageStatistics:', error);
    return null;
  }
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
 * Get leaderboard data with median scores and categories
 */
export async function getLeaderboardData(options: {
  minRatings?: number;
  limit?: number;
  sortBy?: 'median_score' | 'rating_count' | 'created_at';
  sortOrder?: 'asc' | 'desc';
} = {}): Promise<Array<{
  id: string;
  username: string;
  image_url: string;
  median_score: number;
  rating_count: number;
  created_at: string;
  category: string;
}> | null> {
  try {
    const {
      minRatings = 10,
      limit = 1000,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    // Fetch images with minimum rating threshold
    const query = supabase
      .from('images')
      .select('id, username, image_url, median_score, rating_count, created_at, is_visible')
      .eq('is_visible', true)
      .gte('rating_count', minRatings)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .limit(limit);

    const { data: images, error } = await query;

    if (error) {
      console.error('Error fetching leaderboard data:', error);
      return null;
    }

    if (!images || images.length === 0) {
      return [];
    }

    // Sort by median score for category assignment
    const sortedByScore = [...images].sort((a, b) => (b.median_score || 0) - (a.median_score || 0));
    const total = sortedByScore.length;

    // Assign categories based on percentiles
    const categorizedImages = sortedByScore.map((image, index) => {
      const percentile = ((total - index) / total) * 100;
      
      let category: string;
      if (percentile >= 90) category = "Smoke Shows";
      else if (percentile >= 70) category = "Monets";
      else if (percentile >= 30) category = "Mehs";
      else if (percentile >= 10) category = "Plebs";
      else category = "Dregs";

      return {
        ...image,
        category,
      };
    });

    // Return in original sort order if not sorting by median_score
    if (sortBy !== 'median_score') {
      const imageMap = new Map(categorizedImages.map(img => [img.id, img]));
      return images.map(img => imageMap.get(img.id)!).filter(Boolean);
    }

    return categorizedImages;
    
  } catch (error) {
    console.error('Error in getLeaderboardData:', error);
    return null;
  }
}