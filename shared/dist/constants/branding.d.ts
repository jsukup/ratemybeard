/**
 * RateMyFeet Branding Configuration
 *
 * This file contains all branding constants and configuration for the RateMyFeet application.
 * Shared between web and mobile platforms.
 */
export declare const BRAND_CONFIG: {
    readonly name: "RateMyFeet";
    readonly tagline: "COMPETE...with YOUR FEET!";
    readonly shortDescription: "A lighthearted platform for rating foot attractiveness";
    readonly longDescription: "A fun, community-driven platform where users can submit photos and rate foot attractiveness through user-generated scoring";
    readonly contactEmail: "info@ratemyfeet.net";
    readonly supportEmail: "info@ratemyfeet.net";
    readonly assets: {
        readonly logo: {
            readonly main: "/images/ratemyfeet-logo.png";
            readonly light: "/images/ratemyfeet-logo-light.png";
            readonly dark: "/images/ratemyfeet-logo.png";
            readonly icon: "/images/ratemyfeet-icon-dark.png";
            readonly wordmark: "/images/ratemyfeet-logo.png";
        };
        readonly favicon: {
            readonly ico: "/favicon-ratemyfeet.ico";
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
        readonly website: "https://ratemyfeet.com";
        readonly twitter: "@ratemyfeet";
        readonly instagram: "@ratemyfeet";
        readonly github: "https://github.com/jsukup/ratemyfeet";
    };
    readonly seo: {
        readonly keywords: readonly ["feet rating", "foot attractiveness", "community rating", "photo rating", "user generated content", "fun rating app", "feet photos", "attractiveness score"];
        readonly category: "Entertainment";
        readonly locale: "en_US";
    };
    readonly legal: {
        readonly companyName: "RateMyFeet";
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
    'og:site_name': "RateMyFeet";
    'og:locale': "en_US";
    'twitter:card': string;
    'twitter:title': string;
    'twitter:description': string;
    'twitter:image': string;
    'twitter:site': "@ratemyfeet";
    'theme-color': "#FF6B6B";
    'msapplication-TileColor': "#FF6B6B";
};
//# sourceMappingURL=branding.d.ts.map