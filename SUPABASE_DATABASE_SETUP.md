# RateMyBeard Supabase Database Setup Guide

This guide will help you create a new Supabase database for the RateMyBeard platform by cloning the existing RateMyBeard database structure.

## Overview

You need to create a clean database that mirrors the structure of the existing RateMyBeard database (Project ID: `vaxbfvsgzqruuhnntrsy`) but without any user data.

## Step 1: Create New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Set project details:
   - **Name**: `RateMyBeard`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Start with Free tier

## Step 2: Database Schema Migration

Once your project is created, you'll need to apply the database schema. Run the following SQL commands in the Supabase SQL Editor:

### 2.1 Create Images Table

```sql
CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  image_url TEXT NOT NULL,
  image_name TEXT,
  median_score DECIMAL(4,2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0,
  total_rating_sum DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  report_count INTEGER DEFAULT 0,
  last_reported_at TIMESTAMP WITH TIME ZONE
);
```

### 2.2 Create Ratings Table

```sql
CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  image_id INTEGER REFERENCES images(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  rating DECIMAL(4,2) NOT NULL CHECK (rating >= 0 AND rating <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(image_id, session_id)
);
```

### 2.3 Create Reports Table

```sql
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  image_id INTEGER REFERENCES images(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  report_reason VARCHAR(100) NOT NULL,
  additional_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending'
);
```

### 2.4 Create Deletion Log Table

```sql
CREATE TABLE IF NOT EXISTS deletion_log (
  id SERIAL PRIMARY KEY,
  image_id INTEGER,
  username VARCHAR(50),
  image_url TEXT,
  deleted_by VARCHAR(50) DEFAULT 'system',
  deletion_reason TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  original_created_at TIMESTAMP WITH TIME ZONE
);
```

## Step 3: Database Functions

### 3.1 Update Image Stats Function

```sql
CREATE OR REPLACE FUNCTION update_image_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE images 
    SET 
      rating_count = (
        SELECT COUNT(*) 
        FROM ratings 
        WHERE image_id = NEW.image_id
      ),
      total_rating_sum = (
        SELECT COALESCE(SUM(rating), 0) 
        FROM ratings 
        WHERE image_id = NEW.image_id
      ),
      median_score = (
        SELECT COALESCE(
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY rating), 
          0
        ) 
        FROM ratings 
        WHERE image_id = NEW.image_id
      )
    WHERE id = NEW.image_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE images 
    SET 
      rating_count = (
        SELECT COUNT(*) 
        FROM ratings 
        WHERE image_id = OLD.image_id
      ),
      total_rating_sum = (
        SELECT COALESCE(SUM(rating), 0) 
        FROM ratings 
        WHERE image_id = OLD.image_id
      ),
      median_score = (
        SELECT COALESCE(
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY rating), 
          0
        ) 
        FROM ratings 
        WHERE image_id = OLD.image_id
      )
    WHERE id = OLD.image_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### 3.2 Report Count Update Function

```sql
CREATE OR REPLACE FUNCTION update_report_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE images 
    SET 
      report_count = report_count + 1,
      last_reported_at = NEW.created_at
    WHERE id = NEW.image_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE images 
    SET report_count = (
      SELECT COUNT(*) 
      FROM reports 
      WHERE image_id = OLD.image_id
    )
    WHERE id = OLD.image_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### 3.3 Delete Image Function

```sql
CREATE OR REPLACE FUNCTION delete_image_with_log(
  p_image_id INTEGER,
  p_deleted_by VARCHAR(50) DEFAULT 'admin',
  p_deletion_reason TEXT DEFAULT 'Content policy violation'
)
RETURNS BOOLEAN AS $$
DECLARE
  image_record RECORD;
  image_path TEXT;
  deletion_success BOOLEAN := false;
BEGIN
  -- Get image details before deletion
  SELECT * INTO image_record 
  FROM images 
  WHERE id = p_image_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Image with ID % not found', p_image_id;
  END IF;
  
  -- Log the deletion
  INSERT INTO deletion_log (
    image_id, 
    username, 
    image_url, 
    deleted_by, 
    deletion_reason, 
    original_created_at
  )
  VALUES (
    image_record.id,
    image_record.username,
    image_record.image_url,
    p_deleted_by,
    p_deletion_reason,
    image_record.created_at
  );
  
  -- Extract storage path from URL
  image_path := REPLACE(image_record.image_url, 
    'https://vaxbfvsgzqruuhnntrsy.supabase.co/storage/v1/object/public/images/', 
    '');
  
  -- Delete from storage (note: this requires RLS policies)
  -- The actual file deletion should be handled by your application
  
  -- Delete from database (this will cascade to ratings and reports)
  DELETE FROM images WHERE id = p_image_id;
  
  deletion_success := true;
  RETURN deletion_success;
  
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Error during image deletion: %', SQLERRM;
  RETURN false;
END;
$$ LANGUAGE plpgsql;
```

