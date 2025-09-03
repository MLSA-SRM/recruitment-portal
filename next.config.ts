import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Experimental features for better performance
  experimental: {
    // Improve build performance
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Server external packages
  serverExternalPackages: [],

  // Webpack configuration to handle file system issues
  webpack: (config, { dev, isServer }) => {
    // Optimize file watching in development
    if (dev && !isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.next', '**/.git'],
      };
    }

    // Handle build manifest issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    return config;
  },

  // Optimize images
  images: {
    domains: ['recruitment.mlsasrm.in'],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Development optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Reduce bundle size in dev
    compiler: {
      removeConsole: false,
    },
    // Optimize file watching
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  }),
};

export default nextConfig;
