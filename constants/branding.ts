/**
 * RateMyFeet Branding Configuration
 * 
 * This file contains all branding constants and configuration for the RateMyFeet application.
 * Update asset paths here when you have the actual logo and favicon files.
 */

export const BRAND_CONFIG = {
  // Brand Identity
  name: 'RateMyFeet',
  tagline: 'Rate the attractiveness of feet',
  shortDescription: 'A lighthearted platform for rating foot attractiveness',
  longDescription: 'A fun, community-driven platform where users can submit photos and rate foot attractiveness through user-generated scoring',
  
  // Contact Information
  contactEmail: 'hello@ratemyfeet.com',
  supportEmail: 'support@ratemyfeet.com',
  
  // Asset Paths (TODO: Replace with actual assets when available)
  assets: {
    // Logo variations (replace these paths when you have actual assets)
    logo: {
      main: '/images/ratemyfeet-logo.png', // TODO: Add main logo
      light: '/images/ratemyfeet-logo-light.png', // TODO: Add light variant
      dark: '/images/ratemyfeet-logo-dark.png', // TODO: Add dark variant
      icon: '/images/ratemyfeet-icon.png', // TODO: Add icon/favicon
      wordmark: '/images/ratemyfeet-wordmark.png', // TODO: Add text-only logo
    },
    
    // Favicons (TODO: Generate and add when logo is ready)
    favicon: {
      ico: '/favicon-ratemyfeet.ico',
      png16: '/favicon-16x16.png',
      png32: '/favicon-32x32.png',
      appleTouchIcon: '/apple-touch-icon.png',
      androidChrome192: '/android-chrome-192x192.png',
      androidChrome512: '/android-chrome-512x512.png',
    },
    
    // Social Media Images (TODO: Create when logo is ready)
    social: {
      ogImage: '/images/og-image.png', // 1200x630 for social sharing
      twitterCard: '/images/twitter-card.png', // 1200x600 for Twitter
    },
    
    // App Icons (TODO: Generate when logo is ready)
    appIcons: {
      ios180: '/apple-touch-icon-180x180.png',
      ios152: '/apple-touch-icon-152x152.png',
      ios120: '/apple-touch-icon-120x120.png',
    }
  },
  
  // Color Palette
  colors: {
    primary: '#FF6B6B',     // Coral red - main brand color
    secondary: '#4ECDC4',   // Teal - secondary accent
    accent: '#45B7D1',      // Blue - tertiary accent
    
    // Semantic colors
    success: '#51CF66',     // Green for success states
    warning: '#FFD43B',     // Yellow for warnings
    error: '#FF6B6B',       // Red for errors (matches primary)
    info: '#45B7D1',        // Blue for info (matches accent)
    
    // Neutral colors
    text: {
      primary: '#2C3E50',   // Dark blue-gray for main text
      secondary: '#7F8C8D', // Medium gray for secondary text
      muted: '#BDC3C7',     // Light gray for muted text
      inverse: '#FFFFFF',   // White for text on dark backgrounds
    },
    
    background: {
      primary: '#FFFFFF',   // White background
      secondary: '#F8F9FA', // Light gray background
      muted: '#E9ECEF',     // Muted background
      dark: '#2C3E50',      // Dark background
    },
    
    border: {
      light: '#E9ECEF',     // Light borders
      medium: '#DEE2E6',    // Medium borders
      dark: '#ADB5BD',      // Dark borders
    }
  },
  
  // Typography
  fonts: {
    primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    secondary: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'JetBrains Mono, "Fira Code", "Courier New", monospace',
  },
  
  // Social Media & URLs
  social: {
    website: 'https://ratemyfeet.com',
    twitter: '@ratemyfeet', // TODO: Create when ready
    instagram: '@ratemyfeet', // TODO: Create when ready
    github: 'https://github.com/jsukup/ratemyfeet',
  },
  
  // SEO & Meta
  seo: {
    keywords: [
      'feet rating',
      'foot attractiveness',
      'community rating',
      'photo rating',
      'user generated content',
      'fun rating app',
      'feet photos',
      'attractiveness score'
    ],
    category: 'Entertainment',
    locale: 'en_US',
  },
  
  // Legal
  legal: {
    companyName: 'RateMyFeet',
    copyrightYear: new Date().getFullYear(),
    termsUrl: '/terms',
    privacyUrl: '/privacy',
    cookiesUrl: '/cookies',
  }
} as const;

