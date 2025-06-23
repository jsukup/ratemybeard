/**
 * Service Worker registration and management utilities
 */

interface CacheInfo {
  imageCount: number;
  totalSize: number;
  maxSize: number;
}

interface ServiceWorkerMessage {
  type: string;
  data?: any;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('Service Worker registered successfully:', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New Service Worker available. Refresh to update.');
            // Optionally show a notification to the user
            showUpdateNotification();
          }
        });
      }
    });

    return registration;

  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Send message to service worker
 */
function sendMessage(message: ServiceWorkerMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      reject(new Error('No service worker controller'));
      return;
    }

    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      const { success, data, error } = event.data;
      if (success) {
        resolve(data);
      } else {
        reject(new Error(error || 'Service worker message failed'));
      }
    };

    navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
  });
}

/**
 * Clear the image cache
 */
export async function clearImageCache(): Promise<void> {
  try {
    await sendMessage({ type: 'CLEAR_IMAGE_CACHE' });
    console.log('Image cache cleared successfully');
  } catch (error) {
    console.error('Failed to clear image cache:', error);
    throw error;
  }
}

/**
 * Get cache information
 */
export async function getCacheInfo(): Promise<CacheInfo> {
  try {
    const info = await sendMessage({ type: 'GET_CACHE_SIZE' });
    return info as CacheInfo;
  } catch (error) {
    console.error('Failed to get cache info:', error);
    throw error;
  }
}

/**
 * Preload an image into the cache
 */
export async function preloadImage(url: string): Promise<void> {
  try {
    await sendMessage({ 
      type: 'PRELOAD_IMAGE', 
      data: { url } 
    });
    console.log('Image preloaded successfully:', url);
  } catch (error) {
    console.error('Failed to preload image:', error);
    throw error;
  }
}

/**
 * Preload multiple images
 */
export async function preloadImages(urls: string[]): Promise<void> {
  const results = await Promise.allSettled(
    urls.map(url => preloadImage(url))
  );

  const failures = results.filter(result => result.status === 'rejected');
  if (failures.length > 0) {
    console.warn(`Failed to preload ${failures.length} out of ${urls.length} images`);
  }
}

/**
 * Check if service worker is supported and active
 */
export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 
         'serviceWorker' in navigator;
}

/**
 * Check if service worker is active
 */
export function isServiceWorkerActive(): boolean {
  return isServiceWorkerSupported() && 
         navigator.serviceWorker.controller !== null;
}

/**
 * Show update notification to user
 */
function showUpdateNotification(): void {
  // This could be integrated with your notification system
  console.log('App update available. Please refresh the page.');
  
  // Example: Show a toast notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('App Update Available', {
      body: 'A new version is available. Please refresh the page.',
      icon: '/favicon.ico'
    });
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }

  return Notification.permission;
}

/**
 * Force service worker update
 */
export async function updateServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to update service worker:', error);
    return false;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const result = await registration.unregister();
      console.log('Service Worker unregistered:', result);
      return result;
    }
    return false;
  } catch (error) {
    console.error('Failed to unregister service worker:', error);
    return false;
  }
}

/**
 * Initialize service worker and setup
 */
export async function initializeServiceWorker(): Promise<void> {
  try {
    const registration = await registerServiceWorker();
    
    if (registration) {
      console.log('Service Worker initialized successfully');
      
      // Optional: Preload critical images
      // await preloadCriticalImages();
    }
  } catch (error) {
    console.error('Failed to initialize service worker:', error);
  }
}

/**
 * Service worker performance monitoring
 */
export class ServiceWorkerMonitor {
  private metrics: {
    cacheHits: number;
    cacheMisses: number;
    preloadRequests: number;
    errors: number;
  } = {
    cacheHits: 0,
    cacheMisses: 0,
    preloadRequests: 0,
    errors: 0
  };

  recordCacheHit(): void {
    this.metrics.cacheHits++;
  }

  recordCacheMiss(): void {
    this.metrics.cacheMisses++;
  }

  recordPreloadRequest(): void {
    this.metrics.preloadRequests++;
  }

  recordError(): void {
    this.metrics.errors++;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  getCacheHitRate(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total > 0 ? this.metrics.cacheHits / total : 0;
  }

  reset(): void {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      preloadRequests: 0,
      errors: 0
    };
  }
}

// Global monitor instance
export const serviceWorkerMonitor = new ServiceWorkerMonitor();