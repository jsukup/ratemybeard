'use client';

import * as React from 'react';

// Default export - minimal implementation
export default function AdScript() {
  return null;
}

// Simple provider for compatibility
export function AdProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Stub for useAds hook
export function useAds() {
  return {
    hiddenAdSlots: [] as string[],
    toggleAdVisibility: (_adSlot: string) => {},
    isAdHidden: (_adSlot: string) => false
  };
}

// Add AdContainer component
interface AdContainerProps {
  className?: string;
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  style?: React.CSSProperties;
  responsive?: boolean;
  lazyLoad?: boolean;
}

export function AdContainer({ 
  className = '',
  adSlot,
  adFormat = 'auto',
  style = {},
  responsive = true,
  lazyLoad = true
}: AdContainerProps) {
  // Simple placeholder implementation
  return (
    <div 
      className={`${className} flex items-center justify-center border-2 border-dashed border-gray-200 bg-gray-50 rounded-md`}
      style={{
        ...style,
        minHeight: '60px'
      }}
    >
      <div className="text-center text-sm p-2 text-gray-500">
        <p>Ad Placeholder</p>
        <p className="text-xs">{adFormat} - {adSlot}</p>
      </div>
    </div>
  );
} 