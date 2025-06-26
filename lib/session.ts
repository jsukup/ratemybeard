/**
 * Session management utilities for rating system
 */

const SESSION_KEY = 'ratemyfeet_session_id';

/**
 * Get or create a session ID
 * @returns Session ID string
 */
export function getOrCreateSessionId(): string {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Server-side: generate a temporary session ID
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Client-side: try to get existing session ID
  let sessionId = localStorage.getItem(SESSION_KEY);
  
  if (!sessionId) {
    // Generate new session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  
  return sessionId;
}

/**
 * Clear the current session ID (for testing purposes)
 */
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Get current session ID without creating a new one
 * @returns Session ID or null if none exists
 */
export function getCurrentSessionId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  return localStorage.getItem(SESSION_KEY);
}