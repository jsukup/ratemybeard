"use client";

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    
    // Update state with error info
    this.setState({
      errorInfo
    });

    // Log error details
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // Call custom error handler if provided
    onError?.(error, errorInfo);

    // Report to error monitoring service (if available)
    this.reportError(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && !prevProps.hasError) {
      // Error just occurred, set auto-reset timer
      this.resetTimeoutId = window.setTimeout(() => {
        this.resetErrorBoundary();
      }, 30000); // Auto-reset after 30 seconds
    }

    if (hasError && resetOnPropsChange && resetKeys) {
      // Check if any reset keys have changed
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Report to error monitoring service (e.g., Sentry)
      // window.Sentry?.captureException(error, {
      //   contexts: {
      //     react: {
      //       componentStack: errorInfo.componentStack
      //     }
      //   }
      // });

      // Report to analytics
      // window.gtag?.('event', 'exception', {
      //   description: error.message,
      //   fatal: false
      // });

      // Store error locally for debugging
      if (typeof window !== 'undefined') {
        const errorReport = {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        };

        localStorage.setItem(`error_${this.state.errorId}`, JSON.stringify(errorReport));
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  refreshPage = () => {
    window.location.reload();
  };

  goHome = () => {
    window.location.href = '/';
  };

  reportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    
    // Create a bug report with error details
    const bugReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    // Open email or bug reporting system
    const subject = encodeURIComponent(`Bug Report: ${error?.message || 'Application Error'}`);
    const body = encodeURIComponent(`
Error ID: ${errorId}
Message: ${error?.message || 'Unknown error'}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
[Your description here]

Technical Details:
${JSON.stringify(bugReport, null, 2)}
    `);

    window.open(`mailto:hello@ratemyfeet.com?subject=${subject}&body=${body}`);
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails = false } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Oops! Something went wrong
              </CardTitle>
              <CardDescription className="text-lg">
                We&apos;re sorry, but something unexpected happened. Don&apos;t worry - your data is safe.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error message */}
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {error?.message || 'An unexpected error occurred'}
                </AlertDescription>
              </Alert>

              {/* Error details (for development/debugging) */}
              {showDetails && error && (
                <div className="space-y-4">
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-sm text-gray-700 hover:text-gray-900">
                      View technical details
                    </summary>
                    <div className="mt-2 p-4 bg-gray-100 rounded-lg text-xs font-mono overflow-auto max-h-40">
                      <pre>{error.stack}</pre>
                      {errorInfo && (
                        <>
                          <hr className="my-2" />
                          <pre>{errorInfo.componentStack}</pre>
                        </>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.resetErrorBoundary}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.refreshPage}
                  className="flex-1"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
                </Button>
                
                <Button 
                  onClick={this.goHome}
                  className="flex-1"
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {/* Additional help */}
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  If this problem persists, please let us know.
                </p>
                <Button 
                  onClick={this.reportBug}
                  variant="ghost"
                  size="sm"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Report this issue
                </Button>
              </div>

              {/* Auto-reset notification */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  This page will automatically retry in 30 seconds.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

// HOC wrapper for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Utility function to trigger error boundary for testing
export function triggerErrorBoundary(message: string = 'Test error'): never {
  throw new Error(message);
}