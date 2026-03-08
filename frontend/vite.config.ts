import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Environment detection
const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Register service worker automatically
      registerType: 'autoUpdate',
      
      // Include assets to cache
      includeAssets: [
        'favicon.ico',
        'vite.svg',
      ],
      
      // Web App Manifest
      manifest: {
        name: 'Todo Advanced Pro',
        short_name: 'TodoPro',
        description: 'Advanced Todo app with offline support, drag-and-drop, encryption, and more',
        theme_color: '#6366f1',
        background_color: '#1e1b4b',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['productivity', 'utilities'],
        lang: 'en',
        dir: 'ltr',
        
        // Icons configuration - only use existing icon
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        
        // Shortcuts for quick actions - simplified
        shortcuts: [],
      },
      
      // Workbox configuration for service worker
      workbox: {
        // Cache glob patterns
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot,webp,avif,json}',
        ],
        
        // Additional files to ignore
        globIgnores: [
          '**/dev-sw.js',
          '**/dev-sw.js.map',
          '**/sw.js.map',
          '**/workbox-*.js.map',
        ],
        
        // Runtime caching strategies
        runtimeCaching: [
          // API caching with NetworkFirst strategy
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          
          // Google Fonts caching with CacheFirst strategy
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          
          // Google Fonts CSS caching
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-static-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          
          // Image caching with CacheFirst strategy
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          
          // JavaScript and CSS caching with StaleWhileRevalidate
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          
          // HTML pages caching
          {
            urlPattern: /\.(?:html|htm)$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        
        // Skip waiting and claim clients immediately
        skipWaiting: true,
        clientsClaim: true,
        
        // Cleanup old caches
        cleanupOutdatedCaches: true,
        
        // Define navigation preload
        navigationPreload: true,
        
        // Cache ID for versioning
        cacheId: 'todo-app-v1',
        
        // Maximum size for cache entries
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      },
      
      // Dev Options for development
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: '/',
      },
    }),
  ],
  
  // Base path
  base: '/',
  
  // Build configuration
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: !isProduction,
    minify: isProduction ? 'esbuild' : false,
  },
  
  // Development server configuration
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
    host: true,
    strictPort: false,
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@services': '/src/services',
      '@hooks': '/src/hooks',
      '@utils': '/src/utils',
    },
  },
  
  // CSS configuration
  css: {
    devSourcemap: !isProduction,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'axios',
      'dexie',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
    ],
  },
})

