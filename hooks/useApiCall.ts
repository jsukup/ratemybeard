import { useState, useCallback, useRef, useEffect } from 'react';
import { useErrorHandler } from '@/contexts/ErrorContext';

// Configuration for API calls
export interface ApiCallConfig {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  enableRetry?: boolean;
  retryCondition?: (error: Error) => boolean;
}

// Response wrapper for API calls
export interface ApiResponse<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  retry: () => void;
  cancel: () => void;
}

// Default configuration
const DEFAULT_CONFIG: Required<ApiCallConfig> = {
  retries: 3,
  retryDelay: 1000,
  timeout: 30000,
  onSuccess: () => {},
  onError: () => {},
  enableRetry: true,
  retryCondition: (error: Error) => {
    // Retry on network errors but not on client errors (4xx)
    return !error.message.includes('4') || error.message.includes('timeout');
  }
};

// Main API call hook
export function useApiCall<T = any>(config: ApiCallConfig = {}): ApiResponse<T> & {
  execute: (apiFunction: () => Promise<T>, ...args: any[]) => Promise<T | null>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { handleNetworkError, handleSystemError } = useErrorHandler();
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentConfigRef = useRef<Required<ApiCallConfig>>();

  // Merge config with defaults
  currentConfigRef.current = { ...DEFAULT_CONFIG, ...config };

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Cancel current request
  const cancel = useCallback(() => {
    cleanup();
    setLoading(false);
    setError('Request cancelled');
  }, [cleanup]);

  // Execute API call with retry logic
  const executeWithRetries = useCallback(async (
    apiFunction: () => Promise<T>,
    attempt: number = 1
  ): Promise<T | null> => {
    const cfg = currentConfigRef.current!;
    
    try {
      // Create new abort controller for this attempt
      abortControllerRef.current = new AbortController();
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        abortControllerRef.current?.abort();
      }, cfg.timeout);

      // Execute the API function
      const result = await Promise.race([
        apiFunction(),
        new Promise<never>((_, reject) => {
          abortControllerRef.current?.signal.addEventListener('abort', () => {
            reject(new Error('Request timeout or cancelled'));
          });
        })
      ]);

      clearTimeout(timeoutId);
      
      // Success
      setData(result);
      setError(null);
      setSuccess(true);
      cfg.onSuccess(result);
      
      return result;

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      // Check if we should retry
      const shouldRetry = attempt < cfg.retries && 
                         cfg.enableRetry && 
                         cfg.retryCondition(error) &&
                         !abortControllerRef.current?.signal.aborted;

      if (shouldRetry) {
        // Wait before retry with exponential backoff
        const delay = cfg.retryDelay * Math.pow(2, attempt - 1);
        
        return new Promise((resolve) => {
          retryTimeoutRef.current = setTimeout(async () => {
            console.log(`API call retry attempt ${attempt + 1}/${cfg.retries}`);
            const result = await executeWithRetries(apiFunction, attempt + 1);
            resolve(result);
          }, delay);
        });
      }

      // No more retries, handle error
      const errorMessage = error.message || 'API call failed';
      setError(errorMessage);
      setSuccess(false);
      
      // Report error to context
      if (error.message.includes('timeout') || error.message.includes('network')) {
        handleNetworkError(error, { action: 'api_call', attempt });
      } else {
        handleSystemError(error, { action: 'api_call', attempt });
      }
      
      cfg.onError(error);
      
      return null;
    } finally {
      setLoading(false);
      cleanup();
    }
  }, [handleNetworkError, handleSystemError, cleanup]);

  // Main execute function
  const execute = useCallback(async (
    apiFunction: () => Promise<T>,
    ...args: any[]
  ): Promise<T | null> => {
    // Reset state
    setLoading(true);
    setError(null);
    setSuccess(false);
    setData(null);

    // Create bound function with arguments
    const boundFunction = args.length > 0 
      ? () => apiFunction.apply(null, args as any)
      : apiFunction;

    return executeWithRetries(boundFunction);
  }, [executeWithRetries]);

  // Retry function
  const retry = useCallback(() => {
    if (!loading) {
      // Re-execute last API call if available
      // This would need the last function to be stored, implementing basic version
      setError('Retry functionality requires re-calling execute()');
    }
  }, [loading]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    data,
    loading,
    error,
    success,
    execute,
    retry,
    cancel
  };
}

// Specialized hooks for common API patterns

// Hook for GET requests
export function useApiGet<T = any>(url: string, config: ApiCallConfig = {}) {
  const apiCall = useApiCall<T>(config);
  
  const get = useCallback(async (params?: Record<string, any>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const fullUrl = url + queryString;
    
    return apiCall.execute(async () => {
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    });
  }, [url, apiCall]);

  return { ...apiCall, get };
}

// Hook for POST requests
export function useApiPost<T = any>(url: string, config: ApiCallConfig = {}) {
  const apiCall = useApiCall<T>(config);
  
  const post = useCallback(async (data?: any, headers?: Record<string, string>) => {
    return apiCall.execute(async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: data ? JSON.stringify(data) : undefined
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    });
  }, [url, apiCall]);

  return { ...apiCall, post };
}

// Hook for PUT requests
export function useApiPut<T = any>(url: string, config: ApiCallConfig = {}) {
  const apiCall = useApiCall<T>(config);
  
  const put = useCallback(async (data?: any, headers?: Record<string, string>) => {
    return apiCall.execute(async () => {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: data ? JSON.stringify(data) : undefined
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    });
  }, [url, apiCall]);

  return { ...apiCall, put };
}

// Hook for DELETE requests
export function useApiDelete<T = any>(url: string, config: ApiCallConfig = {}) {
  const apiCall = useApiCall<T>(config);
  
  const del = useCallback(async (headers?: Record<string, string>) => {
    return apiCall.execute(async () => {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Handle empty responses
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    });
  }, [url, apiCall]);

  return { ...apiCall, delete: del };
}

// Hook for file uploads
export function useFileUpload(url: string, config: ApiCallConfig = {}) {
  const apiCall = useApiCall<any>(config);
  
  const upload = useCallback(async (
    file: File,
    fieldName: string = 'file',
    additionalFields?: Record<string, string>
  ) => {
    return apiCall.execute(async () => {
      const formData = new FormData();
      formData.append(fieldName, file);
      
      if (additionalFields) {
        Object.entries(additionalFields).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    });
  }, [url, apiCall]);

  return { ...apiCall, upload };
}

// Utility function for handling API responses consistently
export function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text() as any;
}

// Network status hook
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}