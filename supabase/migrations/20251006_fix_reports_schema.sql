-- Fix Reports Table Schema Mismatch
-- Date: 2025-10-06
-- Issue: Application code expects 'report_reason' and 'report_details' columns
--        but database has 'reason' and 'description' columns
--
-- This migration aligns the database schema with the application code expectations
-- to fix the 500 error when submitting reports.

-- 1. Rename columns to match application code
ALTER TABLE reports
  RENAME COLUMN reason TO report_reason;

ALTER TABLE reports
  RENAME COLUMN description TO report_details;

-- 2. Update CHECK constraint to use new column name and beard-specific categories
ALTER TABLE reports
  DROP CONSTRAINT IF EXISTS reports_reason_check;

ALTER TABLE reports
  DROP CONSTRAINT IF EXISTS reports_report_reason_check;

ALTER TABLE reports
  ADD CONSTRAINT reports_report_reason_check
  CHECK (report_reason IN ('not_beard', 'inappropriate', 'spam_fake', 'other'));

-- 3. Update comments for documentation
COMMENT ON COLUMN reports.report_reason IS 'Reason for report: not_beard, inappropriate, spam_fake, other';
COMMENT ON COLUMN reports.report_details IS 'Optional additional details provided by reporter';

-- 4. Verify the schema matches application expectations
-- Expected columns after migration:
--   - id (UUID)
--   - image_id (UUID)
--   - session_id (TEXT)
--   - ip_address (INET)
--   - report_reason (TEXT) - renamed from 'reason'
--   - report_details (TEXT) - renamed from 'description'
--   - status (TEXT)
--   - created_at (TIMESTAMP)
--   - reviewed_at (TIMESTAMP)
--   - reviewed_by (TEXT)
