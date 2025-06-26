-- Content Moderation System Migration
-- Creates reports table and adds moderation fields to images table
-- Date: 2025-06-26

-- 1. Create reports table for user flagging
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID REFERENCES images(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL,
  ip_address INET,
  report_reason TEXT NOT NULL CHECK (report_reason IN ('not_feet', 'inappropriate', 'spam_fake', 'other')),
  report_details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_image_id ON reports(image_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_session_image ON reports(session_id, image_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_ip_created ON reports(ip_address, created_at);

-- 3. Add unique constraint to prevent duplicate reports per session per image
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_session_image_unique 
ON reports(session_id, image_id);

-- 4. Add moderation fields to images table
ALTER TABLE images 
ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0 CHECK (report_count >= 0),
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('approved', 'flagged', 'hidden')),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS moderated_by TEXT;

-- 5. Add indexes for moderation fields
CREATE INDEX IF NOT EXISTS idx_images_moderation_status ON images(moderation_status);
CREATE INDEX IF NOT EXISTS idx_images_report_count ON images(report_count) WHERE report_count > 0;
CREATE INDEX IF NOT EXISTS idx_images_flagged ON images(moderation_status, report_count) WHERE moderation_status != 'approved';

-- 6. Create function to increment report count when new report is added
CREATE OR REPLACE FUNCTION increment_report_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment report count on the image
  UPDATE images 
  SET report_count = report_count + 1,
      moderation_status = CASE 
        WHEN report_count + 1 >= 3 THEN 'flagged'
        ELSE moderation_status
      END
  WHERE id = NEW.image_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to automatically increment report count
DROP TRIGGER IF EXISTS trigger_increment_report_count ON reports;
CREATE TRIGGER trigger_increment_report_count
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION increment_report_count();

-- 8. Create function to get flagged images for admin review
CREATE OR REPLACE FUNCTION get_flagged_images(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  image_id UUID,
  username TEXT,
  image_url TEXT,
  report_count INTEGER,
  moderation_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  recent_reports JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as image_id,
    i.username,
    i.image_url,
    i.report_count,
    i.moderation_status,
    i.created_at,
    (
      SELECT json_agg(
        json_build_object(
          'id', r.id,
          'reason', r.report_reason,
          'details', r.report_details,
          'created_at', r.created_at,
          'status', r.status
        )
      )
      FROM reports r 
      WHERE r.image_id = i.id 
      ORDER BY r.created_at DESC
      LIMIT 10
    ) as recent_reports
  FROM images i
  WHERE i.report_count > 0 OR i.moderation_status != 'approved'
  ORDER BY i.report_count DESC, i.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to update moderation status
CREATE OR REPLACE FUNCTION update_moderation_status(
  image_id_param UUID,
  new_status TEXT,
  moderator_id TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validate status
  IF new_status NOT IN ('approved', 'flagged', 'hidden') THEN
    RAISE EXCEPTION 'Invalid moderation status: %', new_status;
  END IF;
  
  -- Update the image
  UPDATE images 
  SET 
    moderation_status = new_status,
    moderated_at = NOW(),
    moderated_by = moderator_id
  WHERE id = image_id_param;
  
  -- Update related reports if image is approved or hidden
  IF new_status IN ('approved', 'hidden') THEN
    UPDATE reports 
    SET 
      status = 'reviewed',
      reviewed_at = NOW(),
      reviewed_by = moderator_id
    WHERE image_id = image_id_param AND status = 'pending';
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 10. Add comments for documentation
COMMENT ON TABLE reports IS 'User reports for inappropriate or problematic images';
COMMENT ON COLUMN reports.report_reason IS 'Reason for report: not_feet, inappropriate, spam_fake, other';
COMMENT ON COLUMN reports.report_details IS 'Optional additional details provided by reporter';
COMMENT ON COLUMN reports.status IS 'Report status: pending, reviewed, dismissed';
COMMENT ON COLUMN reports.session_id IS 'Session identifier of reporter to prevent duplicates';
COMMENT ON COLUMN reports.ip_address IS 'IP address for rate limiting and tracking';

COMMENT ON COLUMN images.report_count IS 'Number of reports received for this image';
COMMENT ON COLUMN images.moderation_status IS 'Moderation status: approved, flagged, hidden';
COMMENT ON COLUMN images.moderated_at IS 'Timestamp when image was last moderated';
COMMENT ON COLUMN images.moderated_by IS 'Identifier of moderator who last reviewed this image';

COMMENT ON FUNCTION increment_report_count() IS 'Automatically increments report count and flags images with 3+ reports';
COMMENT ON FUNCTION get_flagged_images(INTEGER) IS 'Gets images requiring moderation review with recent report details';
COMMENT ON FUNCTION update_moderation_status(UUID, TEXT, TEXT) IS 'Updates image moderation status and marks related reports as reviewed';