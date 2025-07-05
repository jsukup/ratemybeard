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

  // Use useEffect hooks for lazy loading
  React.useEffect(() => {
    if (!lazyLoad) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !adInitialized) {
          setIsVisible(true);
          setAdInitialized(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px 0px',
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
  }, [lazyLoad, adInitialized]);

  // Initialize Adsterra when ad becomes visible
  React.useEffect(() => {
    if (!isVisible) return;

    const config = ADSTERRA_CONFIGS[adFormat as keyof typeof ADSTERRA_CONFIGS];
    if (!config) return;

    try {
      // Set global atOptions for this ad
      (window as any).atOptions = {
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
      console.error("Config:", config);
      console.error("Ad format:", adFormat);
    }
  }, [isVisible, adFormat]);

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