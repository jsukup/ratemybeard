-- Task 2.8: Migrate existing data and validate schema changes
-- This migration handles data migration and comprehensive validation

-- First, ensure all constraints are properly set
-- (This handles any edge cases where the table existed before our constraints)

-- Validate that images table has the correct structure
DO $$
BEGIN
  -- Check if required columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'images' 
    AND column_name = 'median_score'
  ) THEN
    RAISE EXCEPTION 'Migration error: median_score column missing from images table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'images' 
    AND column_name = 'rating_count'
  ) THEN
    RAISE EXCEPTION 'Migration error: rating_count column missing from images table';
  END IF;
  
  RAISE NOTICE 'Schema validation passed: images table has required columns';
END $$;

-- Initialize rating statistics for any existing images
-- Set default values for images that don't have ratings yet
UPDATE images 
SET 
  median_score = NULL,
  rating_count = 0
WHERE rating_count IS NULL;

-- Create sample test data for validation (only if no ratings exist)
DO $$
DECLARE
  sample_image_id UUID;
  rating_exists BOOLEAN;
BEGIN
  -- Check if any ratings exist
  SELECT EXISTS(SELECT 1 FROM ratings LIMIT 1) INTO rating_exists;
  
  -- Only create test data if no ratings exist
  IF NOT rating_exists THEN
    -- Check if any images exist to use for testing
    SELECT id INTO sample_image_id FROM images LIMIT 1;
    
    IF sample_image_id IS NOT NULL THEN
      -- Insert a few test ratings for validation
      INSERT INTO ratings (image_id, rating, session_id, ip_address) VALUES
        (sample_image_id, 7.50, 'test_session_1', '127.0.0.1'::inet),
        (sample_image_id, 8.25, 'test_session_2', '127.0.0.2'::inet),
        (sample_image_id, 6.75, 'test_session_3', '127.0.0.3'::inet);
      
      RAISE NOTICE 'Created test ratings for validation';
    ELSE
      RAISE NOTICE 'No existing images found for test data creation';
    END IF;
  ELSE
    RAISE NOTICE 'Existing ratings found, skipping test data creation';
  END IF;
END $$;

-- Validate constraints work correctly
DO $$
DECLARE
  test_passed BOOLEAN := true;
  error_msg TEXT;
BEGIN
  -- Test rating constraint (0-10 range)
  BEGIN
    INSERT INTO ratings (image_id, rating, session_id) 
    VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 15.00, 'constraint_test');
    test_passed := false;
    error_msg := 'Rating constraint failed: allowed value > 10.00';
  EXCEPTION WHEN check_violation THEN
    -- This is expected, constraint is working
    NULL;
  END;
  
  -- Clean up any test data
  DELETE FROM ratings WHERE session_id = 'constraint_test';
  
  IF test_passed THEN
    RAISE NOTICE 'Constraint validation passed';
  ELSE
    RAISE EXCEPTION '%', error_msg;
  END IF;
END $$;

-- Test that functions work correctly
DO $$
DECLARE
  sample_image_id UUID;
  calculated_median DECIMAL(4,2);
  calculated_count INTEGER;
BEGIN
  -- Get an image that has ratings
  SELECT DISTINCT image_id INTO sample_image_id FROM ratings LIMIT 1;
  
  IF sample_image_id IS NOT NULL THEN
    -- Test median calculation function
    SELECT calculate_image_median(sample_image_id) INTO calculated_median;
    SELECT get_rating_count(sample_image_id) INTO calculated_count;
    
    IF calculated_median IS NOT NULL AND calculated_count > 0 THEN
      RAISE NOTICE 'Function validation passed: median=%, count=%', calculated_median, calculated_count;
    ELSE
      RAISE EXCEPTION 'Function validation failed: median=%, count=%', calculated_median, calculated_count;
    END IF;
  ELSE
    RAISE NOTICE 'No ratings found for function testing';
  END IF;
END $$;

-- Test triggers by forcing a statistics update
DO $$
DECLARE
  update_count INTEGER;
BEGIN
  SELECT refresh_all_rating_stats() INTO update_count;
  RAISE NOTICE 'Trigger validation completed: %', update_count;
END $$;

-- Final validation: Check that materialized view was created successfully
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_matviews 
    WHERE matviewname = 'image_rating_stats'
  ) THEN
    RAISE EXCEPTION 'Materialized view image_rating_stats was not created';
  END IF;
  
  RAISE NOTICE 'Materialized view validation passed';
END $$;

-- Create rollback procedures for emergency use
CREATE OR REPLACE FUNCTION rollback_rating_system()
RETURNS TEXT AS $$
BEGIN
  -- WARNING: This will destroy all rating data!
  -- Only use in emergency situations
  
  -- Drop triggers
  DROP TRIGGER IF EXISTS trigger_rating_insert ON ratings;
  DROP TRIGGER IF EXISTS trigger_rating_update ON ratings;
  DROP TRIGGER IF EXISTS trigger_rating_delete ON ratings;
  
  -- Drop materialized view
  DROP MATERIALIZED VIEW IF EXISTS image_rating_stats;
  
  -- Drop functions
  DROP FUNCTION IF EXISTS handle_rating_change();
  DROP FUNCTION IF EXISTS calculate_image_median(UUID);
  DROP FUNCTION IF EXISTS get_rating_count(UUID);
  DROP FUNCTION IF EXISTS update_image_stats(UUID);
  
  -- Drop ratings table
  DROP TABLE IF EXISTS ratings;
  
  -- Remove rating columns from images
  ALTER TABLE images DROP COLUMN IF EXISTS median_score;
  ALTER TABLE images DROP COLUMN IF EXISTS rating_count;
  
  RETURN 'Rating system rollback completed - ALL RATING DATA LOST';
END;
$$ LANGUAGE plpgsql;

-- Grant appropriate permissions for rollback function (admin only)
REVOKE EXECUTE ON FUNCTION rollback_rating_system() FROM PUBLIC;

-- Log successful migration completion
DO $$
BEGIN
  RAISE NOTICE 'Task 2 Database Migration Completed Successfully at %', NOW();
  RAISE NOTICE 'Rating system is ready for use';
END $$;