"use client";

import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

// Loading spinner component
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'secondary' | 'muted';
}

export function Spinner({ size = 'md', className = '', color = 'primary' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    muted: 'text-muted-foreground'
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    />
  );
}

// Loading overlay component
interface LoadingOverlayProps {
  message?: string;
  transparent?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingOverlay({ 
  message = 'Loading...', 
  transparent = false,
  size = 'md',
  className = ''
}: LoadingOverlayProps) {
  return (
    <div className={`
      absolute inset-0 flex items-center justify-center z-50
      ${transparent ? 'bg-background/80' : 'bg-background/95'}
      backdrop-blur-sm
      ${className}
    `}>
      <div className="flex flex-col items-center gap-3">
        <Spinner size={size} />
        {message && (
          <p className="text-sm text-muted-foreground font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

// Skeleton components for content placeholders
interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export function Skeleton({ className = '', animate = true }: SkeletonProps) {
  return (
    <div 
      className={`
        bg-muted rounded-md
        ${animate ? 'animate-pulse' : ''}
        ${className}
      `}
    />
  );
}

// Skeleton text lines
interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton 
          key={index}
          className={`h-4 w-full ${
            index === lines - 1 ? 'w-3/4' : ''
          }`}
        />
      ))}
    </div>
  );
}

// Skeleton for avatar/profile pictures
interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function SkeletonAvatar({ size = 'md', className = '' }: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  return (
    <Skeleton 
      className={`rounded-full ${sizeClasses[size]} ${className}`}
    />
  );
}

// Skeleton for cards
interface SkeletonCardProps {
  hasImage?: boolean;
  hasAvatar?: boolean;
  className?: string;
}

export function SkeletonCard({ 
  hasImage = false, 
  hasAvatar = false,
  className = ''
}: SkeletonCardProps) {
  return (
    <div className={`border rounded-lg p-4 space-y-3 ${className}`}>
      {hasImage && (
        <Skeleton className="h-48 w-full rounded-md" />
      )}
      
      <div className="space-y-2">
        {hasAvatar && (
          <div className="flex items-center space-x-3">
            <SkeletonAvatar size="sm" />
            <Skeleton className="h-4 w-24" />
          </div>
        )}
        
        <Skeleton className="h-5 w-3/4" />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}

// Progress bar component
interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showPercentage?: boolean;
  animated?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export function ProgressBar({ 
  progress, 
  className = '',
  showPercentage = false,
  animated = false,
  color = 'primary'
}: ProgressBarProps) {
  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`space-y-1 ${className}`}>
      {showPercentage && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(clampedProgress)}%</span>
        </div>
      )}
      
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className={`
            h-2 rounded-full transition-all duration-300 ease-out
            ${colorClasses[color]}
            ${animated ? 'animate-pulse' : ''}
          `}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

// Loading button component
interface LoadingButtonProps {
  loading?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'default' | 'outline' | 'ghost';
}

export function LoadingButton({ 
  loading = false,
  children,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  variant = 'default'
}: LoadingButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-primary',
    ghost: 'hover:bg-accent hover:text-accent-foreground focus:ring-primary'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        px-4 py-2
        ${className}
      `}
    >
      {loading && (
        <Spinner size="sm" className="mr-2" />
      )}
      {children}
    </button>
  );
}

// Loading dots animation
interface LoadingDotsProps {
  className?: string;
  color?: 'primary' | 'secondary' | 'muted';
}

export function LoadingDots({ className = '', color = 'primary' }: LoadingDotsProps) {
  const colorClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    muted: 'bg-muted-foreground'
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`
            h-2 w-2 rounded-full
            ${colorClasses[color]}
            animate-bounce
          `}
          style={{
            animationDelay: `${index * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );
}

// Pulse loading effect
interface PulseLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PulseLoader({ size = 'md', className = '' }: PulseLoaderProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="relative h-full w-full">
        <div className="absolute inset-0 rounded-full bg-primary opacity-75 animate-ping" />
        <div className="absolute inset-0 rounded-full bg-primary opacity-75 animate-ping" 
             style={{ animationDelay: '0.5s' }} />
        <div className="relative h-full w-full rounded-full bg-primary" />
      </div>
    </div>
  );
}

// Loading state wrapper component
interface LoadingWrapperProps {
  loading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  overlay?: boolean;
  className?: string;
}

export function LoadingWrapper({ 
  loading, 
  children, 
  fallback,
  overlay = false,
  className = ''
}: LoadingWrapperProps) {
  if (loading && !overlay) {
    return (
      <div className={className}>
        {fallback || (
          <div className="flex items-center justify-center p-8">
            <div className="text-center space-y-3">
              <Spinner size="lg" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {children}
      {loading && overlay && (
        <LoadingOverlay />
      )}
    </div>
  );
}

// Table skeleton for data tables
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, className = '' }: SkeletonTableProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} className="h-5 w-full" />
        ))}
      </div>
      
      {/* Separator */}
      <Skeleton className="h-px w-full" />
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={`row-${rowIndex}`}
          className="grid gap-3" 
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              className="h-4 w-full" 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Refresh button with loading state
interface RefreshButtonProps {
  onRefresh: () => void;
  loading?: boolean;
  className?: string;
}

export function RefreshButton({ onRefresh, loading = false, className = '' }: RefreshButtonProps) {
  return (
    <button
      onClick={onRefresh}
      disabled={loading}
      className={`
        inline-flex items-center justify-center rounded-md p-2
        hover:bg-accent hover:text-accent-foreground
        disabled:opacity-50 disabled:pointer-events-none
        transition-colors
        ${className}
      `}
      aria-label="Refresh"
    >
      <RefreshCw 
        className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
      />
    </button>
  );
}