-- Database Optimization Script for RateMyFeet
-- This script creates indexes to improve query performance

-- ============================================
-- RATINGS TABLE INDEXES
-- ============================================

-- Index for duplicate rating checks (session_id + image_id)
CREATE INDEX IF NOT EXISTS idx_ratings_session_image 
ON ratings(session_id, image_id);

-- Index for rate limiting queries (ip_address + created_at)
CREATE INDEX IF NOT EXISTS idx_ratings_ip_created 
ON ratings(ip_address, created_at);

-- Index for fetching image ratings (image_id + rating for median calculation)
CREATE INDEX IF NOT EXISTS idx_ratings_image_rating 
ON ratings(image_id, rating);

-- Index for session statistics (session_id + created_at)
CREATE INDEX IF NOT EXISTS idx_ratings_session_created 
ON ratings(session_id, created_at);

-- ============================================
-- IMAGES TABLE INDEXES
-- ============================================

-- Index for leaderboard queries (is_visible + rating_count + median_score)
CREATE INDEX IF NOT EXISTS idx_images_leaderboard 
ON images(is_visible, rating_count, median_score DESC);

-- Index for recent images (is_visible + created_at)
CREATE INDEX IF NOT EXISTS idx_images_recent 
ON images(is_visible, created_at DESC);

-- Index for username lookups (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_images_username_lower 
ON images(LOWER(username));

-- ============================================
-- DATABASE FUNCTIONS FOR STATISTICS
-- ============================================

-- Function to update image statistics efficiently
CREATE OR REPLACE FUNCTION update_image_stats(target_image_id UUID)
RETURNS void AS $$
DECLARE
    rating_data RECORD;
    median_value DECIMAL(3,2);
    rating_count INTEGER;
BEGIN
    -- Calculate median and count in a single query
    SELECT 
        COUNT(*) as total_count,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY rating) as median_rating
    INTO rating_data
    FROM ratings 
    WHERE image_id = target_image_id;
    
    -- Set variables
    rating_count := COALESCE(rating_data.total_count, 0);
    median_value := COALESCE(rating_data.median_rating, 0);
    
    -- Update the images table
    UPDATE images 
    SET 
        median_score = median_value,
        rating_count = rating_count,
        updated_at = NOW()
    WHERE id = target_image_id;
    
    -- Log the update
    RAISE NOTICE 'Updated image % with median % and count %', target_image_id, median_value, rating_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS FOR AUTOMATIC STATISTICS UPDATES
-- ============================================

-- Function to automatically update image stats when ratings change
CREATE OR REPLACE FUNCTION trigger_update_image_stats()
RETURNS trigger AS $$
BEGIN
    -- Update stats for the affected image
    PERFORM update_image_stats(NEW.image_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updates (if not exists)
DROP TRIGGER IF EXISTS update_image_stats_trigger ON ratings;
CREATE TRIGGER update_image_stats_trigger
    AFTER INSERT ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_image_stats();

-- ============================================
-- BATCH STATISTICS UPDATE FUNCTION
-- ============================================

-- Function to update all image statistics in batches
CREATE OR REPLACE FUNCTION batch_update_all_image_stats(batch_size INTEGER DEFAULT 100)
RETURNS TABLE(processed INTEGER, total INTEGER) AS $$
DECLARE
    image_record RECORD;
    processed_count INTEGER := 0;
    total_count INTEGER;
BEGIN
    -- Get total count
    SELECT COUNT(*) INTO total_count FROM images WHERE is_visible = true;
    
    -- Process images in batches
    FOR image_record IN 
        SELECT id FROM images 
        WHERE is_visible = true 
        ORDER BY created_at DESC
    LOOP
        -- Update statistics for this image
        PERFORM update_image_stats(image_record.id);
        processed_count := processed_count + 1;
        
        -- Return progress every batch_size records
        IF processed_count % batch_size = 0 THEN
            processed := processed_count;
            total := total_count;
            RETURN NEXT;
        END IF;
    END LOOP;
    
    -- Return final count
    processed := processed_count;
    total := total_count;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PERFORMANCE MONITORING VIEWS
-- ============================================

-- View for monitoring rating activity
CREATE OR REPLACE VIEW rating_activity_stats AS
SELECT 
    DATE(created_at) as rating_date,
    COUNT(*) as total_ratings,
    COUNT(DISTINCT image_id) as unique_images_rated,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT ip_address) as unique_ips,
    AVG(rating) as average_rating,
    MIN(rating) as min_rating,
    MAX(rating) as max_rating
FROM ratings
GROUP BY DATE(created_at)
ORDER BY rating_date DESC;

-- View for monitoring image statistics
CREATE OR REPLACE VIEW image_stats_summary AS
SELECT 
    COUNT(*) as total_images,
    COUNT(CASE WHEN rating_count >= 10 THEN 1 END) as images_with_min_ratings,
    AVG(rating_count) as avg_ratings_per_image,
    AVG(median_score) as avg_median_score,
    MIN(median_score) as min_median_score,
    MAX(median_score) as max_median_score
FROM images
WHERE is_visible = true;

-- ============================================
-- CLEANUP FUNCTIONS
-- ============================================

-- Function to clean up old session data
CREATE OR REPLACE FUNCTION cleanup_old_sessions(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete ratings older than specified days that don't affect image stats
    -- (Keep ratings for images that still need them for accurate statistics)
    DELETE FROM ratings 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old
    AND image_id IN (
        SELECT id FROM images 
        WHERE rating_count > 50  -- Only clean up images with plenty of ratings
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Cleaned up % old rating records', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- USAGE EXAMPLES
-- ============================================

/*
-- Update statistics for all images
SELECT * FROM batch_update_all_image_stats(50);

-- Update statistics for a specific image
SELECT update_image_stats('your-image-uuid-here');

-- View rating activity
SELECT * FROM rating_activity_stats LIMIT 7;

-- View image statistics summary
SELECT * FROM image_stats_summary;

-- Clean up old sessions (30 days old)
SELECT cleanup_old_sessions(30);
*/

-- ============================================
-- PERFORMANCE ANALYSIS QUERIES
-- ============================================

-- Query to analyze index usage
-- Run these periodically to ensure indexes are being used

/*
-- Check if rating indexes are being used
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) FROM ratings 
WHERE session_id = 'sample_session' AND image_id = 'sample_uuid';

-- Check if rate limiting queries are efficient
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) FROM ratings 
WHERE ip_address = '127.0.0.1' 
AND created_at >= CURRENT_DATE;

-- Check leaderboard query performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM images 
WHERE is_visible = true AND rating_count >= 10 
ORDER BY median_score DESC 
LIMIT 50;
*/