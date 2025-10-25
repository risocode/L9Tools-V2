
/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [],
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "handlebars": "handlebars/dist/handlebars.js",
    };
    
    config.externals.push({
      '@opentelemetry/instrumentation': 'commonjs @opentelemetry/instrumentation',
    });

    return config;
  },
};

module.exports = withPWA(nextConfig);
