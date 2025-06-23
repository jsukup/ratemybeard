import { supabase } from '@/lib/supabase';

/**
 * Generate and store a unique session ID in localStorage
 */
export function getSessionId(): string {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // For SSR, return a temporary session ID
    return `temp_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  const SESSION_KEY = 'ratemyfeet_session_id';
  
  let sessionId = localStorage.getItem(SESSION_KEY);
  
  if (!sessionId) {
    // Generate new session ID with timestamp and random string
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  
  return sessionId;
}

/**
 * Clear the current session (useful for testing or logout)
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  
  const SESSION_KEY = 'ratemyfeet_session_id';
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Check if the current session has already rated a specific image
 */
export async function hasRatedImage(imageId: string): Promise<boolean> {
  try {
    const sessionId = getSessionId();
    
    const { data, error } = await supabase
      .from('ratings')
      .select('id')
      .eq('image_id', imageId)
      .eq('session_id', sessionId)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking if image was rated:', error);
      return false; // Assume not rated on error to allow rating attempt
    }
    
    return !!data; // Returns true if a rating exists
  } catch (error) {
    console.error('Error in hasRatedImage:', error);
    return false; // Assume not rated on error
  }
}

/**
 * Get all ratings by the current session
 */
export async function getSessionRatings(): Promise<Array<{
  id: string;
  image_id: string;
  rating: number;
  created_at: string;
}> | null> {
  try {
    const sessionId = getSessionId();
    
    const { data, error } = await supabase
      .from('ratings')
      .select('id, image_id, rating, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching session ratings:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getSessionRatings:', error);
    return null;
  }
}

/**
 * Check IP-based rate limiting for the current session
 */
export async function checkRateLimit(ipAddress?: string): Promise<{
  allowed: boolean;
  ratingsToday: number;
  limit: number;
  resetsAt: Date;
}> {
  const DAILY_RATING_LIMIT = 50;
  
  try {
    // If no IP address provided, we can't enforce IP-based rate limiting
    if (!ipAddress || ipAddress === 'unknown') {
      return {
        allowed: true,
        ratingsToday: 0,
        limit: DAILY_RATING_LIMIT,
        resetsAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      };
    }
    
    // Calculate start and end of current day
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    // Count ratings from this IP today
    const { data, error, count } = await supabase
      .from('ratings')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ipAddress)
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString());
    
    if (error) {
      console.error('Error checking rate limit:', error);
      // On error, allow the request but log it
      return {
        allowed: true,
        ratingsToday: 0,
        limit: DAILY_RATING_LIMIT,
        resetsAt: endOfDay
      };
    }
    
    const ratingsToday = count || 0;
    const allowed = ratingsToday < DAILY_RATING_LIMIT;
    
    return {
      allowed,
      ratingsToday,
      limit: DAILY_RATING_LIMIT,
      resetsAt: endOfDay
    };
    
  } catch (error) {
    console.error('Error in checkRateLimit:', error);
    return {
      allowed: true,
      ratingsToday: 0,
      limit: DAILY_RATING_LIMIT,
      resetsAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }
}

/**
 * Get session statistics
 */
export async function getSessionStats(): Promise<{
  totalRatings: number;
  averageRating: number;
  ratingsToday: number;
  firstRatingDate?: string;
  lastRatingDate?: string;
} | null> {
  try {
    const sessionId = getSessionId();
    
    // Get all ratings for this session
    const { data: ratings, error } = await supabase
      .from('ratings')
      .select('rating, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching session stats:', error);
      return null;
    }
    
    if (!ratings || ratings.length === 0) {
      return {
        totalRatings: 0,
        averageRating: 0,
        ratingsToday: 0
      };
    }
    
    // Calculate statistics
    const totalRatings = ratings.length;
    const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;
    const firstRatingDate = ratings[0].created_at;
    const lastRatingDate = ratings[ratings.length - 1].created_at;
    
    // Count ratings from today
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const ratingsToday = ratings.filter(r => 
      r.created_at.startsWith(today)
    ).length;
    
    return {
      totalRatings,
      averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
      ratingsToday,
      firstRatingDate,
      lastRatingDate
    };
    
  } catch (error) {
    console.error('Error in getSessionStats:', error);
    return null;
  }
}

/**
 * Validate if a session ID is in the correct format
 */
export function isValidSessionId(sessionId: string): boolean {
  if (!sessionId || typeof sessionId !== 'string') {
    return false;
  }
  
  // Check if it matches our session ID format: session_TIMESTAMP_RANDOMSTRING
  const sessionPattern = /^session_\d+_[a-z0-9]+$/;
  const tempSessionPattern = /^temp_session_\d+_[a-z0-9]+$/;
  
  return sessionPattern.test(sessionId) || tempSessionPattern.test(sessionId);
}

/**
 * Get IP address from request headers (for use in API routes)
 */
export function getClientIP(headers: Headers): string {
  const xForwardedFor = headers.get('x-forwarded-for');
  const xRealIP = headers.get('x-real-ip');
  const cfConnectingIP = headers.get('cf-connecting-ip'); // Cloudflare
  
  if (xForwardedFor) {
    // x-forwarded-for can be a comma-separated list, take the first one
    return xForwardedFor.split(',')[0].trim();
  }
  
  if (xRealIP) {
    return xRealIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}