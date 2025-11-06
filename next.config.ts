import type { NextConfig } from "next";
import path from "path";

// Force Vercel to rebuild - Updated: 2025-11-05 at 13:45
const nextConfig: NextConfig = {
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
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
