import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
