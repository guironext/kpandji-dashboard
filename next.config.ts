import type { NextConfig } from "next";
import path from "path";

// Force Vercel to rebuild - Updated: 2025-11-05 at 13:45
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Allow Clerk domains
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://js.clerk.com https://www.google.com https://www.gstatic.com https://*.hcaptcha.com https://hcaptcha.com",
              "style-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://www.google.com https://*.hcaptcha.com",
              "img-src 'self' data: blob: https://*.clerk.accounts.dev https://*.clerk.com https://img.clerk.com https://*.public.blob.vercel-storage.com https://*.blob.vercel-storage.com https://www.google.com https://www.gstatic.com https://*.hcaptcha.com",
              "font-src 'self' data: https://www.google.com https://*.gstatic.com",
              "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://api.clerk.com https://*.neon.tech wss://*.clerk.accounts.dev wss://*.clerk.com https://www.google.com https://*.googleapis.com https://*.hcaptcha.com https://hcaptcha.com",
              "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://www.google.com https://*.google.com https://*.hcaptcha.com https://hcaptcha.com",
              "frame-ancestors 'self' https://*.clerk.accounts.dev https://*.clerk.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
  // Webpack config for production builds
  // Note: Turbopack (used in dev) ignores webpack config and uses serverExternalPackages instead
  // This warning is harmless - webpack config is only used for production builds
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle Prisma with custom output directory
      config.externals = config.externals || [];
      config.externals.push({
        '@prisma/client': 'commonjs @prisma/client',
      });
      
      // Copy query engine files
      config.resolve.alias = {
        ...config.resolve.alias,
        '.prisma/client': path.resolve(__dirname, 'lib/generated/prisma'),
      };
    }
    return config;
  },
  // Turbopack uses this for Prisma handling
  serverExternalPackages: ['@prisma/client'],
  // Configure Turbopack to avoid webpack warning
  turbopack: {
    resolveAlias: {
      '.prisma/client': path.resolve(__dirname, 'lib/generated/prisma'),
    },
  },
  // Skip metadata generation for favicon to avoid cache issues
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
