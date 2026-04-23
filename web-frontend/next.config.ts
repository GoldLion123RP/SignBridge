import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    allowedDevOrigins: ['127.0.0.1', 'localhost:3000', '127.0.0.1:3000']
  },
  // Some versions of Next.js dev server might need this for Turbopack HMR
  devIndicators: {
    appIsrStatus: false,
    buildActivity: true,
  }
};

export default nextConfig;
