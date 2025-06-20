-- Task 2.5: Create materialized view for efficient median calculations
-- This migration creates a materialized view for optimized median rating calculations

-- Create materialized view for rating statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS image_rating_stats AS
SELECT 
  r.image_id,
  COUNT(r.rating) as rating_count,
  ROUND(
    percentile_cont(0.5) WITHIN GROUP (ORDER BY r.rating)::numeric, 
    2
  ) as median_score,
  MIN(r.rating) as min_rating,
  MAX(r.rating) as max_rating,
  ROUND(AVG(r.rating)::numeric, 2) as avg_rating,
  MAX(r.created_at) as last_rating_at
FROM ratings r
GROUP BY r.image_id
HAVING COUNT(r.rating) > 0;

-- Create unique index on image_id for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_image_rating_stats_image_id 
ON image_rating_stats(image_id);

-- Create index for ordering by median score
CREATE INDEX IF NOT EXISTS idx_image_rating_stats_median 
ON image_rating_stats(median_score DESC);

-- Create index for ordering by rating count
CREATE INDEX IF NOT EXISTS idx_image_rating_stats_count 
ON image_rating_stats(rating_count DESC);

-- Create index for recently rated images
CREATE INDEX IF NOT EXISTS idx_image_rating_stats_recent 
ON image_rating_stats(last_rating_at DESC);

-- Add comment for documentation
COMMENT ON MATERIALIZED VIEW image_rating_stats IS 'Pre-computed rating statistics for each image, refreshed via triggers';

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_image_rating_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY image_rating_stats;
  -- Log refresh for monitoring
  RAISE NOTICE 'Refreshed image_rating_stats materialized view at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant appropriate permissions
GRANT SELECT ON image_rating_stats TO anon, authenticated;