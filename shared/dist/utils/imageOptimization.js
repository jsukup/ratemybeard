/**
 * Image optimization utilities for performance and caching
 */
// Default optimization settings
const DEFAULT_WIDTH = 400;
const DEFAULT_QUALITY = 80;
const DEFAULT_FORMAT = 'webp';
/**
 * Optimize image URL with Supabase transformations
 */
export function optimizeImageUrl(url, options = {}) {
    if (!url)
        return url;
    try {
        const { width = DEFAULT_WIDTH, height, quality = DEFAULT_QUALITY, format = DEFAULT_FORMAT } = options;
        // Check if URL is from Supabase storage
        const supabasePattern = /supabase\.co\/storage\/v1\/object\/public/;
        if (!supabasePattern.test(url)) {
            // Not a Supabase URL, return as-is
            return url;
        }
        // Build transformation parameters
        const params = new URLSearchParams();
        if (width)
            params.append('width', width.toString());
        if (height)
            params.append('height', height.toString());
        if (quality)
            params.append('quality', quality.toString());
        if (format)
            params.append('format', format);
        // Add parameters to URL
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}${params.toString()}`;
    }
    catch (error) {
        console.warn('Error optimizing image URL:', error);
        return url; // Return original URL on error
    }
}
/**
 * Generate responsive image URLs for different screen sizes
 */
export function generateResponsiveImageUrls(url, breakpoints = {
    mobile: 320,
    tablet: 768,
    desktop: 1200
}) {
    const responsiveUrls = {};
    for (const [key, width] of Object.entries(breakpoints)) {
        responsiveUrls[key] = optimizeImageUrl(url, { width });
    }
    return responsiveUrls;
}
/**
 * Create a low-quality placeholder image URL for progressive loading
 */
export function createPlaceholderUrl(url) {
    return optimizeImageUrl(url, {
        width: 50,
        quality: 20,
        format: 'jpeg' // JPEG compresses better for placeholders
    });
}
/**
 * Calculate optimal image dimensions while maintaining aspect ratio
 */
export function calculateOptimalDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    if (!maxHeight) {
        // Only width constraint
        if (originalWidth <= maxWidth) {
            return { width: originalWidth, height: originalHeight };
        }
        const ratio = maxWidth / originalWidth;
        return {
            width: maxWidth,
            height: Math.round(originalHeight * ratio)
        };
    }
    // Both width and height constraints
    const widthRatio = maxWidth / originalWidth;
    const heightRatio = maxHeight / originalHeight;
    const ratio = Math.min(widthRatio, heightRatio);
    if (ratio >= 1) {
        // Image is smaller than constraints
        return { width: originalWidth, height: originalHeight };
    }
    return {
        width: Math.round(originalWidth * ratio),
        height: Math.round(originalHeight * ratio)
    };
}
/**
 * Image cache management
 */
export class ImageCache {
    constructor(maxSize = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }
    set(key, url) {
        // Remove oldest entry if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, url);
    }
    get(key) {
        return this.cache.get(key);
    }
    has(key) {
        return this.cache.has(key);
    }
    clear() {
        this.cache.clear();
    }
    size() {
        return this.cache.size;
    }
}
/**
 * Web implementation of image preloader
 */
export const webImagePreloader = {
    preloadImage: (url) => {
        return new Promise((resolve, reject) => {
            if (typeof window === 'undefined') {
                resolve(); // Skip in SSR
                return;
            }
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = url;
        });
    },
    supportsWebP: () => {
        if (typeof window === 'undefined')
            return false;
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    },
    measureLoadTime: (url) => {
        const startTime = performance.now();
        return webImagePreloader.preloadImage(url).then(() => {
            const endTime = performance.now();
            return endTime - startTime;
        });
    }
};
/**
 * Get optimal image format based on browser support
 */
export function getOptimalFormat(preloader = webImagePreloader) {
    return preloader.supportsWebP() ? 'webp' : 'jpeg';
}
/**
 * Preload multiple images with concurrency control
 */
export async function preloadImages(urls, maxConcurrent = 3, preloader = webImagePreloader) {
    const chunks = [];
    // Split URLs into chunks for controlled concurrency
    for (let i = 0; i < urls.length; i += maxConcurrent) {
        chunks.push(urls.slice(i, i + maxConcurrent));
    }
    // Process chunks sequentially, items within chunks in parallel
    for (const chunk of chunks) {
        try {
            await Promise.all(chunk.map(url => preloader.preloadImage(url)));
        }
        catch (error) {
            console.warn('Error preloading image chunk:', error);
            // Continue with next chunk even if some images fail
        }
    }
}
/**
 * Image loading with retry logic
 */
export async function loadImageWithRetry(url, maxRetries = 3, delay = 1000, preloader = webImagePreloader) {
    let lastError = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            await preloader.preloadImage(url);
            return; // Success!
        }
        catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
            }
        }
    }
    throw lastError || new Error('Failed to load image after retries');
}
/**
 * Image lazy loading intersection observer options
 */
export const LAZY_LOADING_OPTIONS = {
    threshold: 0.1,
    rootMargin: '100px 0px', // Start loading when image is 100px from viewport
    triggerOnce: true
};
// Global image cache instance
export const globalImageCache = new ImageCache(200);
