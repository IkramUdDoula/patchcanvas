// Service Worker for PWA and GitHub API caching
const CACHE_NAME = 'patchcanvas-v1'
const API_CACHE_NAME = 'patchcanvas-github-api-v1'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Static assets to cache for offline support
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
]

// GitHub API endpoints to cache
const CACHEABLE_URLS = [
  '/api/branches',
  '/api/pulls',
  '/api/commits',
  '/api/graphql/branches',
  '/api/graphql/pulls',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  return self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Only cache GET requests to our API
  if (event.request.method !== 'GET') return
  
  const shouldCache = CACHEABLE_URLS.some(path => url.pathname.startsWith(path))
  if (!shouldCache) return

  event.respondWith(
    caches.open(API_CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request)
      
      // Check if cached response is still fresh
      if (cached) {
        const cachedTime = cached.headers.get('sw-cached-time')
        if (cachedTime) {
          const age = Date.now() - parseInt(cachedTime)
          if (age < CACHE_DURATION) {
            // Return cached response and fetch in background
            event.waitUntil(
              fetch(event.request).then((response) => {
                if (response.ok) {
                  const responseToCache = response.clone()
                  const headers = new Headers(responseToCache.headers)
                  headers.set('sw-cached-time', Date.now().toString())
                  
                  const cachedResponse = new Response(responseToCache.body, {
                    status: responseToCache.status,
                    statusText: responseToCache.statusText,
                    headers: headers,
                  })
                  
                  cache.put(event.request, cachedResponse)
                }
              })
            )
            return cached
          }
        }
      }

      // Fetch fresh data
      try {
        const response = await fetch(event.request)
        
        if (response.ok) {
          const responseToCache = response.clone()
          const headers = new Headers(responseToCache.headers)
          headers.set('sw-cached-time', Date.now().toString())
          
          const cachedResponse = new Response(responseToCache.body, {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers: headers,
          })
          
          cache.put(event.request, cachedResponse)
        }
        
        return response
      } catch (error) {
        // Return cached response if network fails
        if (cached) return cached
        throw error
      }
    })
  )
})
