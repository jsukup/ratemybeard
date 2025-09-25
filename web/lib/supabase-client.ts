import { createClient } from '@supabase/supabase-js';

// Client-side Supabase configuration with cleaning to remove problematic characters
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '')
  .trim()
  .replace(/\s+/g, '')     // Remove any whitespace
  .replace(/\n/g, '')      // Remove actual newlines
  .replace(/\r/g, '');     // Remove actual carriage returns

const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
  .trim()
  .replace(/\s+/g, '')     // Remove any whitespace
  .replace(/\n/g, '')      // Remove actual newlines
  .replace(/\r/g, '');     // Remove actual carriage returns

// Check if environment variables are configured
const isConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder-url.supabase.co' && 
  supabaseAnonKey !== 'placeholder-key'
);

// Log configuration status for debugging (only if there are issues)
if (typeof window !== 'undefined' && !isConfigured) {
  console.warn('Supabase client not properly configured:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
}

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