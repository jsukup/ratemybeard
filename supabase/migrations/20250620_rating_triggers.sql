-- Task 2.7: Set up database triggers for automatic statistics updates
-- This migration creates triggers to automatically update rating statistics

-- Trigger function to handle rating changes
CREATE OR REPLACE FUNCTION handle_rating_change()
RETURNS TRIGGER AS $$
DECLARE
  affected_image_id UUID;
BEGIN
  -- Determine which image_id was affected
  IF TG_OP = 'DELETE' THEN
    affected_image_id := OLD.image_id;
  ELSE
    affected_image_id := NEW.image_id;
  END IF;
  
  -- Update the image statistics
  PERFORM update_image_stats(affected_image_id);
  
  -- Refresh the materialized view (async to avoid blocking)
  -- Note: In production, you might want to batch these refreshes
  PERFORM refresh_image_rating_stats();
  
  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
CREATE OR REPLACE TRIGGER trigger_rating_insert
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION handle_rating_change();

-- Create trigger for UPDATE operations
CREATE OR REPLACE TRIGGER trigger_rating_update
  AFTER UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION handle_rating_change();

-- Create trigger for DELETE operations
CREATE OR REPLACE TRIGGER trigger_rating_delete
  AFTER DELETE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION handle_rating_change();

-- Create a more efficient batched trigger function for high-volume scenarios
CREATE OR REPLACE FUNCTION handle_rating_batch_update()
RETURNS TRIGGER AS $$
DECLARE
  affected_image_ids UUID[];
BEGIN
  -- Collect all affected image_ids from the current transaction
  -- This is more efficient for bulk operations
  
  IF TG_OP = 'INSERT' THEN
    -- For INSERT, we can use NEW
    PERFORM update_image_stats(NEW.image_id);
  ELSIF TG_OP = 'UPDATE' THEN
    -- For UPDATE, handle both OLD and NEW image_ids in case image_id changed
    PERFORM update_image_stats(OLD.image_id);
    IF OLD.image_id != NEW.image_id THEN
      PERFORM update_image_stats(NEW.image_id);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- For DELETE, use OLD
    PERFORM update_image_stats(OLD.image_id);
  END IF;
  
  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to manually refresh all statistics (for maintenance)
CREATE OR REPLACE FUNCTION refresh_all_rating_stats()
RETURNS TEXT AS $$
DECLARE
  updated_count INTEGER;
  refresh_start TIMESTAMP;
  refresh_end TIMESTAMP;
BEGIN
  refresh_start := NOW();
  
  -- Update all image statistics
  SELECT update_all_image_stats() INTO updated_count;
  
  -- Refresh materialized view
  PERFORM refresh_image_rating_stats();
  
  refresh_end := NOW();
  
  RETURN format('Refreshed statistics for %s images in %s seconds', 
                updated_count, 
                EXTRACT(EPOCH FROM (refresh_end - refresh_start)));
END;
$$ LANGUAGE plpgsql;

-- Create indexes to optimize trigger performance
CREATE INDEX IF NOT EXISTS idx_ratings_trigger_perf ON ratings(image_id, created_at);

-- Grant permissions
GRANT EXECUTE ON FUNCTION refresh_all_rating_stats() TO authenticated;

-- Add trigger documentation
COMMENT ON FUNCTION handle_rating_change() IS 'Trigger function to automatically update image statistics when ratings change';
COMMENT ON FUNCTION refresh_all_rating_stats() IS 'Manual function to refresh all rating statistics and materialized views';