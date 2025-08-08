-- Enable Row Level Security (RLS) Migration
-- This migration safely enables RLS on all tables with permissive policies
-- Date: 2025-08-08

-- Enable RLS on images table
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Enable RLS on ratings table  
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for images table
-- These allow all operations initially to prevent breaking existing functionality
CREATE POLICY "Allow all access to images" ON images FOR ALL USING (true);

-- Create permissive policies for ratings table
CREATE POLICY "Allow all access to ratings" ON ratings FOR ALL USING (true);

-- Create permissive policies for reports table
CREATE POLICY "Allow all access to reports" ON reports FOR ALL USING (true);

-- Add comments for documentation
COMMENT ON POLICY "Allow all access to images" ON images IS 'Initial permissive policy - allows all operations to prevent breaking changes';
COMMENT ON POLICY "Allow all access to ratings" ON ratings IS 'Initial permissive policy - allows all operations to prevent breaking changes';
COMMENT ON POLICY "Allow all access to reports" ON reports IS 'Initial permissive policy - allows all operations to prevent breaking changes';

-- Log the RLS enablement
DO $$
BEGIN
    RAISE NOTICE 'Row Level Security enabled on all tables with permissive policies';
    RAISE NOTICE 'Next step: Gradually implement proper access control policies';
END $$;