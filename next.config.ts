import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.dev",
        pathname: "/**",
      },
    ],
  },
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      // Cache Next.js static assets (CSS, JS, fonts)
      urlPattern: /^https:\/\/.*\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static",
        expiration: { maxEntries: 100, maxAgeSeconds: 365 * 24 * 60 * 60 }, // 1 year
      },
    },
    {
      // Cache Next.js pages & dynamic assets
      urlPattern: /^https:\/\/.*\/_next\/.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "next-dynamic",
        expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      // Cache main pages for offline navigation
      urlPattern: /^\/(?:dashboard|jobs|customers|technician|service-providers)(?:\/.*)?$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      // Cache API responses
      urlPattern: /\/api\/(?:jobs|customers|technicians)/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-data",
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      // Cache images and icons
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      // Cache fonts
      urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "fonts",
        expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }, // 1 year
      },
    },
    {
      // Cache CSS files
      urlPattern: /\.css$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "stylesheets",
        expiration: { maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
  ],
});

export default {
  ...nextConfig,
  ...pwaConfig,
};
