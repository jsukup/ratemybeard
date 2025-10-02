/**
 * RateMyBeard Branding Configuration
 *
 * This file contains all branding constants and configuration for the RateMyBeard application.
 * Shared between web and mobile platforms.
 */
export declare const BRAND_CONFIG: {
    readonly name: "RateMyBeard";
    readonly tagline: "GET WEIRD...with YOUR BEARD!";
    readonly shortDescription: "A lighthearted platform for rating beard attractiveness";
    readonly longDescription: "A fun, community-driven platform where users can submit photos and rate beard attractiveness through user-generated scoring";
    readonly contactEmail: "info@ratemyfeet.net";
    readonly supportEmail: "info@ratemyfeet.net";
    readonly assets: {
        readonly logo: {
            readonly main: "/images/ratemybeard-logo.png";
            readonly light: "/images/ratemybeard-logo-light.png";
            readonly dark: "/images/ratemybeard-logo.png";
            readonly icon: "/images/ratemybeard-icon-dark.png";
            readonly wordmark: "/images/ratemybeard-logo.png";
        };
        readonly favicon: {
            readonly ico: "/favicon-ratemybeard.ico";
            readonly png16: "/favicon-16x16.png";
            readonly png32: "/favicon-32x32.png";
            readonly appleTouchIcon: "/apple-touch-icon.png";
            readonly androidChrome192: "/android-chrome-192x192.png";
            readonly androidChrome512: "/android-chrome-512x512.png";
        };
        readonly social: {
            readonly ogImage: "/images/og-image.png";
            readonly twitterCard: "/images/twitter-card.png";
        };
        readonly appIcons: {
            readonly ios180: "/apple-touch-icon.png";
            readonly ios152: "/apple-touch-icon-152x152.png";
            readonly ios120: "/apple-touch-icon-120x120.png";
        };
    };
    readonly colors: {
        readonly primary: "#FF6B6B";
        readonly secondary: "#4ECDC4";
        readonly accent: "#45B7D1";
        readonly success: "#51CF66";
        readonly warning: "#FFD43B";
        readonly error: "#FF6B6B";
        readonly info: "#45B7D1";
        readonly text: {
            readonly primary: "#2C3E50";
            readonly secondary: "#7F8C8D";
            readonly muted: "#BDC3C7";
            readonly inverse: "#FFFFFF";
        };
        readonly background: {
            readonly primary: "#FFFFFF";
            readonly secondary: "#F8F9FA";
            readonly muted: "#E9ECEF";
            readonly dark: "#2C3E50";
        };
        readonly border: {
            readonly light: "#E9ECEF";
            readonly medium: "#DEE2E6";
            readonly dark: "#ADB5BD";
        };
    };
    readonly fonts: {
        readonly primary: "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif";
        readonly secondary: "Poppins, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif";
        readonly mono: "JetBrains Mono, \"Fira Code\", \"Courier New\", monospace";
    };
    readonly social: {
        readonly website: "https://ratemybeard.net";
        readonly twitter: "@ratemybeard";
        readonly instagram: "@ratemybeard";
        readonly github: "https://github.com/jsukup/ratemybeard";
    };
    readonly seo: {
        readonly keywords: readonly ["beard rating", "beard attractiveness", "community rating", "photo rating", "user generated content", "fun rating app", "beard photos", "attractiveness score", "facial hair rating", "beard competition"];
        readonly category: "Entertainment";
        readonly locale: "en_US";
    };
    readonly legal: {
        readonly companyName: "RateMyBeard";
        readonly copyrightYear: number;
        readonly termsUrl: "/terms";
        readonly privacyUrl: "/privacy";
        readonly cookiesUrl: "/cookies";
    };
};
export declare function getBrandColor(path: string): string;
export declare function getBrandAsset(type: 'logo' | 'favicon' | 'social' | 'appIcons', name: string): string;
export declare function generateMetaTags(page?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
}): {
    title: string;
    description: string;
    keywords: string;
    'og:title': string;
    'og:description': string;
    'og:image': string;
    'og:url': string;
    'og:type': string;
    'og:site_name': "RateMyBeard";
    'og:locale': "en_US";
    'twitter:card': string;
    'twitter:title': string;
    'twitter:description': string;
    'twitter:image': string;
    'twitter:site': "@ratemybeard";
    'theme-color': "#FF6B6B";
    'msapplication-TileColor': "#FF6B6B";
};
//# sourceMappingURL=branding.d.ts.map