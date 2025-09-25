import { createClient } from '@supabase/supabase-js';

// Client-side Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Check if environment variables are configured
const isConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder-url.supabase.co' && 
  supabaseAnonKey !== 'placeholder-key'
);

// Create Supabase client with singleton pattern to avoid multiple instances
let supabaseInstance: any = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      supabaseUrl || 'https://placeholder-url.supabase.co',
      supabaseAnonKey || 'placeholder-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      }
    );
  }
  return supabaseInstance;
})();

export function isSupabaseConfigured(): boolean {
  return isConfigured;
}

// Re-export types
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