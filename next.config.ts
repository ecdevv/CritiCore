import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.OPENCRITIC_IMG_HOST || "",
      },
      {
        protocol: "https",
        hostname: process.env.STEAM_IMG_HOST || "",
      },
      {
        protocol: "https",
        hostname: process.env.STEAM_CDN_IMG_HOST || "",
      },
      {
        protocol: "https",
        hostname: process.env.SGDB_CDN_HOST || "",
      }
    ]
  }
};

export default nextConfig;
