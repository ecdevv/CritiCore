import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.OPENCRITIC_API_HOST || "",
        
      },
      {
        protocol: "https",
        hostname: process.env.STEAM_API_HOST || "",
      },
      {
        protocol: "https",
        hostname: process.env.SGDB_API_HOST || "",
      }
    ]
  }
};

export default nextConfig;
