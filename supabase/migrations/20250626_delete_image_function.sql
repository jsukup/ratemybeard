-- Complete Image Deletion Function Migration
-- Creates a comprehensive function to permanently delete images and all related data
-- Date: 2025-06-26

-- Create function to completely delete an image and all related data
CREATE OR REPLACE FUNCTION delete_image_completely(
  image_id_param UUID,
  moderator_id TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  image_record RECORD;
  ratings_deleted INTEGER := 0;
  reports_deleted INTEGER := 0;
  image_deleted INTEGER := 0;
  storage_deleted BOOLEAN := FALSE;
  result JSON;
BEGIN
  -- First, get the image record to check if it exists and get storage info
  SELECT id, username, image_url, image_name, report_count, moderation_status
  INTO image_record
  FROM images 
  WHERE id = image_id_param;
  
  -- Check if image exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Image not found',
      'image_id', image_id_param
    );
  END IF;
  
  -- Log the deletion attempt (for audit trail)
  INSERT INTO deletion_log (
    image_id, 
    username, 
    image_url, 
    moderator_id, 
    deletion_reason,
    original_report_count,
    original_moderation_status,
    deleted_at
  ) VALUES (
    image_record.id,
    image_record.username,
    image_record.image_url,
    moderator_id,
    'permanent_deletion',
    image_record.report_count,
    image_record.moderation_status,
    NOW()
  );
  
  -- Delete all ratings for this image (CASCADE should handle this, but explicit for counting)
  DELETE FROM ratings WHERE image_id = image_id_param;
  GET DIAGNOSTICS ratings_deleted = ROW_COUNT;
  
  -- Delete all reports for this image (CASCADE should handle this, but explicit for counting)
  DELETE FROM reports WHERE image_id = image_id_param;
  GET DIAGNOSTICS reports_deleted = ROW_COUNT;
  
  -- Delete the image record itself
  DELETE FROM images WHERE id = image_id_param;
  GET DIAGNOSTICS image_deleted = ROW_COUNT;
  
  -- Note: Storage deletion will be handled by the API endpoint that calls this function
  -- since Supabase SQL functions cannot directly interact with the storage API
  
  -- Build the result
  result := json_build_object(
    'success', true,
    'image_id', image_id_param,
    'username', image_record.username,
    'image_url', image_record.image_url,
    'records_deleted', json_build_object(
      'ratings', ratings_deleted,
      'reports', reports_deleted,
      'image', image_deleted
    ),
    'total_records_deleted', ratings_deleted + reports_deleted + image_deleted,
    'moderator_id', moderator_id,
    'deleted_at', NOW()
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- If any error occurs, return failure info
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'image_id', image_id_param,
      'sql_state', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql;

-- Create deletion log table for audit trail
CREATE TABLE IF NOT EXISTS deletion_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID NOT NULL,
  username TEXT NOT NULL,
  image_url TEXT NOT NULL,
  moderator_id TEXT,
  deletion_reason TEXT DEFAULT 'permanent_deletion',
  original_report_count INTEGER DEFAULT 0,
  original_moderation_status TEXT DEFAULT 'unknown',
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add indexes for deletion log
CREATE INDEX IF NOT EXISTS idx_deletion_log_deleted_at ON deletion_log(deleted_at);
CREATE INDEX IF NOT EXISTS idx_deletion_log_moderator ON deletion_log(moderator_id);
CREATE INDEX IF NOT EXISTS idx_deletion_log_username ON deletion_log(username);

-- Add comments for documentation
COMMENT ON FUNCTION delete_image_completely(UUID, TEXT) IS 'Permanently deletes an image and all related data from ratings, reports, and images tables. Also logs the deletion for audit purposes.';
COMMENT ON TABLE deletion_log IS 'Audit trail for permanently deleted images and their associated data';
COMMENT ON COLUMN deletion_log.image_id IS 'Original UUID of the deleted image';
COMMENT ON COLUMN deletion_log.username IS 'Username associated with the deleted image';
COMMENT ON COLUMN deletion_log.image_url IS 'Original image URL before deletion';
COMMENT ON COLUMN deletion_log.moderator_id IS 'ID of moderator who performed the deletion';
COMMENT ON COLUMN deletion_log.deletion_reason IS 'Reason for deletion (e.g., permanent_deletion, policy_violation)';

-- Create helper function to get deletion statistics
CREATE OR REPLACE FUNCTION get_deletion_stats(days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  stats_result JSON;
BEGIN
  SELECT json_build_object(
    'period_days', days_back,
    'total_deletions', COUNT(*),
    'deletions_by_moderator', json_object_agg(
      COALESCE(moderator_id, 'system'), 
      moderator_count
    ),
    'deletions_by_day', (
      SELECT json_object_agg(
        date_part('day', deleted_at)::text,  
        daily_count
      )
      FROM (
        SELECT 
          deleted_at,
          COUNT(*) as daily_count
        FROM deletion_log 
        WHERE deleted_at >= NOW() - INTERVAL '1 day' * days_back
        GROUP BY DATE(deleted_at)
        ORDER BY deleted_at
      ) daily_stats
    )
  )
  INTO stats_result
  FROM (
    SELECT 
      moderator_id,
      COUNT(*) as moderator_count
    FROM deletion_log 
    WHERE deleted_at >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY moderator_id
  ) moderator_stats;
  
  RETURN COALESCE(stats_result, json_build_object(
    'period_days', days_back,
    'total_deletions', 0,
    'deletions_by_moderator', json_build_object(),
    'deletions_by_day', json_build_object()
  ));
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_deletion_stats(INTEGER) IS 'Returns statistics about image deletions over the specified number of days';