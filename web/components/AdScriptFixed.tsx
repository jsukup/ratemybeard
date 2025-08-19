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

// Adcash ad configurations
const ADCASH_CONFIGS = {
  rectangle: {
    zoneId: '10145178',
    width: 300,
    height: 250
  },
  leaderboard: {
    zoneId: '10145146',
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

  // Initialize Adcash when ad becomes visible
  React.useEffect(() => {
    if (!isVisible) return;

    const config = ADCASH_CONFIGS[adFormat as keyof typeof ADCASH_CONFIGS];
    if (!config) return;

    try {
      // Load Adcash library if not already loaded
      if (typeof (window as any).aclib === 'undefined') {
        const aclibScript = document.createElement('script');
        aclibScript.type = 'text/javascript';
        aclibScript.src = '//acscdn.com/script/aclib.js';
        aclibScript.async = true;
        aclibScript.onload = () => {
          // Initialize Adcash Banner after library loads
          if ((window as any).aclib && (window as any).aclib.runBanner) {
            (window as any).aclib.runBanner({
              zoneId: config.zoneId
            });
          }
        };
        document.head.appendChild(aclibScript);
      } else {
        // Library already loaded, run Banner directly
        (window as any).aclib.runBanner({
          zoneId: config.zoneId
        });
      }
    } catch (error) {
      console.error("Adcash error:", error);
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
      {/* Adcash ad will be injected here by the script */}
    </div>
  );
} 