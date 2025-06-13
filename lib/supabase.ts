import { createClient } from '@supabase/supabase-js';

// Initialize with placeholder values if env vars are not set
// This allows the app to build even without proper environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Log a warning if environment variables are missing
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables are missing. Using placeholder values for development.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Entry = {
  id: string;
  user_id: string;
  screen_name: string;
  score: number;
  image_url: string;
  image_name: string;
  created_at: string;
  is_visible: boolean;
};