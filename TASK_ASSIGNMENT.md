# TASK_ASSIGNMENT.md

## Worktree: ratemyfeet-database
## Branch: task/database 
## Priority: high

## Description:
Update Database Schema for User Rating System

## Primary Reference Files:
- **Task 2**: `.taskmaster/tasks/task_002.txt`

## Assigned Tasks: 2 + ALL 8 Subtasks (2.1 through 2.8)

### Instructions for Claude Code:
1. **READ FIRST**: `.taskmaster/tasks/task_002.txt` for complete implementation details and all subtasks
2. **FOLLOW EXACTLY**: All subtask specifications and test strategies
3. **SEQUENTIAL EXECUTION**: Follow subtask dependencies carefully (2.1 → 2.2 → 2.3 → etc.)
4. **DATABASE FOCUS**: This is pure database/schema work - avoid frontend changes

## Task 2 Main Details:
**Update Database Schema for User Rating System**
- **Priority**: High
- **Dependencies**: Task 1 (AI cleanup should complete first)
- **Reference**: `.taskmaster/tasks/task_002.txt`

### Core Database Changes:
1. Create ratings table with proper constraints and indexes
2. Remove AI-related columns from images table
3. Add median_score and rating_count columns to images table
4. Create materialized view for efficient median calculations
5. Implement database functions and triggers

## ALL SUBTASKS (from task_002.txt):

### Subtask 2.1: Create ratings table with proper constraints and indexes
- **Dependencies**: None
- **Description**: Create the core ratings table in Supabase
- **SQL**: Complete table creation with UUID, foreign keys, constraints, indexes

### Subtask 2.2: Identify and document AI-related columns in images table
- **Dependencies**: None  
- **Description**: Audit current images table schema
- **Action**: Document all AI columns for safe removal

### Subtask 2.3: Add median_score and rating_count columns to images table
- **Dependencies**: Subtask 2.2
- **Description**: Extend images table with aggregated rating statistics
- **Columns**: median_score (DECIMAL), rating_count (INTEGER)

### Subtask 2.4: Remove AI-related columns from images table
- **Dependencies**: Subtasks 2.2, 2.3
- **Description**: Drop all identified AI-related columns
- **Timing**: After new columns added to maintain availability

### Subtask 2.5: Create materialized view for efficient median calculations
- **Dependencies**: Subtasks 2.1, 2.4
- **Description**: Pre-compute median ratings using percentile_cont
- **Features**: Refresh strategy and indexing

### Subtask 2.6: Create database functions for rating aggregation
- **Dependencies**: Subtasks 2.3, 2.5
- **Description**: Stored procedures for rating calculations
- **Functions**: Median calculation, rating_count updates, view refresh

### Subtask 2.7: Set up database triggers for automatic statistics updates
- **Dependencies**: Subtasks 2.1, 2.6
- **Description**: Auto-update triggers on ratings table
- **Events**: INSERT, UPDATE, DELETE on ratings

### Subtask 2.8: Migrate existing data and validate schema changes
- **Dependencies**: Subtasks 2.4, 2.7
- **Description**: Final migration and comprehensive testing
- **Includes**: Data population, constraint validation, rollback procedures

## SQL Schemas to Implement:

### Ratings Table (from task_002.txt):
```sql
CREATE TABLE ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  rating DECIMAL(4,2) CHECK (rating >= 0.00 AND rating <= 10.00),
  session_id TEXT NOT NULL,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ratings_image_id ON ratings(image_id);
CREATE INDEX idx_ratings_session_image ON ratings(session_id, image_id);
```

## Test Strategy (from task_002.txt):
- Test database schema changes by inserting sample ratings data
- Verify constraints work correctly (0.00-10.00 range)
- Test foreign key relationships and indexes perform efficiently
- Validate all subtask test strategies individually

## Dependencies & Coordination:
- **Depends on**: Task 1 (AI cleanup) completion for clean foundation
- **Provides foundation for**: Tasks 3-6 (Rating System) - they need this schema
- **Coordinate with**: Rating system team on schema requirements

## DO NOT MODIFY:
- Frontend components (Tasks 3-6's responsibility)
- API routes except schema-related database utilities
- UI/UX elements (Task 11's responsibility)

## Work Sequence:
1. ✅ Read `.taskmaster/tasks/task_002.txt` and understand all 8 subtasks
2. ⬜ Execute Subtask 2.1: Create ratings table
3. ⬜ Execute Subtask 2.2: Audit and document AI columns  
4. ⬜ Execute Subtask 2.3: Add new columns to images table
5. ⬜ Execute Subtask 2.4: Remove AI columns
6. ⬜ Execute Subtask 2.5: Create materialized view
7. ⬜ Execute Subtask 2.6: Create database functions
8. ⬜ Execute Subtask 2.7: Set up triggers
9. ⬜ Execute Subtask 2.8: Final migration and validation

## Success Criteria:
- All 8 subtasks completed according to task_002.txt specifications
- New ratings table operational with proper constraints
- Images table updated with median_score and rating_count columns
- All AI-related database columns removed
- Materialized views and triggers functioning
- Database ready for rating system implementation