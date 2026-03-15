import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: 'http://imprimiaqui3d-backend-dev:3001/uploads/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://imprimiaqui3d-backend-dev:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
