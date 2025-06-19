import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Skip ESLint during build if SKIP_LINT is set
    ignoreDuringBuilds: process.env.SKIP_LINT === "true"
  },
  typescript: {
    // Skip TypeScript type checking during build if SKIP_TYPE_CHECK is set
    ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === "true"
  }
};

export default nextConfig;
