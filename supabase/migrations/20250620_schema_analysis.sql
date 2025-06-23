-- Task 2.2: Document current schema and AI-related columns for migration

-- CURRENT SCHEMA ANALYSIS:
-- Based on code analysis, the current database uses an 'entries' table structure
-- that was designed for AI-generated scoring. This needs to be restructured
-- for user-generated ratings.

-- IDENTIFIED TABLES AND COLUMNS:
-- Table: entries (current structure - to be migrated to 'images')
-- Columns observed in codebase:
--   - id (likely UUID PRIMARY KEY)
--   - user_id (TEXT, currently 'anonymous')
--   - screen_name (TEXT, username for the submission)
--   - score (DECIMAL, AI-generated score - TO BE REMOVED)
--   - image_url (TEXT, Supabase storage URL)
--   - image_name (TEXT, filename in storage)
--   - is_visible (BOOLEAN, visibility flag)
--   - created_at (TIMESTAMP, submission time)

-- AI-RELATED COLUMNS TO REMOVE:
-- 1. score - AI-generated attractiveness score (will be replaced with median_score from ratings)
-- 2. Any other AI-related metadata columns that may exist

-- MIGRATION STRATEGY:
-- 1. Rename 'entries' table to 'images' for semantic clarity
-- 2. Remove AI 'score' column 
-- 3. Add 'median_score' and 'rating_count' columns
-- 4. Migrate existing data while preserving image metadata
-- 5. Update foreign key references in new 'ratings' table

-- This analysis will guide the subsequent migration steps.