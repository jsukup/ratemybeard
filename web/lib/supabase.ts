// Server-side Supabase configuration for API routes
import { createClient } from '@supabase/supabase-js';

// Server-side environment variables (accessible in API routes)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Create server-side Supabase client
export const supabase = createClient(
  supabaseUrl.trim().replace(/\s+/g, ''),
  supabaseAnonKey.trim().replace(/\s+/g, ''),
  {
    auth: {
      persistSession: false, // Server-side doesn't need session persistence
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Re-export shared types and utilities
export type { 
  ImageEntry, 
  Rating, 
  RatingSubmissionData,
  LeaderboardImage,
  CategoryName,
  CategoryConfig,
  RatingSubmission,
  RatingResponse
} from '@shared/types/supabase';
export function isSupabaseConfigured(): boolean {
  return !!(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'https://placeholder-url.supabase.co' && 
    supabaseAnonKey !== 'placeholder-key'
  );
}