import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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
      console.error('Error fetching image data:', {
        message: imageError?.message || 'Unknown error',
        details: imageError?.details || 'No details available',
        hint: imageError?.hint || 'No hint available',
        code: imageError?.code || 'No code available',
        fullError: JSON.stringify(imageError, null, 2)
      });
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
      console.error('Error calculating percentile:', {
        message: rankError?.message || 'Unknown error',
        details: rankError?.details || 'No details available',
        hint: rankError?.hint || 'No hint available',
        code: rankError?.code || 'No code available',
        fullError: JSON.stringify(rankError, null, 2)
      });
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
        percentile = Math.round((lowerCount / totalCount) * 100);
        
        // Determine category based on percentile (higher percentile = better ranking)
        if (percentile >= 90) category = "Dregs";
        else if (percentile >= 70) category = "Plebs";  
        else if (percentile >= 30) category = "Mehs";
        else if (percentile >= 10) category = "Monets";
        else category = "Smoke Shows";
      }
    }

    return {
      median: median_score,
      count: rating_count,
      percentile,
      category,
    };
    
  } catch (error) {
    console.error('Error in getImageStatistics:', {
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
  offset?: number;
  sortBy?: 'median_score' | 'rating_count' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  category?: string;
  includeUnrated?: boolean;
} = {}): Promise<{
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
} | null> {
  try {
    // Check if Supabase is properly configured
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL_SET: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_KEY_SET: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_URL_LENGTH: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      SUPABASE_KEY_LENGTH: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      SUPABASE_URL_PREFIX: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 20) + '...',
    });
    
    if (!isSupabaseConfigured()) {
      console.error('Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
      return null;
    }

    const {
      minRatings = 10,
      limit = 50,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
      category,
      includeUnrated = false
    } = options;

    // Calculate page number
    const page = Math.floor(offset / limit) + 1;

    // First, get total count for pagination
    let countQuery = supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('is_visible', true)
      .neq('moderation_status', 'hidden');
    
    // Only apply minimum ratings filter if not including unrated images
    if (!includeUnrated) {
      countQuery = countQuery.gte('rating_count', minRatings);
    }
    
    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error('Error getting total count:', {
        message: countError.message || 'Unknown error',
        details: countError.details || 'No details available',
        hint: countError.hint || 'No hint available',
        code: countError.code || 'No code available',
        fullError: JSON.stringify(countError, null, 2)
      });
      return null;
    }

    // Fetch images with pagination
    let query = supabase
      .from('images')
      .select('id, username, image_url, median_score, rating_count, created_at, is_visible')
      .eq('is_visible', true)
      .neq('moderation_status', 'hidden');
    
    // Only apply minimum ratings filter if not including unrated images
    if (!includeUnrated) {
      query = query.gte('rating_count', minRatings);
    }
    
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: images, error } = await query;

    if (error) {
      console.error('Error fetching leaderboard data:', {
        message: error?.message || 'Unknown error',
        details: error?.details || 'No details available',
        hint: error?.hint || 'No hint available',
        code: error?.code || 'No code available',
        fullError: JSON.stringify(error, null, 2)
      });
      return null;
    }

    const total = totalCount || 0;
    const totalPages = Math.ceil(total / limit);

    if (!images || images.length === 0) {
      return {
        data: [],
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    // For category assignment, we need global rankings, not just current page
    // Get all images to calculate proper percentiles
    let allImagesQuery = supabase
      .from('images')
      .select('id, median_score, rating_count')
      .eq('is_visible', true);
    
    // Only apply minimum ratings filter if not including unrated images
    if (!includeUnrated) {
      allImagesQuery = allImagesQuery.gte('rating_count', minRatings);
    }
    
    const { data: allImages, error: allImagesError } = await allImagesQuery
      .order('median_score', { ascending: false });

    if (allImagesError) {
      console.error('Error fetching all images for categorization:', {
        message: allImagesError?.message || 'Unknown error',
        details: allImagesError?.details || 'No details available',
        hint: allImagesError?.hint || 'No hint available',
        code: allImagesError?.code || 'No code available',
        fullError: JSON.stringify(allImagesError, null, 2)
      });
      // Fall back to returning data without categories
      const dataWithoutCategories = images.map(img => ({ ...img, category: 'Unknown' }));
      return {
        data: dataWithoutCategories,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    }

    // Create a map of image ID to category based on global ranking
    const categoryMap = new Map<string, string>();
    if (allImages) {
      // First, separate rated and unrated images
      const ratedImages = allImages.filter(img => img.rating_count >= minRatings);
      const unratedImages = allImages.filter(img => img.rating_count < minRatings);
      
      // Assign categories to rated images based on percentile
      ratedImages.forEach((image, index) => {
        const percentile = (index / ratedImages.length) * 100;
        
        let category: string;
        if (percentile >= 90) category = "Dregs";
        else if (percentile >= 70) category = "Plebs";
        else if (percentile >= 30) category = "Mehs";  
        else if (percentile >= 10) category = "Monets";
        else category = "Smoke Shows";

        categoryMap.set(image.id, category);
      });
      
      // Assign "Unrated" category to images without enough ratings
      unratedImages.forEach(image => {
        categoryMap.set(image.id, "Unrated");
      });
    }

    // Assign categories to current page images
    const categorizedImages = images.map(image => ({
      ...image,
      category: categoryMap.get(image.id) || 'Unknown',
    }));

    // Filter by category if specified
    const filteredImages = category 
      ? categorizedImages.filter(img => img.category === category)
      : categorizedImages;

    return {
      data: filteredImages,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
    
  } catch (error) {
    console.error('Error in getLeaderboardData:', {
      message: error?.message || 'Unknown error',
      details: error?.details || 'No details available',
      hint: error?.hint || 'No hint available',
      code: error?.code || 'No code available',
      fullError: JSON.stringify(error, null, 2)
    });
    return null;
  }
}