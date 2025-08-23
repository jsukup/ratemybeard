import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get configuration from app.json
const supabaseUrl = Constants.expoConfig?.extra?.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types (simplified for mobile)
export interface DatabaseImage {
  id: string;
  url: string;
  username: string;
  median_score: number | null;
  total_ratings: number;
  created_at: string;
  percentile_rank: number | null;
}

export interface DatabaseRating {
  id: string;
  image_id: string;
  rating: number;
  session_id: string | null;
  created_at: string;
}

// Upload image to Supabase storage
export async function uploadImage(uri: string, username: string): Promise<string> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${username}_${timestamp}.jpg`;
    
    // Convert image URI to blob for upload
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Upload to storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filename, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });
    
    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

// Insert image record into database
export async function createImageRecord(
  url: string, 
  username: string
): Promise<DatabaseImage> {
  try {
    const { data, error } = await supabase
      .from('images')
      .insert({
        url,
        username,
        median_score: null,
        total_ratings: 0,
        percentile_rank: null,
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database insert failed: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error creating image record:', error);
    throw error;
  }
}

// Submit a rating
export async function submitRating(
  imageId: string, 
  rating: number, 
  sessionId?: string
): Promise<DatabaseRating> {
  try {
    const { data, error } = await supabase
      .from('ratings')
      .insert({
        image_id: imageId,
        rating,
        session_id: sessionId || null,
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Rating submission failed: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error submitting rating:', error);
    throw error;
  }
}

// Get images by category/percentile range
export async function getImagesByCategory(
  limit: number = 20, 
  offset: number = 0
): Promise<DatabaseImage[]> {
  try {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .not('median_score', 'is', null)
      .order('median_score', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw new Error(`Failed to fetch images: ${error.message}`);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching images:', error);
    throw error;
  }
}

// Get newest images (unrated or recently added)
export async function getNewestImages(
  limit: number = 20, 
  offset: number = 0
): Promise<DatabaseImage[]> {
  try {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw new Error(`Failed to fetch newest images: ${error.message}`);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching newest images:', error);
    throw error;
  }
}