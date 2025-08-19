/**
 * RateMyFeet Branding Configuration
 *
 * This file contains all branding constants and configuration for the RateMyFeet application.
 * Shared between web and mobile platforms.
 */
export const BRAND_CONFIG = {
    // Brand Identity
    name: 'RateMyFeet',
    tagline: 'COMPETE...with YOUR FEET!',
    shortDescription: 'A lighthearted platform for rating foot attractiveness',
    longDescription: 'A fun, community-driven platform where users can submit photos and rate foot attractiveness through user-generated scoring',
    // Contact Information
    contactEmail: 'info@ratemyfeet.net',
    supportEmail: 'info@ratemyfeet.net',
    // Asset Paths - Platform specific paths will be overridden
    assets: {
        // Logo variations
        logo: {
            main: '/images/ratemyfeet-logo.png',
            light: '/images/ratemyfeet-logo-light.png',
            dark: '/images/ratemyfeet-logo.png',
            icon: '/images/ratemyfeet-icon-dark.png',
            wordmark: '/images/ratemyfeet-logo.png',
        },
        // Favicons
        favicon: {
            ico: '/favicon-ratemyfeet.ico',
            png16: '/favicon-16x16.png',
            png32: '/favicon-32x32.png',
            appleTouchIcon: '/apple-touch-icon.png',
            androidChrome192: '/android-chrome-192x192.png',
            androidChrome512: '/android-chrome-512x512.png',
        },
        // Social Media Images
        social: {
            ogImage: '/images/og-image.png',
            twitterCard: '/images/twitter-card.png',
        },
        // App Icons
        appIcons: {
            ios180: '/apple-touch-icon.png',
            ios152: '/apple-touch-icon-152x152.png',
            ios120: '/apple-touch-icon-120x120.png',
        }
    },
    // Color Palette
    colors: {
        primary: '#FF6B6B', // Coral red - main brand color
        secondary: '#4ECDC4', // Teal - secondary accent
        accent: '#45B7D1', // Blue - tertiary accent
        // Semantic colors
        success: '#51CF66', // Green for success states
        warning: '#FFD43B', // Yellow for warnings
        error: '#FF6B6B', // Red for errors (matches primary)
        info: '#45B7D1', // Blue for info (matches accent)
        // Neutral colors
        text: {
            primary: '#2C3E50', // Dark blue-gray for main text
            secondary: '#7F8C8D', // Medium gray for secondary text
            muted: '#BDC3C7', // Light gray for muted text
            inverse: '#FFFFFF', // White for text on dark backgrounds
        },
        background: {
            primary: '#FFFFFF', // White background
            secondary: '#F8F9FA', // Light gray background
            muted: '#E9ECEF', // Muted background
            dark: '#2C3E50', // Dark background
        },
        border: {
            light: '#E9ECEF', // Light borders
            medium: '#DEE2E6', // Medium borders
            dark: '#ADB5BD', // Dark borders
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
        twitter: '@ratemyfeet',
        instagram: '@ratemyfeet',
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
};
// Helper functions
export function getBrandColor(path) {
    const keys = path.split('.');
    let value = BRAND_CONFIG.colors;
    for (const key of keys) {
        value = value?.[key];
        if (value === undefined)
            break;
    }
    return typeof value === 'string' ? value : '#000000';
}
export function getBrandAsset(type, name) {
    const asset = BRAND_CONFIG.assets[type]?.[name];
    return typeof asset === 'string' ? asset : '';
}
// Meta tag generation
export function generateMetaTags(page) {
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
