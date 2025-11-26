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
    ],
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
  experimental: {
    turbo: {
      resolveAlias: {
        '.prisma/client': path.resolve(__dirname, 'lib/generated/prisma'),
      },
    },
  },
  // Skip metadata generation for favicon to avoid cache issues
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
