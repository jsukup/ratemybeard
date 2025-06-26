import { createClient } from '@supabase/supabase-js';

// Initialize with placeholder values if env vars are not set
// This allows the app to build even without proper environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Log a warning if environment variables are missing
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables are missing. Using placeholder values. Database operations will fail.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Check if Supabase is properly configured
 * @returns boolean indicating if environment variables are set
 */
export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export type ImageEntry = {
  id: string;
  username: string;
  image_url: string;
  image_name?: string;
  median_score?: number;
  rating_count: number;
  is_visible: boolean;
  created_at: string;
};

export type Rating = {
  id: string;
  image_id: string;
  rating: number;
  session_id: string;
  ip_address?: string;
  created_at: string;
};