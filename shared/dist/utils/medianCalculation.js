/**
 * Calculate median from an array of numbers
 */
export function calculateMedian(ratings) {
    if (!ratings || ratings.length === 0)
        return 0;
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
export function validateRating(rating) {
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
export async function fetchImageRatings(imageId, supabase) {
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
    }
    catch (error) {
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
export async function updateImageMedianScore(imageId, supabase) {
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
    }
    catch (error) {
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
// getCategoryFromPercentile moved to constants/categories.ts to avoid duplication
/**
 * Get leaderboard data with median scores and categories
 */
export async function getLeaderboardData(supabase, options = {}) {
    try {
        const { minRatings = 10, limit = 500, offset = 0, sortBy = 'created_at', sortOrder = 'desc', category, includeUnrated = false } = options;
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
            console.error('Error getting total count:', countError);
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
            console.error('Error fetching leaderboard data:', error);
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
            console.error('Error fetching all images for categorization:', allImagesError);
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
        const categoryMap = new Map();
        if (allImages) {
            // First, separate rated and unrated images
            const ratedImages = allImages.filter(img => img.rating_count >= minRatings);
            const unratedImages = allImages.filter(img => img.rating_count < minRatings);
            // Assign categories to rated images based on percentile
            ratedImages.forEach((image, index) => {
                const percentile = (index / ratedImages.length) * 100;
                let category;
                if (percentile >= 90)
                    category = "Dregs";
                else if (percentile >= 70)
                    category = "Plebs";
                else if (percentile >= 30)
                    category = "Mehs";
                else if (percentile >= 10)
                    category = "Monets";
                else
                    category = "Smoke Shows";
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
    }
    catch (error) {
        console.error('Error in getLeaderboardData:', error);
        return null;
    }
}
/**
 * Calculate percentile ranking for an image
 */
export function calculatePercentile(imageScore, allScores) {
    if (allScores.length === 0)
        return 0;
    const lowerScores = allScores.filter(score => score < imageScore);
    return Math.round((lowerScores.length / allScores.length) * 100);
}
/**
 * Batch update median scores for multiple images
 */
export async function batchUpdateMedianScores(imageIds, supabase) {
    const results = [];
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
            }
            else {
                results.push({
                    imageId,
                    success: false,
                    error: 'Update returned null',
                });
                failed++;
            }
        }
        catch (error) {
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