// Derived values and helpers
export const BRAND_COLORS_CSS = {
  '--brand-primary': BRAND_CONFIG.colors.primary,
  '--brand-secondary': BRAND_CONFIG.colors.secondary,
  '--brand-accent': BRAND_CONFIG.colors.accent,
  '--brand-success': BRAND_CONFIG.colors.success,
  '--brand-warning': BRAND_CONFIG.colors.warning,
  '--brand-error': BRAND_CONFIG.colors.error,
  '--brand-info': BRAND_CONFIG.colors.info,
  '--brand-text-primary': BRAND_CONFIG.colors.text.primary,
  '--brand-text-secondary': BRAND_CONFIG.colors.text.secondary,
  '--brand-text-muted': BRAND_CONFIG.colors.text.muted,
  '--brand-text-inverse': BRAND_CONFIG.colors.text.inverse,
  '--brand-bg-primary': BRAND_CONFIG.colors.background.primary,
  '--brand-bg-secondary': BRAND_CONFIG.colors.background.secondary,
  '--brand-bg-muted': BRAND_CONFIG.colors.background.muted,
  '--brand-bg-dark': BRAND_CONFIG.colors.background.dark,
  '--brand-border-light': BRAND_CONFIG.colors.border.light,
  '--brand-border-medium': BRAND_CONFIG.colors.border.medium,
  '--brand-border-dark': BRAND_CONFIG.colors.border.dark,
} as const;

// Helper functions
export function getBrandColor(path: string): string {
  const keys = path.split('.');
  let value: any = BRAND_CONFIG.colors;
  
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) break;
  }
  
  return typeof value === 'string' ? value : '#000000';
}

export function getBrandAsset(type: 'logo' | 'favicon' | 'social' | 'appIcons', name: string): string {
  const asset = BRAND_CONFIG.assets[type]?.[name as keyof typeof BRAND_CONFIG.assets[typeof type]];
  return typeof asset === 'string' ? asset : '';
}

// Meta tag generation
export function generateMetaTags(page?: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}) {
  const title = page?.title 
    ? `${page.title} | ${BRAND_CONFIG.name}`
    : `${BRAND_CONFIG.name} - ${BRAND_CONFIG.tagline}`;
    
  const description = page?.description || BRAND_CONFIG.longDescription;
  const image = page?.image || getBrandAsset('social', 'ogImage');
  const url = page?.url || BRAND_CONFIG.social.website;

  return {
    title,
    description,
    keywords: BRAND_CONFIG.seo.keywords.join(', '),
    
    // Open Graph
    'og:title': title,
    'og:description': description,
    'og:image': image,
    'og:url': url,
    'og:type': 'website',
    'og:site_name': BRAND_CONFIG.name,
    'og:locale': BRAND_CONFIG.seo.locale,
    
    // Twitter Card
    'twitter:card': 'summary_large_image',
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': image,
    'twitter:site': BRAND_CONFIG.social.twitter,
    
    // Additional
    'theme-color': BRAND_CONFIG.colors.primary,
    'msapplication-TileColor': BRAND_CONFIG.colors.primary,
  };
}

// Asset validation (for development)
export function validateAssets(): { missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // This would check if assets exist in development
  // Implementation depends on your build process
  
  if (typeof window !== 'undefined') {
    // Client-side validation could be added here
    warnings.push('Asset validation not implemented for client-side');
  }
  
  return { missing, warnings };
}