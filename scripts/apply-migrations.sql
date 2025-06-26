-- Combined Migration Script for RateMyFeet Database Functions
-- Apply this script in Supabase SQL Editor to set up all necessary functions
-- This will enable the API to use database functions instead of JavaScript calculations

-- ============================================================================
-- 1. ENSURE RATINGS TABLE EXISTS
-- ============================================================================

-- Create ratings table if it doesn't exist
CREATE TABLE IF NOT EXISTS ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  rating DECIMAL(4,2) CHECK (rating >= 0.00 AND rating <= 10.00) NOT NULL,
  session_id TEXT NOT NULL,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_ratings_image_id ON ratings(image_id);
CREATE INDEX IF NOT EXISTS idx_ratings_session_image ON ratings(session_id, image_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at);

-- Create unique constraint to prevent duplicate ratings per session per image
CREATE UNIQUE INDEX IF NOT EXISTS idx_ratings_session_image_unique 
ON ratings(session_id, image_id);

-- ============================================================================
-- 2. ADD RATING COLUMNS TO IMAGES TABLE
-- ============================================================================

-- Add rating-related columns to images table if they don't exist
ALTER TABLE images 
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS median_score DECIMAL(4,2) DEFAULT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_images_rating_count ON images(rating_count);
CREATE INDEX IF NOT EXISTS idx_images_median_score ON images(median_score);

-- ============================================================================
-- 3. CREATE CALCULATION FUNCTIONS
-- ============================================================================

-- Function to calculate median rating for a specific image
CREATE OR REPLACE FUNCTION calculate_image_median(target_image_id UUID)
RETURNS DECIMAL(4,2) AS $$
DECLARE
  median_val DECIMAL(4,2);
BEGIN
  SELECT ROUND(
    percentile_cont(0.5) WITHIN GROUP (ORDER BY rating)::numeric, 
    2
  ) INTO median_val
  FROM ratings 
  WHERE image_id = target_image_id;
  
  RETURN COALESCE(median_val, 0.00);
END;
$$ LANGUAGE plpgsql;

-- Function to get rating count for a specific image
CREATE OR REPLACE FUNCTION get_rating_count(target_image_id UUID)
RETURNS INTEGER AS $$
DECLARE
  rating_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rating_count
  FROM ratings 
  WHERE image_id = target_image_id;
  
  RETURN COALESCE(rating_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update image statistics (median_score and rating_count)
CREATE OR REPLACE FUNCTION update_image_stats(target_image_id UUID)
RETURNS void AS $$
DECLARE
  new_median DECIMAL(4,2);
  new_count INTEGER;
BEGIN
  -- Calculate new statistics
  new_median := calculate_image_median(target_image_id);
  new_count := get_rating_count(target_image_id);
  
  -- Update the images table
  UPDATE images 
  SET 
    median_score = new_median,
    rating_count = new_count
  WHERE id = target_image_id;
  
  -- Log for debugging (optional - remove in production)
  RAISE NOTICE 'Updated stats for image %: median=%, count=%', target_image_id, new_median, new_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user/session has already rated an image
CREATE OR REPLACE FUNCTION has_user_rated_image(
  check_session_id TEXT,
  check_image_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  rating_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM ratings 
    WHERE session_id = check_session_id 
    AND image_id = check_image_id
  ) INTO rating_exists;
  
  RETURN rating_exists;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily rating count for IP address (for rate limiting)
CREATE OR REPLACE FUNCTION get_daily_rating_count(check_ip INET)
RETURNS INTEGER AS $$
DECLARE
  daily_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO daily_count
  FROM ratings 
  WHERE ip_address = check_ip 
  AND created_at >= CURRENT_DATE;
  
  RETURN COALESCE(daily_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update all image statistics (for batch processing)
CREATE OR REPLACE FUNCTION update_all_image_stats()
RETURNS INTEGER AS $$
DECLARE
  images_updated INTEGER := 0;
  image_record RECORD;
BEGIN
  -- Loop through all images that have ratings
  FOR image_record IN 
    SELECT DISTINCT i.id 
    FROM images i 
    WHERE EXISTS (SELECT 1 FROM ratings r WHERE r.image_id = i.id)
  LOOP
    PERFORM update_image_stats(image_record.id);
    images_updated := images_updated + 1;
  END LOOP;
  
  RAISE NOTICE 'Updated statistics for % images', images_updated;
  RETURN images_updated;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. SET PERMISSIONS
-- ============================================================================

-- Grant execute permissions to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION calculate_image_median(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_rating_count(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_image_stats(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION has_user_rated_image(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_daily_rating_count(INET) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_all_image_stats() TO authenticated;

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================

-- Test that all functions were created successfully
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'calculate_image_median',
  'get_rating_count', 
  'update_image_stats',
  'has_user_rated_image',
  'get_daily_rating_count',
  'update_all_image_stats'
)
ORDER BY routine_name;

-- Verify table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'images' 
AND column_name IN ('rating_count', 'median_score')
ORDER BY column_name;

-- Show sample data (if any exists)
SELECT COUNT(*) as total_images FROM images;
SELECT COUNT(*) as total_ratings FROM ratings;

-- ============================================================================
-- 6. OPTIONAL: BATCH UPDATE EXISTING DATA
-- ============================================================================

-- Uncomment the following line to update statistics for all existing images
-- This is useful if you have existing ratings data
-- SELECT update_all_image_stats();

-- ============================================================================
-- INSTALLATION COMPLETE
-- ============================================================================

-- After running this script successfully:
-- 1. All necessary database functions will be available
-- 2. The API can switch from JavaScript calculations to database functions
-- 3. Performance will be improved for high-traffic scenarios
-- 4. All rating statistics will update automatically

RAISE NOTICE '✅ Migration script completed successfully!';
RAISE NOTICE '📝 Next steps:';
RAISE NOTICE '   1. Verify all functions were created (check output above)';
RAISE NOTICE '   2. Test a function: SELECT update_image_stats(''your-image-id'');';
RAISE NOTICE '   3. Optional: Update API to use database functions instead of JavaScript';
RAISE NOTICE '   4. Run batch update if you have existing data: SELECT update_all_image_stats();';