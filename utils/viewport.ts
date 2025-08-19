/**
 * Viewport detection utilities for responsive ad selection
 */

// Standard breakpoints
export const BREAKPOINTS = {
  mobile: 320,
  mobileLarge: 414,
  tablet: 768,
  desktop: 1024,
  desktopLarge: 1440,
} as const;

// Common device sizes for testing
export const DEVICE_SIZES = {
  iPhoneSE: { width: 375, height: 667 },
  iPhone12Pro: { width: 390, height: 844 },
  iPhone14ProMax: { width: 430, height: 932 },
  iPadMini: { width: 768, height: 1024 },
  iPadPro: { width: 1024, height: 1366 },
  galaxyFold: { width: 280, height: 653 },
  desktop: { width: 1920, height: 1080 },
} as const;

/**
 * Get current viewport width
 */
export function getViewportWidth(): number {
  if (typeof window === 'undefined') return 0;
  return window.innerWidth || document.documentElement.clientWidth || 0;
}

/**
 * Get current viewport height
 */
export function getViewportHeight(): number {
  if (typeof window === 'undefined') return 0;
  return window.innerHeight || document.documentElement.clientHeight || 0;
}

/**
 * Check if current viewport is mobile
 */
export function isMobile(): boolean {
  return getViewportWidth() < BREAKPOINTS.tablet;
}

/**
 * Check if current viewport is tablet
 */
export function isTablet(): boolean {
  const width = getViewportWidth();
  return width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
}

/**
 * Check if current viewport is desktop
 */
export function isDesktop(): boolean {
  return getViewportWidth() >= BREAKPOINTS.desktop;
}

/**
 * Get appropriate ad format based on viewport
 */
export function getAdFormatForViewport(
  desktopFormat: string,
  mobileFormat?: string,
  tabletFormat?: string
): string {
  if (isMobile() && mobileFormat) {
    return mobileFormat;
  }
  if (isTablet() && tabletFormat) {
    return tabletFormat;
  }
  return desktopFormat;
}

/**
 * Add resize listener with debouncing
 */
export function onViewportResize(
  callback: (width: number, height: number) => void,
  delay: number = 250
): () => void {
  let timeoutId: NodeJS.Timeout;
  
  const handleResize = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(getViewportWidth(), getViewportHeight());
    }, delay);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize);
  }

  // Return cleanup function
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    }
  };
}

/**
 * Get device type string for analytics/debugging
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (isMobile()) return 'mobile';
  if (isTablet()) return 'tablet';
  return 'desktop';
}

/**
 * Check if viewport width can fit a specific ad size
 */
export function canFitAdSize(adWidth: number, padding: number = 20): boolean {
  return getViewportWidth() >= (adWidth + padding * 2);
}