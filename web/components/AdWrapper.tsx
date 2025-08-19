'use client';

import React, { createContext, useState, useContext } from 'react';

// Create a context for ad visibility
interface AdContextType {
  hiddenAdSlots: string[];
  toggleAdVisibility: (adSlot: string) => void;
  isAdHidden: (adSlot: string) => boolean;
}

const AdContext = createContext<AdContextType>({
  hiddenAdSlots: [],
  toggleAdVisibility: () => {},
  isAdHidden: () => false,
});

// Define props with explicit type
interface AdProviderProps {
  children: JSX.Element | JSX.Element[] | string | null;
}

// Provider component
export function AdProvider(props: AdProviderProps) {
  const [hiddenAdSlots, setHiddenAdSlots] = useState<string[]>([]);

  const toggleAdVisibility = (adSlot: string) => {
    setHiddenAdSlots(current => 
      current.includes(adSlot)
        ? current.filter(slot => slot !== adSlot)
        : [...current, adSlot]
    );
  };

  const isAdHidden = (adSlot: string) => {
    return hiddenAdSlots.includes(adSlot);
  };

  return (
    <AdContext.Provider value={{ hiddenAdSlots, toggleAdVisibility, isAdHidden }}>
      {props.children}
    </AdContext.Provider>
  );
}

// Hook to use the ad context
export function useAds() {
  return useContext(AdContext);
}

// Default export
export default function AdScript() {
  return null;
} 