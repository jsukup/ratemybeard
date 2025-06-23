-- Task 2.1: Create ratings table with proper constraints and indexes
-- This migration creates the core ratings table for user-generated ratings

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  rating DECIMAL(4,2) CHECK (rating >= 0.00 AND rating <= 10.00) NOT NULL,
  session_id TEXT NOT NULL,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_ratings_image_id ON ratings(image_id);
CREATE INDEX IF NOT EXISTS idx_ratings_session_image ON ratings(session_id, image_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at);

-- Add comment for documentation
COMMENT ON TABLE ratings IS 'User-generated ratings for images on a 0-10 scale';
COMMENT ON COLUMN ratings.rating IS 'Rating value between 0.00 and 10.00 with 0.01 precision';
COMMENT ON COLUMN ratings.session_id IS 'Session identifier to prevent duplicate ratings';
COMMENT ON COLUMN ratings.ip_address IS 'IP address for rate limiting and analytics';

-- Create unique constraint to prevent duplicate ratings per session per image
CREATE UNIQUE INDEX IF NOT EXISTS idx_ratings_session_image_unique 
ON ratings(session_id, image_id);