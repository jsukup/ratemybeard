"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

// Toast position
export type ToastPosition = 
  | 'top-left' 
  | 'top-right' 
  | 'top-center'
  | 'bottom-left' 
  | 'bottom-right' 
  | 'bottom-center';

// Toast interface
export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

// Toast context interface
interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
}

// Create context
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Provider props
interface ToastProviderProps {
  children: ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
  defaultDuration?: number;
}

// Toast provider component
export function ToastProvider({ 
  children, 
  position = 'top-right',
  maxToasts = 5,
  defaultDuration = 5000
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Add a new toast
  const addToast = useCallback((toastData: Omit<Toast, 'id'>): string => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newToast: Toast = {
      id,
      duration: defaultDuration,
      ...toastData
    };

    setToasts(prev => {
      // Remove oldest toasts if we exceed max
      const updatedToasts = prev.length >= maxToasts 
        ? prev.slice(1) 
        : prev;
      
      return [...updatedToasts, newToast];
    });

    // Auto-remove non-persistent toasts
    if (!newToast.persistent && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, [defaultDuration, maxToasts]);

  // Remove a toast
  const removeToast = useCallback((id: string) => {
    setToasts(prev => {
      const toast = prev.find(t => t.id === id);
      if (toast?.onClose) {
        toast.onClose();
      }
      return prev.filter(t => t.id !== id);
    });
  }, []);

  // Clear all toasts
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Update a toast
  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev => 
      prev.map(toast => 
        toast.id === id 
          ? { ...toast, ...updates }
          : toast
      )
    );
  }, []);

  const value: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    updateToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer position={position} />
    </ToastContext.Provider>
  );
}

// Toast container component
function ToastContainer({ position }: { position: ToastPosition }) {
  const { toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof window === 'undefined') {
    return null;
  }

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  return createPortal(
    <div className={`fixed z-50 pointer-events-none ${positionClasses[position]}`}>
      <div className="flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((toast) => (
          <ToastComponent 
            key={toast.id} 
            toast={toast} 
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>,
    document.body
  );
}

// Individual toast component
function ToastComponent({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300); // Wait for exit animation
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'loading':
        return (
          <div className="h-5 w-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        );
      default:
        return null;
    }
  };

  const getTypeClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'info':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'loading':
        return 'border-gray-200 bg-white text-gray-800';
      default:
        return 'border-gray-200 bg-white text-gray-800';
    }
  };

  return (
    <div
      className={`
        pointer-events-auto transform transition-all duration-300 ease-in-out
        ${isVisible && !isExiting 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
    >
      <div className={`
        rounded-lg border p-4 shadow-lg max-w-sm w-full
        ${getTypeClasses()}
      `}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {toast.title && (
              <h4 className="font-medium text-sm mb-1">
                {toast.title}
              </h4>
            )}
            <p className="text-sm opacity-90">
              {toast.message}
            </p>

            {/* Action button */}
            {toast.action && (
              <div className="mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toast.action.onClick}
                  className="text-xs h-7 px-2"
                >
                  {toast.action.label}
                </Button>
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-2 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar for timed toasts */}
        {!toast.persistent && toast.duration && toast.duration > 0 && (
          <div className="mt-3 w-full bg-black/10 rounded-full h-1">
            <div 
              className="bg-current h-1 rounded-full transition-all ease-linear"
              style={{
                animation: `toast-progress ${toast.duration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Hook to use toast context
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Convenience hooks for different toast types
export function useToastActions() {
  const { addToast, removeToast, updateToast } = useToast();

  const showSuccess = useCallback((message: string, options?: Partial<Toast>) => {
    return addToast({
      type: 'success',
      message,
      ...options
    });
  }, [addToast]);

  const showError = useCallback((message: string, options?: Partial<Toast>) => {
    return addToast({
      type: 'error',
      message,
      duration: 0, // Errors should be persistent by default
      persistent: true,
      ...options
    });
  }, [addToast]);

  const showWarning = useCallback((message: string, options?: Partial<Toast>) => {
    return addToast({
      type: 'warning',
      message,
      ...options
    });
  }, [addToast]);

  const showInfo = useCallback((message: string, options?: Partial<Toast>) => {
    return addToast({
      type: 'info',
      message,
      ...options
    });
  }, [addToast]);

  const showLoading = useCallback((message: string, options?: Partial<Toast>) => {
    return addToast({
      type: 'loading',
      message,
      persistent: true,
      ...options
    });
  }, [addToast]);

  const dismiss = useCallback((id: string) => {
    removeToast(id);
  }, [removeToast]);

  const promise = useCallback(async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ): Promise<T> => {
    const loadingId = showLoading(messages.loading);

    try {
      const result = await promise;
      dismiss(loadingId);
      showSuccess(messages.success);
      return result;
    } catch (error) {
      dismiss(loadingId);
      showError(messages.error);
      throw error;
    }
  }, [showLoading, showSuccess, showError, dismiss]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    dismiss,
    promise
  };
}

// CSS for progress bar animation (add to global CSS)
const toastStyles = `
@keyframes toast-progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'toast-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = toastStyles;
    document.head.appendChild(style);
  }
}