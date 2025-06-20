-- Task 2.6: Create database functions for rating aggregation
-- This migration creates functions to handle rating calculations and statistics updates

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
  
  -- Log for debugging
  RAISE NOTICE 'Updated stats for image %: median=%, count=%', target_image_id, new_median, new_count;
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_image_median(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_rating_count(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_image_stats(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION has_user_rated_image(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_daily_rating_count(INET) TO anon, authenticated;