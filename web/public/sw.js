// Service Worker for RateMyFeet Image Caching
// Version 1.0.0

const CACHE_NAME = 'ratemyfeet-images-v1';
const STATIC_CACHE_NAME = 'ratemyfeet-static-v1';
const MAX_CACHE_SIZE = 50; // Maximum number of images to cache
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Install event - set up caches
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME),
      caches.open(STATIC_CACHE_NAME)
    ]).then(() => {
      console.log('Service Worker: Caches opened successfully');
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old cache versions
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle image requests
  if (request.destination === 'image' || isImageUrl(url)) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Handle other requests (static assets)
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // For all other requests, go to network
  return;
});

// Check if URL is an image
function isImageUrl(url) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const pathname = url.pathname.toLowerCase();
  
  return imageExtensions.some(ext => pathname.includes(ext)) ||
         url.searchParams.has('format') || // Supabase transformations
         pathname.includes('/storage/') || // Supabase storage
         url.hostname.includes('supabase.co');
}

// Check if URL is a static asset
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.ico', '.woff', '.woff2', '.ttf'];
  const pathname = url.pathname.toLowerCase();
  
  return staticExtensions.some(ext => pathname.endsWith(ext)) ||
         pathname.startsWith('/_next/static/');
}

// Handle image requests with caching
async function handleImageRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Check cache first
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Check if cached image is still valid
      const cachedDate = cachedResponse.headers.get('sw-cached-date');
      if (cachedDate) {
        const age = Date.now() - parseInt(cachedDate);
        if (age < CACHE_EXPIRATION) {
          console.log('Service Worker: Serving cached image:', request.url);
          return cachedResponse;
        } else {
          // Cache expired, delete it
          await cache.delete(request);
        }
      }
    }

    // Fetch from network
    console.log('Service Worker: Fetching image from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone response for caching
      const responseToCache = networkResponse.clone();
      
      // Add cache timestamp header
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-date', Date.now().toString());
      
      const responseWithHeaders = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      // Cache the response (but don't wait for it)
      cacheImage(cache, request, responseWithHeaders.clone());
      
      return responseWithHeaders;
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('Service Worker: Error handling image request:', error);
    
    // Try to serve from cache as fallback
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Serving stale cached image as fallback:', request.url);
      return cachedResponse;
    }
    
    // Return a placeholder image or error response
    return new Response('Image not available', { 
      status: 404, 
      statusText: 'Not Found' 
    });
  }
}

// Cache image with size management
async function cacheImage(cache, request, response) {
  try {
    // Check cache size and clean up if necessary
    const keys = await cache.keys();
    
    if (keys.length >= MAX_CACHE_SIZE) {
      // Remove oldest cached images
      const responses = await Promise.all(
        keys.map(key => cache.match(key))
      );
      
      // Sort by cache date and remove oldest
      const sortedEntries = keys
        .map((key, index) => ({
          key,
          response: responses[index],
          date: parseInt(responses[index]?.headers.get('sw-cached-date') || '0')
        }))
        .sort((a, b) => a.date - b.date);
      
      // Remove oldest entries
      const toRemove = sortedEntries.slice(0, keys.length - MAX_CACHE_SIZE + 1);
      await Promise.all(toRemove.map(entry => cache.delete(entry.key)));
      
      console.log(`Service Worker: Cleaned up ${toRemove.length} old cached images`);
    }
    
    // Cache the new image
    await cache.put(request, response);
    console.log('Service Worker: Cached image:', request.url);
    
  } catch (error) {
    console.error('Service Worker: Error caching image:', error);
  }
}

// Handle static asset requests
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  
  try {
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache static assets
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('Service Worker: Error handling static request:', error);
    
    // Try to serve from cache as fallback
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Message handling for cache management
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'CLEAR_IMAGE_CACHE':
      clearImageCache().then(() => {
        event.ports[0]?.postMessage({ success: true });
      }).catch((error) => {
        event.ports[0]?.postMessage({ success: false, error: error.message });
      });
      break;
      
    case 'GET_CACHE_SIZE':
      getCacheInfo().then((info) => {
        event.ports[0]?.postMessage({ success: true, data: info });
      }).catch((error) => {
        event.ports[0]?.postMessage({ success: false, error: error.message });
      });
      break;
      
    case 'PRELOAD_IMAGE':
      if (data?.url) {
        preloadImage(data.url).then(() => {
          event.ports[0]?.postMessage({ success: true });
        }).catch((error) => {
          event.ports[0]?.postMessage({ success: false, error: error.message });
        });
      }
      break;
  }
});

// Clear image cache
async function clearImageCache() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  await Promise.all(keys.map(key => cache.delete(key)));
  console.log('Service Worker: Image cache cleared');
}

// Get cache information
async function getCacheInfo() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  
  const responses = await Promise.all(
    keys.map(key => cache.match(key))
  );
  
  const totalSize = responses.reduce((size, response) => {
    const contentLength = response?.headers.get('content-length');
    return size + (contentLength ? parseInt(contentLength) : 0);
  }, 0);
  
  return {
    imageCount: keys.length,
    totalSize,
    maxSize: MAX_CACHE_SIZE
  };
}

// Preload image
async function preloadImage(url) {
  const request = new Request(url);
  await handleImageRequest(request);
}