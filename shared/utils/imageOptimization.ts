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
export function optimizeImageUrl(
  url: string, 
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
): string {
  if (!url) return url;

  try {
    const { 
      width = DEFAULT_WIDTH, 
      height, 
      quality = DEFAULT_QUALITY, 
      format = DEFAULT_FORMAT 
    } = options;

    // Check if URL is from Supabase storage
    const supabasePattern = /supabase\.co\/storage\/v1\/object\/public/;
    
    if (!supabasePattern.test(url)) {
      // Not a Supabase URL, return as-is
      return url;
    }

    // Build transformation parameters
    const params = new URLSearchParams();
    
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    if (quality) params.append('quality', quality.toString());
    if (format) params.append('format', format);

    // Add parameters to URL
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
    
  } catch (error) {
    console.warn('Error optimizing image URL:', error);
    return url; // Return original URL on error
  }
}

/**
 * Generate responsive image URLs for different screen sizes
 */
export function generateResponsiveImageUrls(
  url: string,
  breakpoints: { [key: string]: number } = {
    mobile: 320,
    tablet: 768,
    desktop: 1200
  }
): { [key: string]: string } {
  const responsiveUrls: { [key: string]: string } = {};

  for (const [key, width] of Object.entries(breakpoints)) {
    responsiveUrls[key] = optimizeImageUrl(url, { width });
  }

  return responsiveUrls;
}

/**
 * Create a low-quality placeholder image URL for progressive loading
 */
export function createPlaceholderUrl(url: string): string {
  return optimizeImageUrl(url, {
    width: 50,
    quality: 20,
    format: 'jpeg' // JPEG compresses better for placeholders
  });
}

/**
 * Calculate optimal image dimensions while maintaining aspect ratio
 */
export function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight?: number
): { width: number; height: number } {
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
  private cache = new Map<string, string>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, url: string): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, url);
  }

  get(key: string): string | undefined {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
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
export const webImagePreloader: ImagePreloader = {
  preloadImage: (url: string): Promise<void> => {
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

  supportsWebP: (): boolean => {
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  },

  measureLoadTime: (url: string): Promise<number> => {
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
export function getOptimalFormat(preloader: ImagePreloader = webImagePreloader): 'webp' | 'jpeg' {
  return preloader.supportsWebP() ? 'webp' : 'jpeg';
}

/**
 * Preload multiple images with concurrency control
 */
export async function preloadImages(
  urls: string[], 
  maxConcurrent: number = 3,
  preloader: ImagePreloader = webImagePreloader
): Promise<void> {
  const chunks = [];
  
  // Split URLs into chunks for controlled concurrency
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    chunks.push(urls.slice(i, i + maxConcurrent));
  }

  // Process chunks sequentially, items within chunks in parallel
  for (const chunk of chunks) {
    try {
      await Promise.all(chunk.map(url => preloader.preloadImage(url)));
    } catch (error) {
      console.warn('Error preloading image chunk:', error);
      // Continue with next chunk even if some images fail
    }
  }
}

/**
 * Image loading with retry logic
 */
export async function loadImageWithRetry(
  url: string, 
  maxRetries: number = 3,
  delay: number = 1000,
  preloader: ImagePreloader = webImagePreloader
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await preloader.preloadImage(url);
      return; // Success!
    } catch (error) {
      lastError = error as Error;
      
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