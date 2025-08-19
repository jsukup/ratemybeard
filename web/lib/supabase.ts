import { SupabaseClientFactory, WebEnvironmentProvider } from '@shared/services/supabase';

// Set up web environment provider for shared Supabase client
SupabaseClientFactory.setEnvironmentProvider(new WebEnvironmentProvider());

// Get the configured Supabase client
export const supabase = SupabaseClientFactory.getClient();

// Re-export shared types and utilities
export { ImageEntry, Rating, RatingSubmissionData } from '@shared/types/supabase';
export { isSupabaseConfigured } from '@shared/services/supabase';