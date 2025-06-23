-- Task 2.3: Add median_score and rating_count columns to images table
-- This migration adds aggregated rating statistics columns to support the new rating system

-- First, rename 'entries' table to 'images' for semantic clarity
ALTER TABLE IF EXISTS entries RENAME TO images;

-- Add new columns for rating statistics
ALTER TABLE images 
ADD COLUMN IF NOT EXISTS median_score DECIMAL(4,2) CHECK (median_score >= 0.00 AND median_score <= 10.00),
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0 CHECK (rating_count >= 0);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_images_median_score ON images(median_score) WHERE median_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_images_rating_count ON images(rating_count);
CREATE INDEX IF NOT EXISTS idx_images_visible_score ON images(is_visible, median_score) WHERE is_visible = true;

-- Add comments for documentation
COMMENT ON COLUMN images.median_score IS 'Median rating calculated from user ratings (0.00-10.00)';
COMMENT ON COLUMN images.rating_count IS 'Total number of ratings received for this image';

-- Update the table comment
COMMENT ON TABLE images IS 'Image submissions with user-generated rating statistics';