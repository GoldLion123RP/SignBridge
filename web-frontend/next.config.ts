import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/SignBridge',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    // config options here
  }
};

export default nextConfig;
