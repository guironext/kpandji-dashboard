import type { NextConfig } from "next";

// Force Vercel to rebuild - Updated: 2025-11-05 at 13:45
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Matches commercial documentation uploads (see lib/actions/documentation.ts max 25MB)
      bodySizeLimit: "25mb",
    },
    // Avoids parallel webpack workers placing server chunks where runtime can't resolve
    // them (Windows: ./<id>.js vs ./chunks/<id>.js) when loading internal pages/* bundles.
    webpackBuildWorker: false,
  },
  images: {
    loader: "custom",
    loaderFile: "./image-loader.ts",
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://js.clerk.com https://www.google.com https://www.gstatic.com https://*.hcaptcha.com https://hcaptcha.com https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://www.google.com https://*.hcaptcha.com https://challenges.cloudflare.com",
              "img-src 'self' data: blob: https://*.clerk.accounts.dev https://*.clerk.com https://img.clerk.com https://*.public.blob.vercel-storage.com https://*.blob.vercel-storage.com https://www.google.com https://www.gstatic.com https://*.hcaptcha.com https://challenges.cloudflare.com",
              "font-src 'self' data: https://www.google.com https://*.gstatic.com",
              "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://api.clerk.com https://*.neon.tech https://*.blob.vercel-storage.com https://*.vercel-storage.com wss://*.clerk.accounts.dev wss://*.clerk.com https://www.google.com https://*.googleapis.com https://*.hcaptcha.com https://hcaptcha.com https://challenges.cloudflare.com",
              "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://www.google.com https://*.google.com https://*.hcaptcha.com https://hcaptcha.com https://challenges.cloudflare.com",
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
  serverExternalPackages: ['@prisma/client'],
  // Skip metadata generation for favicon to avoid cache issues
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
