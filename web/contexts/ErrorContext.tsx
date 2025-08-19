"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Error types
export type ErrorType = 'network' | 'validation' | 'system' | 'auth' | 'rate-limit' | 'unknown';

export interface AppError {
  id: string;
  type: ErrorType;
  message: string;
  code?: string | number;
  details?: any;
  timestamp: Date;
  context?: {
    component?: string;
    action?: string;
    userId?: string;
    sessionId?: string;
    url?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved?: boolean;
}

export interface ErrorContextValue {
  errors: AppError[];
  addError: (error: Omit<AppError, 'id' | 'timestamp'>) => string;
  removeError: (errorId: string) => void;
  clearErrors: () => void;
  resolveError: (errorId: string) => void;
  getErrorsByType: (type: ErrorType) => AppError[];
  getUnresolvedErrors: () => AppError[];
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
  maxErrors?: number;
  autoResolveDelay?: number;
  onError?: (error: AppError) => void;
}

export function ErrorProvider({ 
  children, 
  maxErrors = 50,
  autoResolveDelay = 5000,
  onError 
}: ErrorProviderProps) {
  const [errors, setErrors] = useState<AppError[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Add a new error
  const addError = useCallback((errorData: Omit<AppError, 'id' | 'timestamp'>): string => {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newError: AppError = {
      id: errorId,
      timestamp: new Date(),
      resolved: false,
      ...errorData,
      context: {
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        sessionId: typeof window !== 'undefined' ? localStorage.getItem('ratemyfeet_session_id') || undefined : undefined,
        ...errorData.context
      }
    };

    setErrors(prev => {
      // Remove oldest errors if we've hit the limit
      const updatedErrors = prev.length >= maxErrors 
        ? prev.slice(1) 
        : prev;
      
      return [...updatedErrors, newError];
    });

    // Call external error handler
    onError?.(newError);

    // Log error to console based on severity
    const logMethod = newError.severity === 'critical' || newError.severity === 'high' 
      ? console.error 
      : newError.severity === 'medium' 
        ? console.warn 
        : console.info;

    logMethod('Error added to context:', newError);

    // Report to external services
    reportError(newError);

    // Auto-resolve low severity errors
    if (newError.severity === 'low' && autoResolveDelay > 0) {
      setTimeout(() => {
        resolveError(errorId);
      }, autoResolveDelay);
    }

    return errorId;
  }, [maxErrors, autoResolveDelay, onError]);

  // Remove an error
  const removeError = useCallback((errorId: string) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Mark an error as resolved
  const resolveError = useCallback((errorId: string) => {
    setErrors(prev => 
      prev.map(error => 
        error.id === errorId 
          ? { ...error, resolved: true }
          : error
      )
    );
  }, []);

  // Get errors by type
  const getErrorsByType = useCallback((type: ErrorType): AppError[] => {
    return errors.filter(error => error.type === type);
  }, [errors]);

  // Get unresolved errors
  const getUnresolvedErrors = useCallback((): AppError[] => {
    return errors.filter(error => !error.resolved);
  }, [errors]);

  const value: ErrorContextValue = {
    errors,
    addError,
    removeError,
    clearErrors,
    resolveError,
    getErrorsByType,
    getUnresolvedErrors,
    isLoading,
    setLoading
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

// Hook to use error context
export function useError(): ErrorContextValue {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}

// Convenience hooks for specific error operations
export function useErrorHandler() {
  const { addError } = useError();

  const handleError = useCallback((
    error: Error | string,
    type: ErrorType = 'unknown',
    severity: AppError['severity'] = 'medium',
    context?: AppError['context']
  ): string => {
    const message = typeof error === 'string' ? error : error.message;
    const details = typeof error === 'object' ? {
      name: error.name,
      stack: error.stack,
      cause: error.cause
    } : undefined;

    return addError({
      type,
      message,
      details,
      severity,
      context
    });
  }, [addError]);

  const handleNetworkError = useCallback((
    error: Error | string,
    context?: AppError['context']
  ): string => {
    return handleError(error, 'network', 'high', context);
  }, [handleError]);

  const handleValidationError = useCallback((
    error: Error | string,
    context?: AppError['context']
  ): string => {
    return handleError(error, 'validation', 'low', context);
  }, [handleError]);

  const handleSystemError = useCallback((
    error: Error | string,
    context?: AppError['context']
  ): string => {
    return handleError(error, 'system', 'critical', context);
  }, [handleError]);

  const handleAuthError = useCallback((
    error: Error | string,
    context?: AppError['context']
  ): string => {
    return handleError(error, 'auth', 'high', context);
  }, [handleError]);

  const handleRateLimitError = useCallback((
    error: Error | string,
    context?: AppError['context']
  ): string => {
    return handleError(error, 'rate-limit', 'medium', context);
  }, [handleError]);

  return {
    handleError,
    handleNetworkError,
    handleValidationError,
    handleSystemError,
    handleAuthError,
    handleRateLimitError
  };
}

// Report error to external services
function reportError(error: AppError) {
  try {
    // Report to Sentry (if available)
    // if (window.Sentry) {
    //   window.Sentry.captureException(new Error(error.message), {
    //     tags: {
    //       errorType: error.type,
    //       severity: error.severity
    //     },
    //     extra: {
    //       errorId: error.id,
    //       details: error.details,
    //       context: error.context
    //     }
    //   });
    // }

    // Report to analytics (if available)
    // if (window.gtag) {
    //   window.gtag('event', 'exception', {
    //     description: error.message,
    //     fatal: error.severity === 'critical',
    //     custom_map: {
    //       error_type: error.type,
    //       error_id: error.id
    //     }
    //   });
    // }

    // Store error in local storage for debugging
    if (typeof window !== 'undefined') {
      try {
        const storageKey = `app_errors`;
        const existingErrors = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        // Keep only last 10 errors in storage
        const updatedErrors = [...existingErrors, error].slice(-10);
        
        localStorage.setItem(storageKey, JSON.stringify(updatedErrors));
      } catch (storageError) {
        console.warn('Failed to store error in localStorage:', storageError);
      }
    }

    // Send to server endpoint (if configured)
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(error)
    // }).catch(console.warn);

  } catch (reportingError) {
    console.error('Failed to report error:', reportingError);
  }
}

// Error boundary integration
export function useErrorBoundaryHandler() {
  const { addError } = useError();

  return useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    addError({
      type: 'system',
      message: error.message,
      severity: 'critical',
      details: {
        name: error.name,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      },
      context: {
        component: 'ErrorBoundary'
      }
    });
  }, [addError]);
}