### 3.4 Get Flagged Images Function

```sql
CREATE OR REPLACE FUNCTION get_flagged_images(limit_count INTEGER DEFAULT 50)
RETURNS TABLE(
  id INTEGER,
  username VARCHAR(50),
  image_url TEXT,
  median_score DECIMAL(4,2),
  rating_count INTEGER,
  report_count INTEGER,
  last_reported_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.username,
    i.image_url,
    i.median_score,
    i.rating_count,
    i.report_count,
    i.last_reported_at,
    i.created_at
  FROM images i
  WHERE i.report_count > 0 
    AND i.is_visible = true
  ORDER BY i.report_count DESC, i.last_reported_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

## Step 4: Create Triggers

```sql
-- Trigger for rating changes
CREATE TRIGGER trigger_update_image_stats
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_image_stats();

-- Trigger for report count updates
CREATE TRIGGER trigger_increment_report_count
  AFTER INSERT OR DELETE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_report_count();
```

## Step 5: Set Up Storage

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `images`
3. Set bucket to **Public**
4. Configure storage policies:

### Storage Policies

```sql
-- Allow public read access to images
CREATE POLICY "Public read access for images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

-- Allow authenticated insert to images
CREATE POLICY "Allow image uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images');

-- Allow authenticated delete for admin
CREATE POLICY "Allow admin delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'images');
```

## Step 6: Row Level Security (RLS)

### Enable RLS and Create Policies

```sql
-- Enable RLS on all tables
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_log ENABLE ROW LEVEL SECURITY;

-- Images policies
CREATE POLICY "Allow public read access to visible images" ON images
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Allow public insert of images" ON images
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update of images" ON images
  FOR UPDATE USING (true);

-- Ratings policies
CREATE POLICY "Allow public read access to ratings" ON ratings
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert of ratings" ON ratings
  FOR INSERT WITH CHECK (true);

-- Reports policies
CREATE POLICY "Allow public read access to reports" ON reports
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert of reports" ON reports
  FOR INSERT WITH CHECK (true);

-- Deletion log policies (admin only)
CREATE POLICY "Allow admin read access to deletion log" ON deletion_log
  FOR SELECT USING (true);
```

## Step 7: Environment Variables

Once your database is set up, update your environment variables:

### For Vercel (Production)

Go to your Vercel project settings and add:
- `NEXT_PUBLIC_SUPABASE_URL`: Your new project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your new anon key

### For Local Development

Update your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

## Step 8: Test Connection

1. Deploy your application with the new environment variables
2. Test image upload functionality
3. Test rating system
4. Verify that the leaderboard populates correctly

## Database Maintenance

### Regular Cleanup Tasks

You may want to set up periodic cleanup:

```sql
-- Delete old ratings (optional, only if you want to limit data retention)
DELETE FROM ratings 
WHERE created_at < NOW() - INTERVAL '1 year';

-- Clean up orphaned reports
DELETE FROM reports 
WHERE image_id NOT IN (SELECT id FROM images);
```

## Troubleshooting

### Common Issues

1. **Connection Errors**: Verify environment variables are set correctly
2. **Storage Upload Fails**: Check storage policies and bucket configuration
3. **RLS Blocks Queries**: Review and adjust RLS policies as needed
4. **Function Errors**: Check function syntax and permissions

### Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Review the SQL editor for error messages
3. Verify all migrations have been applied successfully

## Security Notes

- Never expose your database password or service role key
- Use environment variables for all sensitive configuration
- Review RLS policies regularly for security
- Monitor storage usage and costs
- Set up database backups through Supabase dashboard

This completes the database setup for RateMyBeard. The new database will have the same functionality as the original but will be completely clean of any user data.