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

  // Client-side: try to get existing session ID with fallback for blocked localStorage
  let sessionId = null;
  
  // Try localStorage first
  try {
    sessionId = localStorage.getItem(SESSION_KEY);
  } catch (error) {
    console.warn('localStorage access blocked, using fallback session management:', error);
  }
  
  // If no session ID or localStorage failed, try sessionStorage
  if (!sessionId) {
    try {
      sessionId = sessionStorage.getItem(SESSION_KEY);
    } catch (error) {
      console.warn('sessionStorage access also blocked:', error);
    }
  }
  
  // If still no session ID, check for in-memory fallback
  if (!sessionId && (window as any)._rateMyFeetSession) {
    sessionId = (window as any)._rateMyFeetSession;
  }
  
  // Generate new session ID if none exists
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Try to store in localStorage first
    try {
      localStorage.setItem(SESSION_KEY, sessionId);
    } catch (error) {
      // If localStorage fails, try sessionStorage
      try {
        sessionStorage.setItem(SESSION_KEY, sessionId);
      } catch (error2) {
        // If both fail, store in memory as last resort
        console.warn('Both localStorage and sessionStorage blocked, using in-memory session storage');
        (window as any)._rateMyFeetSession = sessionId;
      }
    }
  }
  
  // Validate session ID to ensure it's safe for HTTP headers
  if (!isValidHeaderValue(sessionId)) {
    console.error('Invalid session ID detected, generating new one');
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store the new valid session ID
    try {
      localStorage.setItem(SESSION_KEY, sessionId);
    } catch (error) {
      try {
        sessionStorage.setItem(SESSION_KEY, sessionId);
      } catch (error2) {
        (window as any)._rateMyFeetSession = sessionId;
      }
    }
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
    // Clear from all possible storage locations
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      // localStorage might be blocked
    }
    
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
      // sessionStorage might be blocked
    }
    
    // Clear in-memory storage
    delete (window as any)._rateMyFeetSession;
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
  
  // Try localStorage first
  try {
    const sessionId = localStorage.getItem(SESSION_KEY);
    if (sessionId) return sessionId;
  } catch (error) {
    // localStorage might be blocked
  }
  
  // Try sessionStorage
  try {
    const sessionId = sessionStorage.getItem(SESSION_KEY);
    if (sessionId) return sessionId;
  } catch (error) {
    // sessionStorage might be blocked
  }
  
  // Check in-memory storage
  return (window as any)._rateMyFeetSession || null;
}