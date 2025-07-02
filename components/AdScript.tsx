'use client';

import * as React from 'react';

declare global {
  interface Window {
    atOptions: any;
  }
}

// Set this to true to display placeholder boxes instead of real ads for testing
const TEST_ADS = true;

// Create a context to manage ad visibility for testing
interface AdContextType {
  hiddenAdSlots: string[];
  toggleAdVisibility: (adSlot: string) => void;
  isAdHidden: (adSlot: string) => boolean;
}

const AdContext = React.createContext<AdContextType>({
  hiddenAdSlots: [],
  toggleAdVisibility: () => {},
  isAdHidden: () => false,
});

// Provider component
export function AdProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Hook to use the ad context
export function useAds() {
  return {
    hiddenAdSlots: [] as string[],
    toggleAdVisibility: (_adSlot: string) => {},
    isAdHidden: (_adSlot: string) => false
  };
}

// Default export - minimal implementation
export default function AdScript() {
  return null;
}

interface AdContainerProps {
  className?: string;
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'leaderboard';
  style?: React.CSSProperties;
  responsive?: boolean;
  lazyLoad?: boolean;
}

// Adsterra ad configurations
const ADSTERRA_CONFIGS = {
  rectangle: {
    key: 'db61a04e8daccfe0a0b946188db6e304',
    width: 300,
    height: 250
  },
  leaderboard: {
    key: '2d5f0ac494d06daf778e0c3b1d8de02e',
    width: 728,
    height: 90
  }
};

export function AdContainer({ 
  className = '',
  adSlot,
  adFormat = 'auto',
  style = {},
  responsive = true,
  lazyLoad = true
}: AdContainerProps) {
  const adRef = React.useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = React.useState(!lazyLoad);
  const [adInitialized, setAdInitialized] = React.useState(false);
  const { isAdHidden, toggleAdVisibility } = useAds();
  const hidden = TEST_ADS && isAdHidden(adSlot);
  
  // Use useEffect hooks before any conditional returns
  React.useEffect(() => {
    if (TEST_ADS || !lazyLoad || hidden) return;

    // Set up Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !adInitialized) {
          setIsVisible(true);
          setAdInitialized(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px 0px', // Load ads when they're within 200px of viewport
        threshold: 0.1
      }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [lazyLoad, adInitialized, hidden]);

  // Initialize Adsterra when ad becomes visible
  React.useEffect(() => {
    if (TEST_ADS || !isVisible || hidden) return;

    const config = ADSTERRA_CONFIGS[adFormat as keyof typeof ADSTERRA_CONFIGS];
    if (!config) return;

    try {
      // Set global atOptions for this ad
      window.atOptions = {
        key: config.key,
        format: 'iframe',
        height: config.height,
        width: config.width,
        params: {}
      };

      // Create and append the Adsterra script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `//www.highperformanceformat.com/${config.key}/invoke.js`;
      script.async = true;
      
      if (adRef.current) {
        adRef.current.appendChild(script);
      }
    } catch (error) {
      console.error("Adsterra error:", error);
    }
  }, [isVisible, hidden, adFormat]);
  
  // If this ad is hidden during development, don't render it
  if (hidden) {
    return null;
  }

  if (TEST_ADS) {
    // Get background color based on ad type for better visual distinction
    const getBgColor = () => {
      switch (adFormat) {
        case 'leaderboard': return 'bg-green-50';
        case 'rectangle': return 'bg-purple-50';
        default: return 'bg-gray-50';
      }
    };
    
    // Get border color based on ad type
    const getBorderColor = () => {
      switch (adFormat) {
        case 'leaderboard': return 'border-green-200';
        case 'rectangle': return 'border-purple-200';
        default: return 'border-gray-200';
      }
    };
    
    // Get default dimensions if not responsive
    const getDefaultSize = () => {
      if (responsive) return {};
      
      const config = ADSTERRA_CONFIGS[adFormat as keyof typeof ADSTERRA_CONFIGS];
      if (!config) return { width: 'auto', height: 'auto' };
      
      return {
        width: `${config.width}px`,
        height: `${config.height}px`,
      };
    };
    
    // Display an enhanced placeholder in test mode
    return (
      <div 
        ref={adRef}
        className={`${className} flex items-center justify-center border-2 border-dashed ${getBorderColor()} ${getBgColor()} rounded-md overflow-hidden transition-colors hover:bg-opacity-70 relative group`} 
        style={{
          ...style,
          ...getDefaultSize(),
          minHeight: '60px', // Ensure minimum height for visibility
        }}
      >
        {/* Add a close button for testing */}
        <button 
          onClick={() => toggleAdVisibility(adSlot)} 
          className="absolute top-1 right-1 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Hide this ad for testing"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div className="text-center text-sm p-2">
          <p className="font-semibold">Ad Placement</p>
          <p className="text-xs opacity-75">{adFormat.charAt(0).toUpperCase() + adFormat.slice(1)} Format</p>
          <p className="text-xs opacity-75 truncate max-w-full" title={adSlot}>ID: {adSlot}</p>
          {lazyLoad && <p className="text-xs text-blue-600 mt-1">Lazy-loaded</p>}
        </div>
      </div>
    );
  }
  
  return (
    <div 
      ref={adRef} 
      className={className} 
      style={{
        ...style,
        ...(responsive && { width: '100%' }),
        display: isVisible ? 'block' : 'none'
      }}
    >
      {/* Adsterra ad will be injected here by the script */}
    </div>
  );
} 