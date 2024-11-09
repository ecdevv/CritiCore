import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "shared.akamai.steamstatic.com"
      },
      {
        protocol: "https",
        hostname: "opencritic-api.p.rapidapi.com"
      }
    ]
  }
};

export default nextConfig;
