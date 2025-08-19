'use client';

import * as React from 'react';

// Default export - minimal implementation
export default function AdScript() {
  return null;
}

// Simple provider for compatibility
export function AdProvider({ children }: { children: JSX.Element | JSX.Element[] | null }) {
  return <>{children}</>;
}

// Stub for useAds hook
export function useAds() {
  return {
    hiddenAdSlots: [],
    toggleAdVisibility: () => {},
    isAdHidden: () => false
  };
} 