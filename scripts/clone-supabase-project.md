# Supabase Project Cloning Guide

## Overview
Clone RateMyBeard (vaxbfvsgzqruuhnntrsy) to RateMyBeard project

## Prerequisites
- Access to both Supabase projects
- Supabase CLI installed
- Database credentials for both projects

## Steps

### 1. Export Source Database Schema
```bash
# Connect to source project
supabase db dump --project-ref vaxbfvsgzqruuhnntrsy --schema-only > ratemybeard-schema.sql

# Export edge functions
supabase functions download --project-ref vaxbfvsgzqruuhnntrsy
```

### 2. Create New Project
```bash
# Create new project via Supabase dashboard
# Project name: ratemybeard
# Note the new project reference ID
```

### 3. Import to New Project
```bash
# Import schema (replace NEW_PROJECT_REF with actual reference)
supabase db push --project-ref NEW_PROJECT_REF --file ratemybeard-schema.sql

# Deploy edge functions
supabase functions deploy --project-ref NEW_PROJECT_REF
```

### 4. Verify Migration
```bash
# Check tables
supabase db diff --project-ref NEW_PROJECT_REF

# Verify edge functions
supabase functions list --project-ref NEW_PROJECT_REF
```

## Manual Dashboard Method

### Database Schema Copy
1. Source project SQL Editor → Export schema:
```sql
-- Export all table definitions
SELECT 
  schemaname,
  tablename,
  tableowner,
  tablespace,
  hasindexes,
  hasrules,
  hastriggers,
  rowsecurity
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog');

-- Get full schema dump
\dt+ public.*
```

2. Copy each table structure manually:
   - Go to Table Editor
   - Copy table definitions
   - Recreate in new project

### RLS Policies Copy
```sql
-- Export all policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check 
FROM pg_policies;
```

### Edge Functions
1. Download function code from source project
2. Create new functions in target project
3. Copy environment variables and secrets

## Environment Variables Update

After cloning, update your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://NEW_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=NEW_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=NEW_SERVICE_ROLE_KEY
```

## Verification Checklist
- [ ] All tables present and empty
- [ ] RLS policies copied
- [ ] Edge functions deployed
- [ ] Storage buckets configured
- [ ] Environment variables updated
- [ ] Database functions/triggers copied
- [ ] Custom types copied