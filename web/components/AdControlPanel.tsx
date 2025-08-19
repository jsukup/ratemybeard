'use client';

import { useState } from 'react';

// Define a minimal interface for the useAds hook
interface AdVisibilityState {
  hiddenAdSlots: string[];
  toggleAdVisibility: (adSlot: string) => void;
  isAdHidden: (adSlot: string) => boolean;
}

// Stub for useAds hook
function useAds(): AdVisibilityState {
  return {
    hiddenAdSlots: [],
    toggleAdVisibility: () => {},
    isAdHidden: () => false
  };
}

export default function AdControlPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { hiddenAdSlots, toggleAdVisibility } = useAds();
  
  // Common ad slots in the application
  const adSlots = [
    { id: 'left-sidebar-vertical', label: 'Left Sidebar' },
    { id: 'right-sidebar-vertical', label: 'Right Sidebar' },
    { id: 'bottom-banner-horizontal', label: 'Bottom Banner' },
    { id: 'mobile-tabs-horizontal', label: 'Mobile Tab' },
    { id: 'leaderboard-horizontal', label: 'Leaderboard' },
  ];
  
  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white border rounded-lg shadow-lg p-4 w-64">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Ad Control Panel</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div className="space-y-2">
            {adSlots.map(slot => (
              <div key={slot.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`toggle-${slot.id}`}
                  checked={!hiddenAdSlots.includes(slot.id)}
                  onChange={() => toggleAdVisibility(slot.id)}
                  className="mr-2"
                />
                <label htmlFor={`toggle-${slot.id}`} className="text-sm">
                  {slot.label}
                </label>
              </div>
            ))}
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            <p>Toggle visibility of ad placements during development.</p>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 17h.01"></path>
            <path d="M12 12a1 1 0 0 0 0 2 1 1 0 0 0 0-2"></path>
            <path d="M3 6l1.5 1.5"></path>
            <path d="M20 6l-1 .75"></path>
            <path d="M4 13a8 8 0 0 1 15.45-2.5"></path>
            <path d="M20 20v-4h-4"></path>
          </svg>
        </button>
      )}
    </div>
  );
} 