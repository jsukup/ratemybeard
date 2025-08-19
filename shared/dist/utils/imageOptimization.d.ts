/**
 * Image optimization utilities for performance and caching
 */
/**
 * Optimize image URL with Supabase transformations
 */
export declare function optimizeImageUrl(url: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
}): string;
/**
 * Generate responsive image URLs for different screen sizes
 */
export declare function generateResponsiveImageUrls(url: string, breakpoints?: {
    [key: string]: number;
}): {
    [key: string]: string;
};
/**
 * Create a low-quality placeholder image URL for progressive loading
 */
export declare function createPlaceholderUrl(url: string): string;
/**
 * Calculate optimal image dimensions while maintaining aspect ratio
 */
export declare function calculateOptimalDimensions(originalWidth: number, originalHeight: number, maxWidth: number, maxHeight?: number): {
    width: number;
    height: number;
};
/**
 * Image cache management
 */
export declare class ImageCache {
    private cache;
    private maxSize;
    constructor(maxSize?: number);
    set(key: string, url: string): void;
    get(key: string): string | undefined;
    has(key: string): boolean;
    clear(): void;
    size(): number;
}
/**
 * Platform-agnostic image preloading interface
 */
export interface ImagePreloader {
    preloadImage: (url: string) => Promise<void>;
    supportsWebP: () => boolean;
    measureLoadTime?: (url: string) => Promise<number>;
}
/**
 * Web implementation of image preloader
 */
export declare const webImagePreloader: ImagePreloader;
/**
 * Get optimal image format based on browser support
 */
export declare function getOptimalFormat(preloader?: ImagePreloader): 'webp' | 'jpeg';
/**
 * Preload multiple images with concurrency control
 */
export declare function preloadImages(urls: string[], maxConcurrent?: number, preloader?: ImagePreloader): Promise<void>;
/**
 * Image loading with retry logic
 */
export declare function loadImageWithRetry(url: string, maxRetries?: number, delay?: number, preloader?: ImagePreloader): Promise<void>;
/**
 * Image lazy loading intersection observer options
 */
export declare const LAZY_LOADING_OPTIONS: {
    threshold: number;
    rootMargin: string;
    triggerOnce: boolean;
};
export declare const globalImageCache: ImageCache;
//# sourceMappingURL=imageOptimization.d.ts.map