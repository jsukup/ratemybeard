-- RateMyBeard Complete Database Migration
-- Generated from existing RateMyFeet structure and migration files
-- This script creates the complete schema for RateMyBeard project
-- Project: dimtnznykselivtdeicv.supabase.co

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- SCHEMA CREATION (Based on RateMyFeet Analysis + Existing Migrations)
-- =============================================================================

-- Create images table (evolved from entries table)
CREATE TABLE IF NOT EXISTS images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL,
    image_url TEXT NOT NULL,
    image_name TEXT NOT NULL,
    median_score DECIMAL(4,2) CHECK (median_score >= 0.00 AND median_score <= 10.00),
    rating_count INTEGER DEFAULT 0 CHECK (rating_count >= 0),
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    report_count INTEGER DEFAULT 0,
    moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderated_by TEXT
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    image_id UUID REFERENCES images(id) ON DELETE CASCADE,
    rating DECIMAL(4,2) CHECK (rating >= 0.00 AND rating <= 10.00) NOT NULL,
    session_id TEXT NOT NULL,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    admin_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Images table indexes
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_median_score ON images(median_score) WHERE median_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_images_rating_count ON images(rating_count);
CREATE INDEX IF NOT EXISTS idx_images_visible_score ON images(is_visible, median_score) WHERE is_visible = true;
CREATE INDEX IF NOT EXISTS idx_images_username ON images(username);
CREATE INDEX IF NOT EXISTS idx_images_moderation_status ON images(moderation_status);

-- Ratings table indexes  
CREATE INDEX IF NOT EXISTS idx_ratings_image_id ON ratings(image_id);
CREATE INDEX IF NOT EXISTS idx_ratings_session_image ON ratings(session_id, image_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at);

-- Reports table indexes
CREATE INDEX IF NOT EXISTS idx_reports_image_id ON reports(image_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_ratings_session_image_unique 
ON ratings(session_id, image_id);

-- =============================================================================
-- DATABASE FUNCTIONS (From existing migration files)
-- =============================================================================

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

-- =============================================================================
-- TRIGGERS (From existing migration files)  
-- =============================================================================

-- Trigger function to automatically update image stats when ratings change
CREATE OR REPLACE FUNCTION trigger_update_image_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_image_stats(NEW.image_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_image_stats(OLD.image_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update image stats
CREATE TRIGGER trigger_ratings_update_stats
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW EXECUTE FUNCTION trigger_update_image_stats();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Permissive policies for all tables (matching existing setup)
CREATE POLICY "Allow all access to images" ON images FOR ALL USING (true);
CREATE POLICY "Allow all access to ratings" ON ratings FOR ALL USING (true);
CREATE POLICY "Allow all access to reports" ON reports FOR ALL USING (true);

-- =============================================================================
-- PERMISSIONS AND GRANTS
-- =============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION calculate_image_median(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_rating_count(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_image_stats(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_all_image_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION has_user_rated_image(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_daily_rating_count(INET) TO anon, authenticated;

-- =============================================================================
-- VIEWS FOR CONVENIENCE
-- =============================================================================

-- View for leaderboard (images with ratings)
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    i.id,
    i.username,
    i.image_url,
    i.image_name,
    i.median_score,
    i.rating_count,
    i.created_at,
    -- Category based on median score
    CASE 
        WHEN i.median_score >= 9.0 THEN 'Smoke Shows'
        WHEN i.median_score >= 7.0 THEN 'Monets'
        WHEN i.median_score >= 5.0 THEN 'Mehs'
        WHEN i.median_score >= 3.0 THEN 'Plebs'
        ELSE 'Dregs'
    END as category
FROM images i
WHERE i.is_visible = true 
  AND i.median_score IS NOT NULL
  AND i.rating_count >= 3
ORDER BY i.median_score DESC, i.rating_count DESC;

-- View for recent submissions
CREATE OR REPLACE VIEW recent_submissions AS
SELECT 
    i.id,
    i.username,
    i.image_url,
    i.image_name,
    i.median_score,
    i.rating_count,
    i.created_at
FROM images i
WHERE i.is_visible = true
ORDER BY i.created_at DESC;

-- =============================================================================
-- COMMENTS AND DOCUMENTATION
-- =============================================================================

-- Table comments
COMMENT ON TABLE images IS 'Image submissions with user-generated rating statistics';
COMMENT ON TABLE ratings IS 'User-generated ratings for images on a 0-10 scale';
COMMENT ON TABLE reports IS 'User reports for inappropriate content';

-- Column comments for images
COMMENT ON COLUMN images.median_score IS 'Median rating calculated from user ratings (0.00-10.00)';
COMMENT ON COLUMN images.rating_count IS 'Total number of ratings received for this image';
COMMENT ON COLUMN images.is_visible IS 'Whether image is visible to public (for moderation)';
COMMENT ON COLUMN images.moderation_status IS 'Moderation status: pending, approved, rejected';

-- Column comments for ratings
COMMENT ON COLUMN ratings.rating IS 'Rating value between 0.00 and 10.00 with 0.01 precision';
COMMENT ON COLUMN ratings.session_id IS 'Session identifier to prevent duplicate ratings';
COMMENT ON COLUMN ratings.ip_address IS 'IP address for rate limiting and analytics';

-- Policy comments
COMMENT ON POLICY "Allow all access to images" ON images IS 'Initial permissive policy - allows all operations to prevent breaking changes';
COMMENT ON POLICY "Allow all access to ratings" ON ratings IS 'Initial permissive policy - allows all operations to prevent breaking changes';
COMMENT ON POLICY "Allow all access to reports" ON reports IS 'Initial permissive policy - allows all operations to prevent breaking changes';

-- =============================================================================
-- STORAGE BUCKET SETUP (Manual step required)
-- =============================================================================

/*
IMPORTANT: Storage bucket creation must be done manually via Supabase Dashboard:

1. Go to Storage in your RateMyBeard Supabase dashboard
2. Create a bucket named 'images'
3. Set it to public
4. Configure policies:
   - Allow public read access
   - Allow authenticated insert
   - Set file size limit to 50MB
   - Allowed MIME types: image/jpeg, image/png, image/webp

Or use these SQL commands in your Supabase SQL editor:
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Storage policies (adjust as needed)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Authenticated can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');
*/

-- =============================================================================
-- COMPLETION LOG
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'RateMyBeard Database Migration Complete!';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Created tables: images, ratings, reports';
    RAISE NOTICE 'Created functions: calculate_image_median, get_rating_count, update_image_stats, etc.';
    RAISE NOTICE 'Created views: leaderboard, recent_submissions';
    RAISE NOTICE 'Enabled RLS with permissive policies';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create storage bucket "images" via Supabase dashboard';
    RAISE NOTICE '2. Deploy edge functions if needed';
    RAISE NOTICE '3. Test the schema with your application';
    RAISE NOTICE '=============================================================================';
END $$;

COMMIT;