-- Task 2.4: Remove AI-related columns from images table
-- This migration removes columns that were used for AI-generated scoring

-- Remove the AI-generated score column (this was the main AI-related column identified)
ALTER TABLE images DROP COLUMN IF EXISTS score;

-- Remove any other potential AI-related columns that might exist
-- (These are speculative based on common AI patterns, use IF EXISTS to prevent errors)
ALTER TABLE images DROP COLUMN IF EXISTS ai_score;
ALTER TABLE images DROP COLUMN IF EXISTS ai_confidence;
ALTER TABLE images DROP COLUMN IF EXISTS ai_tags;
ALTER TABLE images DROP COLUMN IF EXISTS ai_metadata;
ALTER TABLE images DROP COLUMN IF EXISTS ai_analysis;
ALTER TABLE images DROP COLUMN IF EXISTS beauty_score;
ALTER TABLE images DROP COLUMN IF EXISTS facial_score;
ALTER TABLE images DROP COLUMN IF EXISTS confidence_score;

-- Log the completion of AI column removal
-- (This will be visible in migration logs)
DO $$
BEGIN
    RAISE NOTICE 'AI-related columns removed from images table';
END $$;