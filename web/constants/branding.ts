// Re-export shared branding configuration with web-specific additions
import { 
  BRAND_CONFIG as SHARED_BRAND_CONFIG,
  BRAND_COLORS_CSS as SHARED_BRAND_COLORS_CSS,
  getBrandColor,
  getBrandAsset,
  generateMetaTags as generateSharedMetaTags
} from '@shared/constants/branding';

export const BRAND_CONFIG = {
  ...SHARED_BRAND_CONFIG,
  // Web-specific asset paths (override shared assets with web paths)
  assets: {
    ...SHARED_BRAND_CONFIG.assets,
    // Logo variations with web-specific paths
    logo: {
      ...SHARED_BRAND_CONFIG.assets.logo,
      main: '/images/ratemybeard-logo.png',
      light: '/images/ratemybeard-logo-light.png',
      dark: '/images/ratemybeard-logo.png',
      icon: '/images/ratemybeard-icon-dark.png',
      wordmark: '/images/ratemybeard-logo.png',
    },
    
    // Favicons with web-specific paths
    favicon: {
      ...SHARED_BRAND_CONFIG.assets.favicon,
      ico: '/favicon-ratemybeard.ico',
      png16: '/favicon-16x16.png',
      png32: '/favicon-32x32.png',
      appleTouchIcon: '/apple-touch-icon.png',
      androidChrome192: '/android-chrome-192x192.png',
      androidChrome512: '/android-chrome-512x512.png',
    },
    
    // Social Media Images with web-specific paths
    social: {
      ...SHARED_BRAND_CONFIG.assets.social,
      ogImage: '/images/og-image.png',
      twitterCard: '/images/twitter-card.png',
    },
    
    // App Icons with web-specific paths
    appIcons: {
      ...SHARED_BRAND_CONFIG.assets.appIcons,
      ios180: '/apple-touch-icon.png',
      ios152: '/apple-touch-icon-152x152.png',
      ios120: '/apple-touch-icon-120x120.png',
    }
  }
} as const;

// Re-export shared utilities with web-specific BRAND_CONFIG
export const BRAND_COLORS_CSS = SHARED_BRAND_COLORS_CSS;
export { getBrandColor, getBrandAsset };

// Web-specific meta tag generation using web BRAND_CONFIG
export function generateMetaTags(page?: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}) {
  return generateSharedMetaTags(page, BRAND_CONFIG);
}

// Re-export shared validation function
export { validateAssets } from '@shared/constants/branding';