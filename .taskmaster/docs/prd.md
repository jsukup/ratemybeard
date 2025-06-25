# Overview

RateMyFeet is a lighthearted web platform that allows users to rate the attractiveness of feet through user-generated scoring. Unlike its predecessor which used AI-based facial attractiveness scoring, this platform leverages human judgment to provide subjective ratings.

The platform targets a general audience interested in foot aesthetics, offering an entertaining way for users to engage with and rate foot images. While not solving a critical problem, the platform serves as an engaging pastime where users can share their opinions and discover how others perceive foot attractiveness.

# Core Features

## Image Capture and Upload

- Webcam/mobile camera integration for direct image capture
- Removal of face detection component from previous implementation
- "Add to Leaderboard" functionality after image capture
- Support for user-uploaded images

## Rating System

- Precise 0.00 to 10.00 scoring scale with two decimal precision
- Interactive sliding scale interface for rating
- Real-time score display next to the sliding scale
- Submit button for finalizing ratings
- Dynamic score updates in the leaderboard

## Leaderboard Categories

- "The Smoke Shows" (Top rankings)
- "The Monets" (High rankings)
- "The Mehs" (Mid-tier rankings)
- "The Plebs" (Lower rankings)
- "The Dregs" (Bottom rankings)

## Future-Proofing

- Architecture supports potential future implementation of image tags/categories
- Maintainable codebase for feature expansion

# User Experience

## User Roles

- General Users: All users have equal access to rate and upload images
- Admin: Special access for platform management and moderation

## User Flow

1. Image Capture
   - User takes a photo using webcam/mobile camera
   - Clicks "Add to Leaderboard" button

2. Username Selection
   - System prompts for a unique username
   - Real-time validation against existing usernames in Supabase
   - Feedback if username is already taken
   - Option to try different username if needed

3. Submission
   - User confirms submission
   - Automatic redirect to Leaderboard
   - Entry appears in appropriate ranking category

## Future Social Features

- Architecture designed to support potential future additions:
  - Comments system
  - Image sharing capabilities
  - Social media integration
  - User interactions

# Technical Architecture

## Infrastructure

- Frontend: Next.js application
- Backend: Supabase
- Deployment: Vercel
- Organization: Expected X (slug: ybfcxfkgkecqvmmtlshf)

## Database & Storage

- Supabase project for:
  - User data storage
  - Image storage
  - Leaderboard data
  - Username validation

## Performance Requirements

- Page load optimization for Google AdSense compliance
- Efficient image handling and storage
- Responsive leaderboard updates

## System Modifications

1. AI Model Removal
   - Remove Replicate integration
   - Remove AI scoring components
   - Clean up unused model dependencies

2. Leaderboard Updates
   - Implement user scoring interface
   - Modify ranking system for user-generated scores
   - Update leaderboard display components

3. Branding Updates
   - Remove 'looxmaxx' references
   - Update logos and branding elements
   - Implement new RateMyFeet branding

# Development Roadmap

## Phase 1: Core System Modifications

1. AI Model Removal
   - Remove Replicate integration and dependencies
   - Clean up AI scoring components
   - Update database schema for user ratings

2. Rating System Implementation
   - Add rating scale slider component
   - Implement real-time score display
   - Add submit button functionality
   - Create rating submission API endpoints

3. Leaderboard Updates
   - Modify leaderboard to show newest images first
   - Implement median score calculation
   - Update ranking system for user-generated scores
   - Add minimum rating threshold (10 ratings) for ranking

## Phase 2: Performance Optimization

1. Page Load Optimization
   - Optimize image loading and caching
   - Implement lazy loading for leaderboard entries
   - Ensure Google AdSense compliance
   - Performance testing and optimization

2. Database Optimization
   - Optimize rating queries
   - Implement efficient median calculation
   - Add appropriate indexes for performance

## Phase 3: Testing and Refinement

1. User Testing
   - Test rating system functionality
   - Verify leaderboard sorting and ranking
   - Validate median score calculations

2. Performance Testing
   - Load testing for concurrent ratings
   - Page load time verification
   - AdSense integration testing

# Logical Dependency Chain

## Foundation Layer

1. Database Schema Updates
   - Remove AI model related tables/columns
   - Add user rating tables
   - Implement rating aggregation views

2. Core Component Modifications
   - Remove AI model dependencies
   - Update image capture component
   - Modify leaderboard base structure

## Feature Implementation Layer

1. Rating System
   - Implement rating scale component
   - Create rating submission logic
   - Add real-time score updates

2. Leaderboard Updates
   - Implement newest-first sorting
   - Add median score calculation
   - Update ranking logic

## Optimization Layer

1. Performance
   - Implement lazy loading
   - Optimize database queries
   - Add caching mechanisms

2. User Experience
   - Add loading states
   - Implement error handling
   - Add user feedback mechanisms

# Risks and Mitigations

## Technical Risks

### Database Performance

- **Risk**: Large number of ratings per image could impact performance
- **Mitigation**:
  - Implement efficient database indexing for rating queries
  - Use materialized views for median calculations
  - Implement caching for frequently accessed ratings
  - Consider pagination for rating history

### Rating System Scalability

- **Risk**: High concurrent user load affecting rating submission
- **Mitigation**:
  - Leverage Vercel's serverless architecture for handling concurrent requests
  - Utilize Supabase's built-in scalability features
  - Implement rate limiting at the API level
  - Use optimistic updates for better user experience

## Transition Risks

### Codebase Cleanup

- **Risk**: Residual AI model code causing conflicts
- **Mitigation**:
  - Systematic removal of AI-related components
  - Remove "Analyze Photo" button and related functionality
  - Clean up unused dependencies
  - Comprehensive testing after removal

### Data Migration

- **Risk**: Incomplete transition from AI to user ratings
- **Mitigation**:
  - Clear separation of old and new rating systems
  - Database schema updates before feature deployment
  - Validation of all rating-related functionality

## System Integrity

### Rating Manipulation

- **Risk**: Users attempting to rate the same image multiple times
- **Mitigation**:
  - Implement session-based rating restrictions
  - Add IP-based daily rating limits
  - Store rating history with user session data
  - Implement server-side validation

### Data Consistency

- **Risk**: Inconsistent rating calculations
- **Mitigation**:
  - Implement atomic rating updates
  - Use database transactions for rating submissions
  - Regular validation of median calculations
  - Implement data integrity checks

## Performance Concerns

### Load Handling

- **Risk**: High traffic affecting system performance
- **Mitigation**:
  - Utilize Vercel's edge network
  - Implement Supabase connection pooling
  - Add request queuing for peak loads
  - Monitor and optimize database queries

### Resource Management

- **Risk**: Resource exhaustion under heavy load
- **Mitigation**:
  - Implement proper error handling
  - Add circuit breakers for external services
  - Monitor system resources
  - Scale resources based on usage patterns

# Appendix

[Any additional information here]
