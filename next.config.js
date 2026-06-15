
/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  sw: 'pwa-sw.js', // generated worker name so custom public/sw.js is not overwritten
  register: false,  // we register custom /sw.js in the app instead
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /\/l9rs\/.*\.(?:png|jpg|jpeg|svg|gif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'l9rs-image-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        },
      },
    },
    {
      // Exclude critical files that should always be fetched from network
      urlPattern: /^\/(ads\.txt|robots\.txt|sitemap\.xml|manifest\.json)$/,
      handler: 'NetworkOnly',
      options: {
        cacheName: 'critical-files',
      },
    },
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
});

const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@opentelemetry/instrumentation'],
  images: {
    remotePatterns: [],
  },
  turbopack: {
    resolveAlias: {
      handlebars: 'handlebars/dist/handlebars.js',
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      handlebars: 'handlebars/dist/handlebars.js',
    };

    return config;
  },
};

module.exports = withPWA(nextConfig);
