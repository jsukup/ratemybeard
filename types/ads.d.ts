// Ad-related TypeScript definitions

// AdSense ad formats
export type AdFormat = 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';

// Ad size configurations (width and height in pixels)
export interface AdSize {
  width: number;
  height: number;
}

// Common ad slot IDs used in the application
export type AdSlotId = 
  | 'left-sidebar-vertical'
  | 'right-sidebar-vertical'
  | 'bottom-banner-horizontal'
  | 'mobile-tabs-horizontal'
  | 'leaderboard-horizontal'
  | string; // Allow custom slot IDs as well

// AdSense configuration
export interface AdSenseConfig {
  publisherId: string;
  testMode: boolean;
}

// Mapping of ad formats to standard sizes
export interface AdSizeMap {
  [key: string]: AdSize;
}

// Ad visibility controls
export interface AdVisibilityState {
  hiddenAdSlots: string[];
  toggleAdVisibility: (adSlot: string) => void;
  isAdHidden: (adSlot: string) => boolean;
}

// Properties for the AdContainer component
export interface AdContainerProps {
  className?: string;
  adSlot: AdSlotId;
  adFormat?: AdFormat;
  style?: React.CSSProperties;
  responsive?: boolean;
  lazyLoad?: boolean;
} 