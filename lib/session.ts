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
  
  // Validate session ID to ensure it's safe for HTTP headers
  if (!isValidHeaderValue(sessionId)) {
    console.error('Invalid session ID detected, generating new one');
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  
  return sessionId;
}

/**
 * Validate if a string is safe to use as an HTTP header value
 * @param value String to validate
 * @returns boolean indicating if the value is valid
 */
function isValidHeaderValue(value: string | null): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  // HTTP header values must be ASCII and not contain control characters
  // eslint-disable-next-line no-control-regex
  return /^[\x20-\x7E]*$/.test(value) && value.length > 0 && value.length < 8192;
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